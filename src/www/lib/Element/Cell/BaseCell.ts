import { BaseActor } from "../Actor/BaseActor";
import { MoveType } from "../MoveType";
import { Coord } from "../../Coord";
import { BaseElement } from "../BaseElement";
import { Map } from "../../Map";

export abstract class BaseCell extends BaseElement
{
    protected actors: string[] = [];

    /**
     * Construct a BaseCell. Abstract!
     * @param position
     */
    public constructor(position: Coord = null, map: Map = null)
    {
        super(position, map);
    }
    
    /**
     * Get the position of the cell.
     */
    public GetPos(): Coord 
    {
        return this.position;
    }

    /**
     * Enter into the cell with an actor.
     * @param actor 
     */
    public MoveHere(actor: BaseActor): MoveType 
    {
        const tag = actor.GetTag();

        if(!this.actors.includes(tag))
        {
            this.actors.push(tag);
            this.map.OnUpdate.Call(this);
        }

        return MoveType.Successed;
    }

    /**
     * Leave cell the cell with an actor.
     * @param actor 
     */
    public MoveAway(actor: BaseActor): void 
    {
        const tag = actor.GetTag();
        const index = this.actors.indexOf(tag);

        if(index >= 0) 
        {
            this.actors.splice(index, 1);
            this.map.OnUpdate.Call(this);
        }
    }

    /**
     * Dispose the cell.
     */
    public Dispose(): void
    {
        if(this.disposed)
        {
            return;
        }

        super.Dispose();

        if(this instanceof BaseCell)
        {
            this.map.GetCells().Remove(this);
        }
    }
    
    public abstract GetSize(): Coord;
    public abstract GetTexture(): string;
}