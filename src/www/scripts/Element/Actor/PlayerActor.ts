import { IActor } from "./IActor";
import { Map } from "../../Map";
import { MoveType } from "../MoveType";
import { Coord } from "../../Coord";
import { ElementType } from "../ElementType";

export class PlayerActor implements IActor
{
    protected readonly map = Map.GetInstance();

    protected health: number = 1.0;
    protected damage: number = 1.0;

    private position: Coord;

    /**
     * Construct a new PlayerActor.
     * @param position
     */
    public constructor(position: Coord)
    {
        this.position = position;

        const cell = Map.GetInstance().GetCell(position);

        if(cell != null)
        {
            cell.MoveHere(this);
        }
    }

    /**
     * Get the type of the actor.
     */
    public GetType(): ElementType
    {
        return ElementType.PlayerActor;
    }

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
        return new Coord(1.0, 1.0);
    }

    /**
     * Move actor in a direction.
     * @param direction
     */
    public Move(direction: Coord): boolean
    {
        if(this.GetPos().GetDistance(this.GetPos().Add(direction)) > 1.0)
        {
            return false; // Only allow 1 length movement
        }

        // Calculate the next position
        const prevPos = this.GetPos();
        const nextPos = prevPos.Add(direction);
        
        // Get the currently covered cells and the next ones
        const prevCells = this.map.GetCellBetween(prevPos, prevPos.Add(this.GetSize()));
        const nextCells = this.map.GetCellBetween(nextPos, nextPos.Add(this.GetSize()));

        if(!prevCells.length || !nextCells.length)
        {
            return false;
        }

        // Remove intersection 
        const prevFiltered = prevCells.filter(c => !nextCells.includes(c));
        const nextFiltered = nextCells.filter(c => !prevCells.includes(c));

        // Check if one of the cells blocks the movement
        const failed = nextFiltered.some(cell => 
        {
            switch(cell.MoveHere(this))
            {
                case MoveType.Blocked: // Do nothing
                    return true;
                case MoveType.Killed: // Kill it
                    this.Kill();
                    return true;
                case MoveType.Successed: // Move away
                    return false;
            }
        });

        // If the movement failed, revert
        if(failed)
        {
            nextFiltered.forEach(c => c.MoveAway(this));
            return false;
        }

        // If it was successful, move away from the old cells
        prevFiltered.forEach(c => c.MoveAway(this));

        // Update
        this.position = nextPos;
        this.map.OnUpdate();

        return true;
    }

    /**
     * Attack an other actor if it is one cell away.
     * @param actor 
     */
    public Attack(actor: IActor): boolean
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
    }

    /**
     * Kill the actor.
     */
    private Kill(): void
    {
        this.health = 0;

        const from = this.GetPos();
        const to = this.GetPos().Add(this.GetSize());
        const cells = this.map.GetCellBetween(from, to);

        // Clear actor from the cells itself
        cells.forEach(c => c.MoveAway(this));

        // Remove from the map
        this.map.RemoveActor(this);
        this.map.OnUpdate();
    }

    /**
     * Check if the actor is alive.
     */
    public IsAlive(): boolean
    {
        return this.health > 0;
    }
}