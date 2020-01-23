import { Vector } from "../Geometry/Vector";
import { Exportable, ExportType } from "../Exportable";
import { IContact } from "../Geometry/IContact";
import { BaseShape } from "../Geometry/BaseShape";
import { Overlap } from "../Geometry/Overlap";
import { Polygon } from "../Geometry/Polygon";
import { Tools } from "../Util/Tools";
import { ICollision } from "./ICollision";

export interface BodyArgs
{
    density?: number; // Mass density
    gravity?: Vector; // Gravity
    force?: Vector; // Force
    v?: Vector; // Velocity
    av?: number; // Angular velocity
    torque?: number; // Torque
    sf?: number; // Static friction
    df?: number; // Dynamic friction
    r?: number; // Restitution
}


export class Body extends Exportable
{
    @Exportable.Register(ExportType.Visible)
    protected shapes: BaseShape[] = [];

    protected scale: number = 1;
    protected rotation: number = 0;
    protected offset: Vector = new Vector(0, 0);

    protected gravity: Vector; // Gravity
    protected force: Vector; // Force
    protected v: Vector; // Velocity
    protected av: number; // Angular velocity
    protected torque: number; // Torque
    protected I: number;  // Moment of inertia
    protected iI: number; // Inverse inertia
    protected m: number;  // Mass
    protected im: number; // Inverse mass
    protected sf: number; // Static friction
    protected df: number; // Dynamic friction
    protected r: number; // Restitution

    public OnChange: (scale?: number, rotation?: number, offset?: Vector) => void = Tools.Noop;

    /**
     * Construct a new body with the given shapes.
     * @param shapes Can be empty.
     */
    constructor(shapes: BaseShape[] = [], args: BodyArgs = {}) 
    {
        super();

        this.shapes = shapes;

        this.gravity = args.gravity || new Vector(0, 0);
        this.force = args.force || new Vector(0, 0);
        this.sf = args.sf || 0.5;
        this.df = args.df || 0.3;
        this.r = args.r || 0.2;
        this.av = args.av || 0;
        this.torque = args.torque || 0;
        this.v = args.v || new Vector(0, 0);

        this.ComputeMass(args.density);
    }

    private EveryShape<T>(other: Body, callback: (s1: BaseShape, s2: BaseShape) => T): T
    {
        for(let s1 of this.shapes)
        {
            for(let s2 of other.shapes)
            {
                const result = callback(s1, s2);

                if(result)
                {
                    return result;
                }
            }
        }

        return null;
    }

    public AddShape(shape: BaseShape)
    {
        this.shapes.push(shape);
    }

    public GetShapes() 
    {
        return this.shapes;
    }

    public Collide(other: Body): ICollision
    {
        const contact = this.EveryShape<IContact>(other, (s1, s2) => Overlap.Test(s1, s2)) as ICollision;

        if(contact)
        {
            contact.A = this;
            contact.B = other;
        }

        return contact;
    }

    public SetVirtual(scale?: number, rotation?: number, offset?: Vector): void
    {
        scale && (this.scale = scale);
        rotation && (this.rotation = rotation);
        offset && (this.offset = offset);

        this.OnChange(scale, rotation, offset);

        this.shapes.forEach(s => s.SetVirtual(scale, rotation, offset));
    }

    public IntegrateForces(dt: number, cf: number = 0.85)
    {
        if(this.im == 0)
        {
            return;
        }

        this.av = this.av * cf + this.torque * this.iI * (dt / 2);
        this.v = this.v.Scale(cf).Add(this.force.Scale(this.im * dt));
    }

    public IntegrateVelocity(dt: number)
    {
        if(this.im == 0)
        {
            return;
        }

        const nextOffset = this.offset.Add(this.v.Scale(dt));
        const nextRot = this.rotation + this.av * dt;

        this.SetVirtual(null, nextRot, nextOffset);
    }

    public AddForce(f: Vector)
    {
        this.force = this.force.Add(f);
    }

    public AddTorque(t: number)
    {
        this.torque += t;
    }

    public ApplyImpulse(impulse: Vector, contactVector: Vector)
    {
        this.v = this.v.Add(impulse.Scale(new Vector(this.im, this.im)));
        this.av += this.iI * <number>Vector.Cross(contactVector, impulse);
    }

    public ClearForces()
    {   
        this.force = new Vector(0, 0);
        this.torque = 0;
    }

    /**
     * Get the radius of the unit.
     */
    public GetRadius(): number
    {
        if(!this.scale)
        {
            throw new Error("Get radius failed, no size!");
        }

        return this.scale / 2;
    }

    public GetSize(): number
    {
        return this.scale;
    }

