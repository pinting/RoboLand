export class Coord
{
    public X: number;
    public Y: number;

    /**
     * Construct a new coord.
     */
    constructor(x: number = 0, y: number = 0)
    {
        this.X = x;
        this.Y = y;
    }

    /**
     * Get the distance from the other coord.
     * @param other 
     */
    public GetDistance(other: Coord): number
    {
        return Math.sqrt(Math.pow(this.X - other.X, 2) + Math.pow(this.Y - other.Y, 2));
    }

    /**
     * Check if the coord is the same as an other.
     * @param other 
     */
    public Is(other: Coord): boolean
    {
        return this.X == other.X && this.Y == other.Y;
    }

    /**
     * Add a coord to this one.
     * @param other 
     */
    public Add(other: Coord): Coord
    {
        return new Coord(this.X + other.X, this.Y + other.Y);
    }

    /**
     * Clone the coord.
     */
    public Clone(): Coord
    {
        return new Coord(this.X, this.Y);
    }

    /**
     * Floor the coordinates.
     */
    public Floor(): Coord
    {
        return this.F(n => Math.floor(n));
    }

    /**
     * Ceil the coordinates.
     */
    public Ceil(): Coord
    {
        return this.F(n => Math.ceil(n));
    }

    /**
     * Round up the coordinates.
     * @param d Decimal places to round up.
     */
    public Round(d = 0): Coord
    {
        return this.F(n => Math.round(n * Math.pow(10, d)) / Math.pow(10, d));
    }

    /**
     * Execute a function on the coordinates.
     * @param f Function to execute.
     */
    public F(f: (n: number) => number): Coord
    {
        return new Coord(f(this.X), f(this.Y));
    }
}