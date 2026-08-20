from pathlib import Path
from datetime import datetime, timezone
import asyncio
import json
import os
import shutil
import socket
import subprocess
import threading
import uuid
from typing import Optional

import pyperclip
from fastapi import FastAPI, File, Header, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel

# ============================================================
# PHONE-PC CONTROL HUB
# Features:
# - Local room chat
# - Live members panel
# - Away / Busy / Online status
# - Clipboard sharing/history
# - File upload/download with metadata
# - Host-only controls
# - Clear/delete chat
# - Existing /ws WebSocket endpoint preserved
# - Walkie-talkie/WebRTC voice is intentionally disabled
# ============================================================

app = FastAPI(title="Phone-PC Control Hub", version="3.0.0")

BASE_DIR = Path(__file__).resolve().parent
TRANSFER_DIR = BASE_DIR / "transfers"
TRANSFER_DIR.mkdir(exist_ok=True)

MAX_HISTORY = 200
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB

chat_history = []
clipboard_history = []

connected_clients = set()
clients_lock = asyncio.Lock()
history_lock = threading.Lock()

# websocket -> client info
client_info = {}

# file_name -> room_id ("public" or private_room_id)
file_room_map = {}

# --- Private Rooms Storage ---
# room_id -> { "name": str, "key": "1234", "owner_id": str, "members": set(ws), "chat_history": [], "clipboard_history": [], "created_at": iso_str, "locked": bool }
private_rooms = {}
room_key_map = {} # key -> room_id
private_rooms_lock = asyncio.Lock()

def generate_room_key():
    import random
    import string
    while True:
        key = "".join(random.choices(string.digits, k=4))
        if key not in room_key_map:
            return key

host_device_id: Optional[str] = None
host_websocket: Optional[WebSocket] = None
host_token: Optional[str] = None

room_settings = {
    "chat_enabled": True,
    "file_sharing_enabled": True,
    "room_locked": False,
}

# --- Private Rooms Storage ---
# room_id -> { "name": str, "key": "1234", "owner_id": str, "members": set(ws), "chat_history": [], "clipboard_history": [], "created_at": iso_str, "locked": bool }
private_rooms = {}
room_key_map = {} # key -> room_id
private_rooms_lock = asyncio.Lock()

def generate_room_key():
    import random
    import string
    while True:
        key = "".join(random.choices(string.digits, k=4))
        if key not in room_key_map:
            return key

class ClipboardData(BaseModel):
    text: str


class PCCommand(BaseModel):
    action: str
    confirm: bool = False


class HostSetting(BaseModel):
    key: str
    value: bool


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def clean_text(value, limit=4000):
    return str(value or "").strip()[:limit]


def clean_name(value):
    return clean_text(value, 32) or "Guest"


def safe_filename(name):
    name = Path(str(name or "")).name
    return name[:180] or "file"


def local_server_ips():
    ips = {"127.0.0.1", "::1"}
    try:
        ips.update(socket.gethostbyname_ex(socket.gethostname())[2])
    except Exception:
        pass
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ips.add(s.getsockname()[0])
        s.close()
    except Exception:
        pass
    return ips


LOCAL_SERVER_IPS = local_server_ips()


def is_host_connection(ws: WebSocket):
    client = ws.client
    if not client:
        return False
    return client.host in LOCAL_SERVER_IPS


def make_user(ws):
    info = client_info.get(ws, {})
    return {
        "device_id": info.get("device_id"),
        "device_name": info.get("device_name", "Guest"),
        "status": info.get("status", "online"),
        "joined_at": info.get("joined_at"),
        "is_host": bool(info.get("is_host")),
    }


async def send_safe(ws, payload):
    try:
        await ws.send_json(payload)
        return True
    except Exception:
        return False


async def broadcast(payload, exclude=None, room_id=None):
    async with clients_lock:
        if room_id and room_id != "public":
            # Only broadcast to members of the specific private room
            room = private_rooms.get(room_id)
            if not room:
                return
            targets = list(room["members"])
        else:
            # Public broadcast
            targets = list(connected_clients)

    dead = []
    for ws in targets:
        if ws is exclude:
            continue
        if not await send_safe(ws, payload):
            dead.append(ws)

    if dead:
        async with clients_lock:
            for ws in dead:
                connected_clients.discard(ws)
                client_info.pop(ws, None)
                # Also remove from private rooms if needed
                for r_id, r_data in private_rooms.items():
                    r_data["members"].discard(ws)


