import Phaser from "phaser"
import WheelGame from "../scenes/WheelGame"
import { WheelCredit } from "../info/WheelCredit"

type Mask = Phaser.Display.Masks.GeometryMask
type Image = Phaser.GameObjects.Image
type GameObject = Phaser.GameObjects.GameObject
type Container = Phaser.GameObjects.Container
type TweenBuilderConfig = Phaser.Types.Tweens.TweenBuilderConfig
type Audio = Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound

export interface WheelSettings
{
    wheelImage: string,
    wheelPickImage: string,
    wheelIdleSpeed: number,
    wheelSpinSpeed: number,
    wheelClickSound: string,
    wheelSliceJson: string,
    mask: Mask,
}

export default class Wheel extends Phaser.GameObjects.Container
{
    private spinTween: Phaser.Tweens.Tween = null
    private idleTween: Phaser.Tweens.Tween = null
    private idleTweenConfig: TweenBuilderConfig = null

    private wheelGame: WheelGame = null
    private wheelContainer: Container = null
    private wheelSlices: Image[] = []

    private idleSpeed: number = 0
    private spinSpeed: number = 0

    private prevAngle = 0
    private wheelClick: Audio = null

    private sliceLanded: number = -1
    public get IsLanding(): boolean {return this.sliceLanded >= 0}

    private wheelData: WheelCredit[] = null
    public WheelCredit(i: number): number { return this.wheelData ? this.wheelData[i].credit : null }
    public get TotalSlices(): number { return this.wheelData ? this.wheelData.length : 0 }

    private wheelRadius: number = 240
    private centerX: number = 0
    private centerY: number = 0

    constructor(_wheelGame: WheelGame, settings: WheelSettings, x?: number, y?: number, children?: GameObject[])
    {
        super(_wheelGame, x, y, children)

        this.wheelGame = _wheelGame

        this.wheelContainer = this.wheelGame.add.container()

        this.wheelContainer.add( this.wheelGame.add.image(0, 0, settings.wheelImage).setScale(2) )

        let data = this.wheelGame.cache.json.get(settings.wheelSliceJson) as any
        
        if(data)
        {
            this.wheelData = data.wheelSlices as WheelCredit[]
        }

        if(!this.wheelData || this.wheelData.length === 0)
        {
            console.error(`Failed to load wheel slice data from JSON: ${settings.wheelSliceJson}`)
            this.removeAll(true)
            return
        }

        for(let i = 0; i < this.wheelData.length; ++i)
        {
            let angleDeg = (360 / this.wheelData.length) * i
            let angleRad = Phaser.Math.DegToRad(angleDeg)
            let x = Math.cos(angleRad) * this.wheelRadius
            let y = Math.sin(angleRad) * this.wheelRadius

            let sliceContainer = this.wheelGame.add.container(x, y).setAngle(90 + angleDeg)

            //let slice = this.wheelGame.add.image(0, 0, settings.wheelSliceImage).setOrigin(0.5).setTint( WheelSliceInfo.WheelSlices[i].color )
            let creditText = this.wheelGame.add.text(50, -180, String(this.wheelData[i].credit), {
                                            fontFamily: 'Arial',
                                            fontSize: 100,
                                            fontStyle: 'bold',
                                            color: '#FFFFFF', // White color
                                            align: 'left',
                                        }).setAngle(90)

            //sliceContainer.add(slice)
            sliceContainer.add(creditText)

            this.wheelContainer.add(sliceContainer)
            //this.wheelSlices.push( slice )
        }

        this.idleSpeed = settings.wheelIdleSpeed
        this.spinSpeed = settings.wheelSpinSpeed

        this.add(this.wheelContainer)

        // Copied from Google AI
        this.idleTweenConfig = {
            targets: this.wheelContainer,
            angle: '+=360', // Rotates the container by 360 degrees
            duration: 360 / this.idleSpeed * 1000,
            repeat: -1, // Spin indefinitely
            ease: 'Linear'
        }

        this.wheelClick = this.wheelGame.sound.add(settings.wheelClickSound, {
            volume: 50
        })

        this.add(this.wheelGame.add.image(0, -550, settings.wheelPickImage).setScale(2))

        this.setMask(settings.mask)

        this.idleTween = this.wheelGame.tweens.add(this.idleTweenConfig)
    }

