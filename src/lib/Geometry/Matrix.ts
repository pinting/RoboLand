import { Vector } from "./Vector";

export class Matrix
{
    private m00: number;
    private m01: number;
    private m10: number;
    private m11: number;

    public constructor(m00 = 0, m01 = 0, m10 = 0, m11 = 0)
    {
        this.m00 = m00;
        this.m01 = m01;
        this.m10 = m10;
        this.m11 = m11;
    }

    public static ByRad(radians: number)
    {
        const c = Math.cos(radians);
        const s = Math.sin(radians);

        return new Matrix(c, -s, s, c)
    }

    public Abs(): Matrix
    {
        return new Matrix(
            Math.abs(this.m00),
            Math.abs(this.m01),
            Math.abs(this.m10),
            Math.abs(this.m11));
    }

    public AxisX(): Vector
    {
        return new Vector(this.m00, this.m10);
    }

    public AxisY(): Vector
    {
        return new Vector(this.m01, this.m11);
    }

    public Transpose(): Matrix
    {
        return new Matrix(this.m00, this.m10, this.m01, this.m11);
    }

    public ScaleByVector(v: Vector): Vector
    {
        return new Vector(
            this.m00 * v.X + this.m01 * v.Y,
            this.m10 * v.X + this.m11 * v.Y);
    }

    public ScaleByMatrix(m: Matrix): Matrix
    {
        return new Matrix(
            this.m00 * m.m00 + this.m01 * m.m10,
            this.m00 * m.m01 + this.m01 * m.m11,
            this.m10 * m.m00 + this.m11 * m.m10,
            this.m10 * m.m01 + this.m11 * m.m11);
    }
}