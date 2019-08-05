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
     * Add an unit (maybe removes the last one).
     * @param unit 
     */
    public Add(unit: T): void
    {
        this.array.push(unit);

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