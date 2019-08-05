import { BaseActor, BaseActorArgs } from "./BaseActor";
import { Logger } from "../../Util/Logger";
import { Exportable, ExportType } from "../../Exportable";
import { UnitArgs } from "../Unit";
import { Vector } from "../../Geometry/Vector";

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

    /**
     * Move actor in a direction.
     * @param mod Modify the angle temporary.
     */
    public Move(mod: number = 0): void
    {
        if(!this.speed)
        {
            throw new Error("No speed!");
        }

        // Calculate the next position
        const direction = Vector.AngleToVector(this.GetAngle() + mod);
        const push = direction.F(v => v * this.speed);
        
        this.force = this.force.Add(push);
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