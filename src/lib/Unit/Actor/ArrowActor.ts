import { BaseActor, BaseActorArgs } from "./BaseActor";
import { Exportable, ExportType } from "../../Exportable";
import { PlayerActor } from "./PlayerActor";
import { Vector } from "../../Geometry/Vector";

export interface ArrowActorArgs extends BaseActorArgs
{
    damage?: number;
    speed?: number;
}

/**
 * Arrow actor that destroys upon impact and causes damage to player actors.
 */
export class ArrowActor extends BaseActor
{
    @Exportable.Register(ExportType.All)
    protected damage: number;
    
    @Exportable.Register(ExportType.All)
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
        
        this.damage = args.damage === undefined ? this.damage || 0 : args.damage;
        this.speed = args.speed === undefined ? this.speed || 0 : args.speed;
    }

    /**
     * @inheritDoc
     */
    protected InitPost(args: ArrowActorArgs = {})
    {
        super.InitPost(args);
    }

    /**
     * @inheritDoc
     */
    protected OnTick(dt: number): void
    {
        super.OnTick(dt);

        // If arrow stops moving, dispose it
        if(this.GetBody().GetVelocity().Equal(new Vector) && this.GetBody().GetForce().Equal(new Vector))
        {
            this.Dispose();
            return;
        }
        
        const result = this.world.GetUnits().FindCollisions(this);

        for(const actor of result)
        {
            // Damage every touched player
            if(actor instanceof PlayerActor)
            {
                actor.Damage(this.damage);
            }
        }

        // If the arrow hit anything, dispose it
        if(result.length)
        {
            // TODO: With this, it cannot jump back from the wall,
            // which would be really cool
            this.Dispose();
        }
    }

    public GetSpeed(): number
    {
        return this.speed;
    }
}