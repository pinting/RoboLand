import { IExportable } from "./IExportable";

export class Coord implements IExportable
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
     * Export coordinate.
     */
    public Export(): string
    {
        return this.X + "," + this.Y;
    }

    /**
     * Import exported coordinates.
     * @param input 
     */
    public Import(input: string): boolean
    {
        const parts: string[] = input.split(",");

        const x = Number.parseFloat(parts[0]);
        const y = Number.parseFloat(parts[1]);

        if(!Number.isFinite(x) || !Number.isFinite(y))
        {
            return false;
        }

        this.X = x;
        this.Y = y;

        return true;
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
     * Check if the coordinate is inside the intersection of two points.
     * @param from 
     * @param to 
     */
    public Inside(from: Coord, to: Coord): boolean
    {
        if(from.X <= this.X && from.Y <= this.Y && to.X >= this.X && to.Y >= this.Y)
        {
            return true;
        }

        return false;
    }

    /**
     * Check if two objects all collide.
     * @param a A from point
     * @param as A to point
     * @param b B from point
     * @param bs B to point
     */
    static Collide(a: Coord, as: Coord, b: Coord, bs: Coord): boolean
    {
        return as.X > b.X && a.X < bs.X && as.Y > b.Y && a.Y < bs.Y;
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