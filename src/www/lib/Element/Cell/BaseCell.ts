import { BaseActor } from "../Actor/BaseActor";
import { BaseElement } from "../BaseElement";

export abstract class BaseCell extends BaseElement
{
    protected actors: string[] = [];

    /**
     * Enter into the cell with an actor.
     * @param actor 
     */
    public MoveHere(actor: BaseActor): boolean 
    {
        if(!this.actors.includes(actor.Id))
        {
            this.actors.push(actor.Id);
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
        const index = this.actors.indexOf(actor.Id);

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

        this.board.Cells.Remove(this);
        super.Dispose();
    }
}