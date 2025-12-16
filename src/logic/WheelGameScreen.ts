import WheelSliceInfo from "../info/WheelSliceInfo"
import WheelGame from "../scenes/WheelGame"

type Mask = Phaser.Display.Masks.GeometryMask
type Image = Phaser.GameObjects.Image
type TextStyle = Phaser.Types.GameObjects.Text.TextStyle
type Text = Phaser.GameObjects.Text
type Container = Phaser.GameObjects.Container
type Particles = Phaser.GameObjects.Particles.ParticleEmitter

export interface ScreenSettings
{
    overlayImage: string,
    logoImage: string,
    balanceBgImage: string,
    bangupCallback: Function,
    demoScreenButtonImg: string,
    hideLogoDur: number,
    maskBounds: Phaser.GameObjects.Rectangle,
    textBonusSettings?: TextStyle,
    textBalanceSettings?: TextStyle,
    textDemoButtonSettings?: TextStyle,
    demoCallback: (index: number) => void
}

export default class WheelGameScreen extends Phaser.GameObjects.Container
{
    private totalBonusString: string = "YOU WON\n{0}\nCREDITS!"
    private playerBalanceString: string = "BALANCE: {0}"

    private demoButtons: Container = null
    private playerBalanceText: Text = null
    private totalBonusText: Text = null
    private diamondParticles: Particles = null
    private wheelGame: WheelGame = null
    private logo: Image = null
    private overlay: Image = null
    private bangupCallback: Function = null
    private hideLogoDuration: number = 0

    private playerBalance: number = 0 // Stored in millicredits
    private winningsBalance: number = 0

    private bangupWinnings: number = 0
    private bangupTime: number = 5 // stored in seconds
    private bangupRate: number = 0

    constructor(wheelGame: WheelGame, mask: Mask, settings: ScreenSettings)
    {
        super(wheelGame)

        this.wheelGame = wheelGame

        let canvasWidth = this.wheelGame.sys.game.canvas.width
        let canvasHeight = this.wheelGame.sys.game.canvas.height

        this.overlay = wheelGame.add.image(canvasWidth / 2, canvasHeight / 2, settings.overlayImage)
        this.setMask(mask)

        let buttonBg = wheelGame.add.image(canvasWidth / 2, 520, settings.balanceBgImage).setOrigin(0.5).setScale(0.4)

        this.totalBonusText = this.wheelGame.add.text(canvasWidth / 2, canvasHeight / 2, "", settings.textBonusSettings).setOrigin(0.5)
        this.playerBalanceText = this.wheelGame.add.text(canvasWidth / 2, 520, "", settings.textBalanceSettings).setOrigin(0.5)

        this.diamondParticles = this.wheelGame.add.particles(canvasWidth / 2, 40, "diamonds", {
            frame: [0, 1, 2, 3 ,4 ,5],
            speed: 500,
            lifespan: 1000,
            gravityY: 300,
            bounce: 0.8,
            frequency: 30,
            angle: {min: 45, max: 135},
            scale: { start: 1, end: 0 },
            //blendMode: 'ADD', //
            maxAliveParticles: 50
        })

        let maskThirdW = settings.maskBounds.width / 3
        let maskThirdH = settings.maskBounds.height / 5

        this.demoButtons = this.wheelGame.add.container(settings.maskBounds.x, settings.maskBounds.y)

        for(let i = 0; i < WheelSliceInfo.WheelSlices.length; ++i)
        {
            let x = maskThirdW * ( (i % 2 == 0) ? 0.8 : 2.2 )
            let y = maskThirdH * ( Math.floor(i / 2) + 1 ) - maskThirdH / 2

            let demoButton = this.wheelGame.add.image(x, y, settings.demoScreenButtonImg).setScale(0.5).setOrigin(0.5)
            let demoText = this.wheelGame.add.text(x, y, `Slice ${i+1}\n` + String(WheelSliceInfo.WheelSlices[i].credit), settings.textDemoButtonSettings).setOrigin(0.5)

            this.demoButtons.add(demoButton)
            this.demoButtons.add(demoText)

            demoButton.setInteractive()
            demoButton.on('pointerdown', () => {
                console.log(`Demo Button ${i} Selected.`)
                if(settings.demoCallback)
                {
                    settings.demoCallback(i)
                }
            })
        }

        this.logo = this.wheelGame.add.image(canvasWidth / 2, 370, settings.logoImage).setScale(0.4)
        this.hideLogoDuration = settings.hideLogoDur

        this.demoButtons.setMask(mask)

        this.diamondParticles.setMask(mask)
        this.diamondParticles.stop()

        this.bangupCallback = settings.bangupCallback

        this.add(this.logo)
        this.add(this.overlay)
        this.add(this.diamondParticles)
        this.add(this.totalBonusText)
        this.add(this.demoButtons)
        this.add(buttonBg)
        this.add(this.playerBalanceText)

        this.overlay.setVisible(false)
        this.totalBonusText.setVisible(false)
        this.addToUpdateList()

        this.AddBalance(WheelGame.START_AMOUNT * 1000)
    }

