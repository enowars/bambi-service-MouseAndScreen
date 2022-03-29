import { HubConnection } from "@microsoft/signalr";
import { GameObjects, Scene } from "phaser";
import { IConfig } from "phaser3-rex-plugins/plugins/behaviors/textedit/Edit";
import { EaseMoveToDestroy } from "phaser3-rex-plugins/plugins/easemove";
import Label from "phaser3-rex-plugins/templates/ui/label/Label";
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import { MASBackground, MASSessionJoinedMessage, MASSprite, MASSpriteMovedMessage, rest_sprites, signalr_connect } from "../api";

const COLOR_PRIMARY = 0x4e342e;
const COLOR_LIGHT = 0x7b5e57;
const COLOR_DARK = 0x260e04;
const SPRITES_CONTAINER_NAME = "spritesgrid"
const UPLOAD_SPRITE_NAME = "uploadsprite"
const ADD_SPRITE_ACTION = "AddMASSprite"
const UPLOAD_SPRITE_ACTION = "UploadMASSprite"


export class ArenaSprite extends GameObjects.Sprite {
    masSprite: MASSprite;
    masDraggable: boolean = true;

    constructor(scene: ArenaScene, masSprite: MASSprite, x: number, y: number) {
        super(scene, x, y, masSprite.url, 0);
        this.masSprite = masSprite
        this.setInteractive();
        scene.input.setDraggable(this);
    }
}

export class ArenaScene extends Scene {
    rexUI?: RexUIPlugin;
    availableSprites: MASSprite[];
    availableBackground: MASBackground[];
    connection?: HubConnection;
    placedSprites: Map<number, ArenaSprite>;
    session?: string;

    constructor() {
        super({ key: "ArenaScene" });
        const that = this;
        this.availableSprites = [];
        this.availableBackground = [];
        this.placedSprites = new Map();
    }

    public async sendSpriteMoved(sprite: ArenaSprite) {
        console.log("sendSpriteMoved");
        await this.connection!.send(
            "MoveSprite",
            this.session,
            sprite.masSprite.id,
            Math.round(sprite.x),
            Math.round(sprite.y));
    }

    public preload() {
        console.log("ArenaScene.preload");
    }

    protected async init(data) {
        console.log('init', data);
        const that = this;
        this.session = data.sessionName;
        console.log("Connection to session " + this.session);
        this.connection = await signalr_connect();
        (window as any).globalConnection = this.connection;
        this.connection.on("SessionJoinedMessage", async function (msg: MASSessionJoinedMessage) {
            console.log(msg);
        });
        this.connection.on("SpriteMovedMessage", async(msg: MASSpriteMovedMessage) => {
            if (msg.placedSpriteId in this.placedSprites) {
                console.log("moving placed sprite " + msg.placedSpriteId);
                const sprite: ArenaSprite = this.placedSprites[msg.placedSpriteId];
                sprite.x = msg.x;
                sprite.y = msg.y;
                sprite.update();
            } else {
                console.log("adding placed sprite " + msg.placedSpriteId);
                that.load.image(msg.url, msg.url);
                var loaded = this.loadedPromise();
                that.load.start();
                await loaded;
                const t = new ArenaSprite(that, {
                    id: msg.placedSpriteId,
                    url: msg.url
                }, msg.x, msg.y);

                t.displayWidth = 100;
                t.displayHeight = 100;

                that.add.existing(t);
                that.placedSprites[msg.placedSpriteId] = t;
            }
        });
        this.input.on('drag', (_pointer: Phaser.Input.Pointer, gameObject: ArenaSprite, dragX: number, dragY: number) => {
            if (gameObject.masDraggable) {
                gameObject.x = dragX;
                gameObject.y = dragY;
            }
        });
        this.input.on('dragend', async function (_pointer: Phaser.Input.Pointer, gameObject: ArenaSprite) {
            if (gameObject.masDraggable) {
                await that.sendSpriteMoved(gameObject);
            }
        });
        await this.connection.send("Join", this.session);
    }

    private loadedPromise() {
        const that = this;
        return new Promise(function(myReolve, myReject) {
            that.load.on('complete', function() {
                myReolve("OK");
            })
        });
    }

    protected async create() {
        console.log("create ArenaScene");
        const that = this;
        this.availableSprites = (await rest_sprites()).ownSprites;

        for (let sprite of this.availableSprites) {
            that.load.image(sprite.url, sprite.url);
        }
        var loaded = this.loadedPromise();
        that.load.start();
        await loaded;

        var spritesPanel = this.rexUI!.add.scrollablePanel({
            x: 540,
            y: 75,
            width: 1080,
            height: 150,
            scrollMode: 1,

            background: this.rexUI!.add.roundRectangle(0, 0, 0, 0, 0, COLOR_PRIMARY),

            panel: {
                child: this.createSpritesPanel(),
                mask: {
                    padding: 1,
                },
            },

            slider: {
                track: this.rexUI!.add.roundRectangle(0, 0, 20, 10, 10, COLOR_DARK),
                thumb: this.rexUI!.add.roundRectangle(0, 0, 0, 0, 13, COLOR_LIGHT),
            },

            scroller: {
                // pointerOutRelease: false,
            },

            mouseWheelScroller: {
                focus: false,
                speed: 1
            },

            space: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10,
                panel: 10,
            }
        })
            .layout()
        // .drawBounds(this.add.graphics(), 0xff0000);
        // .popUp(300)

