import { BaseActor, BaseActorArgs } from "./BaseActor";
import { Logger } from "../../Util/Logger";
import { Exportable, ExportType } from "../../Exportable";
import { Vector } from "../../Geometry/Vector";

export interface LivingActorArgs extends BaseActorArgs
{
    health?: number;
    damage?: number;
    speed?: number;
    rotSpeed?: number;
}

export abstract class LivingActor extends BaseActor
{
    @Exportable.Register(ExportType.Visible)
    protected health: number;

    @Exportable.Register(ExportType.Visible)
    protected damage: number;

    @Exportable.Register(ExportType.Visible)
    protected speed: number;

    @Exportable.Register(ExportType.Visible)
    protected rotSpeed: number;

    private walkJob: number;
    private rotJob: number;
    
    /**
     * @inheritDoc
     */
    public Init(args: LivingActorArgs = {})
    {
        super.Init(args);
    }

    /**
     * @inheritDoc
     */
    protected InitPre(args: LivingActorArgs = {})
    {
        super.InitPre(args);
        
        this.health = args.health;
        this.damage = args.damage;
        this.speed = args.speed;
        this.rotSpeed = args.rotSpeed;
    }

    protected InitPost(args: LivingActorArgs = {})
    {
        super.InitPost(args);
    }

    public IsWalking(): boolean
    {
        return !!this.walkJob;
    }

    public IsRotating(): boolean
    {
        return !!this.rotJob;
    }

    public StartWalk(back: boolean): void
    {
        if(!this.speed)
        {
            throw new Error("No speed!");
        }

        this.walkJob = this.world.OnTick.Add(dt =>
        {
            const angle = Vector.ByRad(this.GetAngle() + (back ? Math.PI : 0));
            const body = this.GetBody();

            body.AddForce(angle.Scale(this.speed * dt));
        });
    }

    public StopWalk(): void
    {
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

    public StartRot(left: boolean): void
    {
        if(!this.rotSpeed)
        {
            throw new Error("No rot speed!");
        }

        this.rotJob = this.world.OnTick.Add(dt =>
        {
            const body = this.GetBody();

            body.AddTorque((left ? -1 : 1) * this.rotSpeed * dt);
        });
    }

    public StopRot(): void
    {
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

        this.world.OnUpdate.Call(this);
    }

    /**
     * Get if the actor is alive.
     */
    public IsAlive(): boolean
    {
        return this.health > 0;
    }
}