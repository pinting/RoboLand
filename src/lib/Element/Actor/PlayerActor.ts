import { Coord } from "../../Coord";
import { ArrowActor } from "./ArrowActor";
import { LivingActor } from "./LivingActor";
import { Exportable, ExportType } from "../../Exportable";

const SHOT_DELAY = 800;

export class PlayerActor extends LivingActor
{
    @Exportable.Register(ExportType.All)
    protected lastShot = +new Date(0);

    /**
     * Move actor in a direction.
     * @param direction
     */
    public Move(direction: Coord): boolean
    {
        if(direction.GetDistance(new Coord(0, 0)) != 1.0)
        {
            // Do not allow different size of movement
            throw new Error("Wrong distance");
        }

        if(Math.abs(Math.abs(direction.X) - Math.abs(direction.Y)) == 0)
        {
            // Only allow left, right, top and bottom movement
            throw new Error("Wrong direction");
        }
        
        // Calculate the next $position
        const next = this.Position.Add(direction.F(c => c * this.speed)).Round(3);

        // Do the moving
        if(this.SetPos(next))
        {
            this.direction = direction.Clone();

            return true;
        }

        return false;
    }

    /**
     * Shoot an arrow to the direction the player is facing.
     * @param id The _id of the new arrow.
     */
    public Shoot(id: string): void
    {
        const now = +new Date;

        if(this.lastShot + SHOT_DELAY > now) 
        {
            throw new Error("Shot was too quick");
        }

        const actor = new ArrowActor();

        actor.Init({
            id: id,
            position: this.Position.Add(this.size.F(c => c / 2)).Add(this.Direction),
            size: new Coord(0.1, 0.1),
            texture: "res/stone.png",
            direction: this.Direction,
            damage: this.damage,
            speed: 0.075,
            origin: this.origin,
            board: this.board
        });

        this.board.Actors.Set(actor);
        this.lastShot = now;
    }
    
    /**
     * @inheritDoc
     */
    protected OnTick(): void
    {
        return;
    }
}

Exportable.Dependency(PlayerActor);