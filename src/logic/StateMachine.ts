
 type StringFunction = (input: string) => void

export default class StateMachine
{
    private states: string[] = [];
    private _currentState: string = "";
    public get CurrentState(): string { return this._currentState }

    private stateListeners: StringFunction[] = [];
    private stateIndex = -1;

    constructor(_states: string[])
    {
        this.states.push(..._states);

        if(this.states.length > 0)
        {
            this.stateIndex = 0
            this._currentState = this.states[this.stateIndex]
        }
        else
        {
            console.error("No states were present in passed array.")
        }
    }

    public NextState(): void
    {
        this.stateIndex++

        if(this.stateIndex >= this.states.length)
        {
            this.stateIndex = 0
        }

        if(this.states[this.stateIndex])
        {
            this._currentState = this.states[this.stateIndex];
            console.log(`Current State: ${this._currentState}`)
            this.stateListeners.forEach(listener => listener(this._currentState))
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