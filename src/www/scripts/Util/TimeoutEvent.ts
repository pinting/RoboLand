import { Event } from "./Event";

export class TimeoutEvent<T> extends Event<T>
{
    private timeout: number = 1000;
    private timers: NodeJS.Timer[] = [];

    public constructor(timeout: number = 1000)
    {
        super();

        this.timeout = timeout;
    }

    /**
     * Add a listener.
     */
    public Add(callback: (value: T) => void): void
    {
        super.Add(callback);
        this.timers.push(setTimeout(() => 
            callback(null) && this.Remove(callback), this.timeout));
    }

    /**
     * Remove a listener.
     * @param callback 
     */
    public Remove(callback: (value: T) => void): void
    {
        const index = this.listeners.indexOf(callback);

        if(index >= 0)
        {
            clearTimeout(this.timers[index]);
            this.timers.splice(index, 1);
        }

        super.Remove(callback);
    }
}