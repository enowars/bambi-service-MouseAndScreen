import { Scene } from "phaser";
import { ArenaScene } from "./scenes/arena";

export const COLOR_PRIMARY = 0x4e342e;
export const COLOR_LIGHT = 0x7b5e57;
export const COLOR_DARK = 0x260e04;

export function createTextObject(scene: Scene, text: string) {
    var textObject = scene.add.text(0, 0, text, {
        fontSize: '20px'
    })
    return textObject;
}
