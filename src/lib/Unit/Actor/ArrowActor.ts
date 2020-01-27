import { BaseActor, BaseActorArgs } from "./BaseActor";
import { Exportable, ExportType } from "../../Exportable";
import { UnitArgs } from "../Unit";
import { Vector } from "../../Geometry/Vector";
import { PlayerActor } from "./PlayerActor";

export interface ArrowActorArgs extends BaseActorArgs
{
    damage?: number;
    speed?: number;
}

export class ArrowActor extends BaseActor
{
    @Exportable.Register(ExportType.Visible)
    protected damage: number;

    @Exportable.Register(ExportType.Visible)
    protected speed: number;

    /**
     * @inheritDoc
     */
    public Init(args: ArrowActorArgs = {})
    {
        super.Init(args);
    }

    /**
     * @inheritDoc
     */
    protected InitPre(args: ArrowActorArgs = {})
    {
        super.InitPre(args);
        
        this.damage = args.damage;
        this.speed = args.speed;
    }

    /**
     * @inheritDoc
     */
    protected InitPost(args: ArrowActorArgs = {})
    {
        super.InitPost(args);
        
        const facing = Vector.ByRad(this.GetBody().GetRotation());
        const force = facing.Scale(-1 * this.speed);

        this.GetBody().AddForce(force);
        console.log(this.GetBody(), force);
    }

    /**
     * @inheritDoc
     */
    protected OnTick(dt: number): void
    {
        super.OnTick(dt);
        
        /*
        const result = this.world.GetUnits().FindCollisions(this);

        let hit = false;

        // Damage every touched living actor
        for(const actor of result)
        {
            if(actor instanceof PlayerActor)
            {
                actor.Damage(this.damage);
                hit = true;
            }
        }

        // If the arrow hit a living thing, dispose it
        if(hit)
        {
            this.Dispose();
        }
        */
    }
}

Exportable.Dependency(ArrowActor);