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

    @Exportable.Register(ExportType.NetDisk)
    protected gravity: Vector; // Gravity inside the cell

    @Exportable.Register(ExportType.NetDisk)
    protected cf: number; // Cell friction

    /**
     * @inheritDoc
     */
    protected InitPre(args: BaseCellArgs = {})
    {
        super.InitPre(args);
        
        this.cf = args.cf === undefined ? this.cf || 0.10 : args.cf;
        this.gravity = args.gravity === undefined ? this.gravity || new Vector(0, 0) : args.gravity;
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

        if(!this.ignore && this.world)
        {
            this.world.OnUpdate.Call(this);
        }
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
                
            if(!this.ignore && this.world)
            {
                this.world.OnUpdate.Call(this);
            }
        }
    }

    /**
     * @inheritDoc
     */
    public Dispose(value: boolean = true)
    {
        if(this.disposed || !value)
        {
            return;
        }
        
        if(!this.ignore && this.world)
        {
            this.world.GetCells().Remove(this);
        }

        super.Dispose();
    }
}