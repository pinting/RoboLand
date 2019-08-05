import { BaseActor } from "../Actor/BaseActor";
import { BaseCell, BaseCellArgs } from "./BaseCell";
import { LivingActor } from "../Actor/LivingActor";
import { UnitArgs } from "../Unit";
import { Exportable, ExportType } from "../../Exportable";

export interface FireCellArgs extends BaseCellArgs
{
    damage?: number;
}

export class FireCell extends BaseCell
{
    @Exportable.Register(ExportType.Visible)
    protected damage: number;

    /**
     * @inheritDoc
     */
    public Init(args: FireCellArgs = {})
    {
        super.Init(args);
    }

    /**
     * @inheritDoc
     */
    protected InitPre(args: FireCellArgs = {})
    {
        super.InitPre(args);

        this.damage = args.damage;
    }

    /**
     * @inheritDoc
     */
    public MoveHere(actor: BaseActor): boolean 
    {
        return true;
    }

    /**
     * @inheritDoc
     */
    protected OnTick(): void
    {
        super.OnTick();
        
        this.actors.forEach(id =>
        {
            const actor = this.world.GetActors().Get(id);

            if(actor instanceof LivingActor)
            {
                actor.Damage(this.damage);
            }
        });
    }
}

Exportable.Dependency(FireCell);