import { Keyboard } from "./Util/Keyboard";
import { Exportable } from "./Exportable";
import { World } from "./World";
import { Slave } from "./Slave";
import { ArrowActor } from "./Unit/Actor/ArrowActor";
import { PlayerActor } from "./Unit/Actor/PlayerActor";
import { DamageCell } from "./Unit/Cell/DamageCell";
import { NormalCell } from "./Unit/Cell/NormalCell";
import { KillCell } from "./Unit/Cell/KillCell";
import { Vector } from "./Geometry/Vector";
import { Matrix } from "./Geometry/Matrix";
import { Polygon } from "./Geometry/Polygon";
import { Body } from "./Physics/Body";
import { Contact } from "./Geometry/Contact";
import { Collision } from "./Physics/Collision";

export class Boot
{
    /**
     * In case of a web worker, register deps, setup listeners for syncing.
     * In case of the main script, register deps, setup keyboard.
     * @param main The main script of the application.
     */
    public static Setup()
    {
        Boot.RegisterDependencies();

        if(Slave.IsWorker())
        {
            Slave.SetupWorker();
        }
        else
        {
            Keyboard.Init();
        }
    }

    /**
     * Register the inner modules of the engine.
     * Import/Export needs this.
     */
    public static RegisterDependencies()
    {
        Exportable.Dependency(World);
        Exportable.Dependency(ArrowActor);
        Exportable.Dependency(PlayerActor);
        Exportable.Dependency(DamageCell);
        Exportable.Dependency(NormalCell);
        Exportable.Dependency(KillCell);
        Exportable.Dependency(Vector);
        Exportable.Dependency(Matrix);
        Exportable.Dependency(Polygon);
        Exportable.Dependency(Contact);
        Exportable.Dependency(Collision);
        Exportable.Dependency(Body);
    }
}