async def members_payload():
    async with clients_lock:
        users = [make_user(ws) for ws in connected_clients if client_info.get(ws, {}).get("device_id")]
    return {
        "type": "presence",
        "online_count": len(users),
        "users": users,
        "settings": dict(room_settings),
        "timestamp": now_iso(),
    }


async def broadcast_presence():
    await broadcast(await members_payload())


def add_chat(item):
    with history_lock:
        chat_history.append(item)
        if len(chat_history) > MAX_HISTORY:
            del chat_history[:-MAX_HISTORY]


def add_clipboard(item):
    with history_lock:
        clipboard_history.append(item)
        if len(clipboard_history) > MAX_HISTORY:
            del clipboard_history[:-MAX_HISTORY]


def file_metadata(path: Path):
    stat = path.stat()
    return {
        "name": path.name,
        "size": stat.st_size,
        "modified": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
        "url": f"/api/files/download/{path.name}",
    }


# ============================================================
# DASHBOARD
# ============================================================

@app.get("/", response_class=HTMLResponse)
async def dashboard():
    static_file = BASE_DIR / "static" / "index.html"
    if static_file.exists():
        return FileResponse(static_file)
    return HTMLResponse("<h1>Phone-PC Control Hub</h1><p>Place index.html in backend/static/.</p>")


@app.get("/api/health")
async def health():
    async with clients_lock:
        count = len(connected_clients)
    return {
        "status": "online",
        "online_count": count,
        "local_ip": next((x for x in LOCAL_SERVER_IPS if x not in {"127.0.0.1", "::1"}), "127.0.0.1"),
        "timestamp": now_iso(),
    }


