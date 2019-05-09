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
    public Dist(other: Vector): number
    {
        return Math.sqrt(Math.pow(other.X - this.X, 2) + Math.pow(other.Y - this.Y, 2));
    }

    /**
     * Get the squared length of this vector.
     * @return The length^2 of this vector.
     */
    public Len2(): number
    {
        return this.Dot(this);
    }

    /**
     * Get the length of this vector.
     * @return The length of this vector.
     */
    public Len(): number
    {
        return Math.sqrt(this.Len2());
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
     * @param rad In rad
     * @param c Rotate around this point.
     */
    public Rotate(rad: number, c: Vector = new Vector(0, 0)): Vector
    {
        return new Vector(
            c.X + (this.X - c.X) * Math.cos(rad) - (this.Y - c.Y) * Math.sin(rad),
            c.Y + (this.X - c.X) * Math.sin(rad) + (this.Y - c.Y) * Math.cos(rad)
        );
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
     * Normalize this vector. (make it have length of `1`)
     * @return This for chaining.
     */
    public Normalize(): Vector
    {
        var d = this.Dist(this);

        if (d > 0) {
            this.X = this.X / d;
            this.Y = this.Y / d;
        }

        return this;
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
    public static AngleToVector(rad: number): Vector
    {
        return new Vector(Math.cos(rad), Math.sin(rad))
    }
}

Exportable.Dependency(Vector);