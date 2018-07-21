import { Event } from "./Event";

export class TimeoutEvent<T> extends Event<T>
{
    private timeout: number;
    private timers: { [id: number]: NodeJS.Timer } = {};

    /**
     * Create a TimeoutEvent where every listener will be removed
     * after the given timeout and called with a null value.
     * @param timeout 
     */
    public constructor(timeout: number = 5000)
    {
        super();

        this.timeout = timeout;
    }

    /**
     * Add a listener and return its id.
     * @param callback 
     */
    public Add(callback: (value: T) => void): number
    {
        const id = super.Add(callback);

        this.timers[id] = setTimeout(() =>
        {
            callback(null);
            this.Remove(id);
        }, this.timeout);

        return id;
    }

    /**
     * Remove a listener by id.
     * @param id 
     */
    public Remove(id: number): void
    {
        if(this.timers[id])
        {
            clearTimeout(this.timers[id]);
            delete this.timers[id];
        }

        super.Remove(id);
    }
}