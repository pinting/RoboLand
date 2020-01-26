import { Vector } from "../../Geometry/Vector";
import { ArrowActor } from "./ArrowActor";
import { LivingActor } from "./LivingActor";
import { Exportable, ExportType } from "../../Exportable";
import { Body } from "../../Physics/Body";

const SHOT_DELAY = 800;

export class PlayerActor extends LivingActor
{
    @Exportable.Register(ExportType.Hidden)
    protected lastShot = +new Date(0);

    /**
     * Shoot an arrow to the angle the player is facing.
     * @param id The id of the new arrow.
     */
    public Shoot(id: string): void
    {
        const now = +new Date;

        if(this.lastShot + SHOT_DELAY > now) 
        {
            throw new Error("Shot was too quick");
        }

        const r = this.GetBody().GetRadius();
        const d = Vector.ByRad(this.GetBody().GetRotation());
        const p = this.GetBody().GetOffset().Add(d.Scale(r));

        const actor = new ArrowActor;

        actor.Init({
            id: id,
            texture: "res/stone.png",
            damage: this.damage,
            speed: 0.075,
            parent: this.parent,
            world: this.world,
            body: Body.CreateBoxBody(new Vector(0.1, 0.1), this.GetBody().GetRotation(), p)
        });

        this.world.GetActors().Set(actor);
        this.lastShot = now;
    }
}

Exportable.Dependency(PlayerActor);