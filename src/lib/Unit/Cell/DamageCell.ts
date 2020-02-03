import { BaseCell, BaseCellArgs } from "./BaseCell";
import { PlayerActor } from "../Actor/PlayerActor";
import { Exportable, ExportType } from "../../Exportable";

export interface FireCellArgs extends BaseCellArgs
{
    damage?: number;
}

export class DamageCell extends BaseCell
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

        this.damage = args.damage === undefined ? this.damage : args.damage;
    }

    /**
     * @inheritDoc
     */
    protected OnTick(dt: number): void
    {
        super.OnTick(dt);
        
        this.actors.forEach(id =>
        {
            const actor = this.world.GetActors().Get(id);

            if(actor instanceof PlayerActor)
            {
                actor.Damage(this.damage * dt);
            }
        });
    }
}

Exportable.Dependency(DamageCell);