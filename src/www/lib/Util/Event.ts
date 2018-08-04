export class Event<T>
{
    protected listeners: { [id: number]: (value: T) => void } = {};
    private count = 0;

    /**
     * Add a listener.
     * @param callback 
     */
    public Add(callback: (value: T) => void): number
    {
        this.listeners[++this.count] = callback;
        
        return this.count;
    }

    /**
     * Remove a listener.
     * @param id 
     */
    public Remove(id: number): void
    {
        delete this.listeners[id];
    }

    /**
     * Call listeners with the given value.
     * @param value 
     */
    public Call(value?: T): void
    {
        (<any>Object).values(this.listeners).forEach(callback => callback(value));
    }
}