# ============================================================
# WEBSOCKET /ws
# Existing endpoint and register/chat/clipboard message style
# are preserved. No voice_signal / WebRTC / walkie-talkie code.
# ============================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global host_device_id, host_websocket, host_token

    await websocket.accept()

    local_client = is_host_connection(websocket)

    async with clients_lock:
        connected_clients.add(websocket)

    client_info[websocket] = {
        "device_id": None,
        "device_name": "Guest",
        "status": "online",
        "joined_at": now_iso(),
        "is_host": local_client,
    }

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except Exception:
                continue

            msg_type = data.get("type")

            # ------------------------------------------------
            # REGISTER / IDENTIFY
            # ------------------------------------------------
            if msg_type in {"register", "identify"}:
                device_id = clean_text(data.get("device_id"), 80)
                device_name = clean_name(data.get("device_name"))
                requested_status = str(data.get("status") or "online").lower()
                if requested_status not in {"online", "away", "busy"}:
                    requested_status = "online"

                if not device_id:
                    await send_safe(websocket, {
                        "type": "error",
                        "message": "Device ID is required."
                    })
                    continue

                # Only the browser running on the server PC is the host.
                # A locked room still allows the host to reconnect.
                is_host = local_client
                if room_settings["room_locked"] and not is_host and not client_info[websocket].get("device_id"):
                    await send_safe(websocket, {
                        "type": "error",
                        "message": "Room is locked by the host."
                    })
                    await websocket.close(code=4002)
                    break

                client_info[websocket] = {
                    "device_id": device_id,
                    "device_name": device_name,
                    "status": requested_status,
                    "joined_at": client_info[websocket]["joined_at"],
                    "is_host": is_host,
                }

                if is_host:
                    host_device_id = device_id
                    host_websocket = websocket
                    host_token = uuid.uuid4().hex

                await send_safe(websocket, {
                    "type": "registered",
                    "device_id": device_id,
                    "device_name": device_name,
                    "role": "host" if is_host else "member",
                    "is_host": is_host,
                    "host_token": host_token if is_host else None,
                    "messages": list(chat_history),
                    "clipboard_history": list(clipboard_history),
                    "settings": dict(room_settings),
                    "users": [make_user(x) for x in list(connected_clients) if client_info.get(x, {}).get("device_id")],
                })

                await broadcast({
                    "type": "system",
                    "message": f"{device_name} joined the room.",
                    "timestamp": now_iso(),
                }, exclude=websocket)
                await broadcast_presence()

            # ------------------------------------------------
            # PRIVATE ROOMS
            # ------------------------------------------------
            elif msg_type == "create_private_room":
                info = client_info.get(websocket, {})
                if not info.get("device_id"): continue

                room_name = clean_name(data.get("room_name")) or "Private Room"
                room_id = uuid.uuid4().hex
                room_key = generate_room_key()

                async with private_rooms_lock:
                    private_rooms[room_id] = {
                        "id": room_id,
                        "name": room_name,
                        "key": room_key,
                        "owner_id": info["device_id"],
                        "members": {websocket},
                        "chat_history": [],
                        "clipboard_history": [],
                        "created_at": now_iso(),
                        "locked": False,
                    }
                    room_key_map[room_key] = room_id

                await send_safe(websocket, {
                    "type": "private_room_created",
                    "room_id": room_id,
                    "room_name": room_name,
                    "room_key": room_key,
                    "is_owner": True
                })

                await broadcast({
                    "type": "system",
                    "message": f"{info['device_name']} created private room: {room_name}",
                    "timestamp": now_iso()
                })

            elif msg_type == "join_private_room":
                info = client_info.get(websocket, {})
                if not info.get("device_id"): continue

                room_key = clean_text(data.get("room_key"), 4)
                room_id = room_key_map.get(room_key)

                if not room_id or room_id not in private_rooms:
                    await send_safe(websocket, {"type": "private_room_error", "message": "Private room not found."})
                    continue

                room = private_rooms[room_id]
                if room["locked"]:
                    await send_safe(websocket, {"type": "private_room_error", "message": "This private room is locked."})
                    continue

                if websocket in room["members"]:
                    await send_safe(websocket, {"type": "private_room_error", "message": "You are already in this room."})
                    continue

                async with private_rooms_lock:
                    room["members"].add(websocket)

                await send_safe(websocket, {
                    "type": "private_room_joined",
                    "room_id": room_id,
                    "room_name": room["name"],
                    "room_key": room["key"],
                    "is_owner": room["owner_id"] == info["device_id"],
                    "messages": list(room["chat_history"]),
                    "clipboard_history": list(room["clipboard_history"]),
                    "users": [make_user(ws) for ws in room["members"] if client_info.get(ws, {}).get("device_id")]
                })

                await broadcast({
                    "type": "private_system",
                    "room_id": room_id,
                    "message": f"{info['device_name']} joined the room.",
                    "timestamp": now_iso()
                }, room_id=room_id)

            elif msg_type == "leave_private_room":
                room_id = data.get("room_id")
                if room_id in private_rooms:
                    room = private_rooms[room_id]
                    async with private_rooms_lock:
                        room["members"].discard(websocket)

                    info = client_info.get(websocket, {})
                    await broadcast({
                        "type": "private_system",
                        "room_id": room_id,
                        "message": f"{info.get('device_name', 'Someone')} left the room.",
                        "timestamp": now_iso()
                    }, room_id=room_id)

                    await send_safe(websocket, {"type": "private_room_left", "room_id": room_id})

            elif msg_type == "private_chat_message":
                room_id = data.get("room_id")
                info = client_info.get(websocket, {})
                if not info.get("device_id") or room_id not in private_rooms: continue

                room = private_rooms[room_id]
                if websocket not in room["members"]: continue

                message = clean_text(data.get("message"))
                if not message: continue

                item = {
                    "type": "private_chat_message",
                    "room_id": room_id,
                    "id": uuid.uuid4().hex[:12],
                    "device_id": info["device_id"],
                    "device_name": info["device_name"],
                    "message": message,
                    "timestamp": now_iso(),
                    "is_owner": room["owner_id"] == info["device_id"]
                }

                async with private_rooms_lock:
                    room["chat_history"].append(item)
                    if len(room["chat_history"]) > MAX_HISTORY:
                        del room["chat_history"][:-MAX_HISTORY]

                await broadcast(item, room_id=room_id)

            elif msg_type == "private_typing":
                room_id = data.get("room_id")
                info = client_info.get(websocket, {})
                if info.get("device_id") and room_id in private_rooms:
                    await broadcast({
                        "type": "private_typing",
                        "room_id": room_id,
                        "device_id": info["device_id"],
                        "device_name": info["device_name"],
                        "active": bool(data.get("active")),
                    }, exclude=websocket, room_id=room_id)

            elif msg_type == "private_clipboard_share":
                room_id = data.get("room_id")
                info = client_info.get(websocket, {})
                if not info.get("device_id") or room_id not in private_rooms: continue

                text = clean_text(data.get("text"))
                if not text: continue

                item = {
                    "type": "private_clipboard",
                    "room_id": room_id,
                    "id": uuid.uuid4().hex[:12],
                    "device_id": info["device_id"],
                    "device_name": info["device_name"],
                    "text": text,
                    "timestamp": now_iso(),
                }

                async with private_rooms_lock:
                    room["clipboard_history"].append(item)
                    if len(room["clipboard_history"]) > MAX_HISTORY:
                        del room["clipboard_history"][:-MAX_HISTORY]

                await broadcast(item, room_id=room_id)

            # ------------------------------------------------
            # PRIVATE OWNER CONTROLS
            # ------------------------------------------------
            elif msg_type == "private_regen_key":
                room_id = data.get("room_id")
                info = client_info.get(websocket, {})
                if room_id in private_rooms:
                    room = private_rooms[room_id]
                    if room["owner_id"] == info.get("device_id"):
                        old_key = room["key"]
                        new_key = generate_room_key()

                        async with private_rooms_lock:
                            room_key_map.pop(old_key, None)
                            room["key"] = new_key
                            room_key_map[new_key] = room_id

                        await broadcast({
                            "type": "private_room_key_changed",
                            "room_id": room_id,
                            "new_key": new_key,
                            "message": "Room key changed by the owner."
                        }, room_id=room_id)

            elif msg_type == "private_close_room":
                room_id = data.get("room_id")
                info = client_info.get(websocket, {})
                if room_id in private_rooms:
                    room = private_rooms[room_id]
                    if room["owner_id"] == info.get("device_id"):
                        key = room["key"]
                        await broadcast({
                            "type": "private_room_closed",
                            "room_id": room_id,
                            "message": "This private room has been closed by the owner."
                        }, room_id=room_id)

                        async with private_rooms_lock:
                            room_key_map.pop(key, None)
                            private_rooms.pop(room_id, None)

            # ------------------------------------------------
            # HOST: CLEAR CHAT
            # ------------------------------------------------
            elif msg_type == "chat_message":
                info = client_info.get(websocket, {})
                if not info.get("device_id"):
                    continue

                if not room_settings["chat_enabled"] and not info.get("is_host"):
                    await send_safe(websocket, {"type": "error", "message": "Chat is disabled by the host."})
                    continue

                message = clean_text(data.get("message"))
                if not message:
                    continue

                item = {
                    "type": "chat_message",
                    "id": uuid.uuid4().hex[:12],
                    "device_id": info["device_id"],
                    "device_name": info["device_name"],
                    "message": message,
                    "timestamp": now_iso(),
                    "is_host": info.get("is_host", False)
                }
                add_chat(item)
                await broadcast(item)

            # ------------------------------------------------
            # TYPING
            # ------------------------------------------------
            elif msg_type == "typing":
                info = client_info.get(websocket, {})
                if info.get("device_id"):
                    await broadcast({
                        "type": "typing",
                        "device_id": info["device_id"],
                        "device_name": info["device_name"],
                        "active": bool(data.get("active")),
                    }, exclude=websocket)

            # ------------------------------------------------
            # STATUS: ONLINE / AWAY / BUSY
            # ------------------------------------------------
            elif msg_type == "set_status":
                info = client_info.get(websocket, {})
                if not info.get("device_id"):
                    continue

                status = str(data.get("status") or "online").lower()
                if status not in {"online", "away", "busy"}:
                    status = "online"

                info["status"] = status
                client_info[websocket] = info
                await broadcast_presence()

            # ------------------------------------------------
            # CLIPBOARD
            # ------------------------------------------------
            elif msg_type == "clipboard_share":
                info = client_info.get(websocket, {})
                if not info.get("device_id"):
                    continue

                text = clean_text(data.get("text"))
                if not text:
                    continue

                item = {
                    "type": "clipboard",
                    "id": uuid.uuid4().hex[:12],
                    "device_id": info["device_id"],
                    "device_name": info["device_name"],
                    "text": text,
                    "timestamp": now_iso(),
                }
                add_clipboard(item)
                await broadcast(item)

            # ------------------------------------------------
            # HOST: CLEAR CHAT
            # ------------------------------------------------
            elif msg_type == "host_clear_chat":
                info = client_info.get(websocket, {})
                if not info.get("is_host"):
                    await send_safe(websocket, {"type": "error", "message": "Host only."})
                    continue

                with history_lock:
                    chat_history.clear()

                await broadcast({
                    "type": "chat_cleared",
                    "by": info.get("device_name", "Host"),
                    "timestamp": now_iso(),
                })

            # ------------------------------------------------
            # HOST: CLEAR CLIPBOARD
            # ------------------------------------------------
            elif msg_type == "host_clear_clipboard":
                info = client_info.get(websocket, {})
                if not info.get("is_host"):
                    await send_safe(websocket, {"type": "error", "message": "Host only."})
                    continue

                with history_lock:
                    clipboard_history.clear()

                await broadcast({
                    "type": "clipboard_cleared",
                    "by": info.get("device_name", "Host"),
                    "timestamp": now_iso(),
                })

            # ------------------------------------------------
            # HOST: ROOM SETTINGS
            # ------------------------------------------------
            elif msg_type == "host_setting":
                info = client_info.get(websocket, {})
                if not info.get("is_host"):
                    await send_safe(websocket, {"type": "error", "message": "Host only."})
                    continue

                key = str(data.get("key") or "")
                if key not in room_settings:
                    continue

                room_settings[key] = bool(data.get("value"))
                await broadcast_presence()

            # ------------------------------------------------
            # HOST: KICK
            # ------------------------------------------------
            elif msg_type == "host_kick":
                info = client_info.get(websocket, {})
                if not info.get("is_host"):
                    await send_safe(websocket, {"type": "error", "message": "Host only."})
                    continue

                target_id = clean_text(data.get("device_id"), 80)
                target_ws = None

                async with clients_lock:
                    for ws, ci in client_info.items():
                        if ci.get("device_id") == target_id and ws is not websocket:
                            target_ws = ws
                            break

                if target_ws:
                    await send_safe(target_ws, {
                        "type": "kicked",
                        "message": "You were removed from the local room by the host."
                    })
                    try:
                        await target_ws.close(code=4003)
                    except Exception:
                        pass

            # ------------------------------------------------
            # Host can broadcast an announcement
            # ------------------------------------------------
            elif msg_type == "host_announcement":
                info = client_info.get(websocket, {})
                if not info.get("is_host"):
                    await send_safe(websocket, {"type": "error", "message": "Host only."})
                    continue

                text = clean_text(data.get("message"), 500)
                if text:
                    await broadcast({
                        "type": "announcement",
                        "message": text,
                        "by": info.get("device_name", "Host"),
                        "timestamp": now_iso(),
                    })

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        was_host = websocket is host_websocket
        leaving_name = client_info.get(websocket, {}).get("device_name", "A device")

        # Cleanup private rooms membership
        for r_id, r_data in list(private_rooms.items()):
            if websocket in r_data["members"]:
                async with private_rooms_lock:
                    r_data["members"].discard(websocket)
                # If room is empty, it will be handled by the cleanup task (later)
                # or we can do a simple broadcast here
                await broadcast({
                    "type": "private_system",
                    "room_id": r_id,
                    "message": f"{leaving_name} left the room.",
                    "timestamp": now_iso()
                }, room_id=r_id)

        async with clients_lock:
            connected_clients.discard(websocket)
            client_info.pop(websocket, None)

        if was_host:
            host_websocket = None
            host_device_id = None
            host_token = None

        if leaving_name and leaving_name != "Guest":
            await broadcast({
                "type": "system",
                "message": f"{leaving_name} left the room.",
                "timestamp": now_iso(),
            })

        await broadcast_presence()