        var print = this.add.text(0, 0, '');

        
        // Add children-interactive
        // Solution A:
        (spritesPanel as any).setChildrenInteractive({
            targets: [
                spritesPanel.getByName(SPRITES_CONTAINER_NAME, true),
                spritesPanel.getByName(UPLOAD_SPRITE_NAME, true),
            ]
        })
            .on('child.click', function (child) {
                if (child.customDataType == ADD_SPRITE_ACTION) {
                    that.placeSprite(child.customData);;
                } else if (child.customDataType == UPLOAD_SPRITE_ACTION) {
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
                     }
                    input.click();
                } else {
                    console.log("unknown type " + child.customDataType);
                }
            })
    }

    private async placeSprite(sprite: MASSprite) {
        console.log("placeSprite() (" + sprite.url + ")");
        this.connection!.send("PlaceSprite", this.session, sprite.id, "herbert", 200, 200);
    }

    private createSpritesPanel() {
        var header = this.rexUI!.add.label({
            orientation: 'y',
            icon: this.rexUI!.add.roundRectangle(0, 0, 100, 100, 5, COLOR_LIGHT),
            text: this.add.text(0, 0, "Add"),
        });

        header['customDataType'] = UPLOAD_SPRITE_ACTION;

        var sizer = this.rexUI!.add.sizer({
            orientation: 'x',
            space: { item: 10 },
            name: UPLOAD_SPRITE_NAME
        })
            .add(
                header, // child
                { expand: true }
            )
            .add(
                this.createSpritesGrid(), // child
                { expand: true }
            )
            .add(
                this.createBackgroundsGrid(), // child
                { expand: true }
            )
        return sizer;
    }

    private createBackgroundsGrid() {
        var title = this.rexUI!.add.label({
            orientation: 'x',
            text: this.add.text(0, 0, "Available Backgrounds"),
        });

        var table = this.rexUI!.add.gridSizer({
            column: Math.max(1, this.availableBackground.length),
            row: 1,
            rowProportions: 1,
            space: { column: 10, row: 10 },
            name: SPRITES_CONTAINER_NAME,
        });

        var i = 0;
        for (let item of this.availableBackground) {
            table.add(
                this.createIcon(item),
                undefined,
                true,
                'top',
                0,
                true);
            i += 1;
        }

        var container = this.rexUI!.add.sizer({
            orientation: 'y',
            space: { left: 10, right: 10, top: 10, bottom: 10, item: 10 },
            width: 100,
            height: 100,
        })
            .addBackground(
                this.rexUI!.add.roundRectangle(0, 0, 0, 0, 0).setStrokeStyle(2, 0xff0000, 1)
            )
            .add(
                title, // child
                0, // proportion
                'left', // align
                0, // paddingConfig
                true // expand
            )
            .add(table, // child
                1, // proportion
                'center', // align
                0, // paddingConfig
                true // expand
            );

        return container;
    }

    private createSpritesGrid() {
        var title = this.rexUI!.add.label({
            orientation: 'x',
            text: this.add.text(0, 0, "Available Sprites"),
        });

        var table = this.rexUI!.add.gridSizer({
            column: Math.max(1, this.availableSprites.length),
            row: 1,
            rowProportions: 1,
            space: { column: 10, row: 10 },
            name: SPRITES_CONTAINER_NAME,
        });

        var i = 0;
        for (let item of this.availableSprites) {
            table.add(
                this.createIcon(item),
                undefined,
                true,
                'top',
                0,
                true);
            i += 1;
        }

        var container = this.rexUI!.add.sizer({
            orientation: 'y',
            space: { left: 10, right: 10, top: 10, bottom: 10, item: 10 },
            width: 100,
            height: 100,
        })
            .addBackground(
                this.rexUI!.add.roundRectangle(0, 0, 0, 0, 0).setStrokeStyle(2, 0xff0000, 1)
            )
            .add(
                title, // child
                0, // proportion
                'left', // align
                0, // paddingConfig
                true // expand
            )
            .add(table, // child
                1, // proportion
                'center', // align
                0, // paddingConfig
                true // expand
            );

        return container;
    }

    private createIcon(sprite: MASSprite) {
        const i = this.add.image(0, 0, sprite.url);
        i.displayHeight = 100;
        i.displayWidth = 100;
        i['customData'] = sprite;
        i['customDataType'] = ADD_SPRITE_ACTION
        return i;
    };
}
