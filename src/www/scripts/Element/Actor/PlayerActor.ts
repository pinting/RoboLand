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
        return "res/actor.png";
    }

    /**
     * Move actor in a direction.
     * @param direction
     */
    public Move(direction: Coord): boolean
    {
        if(Math.abs(direction.X) > 1 || Math.abs(direction.Y) > 1)
        {
            return false; // Only allow 1 length movement
        }

        let lastCell = this.map.GetCellNear(this.position);
        let nextCoord = this.position.Add(direction);
        let nextCell = this.map.GetCellNear(nextCoord);

        if(lastCell == null || nextCell == null)
        {
            return false;
        }

        switch(nextCell.MoveHere(this))
        {
            case MoveType.Blocked: // Do nothing
                return false;
            case MoveType.Killed: // Move away and kill it
                lastCell.MoveAway(this);
                this.position = nextCoord;
                this.Kill();
                return false;
            case MoveType.Successed: // Move away
                lastCell.MoveAway(this);
                this.position = nextCoord;
                this.map.OnUpdate();
                return true;
        }
    }

    /**
     * Attack an other actor if it is one cell away.
     * @param actor 
     */
    public Attack(actor: IActor): boolean
    {
        if(this.position.GetDistance(actor.GetPosition()) > 1)
        {
            return false;
        }

        actor.Damage(this.damage);
    }

    /**
     * Get the position of the actor.
     */
    public GetPosition(): Coord
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