import { BaseActor, BaseActorArgs } from "./BaseActor";
import { Logger } from "../../Util/Logger";
import { Exportable, ExportType } from "../../Exportable";
import { Vector } from "../../Geometry/Vector";
import { ArrowActor } from "./ArrowActor";

// Delay between shots
const SHOT_DELAY = 800;

export interface PlayerActorArgs extends BaseActorArgs
{
    health?: number;
    speed?: number;
    rotSpeed?: number;
    baseArrow?: ArrowActor;
}

export class PlayerActor extends BaseActor
{
    @Exportable.Register(ExportType.Net + ExportType.Thread)
    protected lastShot = +new Date(0);
    
    @Exportable.Register(ExportType.All)
    protected health: number;

    @Exportable.Register(ExportType.All)
    protected speed: number;

    @Exportable.Register(ExportType.All)
    protected rotSpeed: number;
    
    @Exportable.Register(ExportType.All)
    protected baseArrow: ArrowActor;

    private walkJob: number;
    private rotJob: number;
    
    /**
     * @inheritDoc
     */
    public Init(args: PlayerActorArgs = {})
    {
        super.Init(args);
    }

    /**
     * @inheritDoc
     */
    protected InitPre(args: PlayerActorArgs = {})
    {
        super.InitPre(args);
        
        this.health = args.health === undefined ? this.health : args.health;
        this.speed = args.speed === undefined ? this.speed : args.speed;
        this.rotSpeed = args.rotSpeed === undefined ? this.rotSpeed : args.rotSpeed;
        this.baseArrow = args.baseArrow === undefined ? this.baseArrow : args.baseArrow;
    }

    public IsWalking(): boolean
    {
        return !!this.walkJob;
    }

    public IsRotating(): boolean
    {
        return !!this.rotJob;
    }

    /**
     * Start walking in the direction of the current rotation.
     * @param back Flip the direction
     */
    public StartWalk(back: boolean): void
    {
        if(this.ignore)
        {
            return;
        }

        if(!this.world)
        {
            throw new Error("No world!");
        }

        if(!this.speed)
        {
            throw new Error("No speed!");
        }

        this.walkJob = this.world.OnTick.Add(dt =>
        {
            const angle = Vector.ByRad(this.GetBody().GetRotation() + (back ? Math.PI : 0));

            this.GetBody().AddForce(angle.Scale(this.speed * dt));
        });
    }

    /**
     * Stop walking.
     */
    public StopWalk(): void
    {
        if(this.ignore)
        {
            return;
        }

        if(!this.world)
        {
            throw new Error("No world!");
        }

        if(!this.speed)
        {
            throw new Error("No speed!");
        }

        if(this.walkJob)
        {
            this.world.OnTick.Remove(this.walkJob);
            this.walkJob = null;
        }
    }

    /**
     * Start rotating (to the right by default).
     * @param left Rotate to the left?
     */
    public StartRot(left: boolean): void
    {
        if(this.ignore)
        {
            return;
        }

        if(!this.world)
        {
            throw new Error("No world!");
        }

        if(!this.rotSpeed)
        {
            throw new Error("No rot speed!");
        }

        this.rotJob = this.world.OnTick.Add(dt =>
        {
            this.GetBody().AddTorque((left ? -1 : 1) * this.rotSpeed * dt);
        });
    }

    /**
     * Stop rotating.
     */
    public StopRot(): void
    {
        if(this.ignore)
        {
            return;
        }

        if(!this.world)
        {
            throw new Error("No world!");
        }

        if(!this.rotJob)
        {
            throw new Error("No rot speed!");
        }

        if(this.rotJob)
        {
            this.world.OnTick.Remove(this.rotJob);
            this.rotJob = null;
        }
    }

    /**
     * Shoot an arrow to the angle the player is facing.
     * @param id The id of the new arrow.
     */
    public Shoot(id: string): void
    {
        if(this.ignore)
        {
            return;
        }

        if(!this.world)
        {
            throw new Error("No world!");
        }
        
        const now = +new Date;

        if(this.lastShot + SHOT_DELAY > now) 
        {
            // TODO: Should we really throw an exception?
            throw new Error("Shot was too quick");
        }

        const body = this.GetBody();

        // Clone the template arrow
        const newArrow = this.baseArrow.Clone() as ArrowActor;

        // Calculate the direction and the value of the force
        const facing = Vector.ByRad(body.GetRotation());
        const force = facing.Scale(newArrow.GetSpeed());

        // Add the new values to the body of the new arrow
        newArrow.GetBody().Init({
            z: body.GetZ(),
            force: force
        });

        // Add the world to arrow
        newArrow.Init({
            id: id,
            ignore: false, // IMPORTANT
            parent: this.parent,
            world: this.world
        });

        // Add arrow to the world
        this.world.GetActors().Set(newArrow);

        this.lastShot = now;
    }

    /**
     * Do damage to this actor.
     * @param damage Amount of the damage.
     */
    public Damage(damage: number): void
    {
        this.health -= damage;

        Logger.Info(this, "Actor was damaged", damage, this);

        if(this.health <= 0)
        {
            this.Dispose();
        }

        if(!this.ignore && this.world)
        {
            this.world.OnUpdate.Call(this);
        }
    }

    /**
     * Get if the actor is alive.
     */
    public IsAlive(): boolean
    {
        return this.health > 0;
    }
}