# ============================================================
# STATUS / MEMBERS
# ============================================================

@app.get("/api/members")
async def members():
    payload = await members_payload()
    return payload


@app.get("/api/host-status")
async def host_status():
    return {
        "host_device_id": host_device_id,
        "host_connected": host_websocket is not None,
        "settings": dict(room_settings),
    }


# ============================================================
# CLIPBOARD API
# ============================================================

@app.get("/api/clipboard/history")
async def clipboard_history_api():
    with history_lock:
        return {"items": list(clipboard_history)}


@app.post("/api/clipboard")
async def set_pc_clipboard(data: ClipboardData):
    try:
        pyperclip.copy(data.text)
        return {"status": "success", "message": "Text copied to PC clipboard"}
    except Exception as e:
        raise HTTPException(500, f"Clipboard error: {e}")


@app.get("/api/clipboard")
async def get_pc_clipboard():
    try:
        return {"status": "success", "text": pyperclip.paste()}
    except Exception as e:
        raise HTTPException(500, f"Clipboard error: {e}")


# Existing API aliases kept for compatibility
@app.get("/api/shared-clipboard")
async def shared_clipboard():
    with history_lock:
        return {"status": "success", "items": list(clipboard_history)}


@app.delete("/api/shared-clipboard")
async def clear_shared_clipboard():
    if host_websocket is None:
        raise HTTPException(403, "Only the active host can clear the room.")
    with history_lock:
        clipboard_history.clear()
    await broadcast({"type": "clipboard_cleared", "by": "Host", "timestamp": now_iso()})
    return {"status": "success", "message": "Clipboard history cleared"}


