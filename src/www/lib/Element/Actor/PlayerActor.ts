import { BaseActor } from "./BaseActor";
import { Coord } from "../../Coord";

export class PlayerActor extends BaseActor
{
    protected health: number = 1.0;
    protected damage: number = 1.0;
    protected speed: number = 0.05;

    /**
     * Move actor in a direction.
     * @param direction
     */
    public Move(direction: Coord): boolean
    {
        if(direction.GetDistance(new Coord(0, 0)) != 1.0)
        {
            return false; // Does not allow different size of movement
        }

        if(Math.abs(Math.abs(direction.X) - Math.abs(direction.Y)) == 0)
        {
            return false; // Only allow left, right, top and bottom movement
        }
        
        // Get sizes
        const size = this.Size;
        const mapSize = this.map.Size;

        // Calculate the next position
        const next = this.Position.Add(direction.F(c => c * this.speed)).Round(3);

        // Check if it goes out of the map
        if(!next.Inside(new Coord(0, 0), mapSize) || 
            !next.Add(size).Inside(new Coord(0, 0), mapSize))
        {
            return false;
        }

        this.Position = next;
    }

    /**
     * Attack an other actor if it is one cell away.
     * @param actor 
     */
    public Attack(actor: PlayerActor): boolean
    {
        if(this.Position.GetDistance(actor.Position) > 1)
        {
            return false;
        }

        actor.Damage(this.damage);

        return true;
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
            this.Disposed = true;
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