import Phaser from "phaser"
import Wheel from "../logic/Wheel"
import UIButton, { ButtonState } from "../logic/UIButton"
import StateMachine from "../logic/StateMachine"
import WheelGameScreen from "../logic/WheelGameScreen"
import CoinSlot from "../logic/CoinSlot"

type Container = Phaser.GameObjects.Container
type Mask = Phaser.Display.Masks.GeometryMask
type Audio = Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound

export default class WheelGame extends Phaser.Scene {

    public static readonly BET_AMOUNT = 500 // stored in credits
    public static readonly START_AMOUNT = 2000

    public static readonly BG_DEPTH: number = 0
    public static readonly CABINET_DEPTH: number = 1
    public static readonly UI_DEPTH: number = 20
    public static readonly WHEEL_DEPTH: number = 10

    private fpsCounter: any = null
    private stateMachine: StateMachine = null
    private gameScreen: WheelGameScreen = null
    private coinSlot: CoinSlot = null
    private wagerButton: UIButton = null
    private demoButton: UIButton = null
    private spinButton: UIButton = null
    private screenMask: Mask = null
    private background: Container = null
    private centerX: number = 0

    private wheelLand: Audio = null
    private winCelebration: Audio = null
    private bangupStop: Audio = null
    private gameLoop: Audio = null

    private bangupIsDone: boolean = true
    private wheelSlicePicked: number = -1
    private wheelUp: boolean = false

    private wheel: Wheel = null
    public get Wheel(): Wheel { return this.wheel }

    private readonly wheelCenterPos: number = 300
    private readonly wheelTopPos: number = 115
    private readonly coinSlotDuration: number = 500 // milliseconds
    private readonly wheelMoveDuration: number = 3000

    constructor() {
        super('WheelGame')

        this.centerX = 0
    }

    public preload(): void {
        this.load.pack('wheel-game-pack', '/assets/asset-package.json')
        this.load.json('wheel-slices', '/assets/data/wheel-slices.json')
        this.load.json('states', '/assets/data/states.json')
    }

    public create() {

        // Get HTML fps counter element if it exists
        this.fpsCounter = document.getElementById('fps')

        // Demo Button sprites
        this.createButtonSprites('spin-button', ['unpressed', 'disable', 'pressed'])
        this.createButtonSprites('demo-button', ['unpressed_demo', 'disable_demo', 'pressed_demo'])

        // Diamond sprites
        for(let i = 0; i < 6; ++i)
        {
            this.anims.create({
                key: `diamond-${i}`,
                frames: this.anims.generateFrameNumbers('diamonds', { start: 0, end: 0 })
            })
        }

        // This controls the logic flow of the game
        this.stateMachine = new StateMachine(this, "states")
        this.stateMachine.AddListener(this.stateChangedHandler.bind(this))

        this.createUIButtons()

        this.coinSlot = new CoinSlot(this, {
            coinImg: 'coin',
            coinDropSound: 'coin-drop'
        }).setDepth(WheelGame.UI_DEPTH)

        this.add.existing(this.coinSlot)

        // Create background and cabinet
        let arcadeScreen = this.add.image(0, 0, "arcade_screen").setOrigin(0, 0)
        let arcadeCabinet = this.add.image(0, 0, "arcade_cabinet").setOrigin(0, 0)
        let wall = this.add.image(0, 0, "wall").setOrigin(0, 0)

        arcadeScreen.x = 67
        arcadeScreen.y = 121
        arcadeScreen.setDisplaySize(351, 442)

        // Create screen mask
        let box = this.add.rectangle(arcadeScreen.x, arcadeScreen.y, arcadeScreen.displayWidth, arcadeScreen.displayHeight, 0, 0).setOrigin(0, 0)
        let graphics = this.make.graphics()
        graphics.fillRect(arcadeScreen.x, arcadeScreen.y, arcadeScreen.displayWidth, arcadeScreen.displayHeight)
        this.screenMask = graphics.createGeometryMask()

        this.wheel = new Wheel(this, {
            wheelImage: "wheel",
            wheelPickImage: "wheel-pick",
            wheelIdleSpeed: 10,
            wheelSpinSpeed: 540,
            wheelClickSound: "wheel-click",
            mask: this.screenMask,
            wheelSliceJson: "wheel-slices"
        }).setScale(0.3).setDepth(WheelGame.WHEEL_DEPTH).addToUpdateList()
        this.wheel.y = this.wheelTopPos

        this.gameScreen = new WheelGameScreen(this, this.screenMask, {
            overlayImage: "screen-overlay",
            logoImage: "game-logo",
            hideLogoDur: 300,
            textBonusSettings: {
                fontFamily: 'Gill Sans',
                fontSize: 50,
                align: 'center',
                color: '#eaeaeaff'
            },
            textBalanceSettings: {
                fontFamily: 'Gill Sans',
                fontSize: 30,
                align: 'left',
                color: '#DDDDDD'
            },
            textDemoButtonSettings: {
                fontFamily: 'Gill Sans',
                fontSize: 20,
                align: 'center',
                color: '#000000'
            },
            balanceBgImage: "balance-bg",
            maskBounds: box,
            demoScreenButtonImg: 'demo-screen-button',
            bangupCallback: this.bangupDone.bind(this),
            demoCallback: this.demoScreenButtonDown.bind(this)
        }).setDepth(WheelGame.UI_DEPTH)

        this.add.existing(this.gameScreen)

        arcadeCabinet.setDepth(WheelGame.CABINET_DEPTH)
        
        // Create audio objects
        this.wheelLand = this.sound.add('wheel-land')
        this.winCelebration = this.sound.add('win-celebration')
        this.bangupStop = this.sound.add('bangup-stop')
        this.gameLoop = this.sound.add('game-loop', {
            loop: true
        })

        // Create background container and add the assets
        this.background = this.add.container(0, 0)

        this.background.add(wall)
        this.background.add(arcadeScreen)
        this.background.setDepth(WheelGame.BG_DEPTH)
        this.background.add(this.wheel)

        this.gameScreen.HideDemoScreen()

        this.update(0, 0)
    }

