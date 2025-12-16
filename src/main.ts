import Phaser from "phaser"
import WheelGame from './scenes/WheelGame';

const config = {
    type: Phaser.CANVAS,
    title: 'Bonus Wheel Game',
    description: '',
    parent: 'game-container',
    width: 489,
    height: 762,
    backgroundColor: '#048915ff',
    pixelArt: false,
    scene: [
        WheelGame
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
            