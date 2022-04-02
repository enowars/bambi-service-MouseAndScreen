import { HubConnection } from "@microsoft/signalr";
import { GameObjects, Scene } from "phaser";
import { IConfig } from "phaser3-rex-plugins/plugins/behaviors/textedit/Edit";
import { EaseMoveToDestroy } from "phaser3-rex-plugins/plugins/easemove";
import Label from "phaser3-rex-plugins/templates/ui/label/Label";
import ScrollablePanel from "phaser3-rex-plugins/templates/ui/scrollablepanel/ScrollablePanel";
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import { MASBackground, MASBackgroundChangedMessage, MASSessionJoinedMessage, MASSprite, MASSpriteMovedMessage, rest_sprites, signalr_connect } from "../api";
import { COLOR_DARK, COLOR_LIGHT, COLOR_PRIMARY, createTextObject } from "../util";
import { createArenaUI } from "./arena.create";


export class ArenaSprite extends GameObjects.Sprite {
    masSprite: MASSprite;
    masDraggable: boolean = true;
    nameObject: GameObjects.Text;

    constructor(scene: ArenaScene, masSprite: MASSprite, x: number, y: number) {
        super(scene, x, y, masSprite.url, 0);
        this.masSprite = masSprite;
        this.nameObject = createTextObject(scene, masSprite.name);;
        this.setInteractive();
        this.moveArenaSprite(x, y);
        scene.input.setDraggable(this);
    }

    public moveArenaSprite(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.nameObject.x = x - (this.nameObject.width/2);
        this.nameObject.y = y - 75;
    }
}

export class ArenaScene extends Scene {
    rexUI?: RexUIPlugin;
    availableSprites: MASSprite[];
    availableBackgrounds: MASBackground[];
    connection?: HubConnection;
    placedSprites: Map<number, ArenaSprite>;
    session?: string;

    constructor() {
        super({ key: "ArenaScene" });
        const that = this;
        this.availableSprites = [];
        this.availableBackgrounds = [];
        this.placedSprites = new Map();
    }

    public async openUploadSpriteDialog() {
        var input = document.createElement('input');
        input.type = 'file';
        input.onchange = async (e: any)=> { 
            var file = e.target.files[0];
            var data = new FormData()
            data.append('file', file)
            var resp = await fetch('/api/resources/sprite', {
                method: 'POST',
                body: data
            })
            await resp.text();
            this.scene.restart();
        }
        input.click();
    }

    public async openUploadBackgroundDialog() {
        var input = document.createElement('input');
        input.type = 'file';
        input.onchange = async (e: any)=> { 
            var file = e.target.files[0];
            var data = new FormData();
            data.append('file', file)
            var resp = await fetch('/api/resources/background', {
                method: 'POST',
                body: data,
            })
            await resp.text();
            this.scene.restart();
        }
        input.click();
    }

    public async sendPlaceSprite(sprite: MASSprite, name: string) {
        console.log("sendPlaceSprite() (" + sprite.url + ")");
        this.connection!.send("PlaceSprite", this.session, sprite.id, name, 200, 200);
    }

    public async sendSelectBackground(background: MASBackground) {
        console.log("sendSelectBackground() (" + background.url + ")");
        this.connection!.send("SelectBackground", this.session, background.url);
    }

    public loadedPromise() {
        const that = this;
        return new Promise(function(myReolve, myReject) {
            that.load.on('complete', function() {
                myReolve("OK");
            })
        });
    }

    protected async create() {
        await createArenaUI(this);
    }

    protected async init(data) {
        console.log('init', data);
        const that = this;
        this.session = data.sessionName;
        this.availableSprites = [];
        this.availableBackgrounds = [];
        this.placedSprites = new Map();
        await this.connection?.stop();
        this.connection = await signalr_connect();
        (window as any).globalConnection = this.connection;
        this.connection.on("SessionJoinedMessage", async function (msg: MASSessionJoinedMessage) {
            console.log(msg);
        });
        this.connection.on("SpriteMovedMessage", async(msg: MASSpriteMovedMessage) => {
            if (msg.placedSpriteId in this.placedSprites) {
                console.log("moving placed sprite " + msg.placedSpriteId);
                const sprite: ArenaSprite = this.placedSprites[msg.placedSpriteId];
                sprite.moveArenaSprite(msg.x, msg.y);
                sprite.update();
            } else {
                console.log("adding placed sprite " + msg.placedSpriteId);
                that.load.image(msg.url, msg.url);
                var loaded = this.loadedPromise();
                that.load.start();
                await loaded;
                const t = new ArenaSprite(that, {
                        id: msg.placedSpriteId,
                        name: msg.name,
                        url: msg.url,
                    },
                    msg.x,
                    msg.y);
                t.displayWidth = 100;
                t.displayHeight = 100;
                this.add.existing(t);
                that.placedSprites[msg.placedSpriteId] = t;
            }
        });
        this.connection.on("BackgroundChangedMessage", async (msg: MASBackgroundChangedMessage) => {
            console.log(msg);
            that.load.image(msg.newBackgroundUrl, msg.newBackgroundUrl);
            var loaded = this.loadedPromise();
            that.load.start();
            await loaded;
            var bg = that.add.image(
                that.sys.canvas.width/2,
                that.sys.canvas.height/2,
                msg.newBackgroundUrl);
            bg.displayWidth = that.sys.canvas.width;
            bg.displayHeight = that.sys.canvas.height;
            bg.depth = -5000;
        });
        this.input.on('drag', (_pointer: Phaser.Input.Pointer, gameObject: ArenaSprite, dragX: number, dragY: number) => {
            if (gameObject.masDraggable) {
                gameObject.x = dragX;
                gameObject.y = dragY;
                this.sendSpriteMoved(gameObject)
            }
        });
        this.input.on('dragend', async function (_pointer: Phaser.Input.Pointer, gameObject: ArenaSprite) {
            if (gameObject.masDraggable) {
                await that.sendSpriteMoved(gameObject);
            }
        });
        await this.connection.send("Join", this.session);
    }

    private async sendSpriteMoved(sprite: ArenaSprite) {
        console.log("sendSpriteMoved");
        await this.connection!.send(
            "MoveSprite",
            this.session,
            sprite.masSprite.id,
            Math.round(sprite.x),
            Math.round(sprite.y));
    }
}
