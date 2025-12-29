import { State } from "../info/States";
import WheelGame from "../scenes/WheelGame";

 type StringFunction = (input: string) => void

export default class StateMachine
{
    private states: State[] = null;
    private _currentState: string = "";
    public get CurrentState(): string { return this._currentState }
    private stateIndex: number = -1

    private stateListeners: StringFunction[] = [];

    constructor(_wheelGame: WheelGame,  _statesFile: string)
    {
        let data = _wheelGame.cache.json.get(_statesFile) as any
        let firstState: string = null;
        if(data && data.states)
        {
            this.states = data.states as State[]
            firstState = data.firstState as string
        }

        if(!this.states)
        {
            console.error("Failed to parse states from states file.")
            return;
        }    

        if(firstState)
        {
            let index = this.states.findIndex(s => s.name === firstState)
            if(index >= 0)
            {
                this.stateIndex = index
            }
            else
            {
                console.error(`First state ${firstState} not found in states list.`)
            }
            this._currentState = firstState
        }
        else
        {
            console.error(`No states were present in passed file ${_statesFile}`)
        }
    }

    public NextState(): void
    {
        if(this.stateIndex >= 0 && this.states[this.stateIndex])
        {
            let nextStateName = this.states[this.stateIndex].nextState;
            let state = this.states.find((s, index) => {    
                if(s.name === nextStateName)
                {
                    this.stateIndex = index
                    return s
                }
            });

            if(state)
            {
                this._currentState = this.states[this.stateIndex].name
                console.log(`Current State: ${this._currentState}`)
                this.stateListeners.forEach(listener => listener(this._currentState))
            }
        }
    }

    public AddListener(func: StringFunction): void
    {
        if(func)
        {
            this.stateListeners.push(func);
        }
    }

    public RemoveListener(func: StringFunction): void
    {
        this.stateListeners.filter(f => f != func);
    }
}