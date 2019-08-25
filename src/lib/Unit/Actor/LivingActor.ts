import { BaseActor, BaseActorArgs } from "./BaseActor";
import { Logger } from "../../Util/Logger";
import { Exportable, ExportType } from "../../Exportable";
import { Vector } from "../../Geometry/Vector";

const ROT_SPEED = 1;

export interface LivingActorArgs extends BaseActorArgs
{
    health?: number;
    damage?: number;
    speed?: number;
}

export abstract class LivingActor extends BaseActor
{
    @Exportable.Register(ExportType.Visible)
    protected health: number;

    @Exportable.Register(ExportType.Visible)
    protected damage: number;

    @Exportable.Register(ExportType.Visible)
    protected speed: number;
    
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
    }

    public Step(back: boolean): void
    {
        if(!this.speed)
        {
            throw new Error("No speed!");
        }

        const d = Vector.ByRad(this.GetAngle() + (back ? Math.PI : 0));
        
        this.force = this.force.Add(d.F(v => v * this.speed));
    }

    public Rotate(left: boolean): void
    {
        this.av += (left ? -1 : +1) * ROT_SPEED;
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