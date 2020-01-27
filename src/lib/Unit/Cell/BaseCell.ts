import { BaseActor } from "../Actor/BaseActor";
import { Unit, UnitArgs } from "../Unit";
import { Exportable, ExportType } from "../../Exportable";
import { Vector } from "../../Geometry/Vector";

export interface BaseCellArgs extends UnitArgs
{
    cf?: number;
    gravity?: Vector;
}

export abstract class BaseCell extends Unit
{
    protected actors: string[] = [];

    @Exportable.Register(ExportType.Visible)
    protected gravity: Vector; // Gravity inside the cell

    @Exportable.Register(ExportType.Visible)
    protected cf: number; // Cell friction

    /**
     * @inheritDoc
     */
    protected InitPre(args: BaseCellArgs = {})
    {
        super.InitPre(args);
        
        this.cf = args.cf || 0.85;
        this.gravity = args.gravity || new Vector(0, 0);
    }

    /**
     * Enter into the cell with an actor.
     * @param actor 
     */
    public MoveHere(actor: BaseActor): void 
    {
        if(this.actors.includes(actor.GetId()))
        {
            return;
        }
        
        this.actors.push(actor.GetId());
        
        const body = actor.GetBody();

        // TODO: Issue: when multiply cells are hit, the last cell props will be set and not the max props.
        body.SetCellFriction(this.cf);
        body.SetGravity(this.gravity);

        this.world.OnUpdate.Call(this);
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

    /**
     * Get the friction of the surface of the cell.
     */
    public GetFriction(): number
    {
        return this.cf;
    }
}