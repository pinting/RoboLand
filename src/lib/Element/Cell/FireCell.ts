import { BaseActor } from "../Actor/BaseActor";
import { BaseCell } from "./BaseCell";
import { LivingActor } from "../Actor/LivingActor";
import { BaseElementArgs } from "../BaseElement";
import { Exportable, ExportType } from "../../Exportable";
import { Mesh } from "../../Geometry/Mesh";

export interface FireCellArgs extends BaseElementArgs
{
    damage?: number;
}

export class FireCell extends BaseCell
{
    @Exportable.Register(ExportType.User)
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
        this.actors.forEach(id =>
        {
            const actor = this.board.GetActors().Get(id);

            if(actor instanceof LivingActor)
            {
                actor.Damage(this.damage);
            }
        });
    }
}

Exportable.Dependency(FireCell);