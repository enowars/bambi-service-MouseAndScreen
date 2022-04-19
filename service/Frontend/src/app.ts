import { Game } from "phaser";
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

import { MainScene } from "./scenes/main";
import { ArenaScene } from "./scenes/arena";

window.onload = () => {
    window.focus();
    alert(`Welcome to MouseAndScreen, your pandemic friendly pen and paper replacement!

For your convenience, an openapi interface is available at /swagger/index.html.

Flags are stored in 4 different locations:
- The name of a sprite
- The name of a placed sprite (i.e. a unit on the game board)
- The content of a sprite (for your convenience they are .svg files :))
- The name of a session

There are 4 distinct vulnerabilities. Every vulnerability might give access to more than one flagstore.

Attack info (aka flag hints) is available at https://bambi.enoflag.de/scoreboard/attack.json. These make exploiting this service significantly easier, so use them!

Good luck!`)
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
