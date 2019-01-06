import { Exportable, ExportType } from "./Exportable";

export class Coord extends Exportable
{
    @Exportable.Register(ExportType.User)
    public X: number;

    @Exportable.Register(ExportType.User)
    public Y: number;

    /**
     * Construct a new coord.
     */
    constructor(x: number = 0, y: number = 0)
    {
        super();

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
     * Check if two objects are collide.
     * @param a1 A from point
     * @param a2 A to point
     * @param b1 B from point
     * @param b2 B to point
     */
    public static Collide(a1: Coord, a2: Coord, b1: Coord, b2: Coord): boolean
    {
        return a2.X > b1.X && a1.X < b2.X && a2.Y > b1.Y && a1.Y < b2.Y;
    }
}

Exportable.Dependency(Coord);