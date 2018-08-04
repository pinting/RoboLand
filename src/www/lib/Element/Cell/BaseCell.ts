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
        if(!this.actors.includes(actor.Tag))
        {
            this.actors.push(actor.Tag);
            this.map.OnUpdate.Call(this);
        }

        return true;
    }

    /**
     * Leave cell the cell with an actor.
     * @param actor 
     */
    public MoveAway(actor: BaseActor): void 
    {
        const index = this.actors.indexOf(actor.Tag);

        if(index >= 0) 
        {
            this.actors.splice(index, 1);
            this.map.OnUpdate.Call(this);
        }
    }

    /**
     * @inheritDoc
     */
    public set Disposed(value)
    {
        if(this.disposed || !value)
        {
            return;
        }

        super.Disposed = true;

        if(this instanceof BaseCell)
        {
            this.map.Cells.Remove(this);
        }
    }

    /**
     * @inheritDoc
     */
    public get Disposed(): boolean
    {
        // Needed because JavaScript limitation
        return super.Disposed;
    }

    /**
     * @inheritDoc
     */
    protected OnTick(): void
    {
        return;
    }
}