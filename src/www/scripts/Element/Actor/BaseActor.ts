import { ElementType } from "../ElementType";
import { Map } from "../../Map";
import { Coord } from "../../Coord";
import { Utils } from "../../Utils";
import { BaseElement } from "../BaseElement";

export abstract class BaseActor extends BaseElement
{
    /**
     * Construct a new PlayerActor.
     * @param position
     */
    public constructor(position: Coord = null)
    {
        super(position);

        const cell = this.map.GetCells().Get(this.position)[0];

        if(cell != null)
        {
            cell.MoveHere(this);
        }
    }

    /**
     * Dispose the cell.
     */
    public Dispose(): void
    {
        super.Dispose();

        if(!this.disposed && this instanceof BaseActor)
        {
            this.map.GetActors().Remove(this);
        }
    }
    
    abstract GetType(): ElementType;
    abstract GetPos(): Coord;
    abstract GetSize(): Coord;
    abstract GetTexture(): string;
}