# ============================================================
# FILE SHARING
# ============================================================

@app.post("/api/files/upload")
async def upload_file(
    file: UploadFile = File(...),
    device_id: str = "unknown",
    device_name: str = "Guest",
    room_id: str = "public"
):
    if room_id == "public":
        if not room_settings["file_sharing_enabled"]:
            raise HTTPException(403, "File sharing is disabled by the host.")
    else:
        if room_id not in private_rooms:
            raise HTTPException(404, "Private room not found.")

    filename = safe_filename(file.filename)
    destination = TRANSFER_DIR / filename

    # Avoid overwriting an existing file.
    if destination.exists():
        stem, suffix = destination.stem, destination.suffix
        filename = f"{stem}_{uuid.uuid4().hex[:6]}{suffix}"
        destination = TRANSFER_DIR / filename

    total = 0
    try:
        with destination.open("wb") as out:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_FILE_SIZE:
                    out.close()
                    destination.unlink(missing_ok=True)
                    raise HTTPException(413, "File is larger than 100 MB.")
                out.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        destination.unlink(missing_ok=True)
        raise HTTPException(500, f"Upload failed: {e}")
    finally:
        await file.close()

    meta = file_metadata(destination)
    meta["uploader_id"] = device_id
    meta["uploader_name"] = clean_name(device_name)
    meta["room_id"] = room_id

    file_room_map[filename] = room_id

    await broadcast({
        "type": "file_uploaded" if room_id == "public" else "private_file_uploaded",
        "room_id": room_id,
        "file": meta,
    }, room_id=room_id)

    return {"status": "success", "file": meta}


