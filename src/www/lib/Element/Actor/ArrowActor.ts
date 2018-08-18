import { BaseActor, BaseActorArgs } from "./BaseActor";
import { Coord } from "../../Coord";
import { PlayerActor } from "./PlayerActor";
import { LivingActor } from "./LivingActor";
import { TickActor } from "./TickActor";

export interface ArrowActorArgs extends BaseActorArgs
{
    direction?: Coord;
    damage?: number;
    speed?: number;
}

export class ArrowActor extends TickActor
{
    protected direction: Coord;
    protected damage: number;
    protected speed: number;

    /**
     * @inheritDoc
     */
    public constructor(init: ArrowActorArgs = {})
    {
        super(init);

        this.direction = init.direction;
        this.damage = init.damage;
        this.speed = init.speed;
    }

    /**
     * @inheritDoc
     */
    protected OnTick(): void
    {
        const success = this.SetPos(this.Position.Add(
            this.direction.F(c => c * this.speed)));

        // If the arrow hit a wall, dispose it
        if(!success)
        {
            this.Dispose();
            return;
        }

        const result = this.map.Actors.FindBetween(
            this.Position, this.Position.Add(this.Size));

        let hit = false;

        // Damage every touched living actor
        for(const actor of result)
        {
            if(actor instanceof LivingActor)
            {
                actor.Damage(this.damage);
                hit = true;
            }
        }

        // If the arrow hit a living thing, dispose it
        if(hit)
        {
            this.Dispose();
        }
    }
}