    private createButtonSprites(spriteName: string, anims: string[]): void
    {
        for(let i = 0; i < anims.length; ++i)
        {
            this.anims.create({
                key: anims[i],
                frames: this.anims.generateFrameNumbers(spriteName, { start: i, end: i })
            })
        }
    }

    private createUIButtons(): void
    {
        // CREATE UI ELEMENTS
        this.spinButton = new UIButton(this, {
            buttonImg: 'spin-button',
            text: 'PRESS TO SPIN',
            textSettings: {
                fontFamily: 'Gill Sans',
                fontSize: 20,
                fontStyle: 'bold',
                color: '0x00000'
            },
            textY: -10,
            pressed: 'pressed',
            unpressed: 'unpressed',
            disable: 'disable',
            buttonY: 602,
            clickSound: 'button-click',
            callback: this.spinButtonDown.bind(this)
        }).setDepth(WheelGame.UI_DEPTH).setButtonScale(0.6, 0.55)

        this.demoButton = new UIButton(this, {
            buttonImg: 'demo-button',
            text: 'DEMO',
            textSettings: {
                fontFamily: 'Gill Sans',
                fontSize: 20,
                fontStyle: 'bold',
                color: '0x00000'
            },
            textY: 15,
            pressed: 'pressed_demo',
            unpressed: 'unpressed_demo',
            disable: 'disable_demo',
            buttonX: 75,
            buttonY: 702,
            upsidedown: true,
            clickSound: 'button-click',
            callback: this.demoButtonDown.bind(this)
        }).setDepth(WheelGame.UI_DEPTH).setButtonScale(0.4, 0.7)

        this.wagerButton = new UIButton(this, {
            buttonImg: 'spin-button',
            text: 'PLAY GAME',
            textSettings: {
                fontFamily: 'Gill Sans',
                fontSize: 20,
                fontStyle: 'bold',
                color: '0x00000'
            },
            textY: 15,
            pressed: 'pressed',
            unpressed: 'unpressed',
            disable: 'disable',
            buttonY: 702,
            upsidedown: true,
            clickSound: 'button-click',
            callback: this.wagerButtonDown.bind(this)
        }).setDepth(WheelGame.UI_DEPTH).setButtonScale(0.4, 0.7)

        this.add.existing(this.spinButton)
        this.add.existing(this.wagerButton)
        this.add.existing(this.demoButton)
        this.spinButton.ButtonState = ButtonState.Disabled
        this.wagerButton.ButtonState = ButtonState.Unpressed
        this.demoButton.ButtonState = ButtonState.Unpressed
    }