    public ResetWheel(): void
    {
        this.sliceLanded = -1
        this.idleTween = this.wheelGame.tweens.add(this.idleTweenConfig)
    }

    public get SliceWin(): number { return this.wheelData[this.sliceLanded].credit}

    public LandOnSlice(slice: number = -1): void
    {

        this.wheelGame.tweens.remove(this.idleTween)

        // Ignore
        if(this.sliceLanded >= 0)
        {
            return
        }

        if(slice < 0 || slice >= this.wheelData.length)
        {
            // Use weighted table to determine slice to land on
            let totalWeight = 0

            // Total up weights
            this.wheelData.forEach(s => totalWeight += s.weight)

            // pick a random weight
            let randWeight = Math.random() * totalWeight

            for(let x = 0; x < this.wheelData.length; ++x)
            {
                randWeight -= this.wheelData[x].weight

                // Broke past 0, set this.sliceLanded
                if(randWeight <= 0)
                {
                    slice = x
                    break
                }
            }
        }

        if(slice < 0)
        {
            console.error("Logic error: Couldn't find a slice to land on...?")
            return
        }

        this.sliceLanded = slice

        let sliceLength = (360 / this.wheelData.length)
        let angleToLand = slice * sliceLength - ( (slice+1) % 2 ) * 90 // Calculate where the wheel needs to land

        let rotations = 5        // Total amount of times wheel will spin
        let rotationsToSlow = 3  // Amount of rotations before slowing down


        let spinDuration = ( (rotations - rotationsToSlow) * 360) / this.spinSpeed * 1000

        this.spinTween = this.wheelGame.tweens.add({
            targets: this.wheelContainer,
            angle: (rotations - rotationsToSlow) * 360,
            duration: spinDuration,
            repeat: 0,
            ease: 'Linear',
            onComplete: () => {
                this.wheelGame.tweens.remove(this.spinTween)
                // Wheel will always spin to degree 0 due to the initial tween above
                let currentWheelAngle = 0
                let angleToTravel = angleToLand - currentWheelAngle
                // calculate distance to the angle
                let distance = (rotations - rotationsToSlow) * 360 + angleToTravel
                // based on basic physics
                // We know the distance and the final and inital velocity
                // Solve for time
                // EQ: d = ((vi + vf) / 2) * t
                let time = 2 * distance / (this.spinSpeed)

                // Now we know the time, we can do the final tween to land on the slice
                this.wheelGame.tweens.add({
                    targets: this.wheelContainer,
                    angle: (rotations - rotationsToSlow) * 360 + angleToLand,
                    duration: time * 1000,
                    repeat: 0,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        this.wheelGame.WheelLanded()
                    }
                })
            }
        })
    }

    // Phasers way of keeping track of the angle is based differently
    // than a traditional unit circle, so we need to adjust accordingly
    // For easier tracking
    private getWheelAngle(): number
    {
        if(this.wheelContainer)
        {
            let angle = this.wheelContainer.angle

            return angle < 0 ? 360 - Math.abs(angle) : angle
        }

        return 0
    }

    public update(): void
    {
        if(this.wheelData === null)
        {
            return;
        }

        let sliceLength = (360 / this.wheelData.length)

        if(this.wheelClick && this.sliceLanded >= 0)
        {
            // We adjust by half a slice to make the click sound line up on the line and not in between
            let angle = this.getWheelAngle() - sliceLength / 2

            // Divide the angles by the slice length to see how far from the previous slice the angle is
            let anglePastClick = Math.floor(angle / sliceLength)
            let prevAnglePastClick = Math.floor(this.prevAngle / sliceLength)

            // If they don't match, we've crossed a slice line
            if(anglePastClick != prevAnglePastClick)
            {
                this.wheelClick.play()
            }

            this.prevAngle = angle
        }
        else
        {
            this.prevAngle = this.getWheelAngle() - sliceLength / 2
        }
    }
}