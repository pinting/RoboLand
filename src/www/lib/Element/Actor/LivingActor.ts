import { BaseActor, BaseActorArgs } from "./BaseActor";

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

    public constructor(args: LivingActorArgs = {})
    {
        super(args);

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

        if(this.health <= 0)
        {
            this.Dispose();
        }

        this.map.OnUpdate.Call(this);
    }

    /**
     * Get if the actor is alive.
     */
    public get Alive(): boolean
    {
        return this.health > 0;
    }
}