@app.get("/api/files")
async def list_files(room_id: str = "public"):
    files = []
    for p in TRANSFER_DIR.iterdir():
        if p.is_file():
            # Filter by room_id
            if file_room_map.get(p.name, "public") == room_id:
                files.append(file_metadata(p))
    files.sort(key=lambda x: x["modified"], reverse=True)
    return {"status": "success", "files": files}


@app.get("/api/files/download/{filename}")
async def download_file(filename: str):
    p = TRANSFER_DIR / safe_filename(filename)
    if not p.exists() or not p.is_file():
        raise HTTPException(404, "File not found")
    return FileResponse(p, filename=p.name)


@app.delete("/api/files/{filename}")
async def delete_file(filename: str, x_host_token: Optional[str] = Header(default=None), device_id: Optional[str] = Header(default=None)):
    filename = safe_filename(filename)
    room_id = file_room_map.get(filename, "public")

    if room_id == "public":
        require_host_token(x_host_token)
    else:
        # Private room logic: only owner can delete for now, or uploader
        # For simplicity, if room exists, check if room_id is valid
        if room_id not in private_rooms:
            raise HTTPException(404, "Room not found")
        room = private_rooms[room_id]
        if room["owner_id"] != device_id:
            # Check if this device is the owner via host token (if they are the same)
            # Or just require host token if it's the global host
            try: require_host_token(x_host_token)
            except: raise HTTPException(403, "Only room owner can delete.")

    p = TRANSFER_DIR / filename
    if not p.exists():
        raise HTTPException(404, "File not found")
    p.unlink()
    file_room_map.pop(filename, None)

    await broadcast({
        "type": "file_deleted" if room_id == "public" else "private_file_deleted",
        "filename": filename,
        "room_id": room_id
    }, room_id=room_id)

    return {"status": "success", "message": "File deleted"}


