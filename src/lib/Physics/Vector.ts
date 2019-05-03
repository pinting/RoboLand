import { Exportable, ExportType } from "../Exportable";

export class Vector extends Exportable
{
    @Exportable.Register(ExportType.User)
    public X: number;

    @Exportable.Register(ExportType.User)
    public Y: number;

    /**
     * Construct a new vector.
     */
    constructor(x: number = 0, y: number = 0)
    {
        super();

        this.X = x;
        this.Y = y;
    }

    /**
     * Clone the vector.
     */
    public Clone(): Vector
    {
        return new Vector(this.X, this.Y);
    }

    /**
     * Get the perpendicular of this vector.
     */
    public Perp(): Vector
    {
        return new Vector(this.Y, -this.X);
    }

    /**
     * Get the dot product of this vector and another.
     * @param other
     */
    public Dot(other: Vector): number
    {
        return this.X * other.X + this.Y * other.Y;
    }

    /**
     * Get the distance from another vector.
     * @param other 
     */
    public Len(other: Vector): number
    {
        return Math.sqrt(this.Dot(other));
    }

    /**
     * Check if the vector is the same as an other.
     * @param other 
     */
    public Is(other: Vector): boolean
    {
        return this.X == other.X && this.Y == other.Y;
    }

    /**
     * Add a vector to this one.
     * @param other 
     */
    public Add(other: Vector): Vector
    {
        return new Vector(this.X + other.X, this.Y + other.Y);
    }

    /**
     * Substract a vector from this one.
     * @param other 
     */
    public Sub(other: Vector): Vector
    {
        return new Vector(this.X - other.X, this.Y - other.Y);
    }

    /**
     * Scale this vector by another one.
     * @param other 
     */
    public Scale(other: Vector): Vector
    {
        return new Vector(this.X * other.X, this.Y * other.Y);
    }

    /**
     * Round up the vectorinates.
     * @param d Decimal places to round up.
     */
    public Round(d = 0): Vector
    {
        return this.F(n => Math.round(n * Math.pow(10, d)) / Math.pow(10, d));
    }

    /**
     * Rotate the vector by angle.
     * @param angle In rad
     * @param center Rotate around this point.
     */
    public Rotate(angle: number, center: Vector = new Vector): Vector
    {
        const ox = this.X - center.X;
        const oy = this.Y - center.Y;

        const nx = ox * Math.cos(angle) - ox * Math.sin(angle);
        const ny = oy * Math.sin(angle) + oy * Math.cos(angle);

        return new Vector(nx + center.X, ny + center.Y);
    }

    /**
     * Project this vector onto another vector.
     * @param other
     */
    public Project(other: Vector): Vector
    {
        const amt = this.Dot(other) / this.Dot(this);

        return new Vector(amt * other.X, amt * other.Y);
    }

    /**
     * Execute a function on the vectorinates.
     * @param f Function to execute.
     */
    public F(f: (n: number) => number): Vector
    {
        return new Vector(f(this.X), f(this.Y));
    }

    /**
     * Convert deg to rad
     * @param deg In deg
     */
    public static DegToRad(deg: number): number
    {
        return deg * Math.PI / 180;
    }

    /**
     * Create a Vector pointing into the angle specified in radian.
     * @param rad In rad
     */
    public static AngleToVector(angle: number): Vector
    {
        return new Vector(Math.cos(angle), Math.sin(angle))
    }
}

Exportable.Dependency(Vector);