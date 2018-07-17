import { BaseActor } from "./BaseActor";
import { MoveType } from "../MoveType";
import { Coord } from "../../Coord";

export class PlayerActor extends BaseActor
{
    protected health: number = 1.0;
    protected damage: number = 1.0;

    /**
     * Get the cell texture.
     */
    public GetTexture(): string
    {
        return "res/player.png";
    }

    /**
     * Get the size of the actor.
     */
    public GetSize(): Coord
    {
        return new Coord(0.8, 0.8);
    }

    /**
     * Move actor in a direction.
     * @param direction
     */
    public Move(direction: Coord): boolean
    {
        // Get sizes
        const size = this.GetSize();
        const mapSize = this.map.GetSize();

        // Calculate the next position
        const prevPos = this.GetPos().Round(3);
        const nextPos = prevPos.Add(direction).Round(3);

        // Check if it goes out of the map
        if(!nextPos.Inside(new Coord(0, 0), mapSize) || 
            !nextPos.Add(size).Inside(new Coord(0, 0), mapSize))
        {
            return false;
        }

        return this.SetPos(nextPos);
    }

    /**
     * Handle movement types.
     * @param type 
     */
    protected HandleMove(type: MoveType)
    {
        switch(type)
        {
            case MoveType.Blocked: // Do nothing
                return true;
            case MoveType.Killed: // Kill it
                this.Kill();
                return true;
            case MoveType.Successed: // Move away
                return false;
        }
    }

    /**
     * Attack an other actor if it is one cell away.
     * @param actor 
     */
    public Attack(actor: PlayerActor): boolean
    {
        if(this.position.GetDistance(actor.GetPos()) > 1)
        {
            return false;
        }

        actor.Damage(this.damage);
    }

    /**
     * Get the position of the actor.
     */
    public GetPos(): Coord
    {
        return this.position;
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
            this.Kill();
        }

        this.map.OnUpdate(this);
    }

    /**
     * Kill the actor.
     */
    private Kill(): void
    {
        this.health = 0;
        
        // Dispose
        this.Dispose();
    }

    /**
     * Check if the actor is alive.
     */
    public IsAlive(): boolean
    {
        return this.health > 0;
    }
}