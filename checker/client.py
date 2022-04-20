import asyncio

from enum import Enum, auto
import json
from logging import getLogger, LoggerAdapter
from typing import Dict, List, Optional
from signalr_async.netcore import Hub, Client as SignalRClient

from httpx import AsyncClient
from enochecker3 import MumbleException


'''
export interface MASSessionJoinedMessage {
    username: string,
    session: string
}

export interface MASSpriteMovedMessage {
    placedSpriteId: number,
    name: string,
    url: string,
    x: number,
    y: number,
}

export interface MASBackgroundChangedMessage {
    session: string,
    newBackgroundUrl: string,
}

export interface MASAvailableSpritesMessage {
    ownSprites: MASSprite[],
}

export interface MASSprite {
    id: number,
    name: string,
    url: string,
}

export interface MASAvailableBackgroundsMessage {
    ownBackgrounds: MASBackground[]
}

export interface MASBackground {
    id: number,
    url: string,
}
'''

class MessageKind(Enum):
    SessionJoinedMessage     = 1
    SpriteMovedMessage       = 2
    BackgroundChangedMessage = 3

class Session(Hub):
    def __init__(self, name: Optional[str] = None):
        super().__init__(name)

        self.message_queues = {}
        for name, kind in MessageKind.__members__.items():
            self.message_queues[kind.value] = asyncio.Queue()

    async def on_connect(self, connection_id: str) -> None:
        return await super().on_connect(connection_id)

    async def on_disconnect(self) -> None:
        return await super().on_disconnect()

    async def on_SessionJoinedMessage(self, message):
        await self.message_queues[MessageKind.SessionJoinedMessage.value].put(message)

    async def on_SpriteMovedMessage(self, message):
        await self.message_queues[MessageKind.SpriteMovedMessage.value].put(message)

    async def on_BackgroundChangedMessage(self, message):
        await self.message_queues[MessageKind.BackgroundChangedMessage.value].put(message)

    async def next_message(self, message_type):
        queue = self.message_queues[message_type.value]
        val = await queue.get()
        return val

    async def join_session(self, session_name: str) -> None:
        return await self.invoke("Join", session_name)
    
    async def select_background(self, session_name: str, url: str, name: str) -> None:
        return await self.invoke("SelectBackground", session_name, url, name)

    async def place_sprite(self, session_name: str, sprite_id: int, name: str, x: int, y: int) -> None:
        return await self.invoke("PlaceSprite", session_name, sprite_id, name, x, y)

    async def move_sprite(self, session_name: str, sprite_id: int, x: int, y: int) -> None:
        return await self.invoke("MoveSprite", session_name, sprite_id, x, y)

class MouseAndScreenClient():
    def __init__(self, task, username: str, password: str, logger: LoggerAdapter) -> None:
        self.http_client = AsyncClient(base_url=f"http://{task.address}:5005/")
        self.username = username
        self.password = password
        self.logger = logger
        self.signalRClient = None

    async def __aenter__(self):
        await self.http_client.__aenter__()
        return self

    async def __aexit__ (self, *args, **kwargs):
        if self.signalRClient is not None:
            await self.signalRClient.__aexit__(*args, **kwargs)

        if self.http_client is not None:
            await self.http_client.__aexit__(*args, **kwargs)

    async def register(self) -> None:
        reg_result = await self.http_client.post("/api/account/register", params={"username": self.username, "password": self.password})
        if reg_result.status_code != 204:
            raise MumbleException("Failed to register user")


    async def login(self) -> None:
        login_result = await self.http_client.post("/api/account/login", params={"username": self.username, "password": self.password})
        if login_result.status_code != 204:
            raise MumbleException("Failed to login")


    async def enter_signalr_conn(self, address: str) ->  Session:
        sr_cookie = self.http_client.cookies.get(".AspNetCore.Cookies")
        if sr_cookie is None:
            raise MumbleException("Session cookie not received")
        
        headers = {"Cookie": f".AspNetCore.Cookies={sr_cookie}"}
        hub = Session()
        self.signalRClient = SignalRClient(base_url=f"http://{address}:{5005}/hubs", hub=hub, connection_options={
            "http_client_options": {"headers": headers},
            "ws_client_options": {"headers": headers},
        })
        await self.signalRClient.start()
        return hub

    async def upload_sprite(self, name: str, file_content: str) -> None:
        # fileupload how?
        upload_result = await self.http_client.post("/api/resources/sprite", params={"name": name}, files={"file": file_content})
        if upload_result.status_code != 204:
            self.logger.warn(f"Failed to upload sprite ({upload_result.status_code}, {upload_result.text})")
            raise MumbleException("Failed to upload sprite")

    async def upload_background(self, name: str, file_content) -> None:
        # fileupload how?
        upload_result = await self.http_client.post("/api/resources/background", params={"name": name}, files={"file": file_content})
        if upload_result.status_code != 204:
            self.logger.warn(f"Failed to upload background ({upload_result.status_code}, {upload_result.text})")
            raise MumbleException("Failed to upload background")

    async def get_sprites(self):
        result = await self.http_client.get("/api/resources/sprites")
        self.logger.debug(f"get_sprites {result.text}")
        return result.text

    async def get_backgrounds(self):
        result = await self.http_client.get("/api/resources/backgrounds")
        self.logger.debug(f"backgrounds {result.text}")
        return result.text