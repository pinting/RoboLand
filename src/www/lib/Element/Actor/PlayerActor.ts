import { Coord } from "../../Coord";
import { ArrowActor } from "./ArrowActor";
import { LivingActor } from "./LivingActor";

export class PlayerActor extends LivingActor
{
    /**
     * Move actor in a direction.
     * @param direction
     */
    public Move(direction: Coord): boolean
    {
        if(direction.GetDistance(new Coord(0, 0)) != 1.0)
        {
            return false; // Do not allow different size of movement
        }

        if(Math.abs(Math.abs(direction.X) - Math.abs(direction.Y)) == 0)
        {
            return false; // Only allow left, right, top and bottom movement
        }
        
        // Calculate the next position
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
     */
    public Shoot(): void
    {
        // TODO: Make a logic for this
        this.map.Actors.Set(new ArrowActor({
            position: this.Position.Add(this.size.F(c => c / 2)).Add(this.Direction),
            size: new Coord(0.1, 0.1),
            texture: "res/stone.png",
            direction: this.Direction,
            damage: this.damage,
            speed: 0.075
        }));
    }
    
    /**
     * @inheritDoc
     */
    protected OnTick(): void
    {
        return;
    }
}