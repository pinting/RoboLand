import { Vector } from "../Geometry/Vector";
import { Exportable, ExportType, IExportableArgs } from "../Exportable";
import { IContact } from "../Geometry/IContact";
import { BaseShape } from "../Geometry/BaseShape";
import { Overlap } from "../Geometry/Overlap";
import { Polygon } from "../Geometry/Polygon";
import { ICollision } from "./ICollision";
import { Logger } from "../Util/Logger";
import { Tools } from "../Util/Tools";

export interface BodyArgs extends IExportableArgs
{
    shapes?: BaseShape[];
    position?: Vector;
    scale?: Vector;
    rotation?: number;
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
    private static PenetrationAllowance = 0.01; // Penetration allowance
    private static PenetrationCorrect = 0.4; // Penetration percentage to correct

    @Exportable.Register(ExportType.NetDisk)
    protected shapes: BaseShape[] = [];

    @Exportable.Register(ExportType.NetDisk)
    protected scale: Vector;
    
    @Exportable.Register(ExportType.NetDisk)
    protected rotation: number;
    
    @Exportable.Register(ExportType.NetDisk)
    protected position: Vector;

    @Exportable.Register(ExportType.NetDisk)
    protected gravity: Vector = new Vector(0, 0); // Gravity
    
    @Exportable.Register(ExportType.NetDisk)
    protected force: Vector = new Vector(0, 0); // Force
    
    @Exportable.Register(ExportType.NetDisk)
    protected v: Vector = new Vector(0, 0); // Velocity
    
    @Exportable.Register(ExportType.NetDisk)
    protected av: number = 0; // Angular velocity
    
    @Exportable.Register(ExportType.NetDisk)
    protected torque: number = 0; // Torque
    
    @Exportable.Register(ExportType.NetDisk)
    protected sf: number = 0.5; // Static friction
    
    @Exportable.Register(ExportType.NetDisk)
    protected df: number = 0.3; // Dynamic friction
    
    @Exportable.Register(ExportType.NetDisk)
    protected cf: number = 0.05; // Cell friction
    
    @Exportable.Register(ExportType.NetDisk)
    protected r: number = 0.2; // Restitution

    @Exportable.Register(ExportType.NetDisk)
    protected density: number = 1; // Mass density
    
    @Exportable.Register(ExportType.NetDisk)
    protected z: number = 0; // Z-Index
    
    protected I: number;  // Moment of inertia
    protected iI: number; // Inverse inertia
    protected m: number;  // Mass
    protected im: number; // Inverse mass

    /**
     * Validate if the underlaying "world" will accept the move.
     * @param scale The new scale.
     * @param rotation The new rotation.
     * @param position The new position.
     */
    public OnChange: (scale: Vector, rotation: number, position: Vector) => void;

    public Init(args: BodyArgs = {})
    {
        super.Init(args);
    }
    
    public InitPre(args: BodyArgs = {})
    {
        super.InitPre(args);

        this.shapes = args.shapes === undefined ? this.shapes || [] : args.shapes;
        this.gravity = args.gravity === undefined ? this.gravity : args.gravity;
        this.sf = args.sf === undefined ? this.sf : args.sf;
        this.df = args.df === undefined ? this.df : args.df;
        this.r = args.sf === undefined ? this.r : args.r;
        this.av = args.av === undefined ? this.av : args.av;
        this.torque = args.torque === undefined ? this.torque : args.torque;
        this.v = args.v === undefined ? this.v : args.v;
        this.force = args.force === undefined ? this.force : args.force;
        this.density = args.density === undefined ? this.density : args.density;
        this.z = args.z === undefined ? this.z : args.z;
        this.cf = args.cf === undefined ? this.cf : args.cf;
    }

    public InitPost(args: BodyArgs = {})
    {
        super.InitPost(args);

        this.ComputeMass();
        this.ForceSetVirtual(
            args.scale === undefined ? this.scale : args.scale,
            args.rotation === undefined ? this.rotation : args.rotation,
            args.position === undefined ? this.position : args.position);
    }
    
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

    public GetDensity(): number
    {
        return this.density;
    } 

    public SetCellFriction(friction: number): void
    {
        if(typeof friction != "number" || Number.isNaN(friction))
        {
            throw new Error("Friction is NaN.");
        }

        this.cf = friction;
    }

    public SetGravity(gravity: Vector): void
    {
        this.gravity = gravity;
    }

    public SetZ(z: number): void
    {
        if(typeof z != "number" || Number.isNaN(z))
        {
            throw new Error("Z is NaN.");
        }

        this.z = z;
    }

    public AddForce(f: Vector)
    {
        if(!Number.isFinite(f.X) || !Number.isFinite(f.Y))
        {
            throw new Error("Force is not finite.");
        }

        this.force = this.force.Add(f);
    }
    
