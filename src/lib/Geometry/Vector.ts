import { Exportable, ExportType } from "../Exportable";
import { Matrix } from "./Matrix";

export class Vector extends Exportable
{
    public static EPSILON = 0.0001;

    @Exportable.Register(ExportType.Visible)
    public X: number;

    @Exportable.Register(ExportType.Visible)
    public Y: number;
    
    constructor(x: number = 0, y: number = 0)
    {
        super();

        if(Number.isNaN(x) || Number.isNaN(y))
        {
            throw new Error("NaN in Vector!");
        }

        this.X = x;
        this.Y = y;
    }
    
    public static ByRad(rad: number): Vector
    {
        return new Vector(Math.cos(rad), Math.sin(rad))
    }

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

    public static Cross(a: Vector | number, b: Vector | number): Vector | number
    {

        if(a instanceof Vector && typeof b === "number")
        {
            if(Number.isNaN(b))
            {
                throw new Error("Cross resulted in NaN");
            }

            return new Vector(b * a.Y, -b * a.X);
        }

        if(typeof a === "number" && b instanceof Vector)
        {
            if(Number.isNaN(a))
            {
                throw new Error("Cross resulted in NaN");
            }

            return new Vector(-a * b.Y, a * b.X);
        }

        if(a instanceof Vector && b instanceof Vector)
        {
            return a.X * b.Y - a.Y * b.X;
        }

        throw Error("Vector Cross wrong parameters!")
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

    public Equal(other: Vector): boolean
    {
        return Vector.Equal(this.X, other.X) && Vector.Equal(this.Y, other.Y);
    }

    /**
     * Add a vector to this one.
     * @param other 
     */
    public Add(other: Vector | number): Vector
    {
        if(typeof other === "number")
        {
            if(Number.isNaN(other))
            {
                throw new Error("Add resulted in NaN");
            }

            return new Vector(this.X + other, this.Y + other);
        }

        return new Vector(this.X + other.X, this.Y + other.Y);
    }

    /**
     * Substract a vector from this one.
     * @param other 
     */
    public Sub(other: Vector | number): Vector
    {
        if(typeof other === "number")
        {
            if(Number.isNaN(other))
            {
                throw new Error("Sub resulted in NaN");
            }

            return new Vector(this.X - other, this.Y - other);
        }

        return new Vector(this.X - other.X, this.Y - other.Y);
    }

    public Neg(): Vector
    {
        return new Vector(-this.X, -this.Y);
    }

    /**
     * Scale this vector by another one.
     * @param other 
     */
    public Scale(other: Vector | number): Vector
    {
        if(typeof other === "number")
        {
            if(Number.isNaN(other))
            {
                throw new Error("Scale resulted in NaN");
            }
    
            return new Vector(this.X * other, this.Y * other);
        }

        return new Vector(this.X * other.X, this.Y * other.Y);
    }

    /**
     * Rotate the vector by angle.
     * @param r Rotation in radian
     * @param c Rotate around this point.
     */
    public Rotate(r: number = 0, c: Vector = new Vector(0, 0)): Vector
    {
        return Matrix.ByRad(r).ScaleByVector(this.Add(c.Neg())).Add(c);
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
     * Normalize this vector (make it have length of `1`).
     * @return This for chaining.
     */
    public Normalize(): Vector
    {
        var l = this.Len();

        return new Vector(this.X / l, this.Y / l);
    }

    public static Equal(a: number, b: number)
    {
        return Math.abs(a - b) <= Vector.EPSILON;
    }

    public static BiasGreaterThan(a: number, b: number): boolean
    {
        const biasRelative = 0.95;
        const biasAbsolute = 0.01;

        return a >= b * biasRelative + a * biasAbsolute;
    }
}

Exportable.Dependency(Vector);