# ============================================================
# HOST CONTROL HTTP API
# ============================================================

def require_host_token(token: Optional[str]):
    if not host_websocket or not host_token or token != host_token:
        raise HTTPException(403, "Host authorization required.")


@app.post("/api/host/clear-chat")
async def host_clear_chat_http(x_host_token: Optional[str] = Header(default=None)):
    require_host_token(x_host_token)
    with history_lock:
        chat_history.clear()
    await broadcast({"type": "chat_cleared", "by": "Host", "timestamp": now_iso()})
    return {"status": "success"}


@app.post("/api/host/clear-files")
async def host_clear_files_http(x_host_token: Optional[str] = Header(default=None)):
    require_host_token(x_host_token)
    deleted = []
    for p in TRANSFER_DIR.iterdir():
        if p.is_file():
            deleted.append(p.name)
            p.unlink(missing_ok=True)
    await broadcast({"type": "files_cleared", "by": "Host", "timestamp": now_iso()})
    return {"status": "success", "deleted": deleted}


# ============================================================
# PC CONTROL
# ============================================================

@app.post("/api/pc/control")
async def pc_control(cmd: PCCommand, x_host_token: Optional[str] = Header(default=None)):
    require_host_token(x_host_token)
    if not cmd.confirm:
        raise HTTPException(400, "Confirmation required.")

    action = cmd.action.lower()
    if action == "restart":
        subprocess.Popen(["shutdown", "/r", "/t", "10"])
        return {"status": "success", "message": "PC restart scheduled in 10 seconds."}
    if action == "shutdown":
        subprocess.Popen(["shutdown", "/s", "/t", "10"])
        return {"status": "success", "message": "PC shutdown scheduled in 10 seconds."}
    if action == "lock":
        subprocess.Popen(["rundll32.exe", "user32.dll,LockWorkStation"])
        return {"status": "success", "message": "PC locked."}
    if action == "sleep":
        subprocess.Popen(["rundll32.exe", "powrprof.dll,SetSuspendState", "0,1,0"])
        return {"status": "success", "message": "PC entering sleep mode."}

    raise HTTPException(400, "Unknown PC action.")


async def cleanup_empty_rooms():
    while True:
        await asyncio.sleep(600) # Check every 10 mins
        async with private_rooms_lock:
            to_delete = []
            for r_id, r_data in private_rooms.items():
                if not r_data["members"]:
                    # In a real app we'd track "last_active"
                    # For now, if empty, we can mark for deletion or check timestamp
                    pass
            # Implementation of 30-min timeout logic would go here
            # For simplicity in this local project, we'll keep them
            # unless explicitly closed by owner or server restart.

@app.on_event("startup")
async def startup_event():
    # asyncio.create_task(cleanup_empty_rooms())
    pass

# ============================================================
# Static fallback
# ============================================================

STATIC_DIR = BASE_DIR / "static"
if STATIC_DIR.exists():
    try:
        from fastapi.staticfiles import StaticFiles
        app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

        GAMES_DIR = BASE_DIR.parent / "offline-games"
        if GAMES_DIR.exists():
            app.mount("/games", StaticFiles(directory=GAMES_DIR), name="games")
    except Exception:
        pass
