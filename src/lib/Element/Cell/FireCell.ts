import { BaseActor } from "../Actor/BaseActor";
import { BaseCell } from "./BaseCell";
import { LivingActor } from "../Actor/LivingActor";
import { BaseElementArgs } from "../BaseElement";
import { Exportable } from "../../Exportable";

export interface FireCellArgs extends BaseElementArgs
{
    damage?: number;
}

export class FireCell extends BaseCell
{
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
            const actor = this.board.Actors.Get(id);

            if(actor instanceof LivingActor)
            {
                actor.Damage(this.damage);
            }
        });
    }

    /**
     * Register the class as a dependency.
     */
    public static Register()
    {
        Exportable.Register("FireCell", FireCell);
    }
}