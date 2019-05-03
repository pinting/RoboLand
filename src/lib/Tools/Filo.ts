export class Filo<T>
{
    private size: number;
    private array: T[];

    /**
     * Construct a first in last out storage.
     * @param size 
     */
    public constructor(size: number)
    {
        this.size = size;
        this.array = new Array<T>();
    }

    /**
     * Add an element (maybe removes the last one).
     * @param element 
     */
    public Add(element: T): void
    {
        this.array.push(element);

        if(this.array.length >= this.size)
        {
            this.array.shift();
        }
    }

    /**
     * Get the internal array.
     */
    public GetList(): Array<T>
    {
        return this.array;
    }
}