    public AddTorque(t: number)
    {
        if(!Number.isFinite(t))
        {
            throw new Error("Torque is not finite.");
        }

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
            Logger.Debug(this, "Distance was larger than r1 + r2, skipping SAT");
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

    protected ForceSetVirtual(scale?: Vector, rotation?: number, position?: Vector): void
    {
        if(typeof rotation === "number" && !Number.isFinite(rotation))
        {
            throw new Error("Rotation is not finite!");
        }

        this.scale = scale || this.scale;
        this.rotation = typeof rotation == "number" ? rotation : this.rotation;
        this.position = position || this.position;
        
        this.OnChange && this.OnChange(this.scale, this.rotation, this.position);
        this.shapes.forEach(s => s.SetVirtual(this.scale, this.rotation, this.position));
    }

    public SetVirtual(scale?: Vector, rotation?: number, position?: Vector): void
    {
        // Do not set, if the change is smaller than Tools.Epsilon
        if((!scale || (this.scale && scale.Equal(this.scale))) &&
            (typeof rotation !== "number" || Tools.Equal(this.rotation, rotation)) &&
            (!position || (this.position && position.Equal(this.position))))
        {
            return;
        }

        this.ForceSetVirtual(scale, rotation, position);
    }

    /**
     * Calculate angular velocity and velocity.
     * @param dt 
     */
    public IntegrateForces(dt: number)
    {
        if(this.density == Infinity || this.im == 0)
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
        if(this.density == Infinity || this.im == 0 || (!this.av && !this.v.Len()))
        {
            return;
        }

        const nextPos = this.position.Add(this.v.Scale(dt));
        const nextRot = this.rotation + this.av * dt;

        this.SetVirtual(null, nextRot, nextPos);
    }

    /**
     * Apply impluse onto the body.
     * @param impulse 
     * @param contactVector 
     */
    private ApplyImpulse(impulse: Vector, contactVector: Vector)
    {
        if(this.density == Infinity || this.im == 0)
        {
            return;
        }
        
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
     * Calculate centroid and moment of interia.
     */
    protected ComputeMass(): void
    {
        if(!this.density)
        {
            throw new Error("No density in body!");
        }

        if(!this.shapes.length)
        {
            return;
        }

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

                    const d = Vector.Cross(p1, p2) as number;
                    const triangleArea = 0.5 * d;

                    area += triangleArea;

                    // Use area to weight the centroid average, not just vertex position
                    c = c.Add(p1.Add(p2).Scale(triangleArea * (1 / 3)));

                    const intx2 = p1.X * p1.X + p2.X * p1.X + p2.X * p2.X;
                    const inty2 = p1.Y * p1.Y + p2.Y * p1.Y + p2.Y * p2.Y;

                    inertia += (0.25 * (1 / 3) * d) * (intx2 + inty2);
                }
            }
        }

        c = c.Scale(1 / area);

        this.m = this.density * area;
        this.im = (this.m) ? 1 / this.m : 0;
        this.I = inertia * this.density;
        this.iI = this.I ? 1 / this.I : 0;
    }

    /**
     * Naive correction of positional penetration.
     * @param c An object that implements the ICollision interface.
     * @param dt 
     */
    public static PositionalCorrection(c: ICollision, dt: number = 1 / 60)
    {
        const a = c.A;
        const b = c.B;

        const pa = Body.PenetrationAllowance;
        const pc = Body.PenetrationCorrect;

        const correction = c.Normal.Scale((Math.max(c.Penetration - pa, 0) / (a.im + b.im)) * pc);

        a.position = a.position.Add(correction.Scale(a.im));
        b.position = b.position.Add(correction.Scale(b.im));
    }
    
    /**
     * Resolve a collision between two bodies.
     * Based on ImpulseEngine by Randy Gaul.
     * @param c An object that implements the ICollision interface.
     * @param dt 
     */
    public static ResolveCollision(c: ICollision, dt: number = 1 / 60)
    {
        const a = c.A;
        const b = c.B;

        // If both bodies are having infinite or zero mass, stop resolving
        if(Tools.Equal(a.im + b.im, 0) || (a.density == Infinity && b.density == Infinity))
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
            if(rv.Len2() < a.gravity.Scale(dt).Len2() + Tools.Epsilon)
            {
                e = 0;
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
            let j = -(1 + e) * contactVel;

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
            if(Tools.Equal(jt, 0))
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
    
    public static CreateBox(scale: Vector, rotation: number, position: Vector, args: BodyArgs = {}): Body
    {
        const body = new Body();
        
        body.Init({ scale, rotation, position, shapes: [Polygon.CreateBox(1)], ...args });

        return body;
    }

    /**
     * Check if two bodies are equal (or near equal, depending on the epsilon values).
     * @param a 
     * @param b 
     * @param se Scaling epsilon
     * @param re Rotation epsilon
     * @param pe Position epsilon
     */
    public static Equal(a: Body, b: Body, se: number = 0.5, re: number = Math.PI / 4, pe: number = 0.5): boolean
    {
        return a.GetScale().Equal(b.GetScale(), se) && 
            Tools.Equal(a.GetRotation(), b.GetRotation(), re) && 
            a.GetPosition().Equal(b.GetPosition(), pe);
    }
}

Exportable.Dependency(Body);