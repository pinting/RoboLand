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
    cf?: number; // Cell friction
    r?: number; // Restitution
    z?: number; // Z-Index
}

export class Body extends Exportable
{
    @Exportable.Register(ExportType.NetDisk)
    protected shapes: BaseShape[] = [];

    @Exportable.Register(ExportType.NetDisk, (s, v) => s.SetVirtual(v, null, null))
    protected scale: Vector = new Vector(1, 1);
    
    @Exportable.Register(ExportType.NetDisk, (s, v) => s.SetVirtual(null, v, null))
    protected rotation: number = 0;
    
    @Exportable.Register(ExportType.NetDisk, (s, v) => s.SetVirtual(null, null, v))
    protected position: Vector = new Vector(0, 0);

    @Exportable.Register(ExportType.NetDisk)
    protected gravity: Vector; // Gravity
    
    @Exportable.Register(ExportType.NetDisk)
    protected force: Vector; // Force
    
    @Exportable.Register(ExportType.NetDisk)
    protected v: Vector; // Velocity
    
    @Exportable.Register(ExportType.NetDisk)
    protected av: number; // Angular velocity
    
    @Exportable.Register(ExportType.NetDisk)
    protected torque: number; // Torque
    
    @Exportable.Register(ExportType.NetDisk)
    protected sf: number; // Static friction
    
    @Exportable.Register(ExportType.NetDisk)
    protected df: number; // Dynamic friction
    
    @Exportable.Register(ExportType.NetDisk)
    protected cf: number; // Cell friction
    
    @Exportable.Register(ExportType.NetDisk)
    protected r: number; // Restitution

    @Exportable.Register(ExportType.NetDisk, (s, v) => s.ComputeMass(v))
    protected density: number; // Mass density
    
    @Exportable.Register(ExportType.NetDisk)
    protected z: number; // Z-Index
    
    protected I: number;  // Moment of inertia
    protected iI: number; // Inverse inertia
    protected m: number;  // Mass
    protected im: number; // Inverse mass

    public Validate: (scale: Vector, rotation: number, position: Vector) => boolean;

    /**
     * Construct a new body with the given shapes.
     * @param shapes Can be empty.
     */
    constructor(shapes: BaseShape[] = [], args: BodyArgs = {}) 
    {
        super();

        this.shapes = shapes;

        this.gravity = args.gravity || new Vector(0, 0);
        this.sf = args.sf || 0.5;
        this.df = args.df || 0.3;
        this.r = args.r || 0.2;
        this.av = args.av || 0;
        this.torque = args.torque || 0;
        this.v = args.v || new Vector(0, 0);
        this.force = args.force || new Vector(0, 0);
        this.density = args.density || 1.0;
        this.z = args.z || 0;
        this.cf = args.cf || 0.05;

        this.ComputeMass(this.density);
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

        return this.scale.Len() / 2;
    }

    public GetRotation(): number
    {
        return this.rotation;
    }

    public GetPosition(): Vector
    {
        return this.position;
    }

    public GetScale(): Vector
    {
        return this.scale;
    }

    public GetShapes() 
    {
        return this.shapes;
    }

    public GetForce(): Vector
    {
        return this.force;
    }

    public GetTorque(): number
    {
        return this.torque;
    }
    
    public GetVelocity(): Vector
    {
        return this.v;
    }
    
    public GetAngularVelocity(): number
    {
        return this.av;
    }
    
    public GetZ(): number
    {
        return this.z;
    }

    public SetCellFriction(friction: number): void
    {
        this.cf = friction;
    }

    public SetGravity(gravity: Vector): void
    {
        this.gravity = gravity;
    }

    public SetZ(z: number): void
    {
        this.z = z;
    }

    public AddForce(f: Vector)
    {
        this.force = this.force.Add(f);
    }
    
    public AddTorque(t: number)
    {
        this.torque += t;
    }

    /**
     * Go through each shape combination of this and the other body.
     * @param other 
     * @param callback 
     */
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

    /**
     * Add a new shape to this body.
     * @param shape 
     */
    public AddShape(shape: BaseShape)
    {
        this.shapes.push(shape);
    }

