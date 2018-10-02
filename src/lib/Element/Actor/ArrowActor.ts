import { BaseActor, BaseActorArgs } from "./BaseActor";
import { Coord } from "../../Coord";
import { PlayerActor } from "./PlayerActor";
import { LivingActor } from "./LivingActor";
import { TickActor } from "./TickActor";
import { Exportable } from "../../Exportable";

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
    public Init(args: ArrowActorArgs = {})
    {
        super.Init(args);
    }

    /**
     * @inheritDoc
     */
    protected InitPre(args: ArrowActorArgs = {})
    {
        super.InitPre(args);

        this.direction = args.direction;
        this.damage = args.damage;
        this.speed = args.speed;
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

        const result = this.board.Actors.FindBetween(
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

    /**
     * Register the class as a dependency.
     */
    public static Register()
    {
        Exportable.Register("ArrowActor", ArrowActor);
    }
}