    /**
     * Calculate centroid and moment of interia
     * @param density 
     */
    private ComputeMass(density = 1) 
    {
        let c = new Vector(0, 0); // Centroid
        let area = 0;
        let I = 0;

        const inv3 = 1 / 3;

        for (let shape of this.shapes)
        {
            if (shape instanceof Polygon) 
            {
                for (let i1 = 0; i1 < shape.GetPoints().length; ++i1) 
                {
                    const p1 = shape.GetPoints()[i1];
                    const i2 = i1 + 1 < shape.GetPoints().length ? i1 + 1 : 0;
                    const p2 = shape.GetPoints()[i2];

                    const D = Vector.Cross(p1, p2) as number;
                    const triangleArea = 0.5 * D;

                    area += triangleArea;

                    // Use area to weight the centroid average, not just vertex position
                    c = c.Add(p1.Add(p2).Scale(triangleArea * inv3));

                    const intx2 = p1.X * p1.X + p2.X * p1.X + p2.X * p2.X;
                    const inty2 = p1.Y * p1.Y + p2.Y * p1.Y + p2.Y * p2.Y;

                    I += (0.25 * inv3 * D) * (intx2 + inty2);
                }
            }
        }

        c = c.Scale(1.0 / area);

        this.m = density * area;
        this.im = (this.m) ? 1.0 / this.m : 0.0;
        this.I = I * density;
        this.iI = this.I ? 1.0 / this.I : 0.0;
    }

    /**
     * Naive correction of positional penetration
     * @param c An object that implements the ICollision interface
     * @param dt 
     */
    public static PositionalCorrection(c: ICollision, dt: number = 1 / 60)
    {
        const a = c.A;
        const b = c.B;

        const kSlop = 0.05; // Penetration allowance
        const percent = 0.4; // Penetration percentage to correct

        const correction = c.Normal.Scale((Math.max(c.Penetration - kSlop, 0) / (a.im + b.im)) * percent);

        a.offset = a.offset.Add(correction.Scale(a.im));
        b.offset = b.offset.Add(correction.Scale(b.im));
    }
    
    /**
     * Resolve a collision between two bodies
     * @param c An object that implements the ICollision interface
     * @param dt 
     */
    public static ResolveCollision(c: ICollision, dt: number = 1 / 60)
    {
        const a = c.A;
        const b = c.B;

        if(Vector.Equal(a.im + b.im, 0))
        {
            a.v = new Vector(0, 0);
            b.v = new Vector(0, 0);
            return;
        }

        // Calculate average restitution
        let e = Math.min(a.r, b.r);

        // Calculate static and dynamic friction
        const sf = Math.sqrt(a.sf * b.sf);
        const df = Math.sqrt(a.df * b.df);

        for(let i = 0; i < c.Points.length; i++)
        {
            const ra = c.Points[i].Sub(a.offset);
            const rb = c.Points[i].Sub(b.offset);

            const ca = Vector.Cross(a.av, ra) as Vector;
            const cb = Vector.Cross(b.av, rb) as Vector;
            const rv = b.v.Add(cb).Sub(a.v.Sub(ca));

            // Determine if we should perform a resting collision or not
            // The idea is if the only thing moving a object is gravity,
            // then the collision should be performed without any restitution
            if(rv.Len2() < a.gravity.Scale(dt).Len2() + Vector.EPSILON)
            {
                e = 0.0;
            }
        }

        for(let i = 0; i < c.Points.length; i++)
        {
            // Calculate radii from COM to contact
            const ra = c.Points[i].Sub(a.offset);
            const rb = c.Points[i].Sub(b.offset);

            // Relative velocity
            let cb = Vector.Cross(b.av, rb) as Vector;
            let ca = Vector.Cross(a.av, ra) as Vector;
            let rv = b.v.Add(cb).Sub(a.v.Sub(ca));

            // Relative velocity along the normal
            const contactVel = rv.Dot(c.Normal);

            // Do not resolve if velocities are separating
            if(contactVel > 0)
            {
                return;
            }

            const raCrossN = Vector.Cross(ra, c.Normal) as number;
            const rbCrossN = Vector.Cross(rb, c.Normal) as number;

            const invMassSum = a.im + b.im + 
                Math.pow(raCrossN, 2) * a.iI + 
                Math.pow(rbCrossN, 2) * b.iI;

            // Calculate impulse scalar
            let j = -(1.0 + e) * contactVel;

            j /= invMassSum;
            j /= c.Points.length;

            if(!Number.isFinite(j))
            {
                return;
            }

            // Apply impulse
            const impulse = c.Normal.Scale(j);

            a.ApplyImpulse(impulse.Neg(), ra);
            b.ApplyImpulse(impulse, rb);

            // Friction impulse
            ca = Vector.Cross(a.av, ra) as Vector;
            cb = Vector.Cross(b.av, rb) as Vector;
            rv = b.v.Add(cb).Sub(a.v.Sub(ca));

            const rvnDot = rv.Dot(c.Normal);
            let t = rv.Sub(c.Normal.Scale(rvnDot));

            t = t.Normalize();

            // j tangent magnitude
            let jt = -rv.Dot(t);

            jt /= invMassSum;
            jt /= c.Points.length;

            // Don't apply tiny friction impulses
            if(Vector.Equal(jt, 0.0))
            {
                return;
            }

            // Coulumb's law
            let tangentImpulse: Vector;

            if(Math.abs(jt) < j * sf) 
            {
                tangentImpulse = t.Scale(jt);
            }
            else {
                tangentImpulse = t.Scale(-j * df);
            }

            // Apply friction impulse
            a.ApplyImpulse(tangentImpulse.Neg(), ra);
            b.ApplyImpulse(tangentImpulse, rb);
        }
    }
}