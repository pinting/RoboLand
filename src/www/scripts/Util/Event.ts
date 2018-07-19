export class Event<T>
{
    protected listeners: Array<(value: T) => void> = [];

    /**
     * Add a listener.
     */
    public Add(callback: (value: T) => void): void
    {
        this.listeners.push(callback);
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
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Call listeners with the given value.
     * @param value 
     */
    public Call(value: T): void
    {
        this.listeners.forEach(callback => callback(value));
    }
}