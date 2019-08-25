import { BaseActor } from "../Actor/BaseActor";
import { Unit, UnitArgs } from "../Unit";
import { Exportable, ExportType } from "../../Exportable";

export interface BaseCellArgs extends UnitArgs
{
    cf?: number;
}

export abstract class BaseCell extends Unit
{
    protected actors: string[] = [];

    @Exportable.Register(ExportType.Visible)
    protected cf: number; // Cell friction

    /**
     * @inheritDoc
     */
    protected InitPre(args: BaseCellArgs = {})
    {
        super.InitPre(args);

        this.cf = args.cf || 0.0001;
    }

    /**
     * Enter into the cell with an actor.
     * @param actor 
     */
    public MoveHere(actor: BaseActor): boolean 
    {
        if(!this.actors.includes(actor.GetId()))
        {
            this.actors.push(actor.GetId());
            this.world.OnUpdate.Call(this);
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
            this.world.OnUpdate.Call(this);
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

        this.world.GetCells().Remove(this);
        super.Dispose();
    }

    public GetFriction(): number
    {
        return this.cf;
    }
}