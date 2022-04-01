import { MASBackground, MASSprite, rest_backgrounds, rest_sprites } from "../api";
import { COLOR_DARK, COLOR_LIGHT, COLOR_PRIMARY, createTextObject } from "../util";
import { ArenaScene } from "./arena";

const UPLOAD_SPRITE_BUTTON_TEXT: string = 'Upload Sprite';
const UPLOAD_BACKGROUND_BUTTON_TEXT: string = 'Upload Background';

export async function createArenaUI(scene: ArenaScene) {
    console.log("create ArenaScene");
    scene.input.topOnly = false;

    // Load owned resources
    scene.availableSprites = (await rest_sprites()).ownSprites;
    for (let sprite of scene.availableSprites) {
        scene.load.image(sprite.url, sprite.url);
    }
    scene.availableBackgrounds = (await rest_backgrounds()).ownBackgrounds;
    for (let background of scene.availableBackgrounds) {
        scene.load.image(background.url, background.url);
    }
    var loaded = scene.loadedPromise();
    scene.load.start();
    await loaded;

    // Must be created first to ensure the correct z index (╯°□°）╯︵ ┻━┻
    const arenaTopBarInnerBg = scene.rexUI!.add.roundRectangle(0, 0, 0, 0, 0, COLOR_PRIMARY);

    // Upload buttons
    const uploadButtons = scene.rexUI!.add.buttons({
        x: 200,
        y: 200,
        width: 120,
        orientation: 'y',
        buttons: [
            createTextButton(scene, UPLOAD_SPRITE_BUTTON_TEXT),
            createTextButton(scene, UPLOAD_BACKGROUND_BUTTON_TEXT),
        ]
    });
    uploadButtons
        .on('button.click', async function (button) {
            if (button.text == UPLOAD_SPRITE_BUTTON_TEXT) {
                await scene.openUploadSpriteDialog();
            } else if (button.text == UPLOAD_BACKGROUND_BUTTON_TEXT) {
                await scene.openUploadBackgroundDialog();
            } else {
                console.log("unknown button click", button);
            }
        });

    // Available sprites
    const spriteButtons = scene.rexUI!.add.buttons({
        orientation: 'h',
        buttons: scene.availableSprites.map(function (item) {
            return createPlaceSpriteButton(scene, item);
        }),
    });
    spriteButtons
        .on('button.click', async function (button) {
            console.log("spriteButtons click", button);
            var name = prompt("Unit Name?");
            await scene.sendPlaceSprite(button.masSprite, name as string);
        });

    // Available backgrounds
    const backgroundButtons = scene.rexUI!.add.buttons({
        orientation: 'h',
        buttons: scene.availableBackgrounds.map(function (item) {
            return createSelectBackgroundButton(scene, item);
        }),
    });
    backgroundButtons
        .on('button.click', async function (button) {
            await scene.sendSelectBackground(button.masBackground);
        });

    // Inner panel
    var arenaTopBarInner = scene.rexUI!.add.sizer({
        orientation: 'h',
    });
    arenaTopBarInner
        .addBackground(arenaTopBarInnerBg)
        .add(uploadButtons)
        .add(spriteButtons)
        .add(backgroundButtons);

    // Scrollable panel
    const arenaTopBarWidth = 1920;
    var arenaTopBar = scene.rexUI!.add.scrollablePanel({
        x: 0,
        y: 0,
        width: arenaTopBarWidth,
        scrollMode: 1,
        panel: {
            child: arenaTopBarInner
        },
        slider: false,
        clamplChildOY: true,
    })
        .setOrigin(0)
        .layout()
}

function createPlaceSpriteButton(scene: ArenaScene, sprite: MASSprite) {
    const i = scene.add.image(0, 0, sprite.url);
    i.displayHeight = 100;
    i.displayWidth = 100;
    i["masSprite"] = sprite;
    return i;
};

function createSelectBackgroundButton(scene: ArenaScene, background: MASBackground) {
    const i = scene.add.image(0, 0, background.url);
    i.displayHeight = 100;
    i.displayWidth = 100;
    i["masBackground"] = background;
    return i;
}

function createTextButton(scene: ArenaScene, title: string) {
    const label = scene.rexUI!.add.label({
        background: scene.rexUI!.add.roundRectangle(0, 0, 0, 0, 10, COLOR_LIGHT),
        text: createTextObject(scene, title),
        space: {
            left: 10,
            right: 10,
            top: 10,
            bottom: 10,
            icon: 10
        },
        height: 40,
        name: title,
    });
    return label;
}

