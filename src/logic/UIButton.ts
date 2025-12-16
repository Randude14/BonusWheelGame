import Phaser from "phaser"
import WheelGame from "../scenes/WheelGame"

type Sprite = Phaser.GameObjects.Sprite
type TextStyle = Phaser.Types.GameObjects.Text.TextStyle
type Text = Phaser.GameObjects.Text
type Audio = Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound

export interface ButtonSettings
{
    buttonImg: string,
    text: string,
    textSettings?: TextStyle
    textY: number,
    buttonX?: number,
    buttonY: number,
    pressed: string,
    unpressed: string,
    disable: string,
    upsidedown?: boolean,
    clickSound: string,
    callback: Function
}

export enum ButtonState
{
    Pressed,
    Unpressed,
    Disabled
}

export default class UIButton extends Phaser.GameObjects.Container
{
    private button: Sprite = null
    private text: Text = null
    private pressedAnim: string = ""
    private unpressedAnim: string = ""
    private disabledAnim: string = ""
    private centerX = 0
    private clickSound: Audio = null

    private buttonState: ButtonState = undefined
    public get ButtonState(): ButtonState {return this.buttonState}
    public set ButtonState(_state: ButtonState)
    {
        if(this.buttonState != _state)
        {
            this.buttonState = _state

            this.text.setVisible(this.buttonState === ButtonState.Unpressed)

            let anim: string = ""
            switch(this.buttonState)
            {
                case ButtonState.Pressed: anim = this.pressedAnim; break;
                case ButtonState.Unpressed: anim = this.unpressedAnim; break;
                case ButtonState.Disabled: anim = this.disabledAnim; break
                default: anim = undefined;
            }
            if(anim)
            {
                this.button.play(anim)
            }
        }
    }

    public setButtonScale(xs: number, ys: number): this
    {
        this.button.setScale(xs, ys)
        return this
    }

    constructor(scene: WheelGame, settings: ButtonSettings)
    {
        super(scene)

        let canvasWidth = scene.sys.game.canvas.width
        this.centerX = canvasWidth / 2

        this.x = settings.buttonX ? settings.buttonX : this.centerX
        this.y = settings.buttonY
        this.button = scene.add.sprite(0, 0, settings.buttonImg)
        this.button.play(settings.unpressed)

        this.text = scene.add.text(0, settings.textY, settings.text, settings.textSettings).setOrigin(0.5)

        if(settings.upsidedown)
        {
            this.button.setAngle(-180)
        }

        this.unpressedAnim = settings.unpressed
        this.pressedAnim = settings.pressed
        this.disabledAnim = settings.disable

        this.add(this.button)
        this.add(this.text)

        this.clickSound = scene.sound.add(settings.clickSound)

        if(settings.callback)
        {
            this.button.setInteractive();
            this.button.on('pointerdown', () => {
                if(this.buttonState === ButtonState.Unpressed)
                {
                    if(this.clickSound)
                    {
                        this.clickSound.play()
                    }

                    // Play pressed animation and call the callback
                    this.ButtonState = ButtonState.Pressed
                    settings.callback()
                }
            })
        }
    }
}