export class Coord
{
    public X: number;
    public Y: number;

    constructor(x: number, y: number)
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
     * Calculate the difference with another coord.
     * @param other 
     */
    public Difference(other: Coord): Coord
    {
        return new Coord(this.X + other.X, this.Y + other.Y);
    }
}