    public BangupTo(winningsCredits: number): void
    {
        this.bangupWinnings = winningsCredits * 1000
        this.winningsBalance = 0

        this.bangupRate = this.bangupWinnings / this.bangupTime
        this.overlay.setVisible(true)
        this.totalBonusText.setVisible(true)
        this.diamondParticles.start()
    }

    public DeductWager(): void
    {
        //this.AddBalance( -WheelGame.BET_AMOUNT * 1000 )
    }

    public HideLogo(): void
    {
        this.wheelGame.tweens.add({
            targets: this.logo,
            alpha: 0,
            duration: this.hideLogoDuration
        })
    }

    public ShowLogo(): void
    {
        this.wheelGame.tweens.add({
            targets: this.logo,
            alpha: 1,
            duration: this.hideLogoDuration
        })
    }

    public ToggleDemoScreenVisibility(): void
    {
        this.demoButtons.setVisible( ! this.demoButtons.visible )
        this.overlay.setVisible( this.demoButtons.visible )
    }

    public ShowDemoScreen(): void
    {
        this.demoButtons.setVisible(true)
        this.overlay.setVisible(true)
    }

    public HideDemoScreen(): void
    {
        this.demoButtons.setVisible(false)
        this.overlay.setVisible(false)
    }

    public CompleteBangup(): void
    {
        // Ignore repeated calls when bangup is done
        if(this.bangupWinnings <= 0)
        {
            return
        }

        // Add whatever's left
        this.AddBalance(this.bangupWinnings - this.winningsBalance)

        this.bangupWinnings = 0

        if(this.bangupCallback)
        {
            this.BangupDelayEnd()
        }
    }

    public update(time: number, delta: number) {

        delta = delta / 1000 // convert miliseconds to seconds

        if(this.bangupWinnings > 0)
        {
            if(this.bangupWinnings > this.winningsBalance)
            {
                let balToAdd = this.bangupRate * delta
                
                if( (balToAdd + this.winningsBalance) >= this.bangupWinnings)
                {
                    this.AddBalance(this.bangupWinnings - this.winningsBalance)
                    this.bangupWinnings = 0

                    this.BangupDelayEnd()
                }
                else
                {
                    this.AddBalance(balToAdd)
                }
            }
        }
    }

    private BangupDelayEnd(): void
    {
        if(this.bangupCallback)
        {
            this.wheelGame.time.addEvent({
                delay: 3000,
                callback: this.BangupDone.bind(this)
            })
        }
    }

    private BangupDone(): void
    {
        if(this.bangupCallback) 
            this.bangupCallback()

        this.overlay.setVisible(false)
        this.totalBonusText.setVisible(false)
        this.diamondParticles.stop()
    }

    private AddBalance(balance: number): void
    {
        if(balance)
        {
            this.playerBalance += balance
            this.winningsBalance += balance

            let winningsCredits = Math.round(this.winningsBalance / 1000)
            let balanceCredits = Math.round(this.playerBalance / 1000)

            this.totalBonusText.setText( this.localize(this.totalBonusString, [String(winningsCredits)]) )
            this.playerBalanceText.setText( this.localize(this.playerBalanceString, [String(balanceCredits)]) )
        }
    }

    private localize(text: string, args: string[]): string
    {
        for(let x = 0; x < args.length; x++)
        {
            text = text.replace(`{${x}}`, args[x])
        }
        return text
    }
}