import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

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
    name: string,
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
    name: string
}

export async function rest_register(username: string, password: string) {
    const params = new URLSearchParams({
        username: username,
        password: password
    });
    const response = await fetch("/api/account/register?" + params, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: "POST",
    });
    await response.text();
    if (response.status != 204) {
        throw new Error("Invalid return code");
    }
}

export async function rest_login(username: string, password: string) {
    const params = new URLSearchParams({
        username: username,
        password: password
    });
    const response = await fetch("/api/account/login?" + params, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: "POST",
    });
    await response.text();
    if (response.status != 204) {
        throw new Error("Invalid return code");
    }
}

export async function rest_sprites(): Promise<MASAvailableSpritesMessage> {
    const response = await fetch("/api/resources/sprites")
    return await response.json()
}

export async function rest_backgrounds(): Promise<MASAvailableBackgroundsMessage> {
    const response = await fetch("/api/resources/backgrounds")
    return await response.json()
}

export async function signalr_connect(): Promise<HubConnection> {
    const  connection = new HubConnectionBuilder()
        .withUrl("/hubs/session")
        .configureLogging(LogLevel.Debug)
        .build();

    await connection.start();
    return connection;
}
