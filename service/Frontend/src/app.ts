import { Game } from "phaser";
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

import { MainScene } from "./scenes/main";
import { ArenaScene } from "./scenes/arena";

window.onload = () => {
    window.focus();
    const game: Game = new Game({
        type: Phaser.AUTO,
        parent: 'phaser-example',
        width: 1920,
        height: 1080,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [new MainScene(), new ArenaScene()],
        backgroundColor: '#222288',
        dom: {
            createContainer: true,
        },
        plugins: {
            scene: [{
                key: 'rexUI',
                plugin: RexUIPlugin,
                mapping: 'rexUI',
            }]
        }
    });
    resizeGame();
    window.addEventListener("resize", resizeGame);
};

function resizeGame() {
    const canvas: (HTMLCanvasElement | null) = document.querySelector("canvas");
    if (canvas !== null) {
        const windowWidth: number = window.innerWidth;
        const windowHeight: number = window.innerHeight;
        const windowRatio: number = windowWidth / windowHeight;
        const gameRatio: number = 750 / 1334;
        if (windowRatio < gameRatio) {
            canvas.style.width = windowWidth + "px";
            canvas.style.height = (windowWidth / gameRatio) + "px";
        } else {
            canvas.style.width = (windowHeight * gameRatio) + "px";
            canvas.style.height = windowHeight + "px";
        }
    }
}
