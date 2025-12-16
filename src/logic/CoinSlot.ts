import Phaser from "phaser"
import WheelGame from "../scenes/WheelGame"

type Mask = Phaser.Display.Masks.GeometryMask
type Image = Phaser.GameObjects.Image
type Audio = Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound

export interface CoinSlotSettings
{
    coinImg: string,
    coinDropSound: string
}

export default class CoinSlot extends Phaser.GameObjects.Container
{
    private wheelGame: WheelGame = null
    private coinDrop: Audio = null
    private coin: Image = null

    constructor(wheelGame: WheelGame, settings: CoinSlotSettings)
    {
        super(wheelGame)

        this.wheelGame = wheelGame

        let graphics = this.wheelGame.make.graphics()
        graphics.fillRect(378, 550, 500, 300)
        let mask = graphics.createGeometryMask()

        this.coin = this.wheelGame.add.image(400, 702, settings.coinImg).setOrigin(0.5)
        this.coin.setMask(mask).setScale(0.3)

        this.coinDrop = this.wheelGame.sound.add(settings.coinDropSound)

        this.add(this.coin)
        this.coin.setVisible(false)
    }

    public InsertCoin(duration: number): void
    {
        this.coin.setPosition(500, 680)

        if(this.coinDrop)
        {
            this.coinDrop.play()
        }

        this.coin.setVisible(true)
        this.wheelGame.tweens.add({
            targets: this.coin,
            x: 350,
            y: 712,
            duration: duration,
            onComplete: () => this.coin.setVisible(false)
        })
    }

}
