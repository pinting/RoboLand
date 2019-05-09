import { BaseActor } from "../Actor/BaseActor";
import { TickElement } from "../TickElement";
import { Mesh } from "../../Geometry/Mesh";

export abstract class BaseCell extends TickElement
{
    protected actors: string[] = [];

    /**
     * Enter into the cell with an actor.
     * @param actor 
     */
    public MoveHere(actor: BaseActor): boolean 
    {
        if(!this.actors.includes(actor.GetId()))
        {
            this.actors.push(actor.GetId());
            this.board.OnUpdate.Call(this);
        }

        return true;
    }

    /**
     * Leave cell the cell with an actor.
     * @param actor 
     */
    public MoveAway(actor: BaseActor): void 
    {
        const index = this.actors.indexOf(actor.GetId());

        if(index >= 0) 
        {
            this.actors.splice(index, 1);
            this.board.OnUpdate.Call(this);
        }
    }

    /**
     * @inheritDoc
     */
    public Dispose(value)
    {
        if(this.disposed || !value)
        {
            return;
        }

        this.board.GetCells().Remove(this);
        super.Dispose();
    }
}