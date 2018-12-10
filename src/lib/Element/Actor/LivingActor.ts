import { BaseActor, BaseActorArgs } from "./BaseActor";
import { Logger } from "../../Tools/Logger";

export interface LivingActorArgs extends BaseActorArgs
{
    health?: number;
    damage?: number;
    speed?: number;
}

export abstract class LivingActor extends BaseActor
{
    protected health: number;
    protected damage: number;
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

        this.board.OnUpdate.Call(this);
    }

    /**
     * Get if the actor is alive.
     */
    public get Alive(): boolean
    {
        return this.health > 0;
    }
}