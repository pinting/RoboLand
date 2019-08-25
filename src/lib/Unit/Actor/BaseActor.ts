import { Vector } from "../../Geometry/Vector";
import { Unit, UnitArgs } from "../Unit";
import { Polygon } from "../../Geometry/Polygon";
import { Logger, LogType } from "../../Util/Logger";
import { ICollison } from "../../Geometry/ICollision";

const GRAVITY = new Vector(0, 10.0);

export interface BaseActorArgs extends UnitArgs
{
    force?: Vector;
    sf?: number;
    df?: number;
    r?: number;
    av?: number;
    torque?: number;
    v?: Vector;
}

export abstract class BaseActor extends Unit
{
    private lastTick: number = +new Date;

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

    /**
     * @inheritDoc
     */
    protected InitPre(args: BaseActorArgs = {})
    {
        super.InitPre(args);

        this.force = args.force || new Vector(0, 0);
        this.sf = args.sf || 0.5;
        this.df = args.df || 0.3;
        this.r = args.r || 0.2;
        this.av = args.av || 0;
        this.torque = args.torque || 0;
        this.v = args.v || new Vector(0, 0);
    }

    protected InitPost(args)
    {
        super.InitPost(args);
    }

    /**
     * Calculate centroid and moment of interia
     * @param density 
     */
    private ComputeMass(density = 1) 
    {
        if(!this.body)
        {
            throw new Error("ComputeMass failed, no body!");
        }

        let c = new Vector(0, 0); // Centroid
        let area = 0;
        let I = 0;

        const inv3 = 1 / 3;

        for (let shape of this.body.GetShapes())
        {
            if (shape instanceof Polygon) 
            {
                for (let i1 = 0; i1 < shape.GetVertices().length; ++i1) 
                {
                    const p1 = shape.GetVertices()[i1];
                    const i2 = i1 + 1 < shape.GetVertices().length ? i1 + 1 : 0;
                    const p2 = shape.GetVertices()[i2];

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
     * @inheritDoc
     */
    public SetPosition(position?: Vector): boolean
    {
        return position &&
            this.Move(position, this.angle) && 
            super.SetPosition(position);
    }

    /**
     * @inheritDoc
     */
    public SetAngle(angle?: number): boolean
    {
        return typeof angle === "number" && 
            this.Move(this.position, angle) && 
            super.SetAngle(angle);
    }
    
    private Move(position: Vector, angle: number): boolean
    {
        if(!this.world)
        {
            return true;
        }

        const clone = <BaseActor>this.Clone();

        // Debug tag
        (clone as any).DEBUG = "DUMP CLONE";

        clone.SetAngle(angle);
        clone.SetPosition(position);

        const actors = this.world.GetActors().FindCollisions(clone);

        if(actors.length)
        {
            console.log(actors);
            for(let actor of actors)
            {
                if(Vector.Equal(this.im + actor.im, 0))
                {
                    this.v = new Vector(0, 0);
                    actor.v = new Vector(0, 0);

                    continue;
                }

                const collision = clone.body.GetPenetration(actor.body);

                if(collision)
                {
                    this.DoPhsyics(collision, actor);
                }
            }

            return false;
        }

        // Get the currently covered cells and the next ones
        const prev = this.position 
            ? this.world.GetCells().FindCollisions(this)
            : [];
        
        const next = this.world.GetCells().FindCollisions(clone);

        if(!next.length)
        {
            return false;
        }

        // Remove intersection 
        const prevFiltered = prev.filter(v => !next.includes(v));
        const nextFiltered = next.filter(v => !prev.includes(v));

        // TODO: The move will really occur in cells - should I change this?
        // Check if one of the cells blocks the movement
        if(nextFiltered.some(cell => !cell.MoveHere(this)))
        {
            // If yes, revert all movement and return
            nextFiltered.forEach(v => v.MoveAway(this));

            return false;
        }

        // If it was successful, move away from the old cells
        prevFiltered.forEach(v => v.MoveAway(this));

        return true;
    }

    /**
     * @inheritDoc
     */
    public Dispose(value: boolean = true)
    {
        if(this.disposed || !value)
        {
            return;
        }

        this.world.GetActors().Remove(this);
        super.Dispose();
    }

    public AddForce(vector: Vector): void
    {
        this.force.Add(vector);
    }

    protected OnTick(): void
    {
        // TODO: Move this elsewere
        if(!this.im)
        {
            this.ComputeMass();
        }

        if(!this.size || !this.position)
        {
            // No force, no need to do the calculations
            return;
        }
        
        const now = +new Date;
        const dt = (now - this.lastTick) / 1000;

        this.lastTick = now;

        const nextPosition = this.position.Add(this.v.Scale(dt));
        const nextAngle = this.angle + this.av * dt;

        // TODO: Smarter cell search
        const cell = this.world.GetCells().FindNearest(this.GetCenter());
        const cf = Math.pow(cell.GetFriction(), dt);

        this.av = this.av * cf + this.torque * this.iI * (dt / 2);
        this.v = this.v.Scale(cf).Add(this.force.Scale(this.im * dt));

        /*
        this.v = this.v
            .Scale(GRAVITY)
            .Scale(dt);
        */

        this.torque = 0;
        this.force = new Vector(0, 0);

        if(nextPosition.Equal(this.position) && Vector.Equal(nextAngle, this.angle))
        {
            return;
        }

        if(this.Move(nextPosition, nextAngle))
        {
            // Do not use the setters, because that would mean
            // two GetVirtualBody calls
            this.position = nextPosition;
            this.angle = nextAngle;
            this.virtualBody = null;

            this.GetVirtualBody();
            this.world && this.world.OnUpdate.Call(this);
        }
    }

    public ApplyImpulse(impulse: Vector, contactVector: Vector)
    {
        this.v = this.v.Add(impulse.Scale(new Vector(this.im, this.im)));
        this.av += this.iI * <number>Vector.Cross(contactVector, impulse);
    }

    private DoPhsyics(collision: ICollison, other: BaseActor)
    {
        // Calculate average restitution
        let e = Math.min(this.r, other.r);

        // Calculate static and dynamic friction
        const sf = Math.sqrt(this.sf * other.sf);
        const df = Math.sqrt(this.df * other.df);

        /*
        for(let i = 0; i < collision.ContactCount; i++)
        {
            const ra = collision.Contacts[i].Sub(a.position);
            const rb = collision.Contacts[i].Sub(b.position);

            const ca = Vector.Cross(a.angularVelocity, ra) as Vector;
            const cb = Vector.Cross(b.angularVelocity, rb) as Vector;
            const rv = b.velocity.Add(cb).Sub(a.velocity.Sub(ca));

            // Determine if we should perform a resting collision or not
            // The idea is if the only thing moving this object is gravity,
            // then the collision should be performed without any restitution
            if(rv.Len2() < gravity.Scale(new Vector(dt, dt)).Len2() + Vector.EPSILON)
            {
                e = 0.0;
            }
        }
        */

        for(let i = 0; i < collision.ContactCount; i++)
        {
            // Calculate radii from COM to contact
            const ra = collision.Contacts[i].Sub(this.position);
            const rb = collision.Contacts[i].Sub(other.position);

            // Relative velocity
            let ca = Vector.Cross(this.av, ra) as Vector;
            let cb = Vector.Cross(other.av, rb) as Vector;
            let rv = other.v.Add(cb).Sub(this.v.Sub(ca));

            // Relative velocity along the normal
            const contactVel = rv.Dot(collision.Normal);

            // Do not resolve if velocities are separating
            if(contactVel > 0)
            {
                Logger.Warn(this, "Do not resolve if velocities are separating");
                return;
            }

            const raCrossN = Vector.Cross(ra, collision.Normal) as number;
            const rbCrossN = Vector.Cross(rb, collision.Normal) as number;

            const invMassSum = this.im + other.im + 
                Math.pow(raCrossN, 2) * this.iI + 
                Math.pow(rbCrossN, 2) * other.iI;

            // Calculate impulse scalar
            let j = -(1.0 + e) * contactVel;

            j /= invMassSum;
            j /= collision.ContactCount;

            // Apply impulse
            const impulse = collision.Normal.Scale(j);

            this.ApplyImpulse(impulse.Neg(), ra);
            other.ApplyImpulse(impulse, rb);

            // Friction impulse
            ca = Vector.Cross(this.av, ra) as Vector;
            cb = Vector.Cross(other.av, rb) as Vector;
            rv = other.v.Add(cb).Sub(this.v.Sub(ca));

            const rvnDot = rv.Dot(collision.Normal);
            let t = rv.Sub(collision.Normal.Scale(rvnDot));

            t = t.Normalize();

            // j tangent magnitude
            let jt = -rv.Dot(t);

            jt /= invMassSum;
            jt /= collision.ContactCount;

            // Don't apply tiny friction impulses
            if(Vector.Equal(jt, 0.0))
            {
                Logger.Warn(this, "Don't apply tiny friction impulses");
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
            this.ApplyImpulse(tangentImpulse.Neg(), ra);
            other.ApplyImpulse(tangentImpulse, rb);
        }
    }
}