    public Collide(other: Body): ICollision
    {
        if(this.GetZ() != other.GetZ())
        {
            return null;
        }

        const dist = this.position.Dist(other.position);

        // Optimize, if unit is too far away, skip deeper collision detection
        if(dist > this.GetRadius() + other.GetRadius())
        {
            return null;
        }

        const contact = this.EveryShape<IContact>(other, (s1, s2) => Overlap.Test(s1, s2)) as ICollision;

        if(contact)
        {
            contact.A = this;
            contact.B = other;
        }

        return contact;
    }

    public SetVirtual(scale?: Vector, rotation?: number, position?: Vector): void
    {
        if(this.Validate && !this.Validate(scale || this.scale,
            Number.isFinite(rotation) ? rotation : this.rotation,
            position || this.position))
        {
            return;
        }

        scale && (this.scale = scale);
        rotation && (this.rotation = rotation);
        position && (this.position = position);

        this.shapes.forEach(s => s.SetVirtual(scale, rotation, position));
    }

    /**
     * Calculate angular velocity and velocity.
     * @param dt 
     */
    public IntegrateForces(dt: number)
    {
        if(this.im == 0)
        {
            return;
        }

        const cf = Math.pow(this.cf, dt);

        this.av = this.av * cf + this.torque * this.iI * (dt / 2);
        this.v = this.v.Scale(cf).Add((this.force.Scale(this.im).Add(this.gravity).Scale(dt / 2)));
    }

    /**
     * Calculate the next rotation and position from the angular velocity and velocity.
     * @param dt 
     */
    public IntegrateVelocity(dt: number)
    {
        if(this.im == 0 || (!this.av && !this.v.Len()))
        {
            return;
        }

        const nextposition = this.position.Add(this.v.Scale(dt));
        const nextRot = this.rotation + this.av * dt;

        this.SetVirtual(null, nextRot, nextposition);
    }

    /**
     * Apply impluse onto the body.
     * @param impulse 
     * @param contactVector 
     */
    private ApplyImpulse(impulse: Vector, contactVector: Vector)
    {
        this.v = this.v.Add(impulse.Scale(new Vector(this.im, this.im)));
        this.av += this.iI * <number>Vector.Cross(contactVector, impulse);
    }

    /**
     * Clear the force and the torque of the body.
     */
    public ClearForces()
    {   
        this.force = new Vector(0, 0);
        this.torque = 0;
    }

    /**
     * Calculate centroid and moment of interia
     * @param density 
     */
    protected ComputeMass(density: number): void
    {
        if(!this.shapes.length)
        {
            return;
        }

        this.density = density;
        let c = new Vector(0, 0);
        let area = 0;
        let inertia = 0;

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
                    c = c.Add(p1.Add(p2).Scale(triangleArea * (1 / 3)));

                    const intx2 = p1.X * p1.X + p2.X * p1.X + p2.X * p2.X;
                    const inty2 = p1.Y * p1.Y + p2.Y * p1.Y + p2.Y * p2.Y;

                    inertia += (0.25 * (1 / 3) * D) * (intx2 + inty2);
                }
            }
        }

        c = c.Scale(1.0 / area);

        this.m = density * area;
        this.im = (this.m) ? 1.0 / this.m : 0.0;
        this.I = inertia * density;
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

        a.position = a.position.Add(correction.Scale(a.im));
        b.position = b.position.Add(correction.Scale(b.im));
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
            const ra = c.Points[i].Sub(a.position);
            const rb = c.Points[i].Sub(b.position);

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
            const ra = c.Points[i].Sub(a.position);
            const rb = c.Points[i].Sub(b.position);

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
            else
            {
                tangentImpulse = t.Scale(-j * df);
            }

            // Apply friction impulse
            a.ApplyImpulse(tangentImpulse.Neg(), ra);
            b.ApplyImpulse(tangentImpulse, rb);
        }
    }
    
    public static CreateBoxBody(scale: Vector, rotation: number, position: Vector, args: BodyArgs = {}): Body
    {
        const body = new Body([Polygon.CreateBox(1)], args);

        body.SetVirtual(scale, rotation, position);

        return body;
    }
}

Exportable.Dependency(Body);