    private stateChangedHandler(state: string): void
    {
        if(state === "WheelDown")
        {
            this.gameScreen.HideDemoScreen()
            this.demoButton.ButtonState = ButtonState.Disabled

            this.coinSlot.InsertCoin(this.coinSlotDuration)

            this.time.addEvent({
                delay: this.coinSlotDuration,
                callback: () => {
                    if(this.gameLoop)
                    {
                        this.gameLoop.play()
                    }
                    this.gameScreen.HideLogo()
                    // Move wheel down before allowing player to spin the wheel
                    this.tweens.add({
                        targets: this.wheel,
                        y: this.wheelCenterPos,
                        duration: this.wheelMoveDuration,
                        onComplete: () => {
                            this.stateMachine.NextState()
                            if(this.wheelSlicePicked < 0)
                            {
                                this.spinButton.ButtonState = ButtonState.Unpressed
                            }
                        }
                    })
                }
            })

            this.wheelUp = false
        }
        else if(state === "WheelLanded")
        {
            this.stateMachine.NextState()
        }
        else if(state === "BonusInput")
        {
            if(this.wheelSlicePicked >= 0)
            {
                this.spinButtonDown(true)
            }
        }
        else if(state === "Award")
        {
            this.bangupIsDone = false
            this.gameScreen.BangupTo(this.wheel.SliceWin)
            this.wagerButton.ButtonState = ButtonState.Unpressed

            if(this.gameLoop)
            {
                this.gameLoop.stop()
            }

            if(this.winCelebration)
            {
                this.winCelebration.play()
            }

            this.time.addEvent({
                delay: 3000,
                callback: () => { 
                    // Move wheel back up
                    this.tweens.add({
                        targets: this.wheel,
                        y: this.wheelTopPos,
                        duration: this.wheelMoveDuration,
                        onComplete: () => {
                            this.wheelUp = true
                            if(this.bangupIsDone)
                            {
                                this.resetUI()
                            }
                        }
                    })
                }
            })
        }
    }

    public WheelLanded(): void
    {
        console.log("Wheel Landed!")
        this.stateMachine.NextState()
        
        if(this.wheelLand)
        {
            this.wheelLand.play()
        }
    }

    private resetUI(): void
    {
        this.wagerButton.ButtonState = ButtonState.Unpressed
        this.demoButton.ButtonState = ButtonState.Unpressed
        this.gameScreen.ShowLogo()
        this.wheel.ResetWheel()
    }

    // BUTTON CALLBACKS

    private bangupDone(): void
    {
        this.stateMachine.NextState()
        this.bangupIsDone = true

        if(this.wheelUp)
        {
            this.resetUI()
        }
    }
    
    private demoButtonDown(): void
    {
        this.gameScreen.ToggleDemoScreenVisibility()

        this.time.addEvent({
            delay: 500,
            callback: () => this.demoButton.ButtonState = ButtonState.Unpressed
        })
    }

    private demoScreenButtonDown(index: number): void
    {
        if(this.stateMachine.CurrentState === "WaitForPlay")
        {
            this.wheelSlicePicked = index
            this.wagerButtonDown(true)
        }
    }

    private spinButtonDown(isDemo?: boolean): void
    {
        console.log("Spin button clicked.")

        if(this.stateMachine.CurrentState === "BonusInput" && ! this.wheel.IsLanding)
        {
            this.wheel.LandOnSlice(this.wheelSlicePicked)
            this.stateMachine.NextState()

            if(isDemo)
            {
                this.spinButton.ButtonState = ButtonState.Disabled
            }
            else
            {
                this.time.addEvent({
                delay: 500,
                callback: () => {
                        this.spinButton.ButtonState = ButtonState.Disabled
                    }
                })
            }
        }
    }

    private wagerButtonDown(force?: boolean): void
    {
        console.log("Wager button clicked.")

        if(this.stateMachine.CurrentState === "WaitForPlay")
        {
            if(! force)
            {
                this.wheelSlicePicked = -1
            }

            this.stateMachine.NextState()

            this.gameScreen.DeductWager()

            this.time.addEvent({
                delay: 500,
                callback: () => {
                    this.wagerButton.ButtonState = ButtonState.Disabled
                }
            })
        }
        if(this.stateMachine.CurrentState === "Award")
        {
            this.gameScreen.CompleteBangup()
            if(this.bangupStop)
            {
                this.bangupStop.play()
            }
            if(this.winCelebration && this.winCelebration.isPlaying)
            {
                this.winCelebration.stop()
            }
        }
    }

    // UPDATE FUNCS

    private updateImagePositions() {
        this.wheel.x = this.centerX
    }

    private updateValues(): void {
        let canvasWidth = this.sys.game.canvas.width
        let canvasHeight = this.sys.game.canvas.height
        this.centerX = canvasWidth / 2
        this.background.setDisplaySize(canvasWidth, canvasHeight)
    }

    public update(time: number, delta: number) {
        this.wheel.update()

        this.updateValues()
        this.updateImagePositions()

        this.background.width = this.scale.width
        this.background.height = this.scale.height

        if(this.gameScreen)
        {
            this.gameScreen.update(time, delta)
        }

        if(this.fpsCounter)
        {
            this.fpsCounter.innerHTML = 'FPS: ' + Math.floor(this.game.loop.actualFps)
        }
    }
    
}
