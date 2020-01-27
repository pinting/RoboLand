import { BaseActor, BaseActorArgs } from "./BaseActor";
import { Logger } from "../../Util/Logger";
import { Exportable, ExportType } from "../../Exportable";
import { Vector } from "../../Geometry/Vector";
import { ArrowActor } from "./ArrowActor";
import { Body } from "../../Physics/Body";

const SHOT_DELAY = 800;

export interface PlayerActorArgs extends BaseActorArgs
{
    health?: number;
    damage?: number;
    speed?: number;
    rotSpeed?: number;
}

export class PlayerActor extends BaseActor
{
    @Exportable.Register(ExportType.Hidden)
    protected lastShot = +new Date(0);
    
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
        
        this.health = args.health;
        this.damage = args.damage;
        this.speed = args.speed;
        this.rotSpeed = args.rotSpeed;
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
            const angle = Vector.ByRad(this.GetBody().GetRotation() + (back ? Math.PI : 0));

            this.GetBody().AddForce(angle.Scale(this.speed * dt));
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
            this.GetBody().AddTorque((left ? -1 : 1) * this.rotSpeed * dt);
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
     * Shoot an arrow to the angle the player is facing.
     * @param id The id of the new arrow.
     */
    public Shoot(id: string): void
    {
        const now = +new Date;

        if(this.lastShot + SHOT_DELAY > now) 
        {
            throw new Error("Shot was too quick");
        }

        const r = this.GetBody().GetRadius();
        const d = Vector.ByRad(this.GetBody().GetRotation());
        const p = this.GetBody().GetOffset().Add(d.Scale(r));

        const actor = new ArrowActor;

        actor.Init({
            id: id,
            texture: "res/stone.png",
            damage: this.damage,
            speed: 0.075,
            parent: this.parent,
            world: this.world,
            blocking: false,
            body: Body.CreateBoxBody(
                new Vector(0.1, 0.1),
                this.GetBody().GetRotation(),
                p,
                { z: this.GetBody().GetZ() })
        });

        this.world.GetActors().Set(actor);
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