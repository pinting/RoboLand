import * as React from "react";
import "./Shared.css";
import { PlayerActor } from "./lib/Unit/Actor/PlayerActor";
import { Vector } from "./lib/Geometry/Vector";
import { Keyboard } from "./lib/Util/Keyboard";
import { Tools } from "./lib/Util/Tools";
import { Exportable } from "./lib/Exportable";
import { World } from "./lib/World";
import { WaterCell } from "./lib/Unit/Cell/WaterCell";
import { StoneCell } from "./lib/Unit/Cell/StoneCell";
import { GroundCell } from "./lib/Unit/Cell/GroundCell";
import { FireCell } from "./lib/Unit/Cell/FireCell";
import { ArrowActor } from "./lib/Unit/Actor/ArrowActor";
import { LightCell } from "./lib/Unit/Cell/LightCell";
import { Polygon } from "./lib/Geometry/Polygon";
import { Body } from "./lib/Physics/Body";
import { Matrix } from "./lib/Geometry/Matrix";
import { Logger } from "./lib/Util/Logger";
import { IDump } from "./lib/IDump";
import { ResourceManager } from "./lib/Util/ResourceManager";

// Dependency classes as a dependency
Exportable.Dependency(ArrowActor);
Exportable.Dependency(PlayerActor);
Exportable.Dependency(FireCell);
Exportable.Dependency(GroundCell);
Exportable.Dependency(StoneCell);
Exportable.Dependency(WaterCell);
Exportable.Dependency(LightCell);
Exportable.Dependency(World);
Exportable.Dependency(Vector);
Exportable.Dependency(Matrix);
Exportable.Dependency(Polygon);
Exportable.Dependency(Body);

const SHOT_DELAY = 1000;

export abstract class Shared<P = {}, S = {}> extends React.PureComponent<P, S>
{
    protected nextShoot = +new Date(0);

    /**
     * The consturtor of the Shared unit - which is abstract, so
     * cannot be constructed on its own.
     * @param props
     */
    constructor(props) 
    {
        super(props);

        Keyboard.Init();
    }

    public SaveWorkspace()
    {
        const blob = ResourceManager.Save();

        if(window.navigator.msSaveOrOpenBlob)
        {
            window.navigator.msSaveBlob(blob, name);
        }
        else {
            const link = window.document.createElement("a");

            link.href = window.URL.createObjectURL(blob);
            link.download = name;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    /**
     * Game cycle
     * @param player 
     * @param data.up
     * @param data.left
     * @param data.down
     * @param data.right
     * @param data.shoot
     */
    protected SetupControl(player: PlayerActor, { up, left, down, right, shoot })
    {
        if(!player)
        {
            return;
        }

        if(Keyboard.Keys[left])
        {
            if(!player.IsRotating())
            {
                player.StartRot(true);
            }
        }
        else if(!Keyboard.Keys[right] && player.IsRotating())
        {
            player.StopRot();
        }

        if(Keyboard.Keys[right])
        {
            if(!player.IsRotating())
            {
                player.StartRot(false);
            }
        }
        else if(!Keyboard.Keys[left] && player.IsRotating())
        {
            player.StopRot();
        }

        if(Keyboard.Keys[up])
        {
            if(!player.IsWalking())
            {
                player.StartWalk(false);
            }
        }
        else if(!Keyboard.Keys[down] && player.IsWalking())
        {
            player.StopWalk();
        }

        if(Keyboard.Keys[down])
        {
            if(!player.IsWalking())
            {
                player.StartWalk(true);
            }
        }
        else if(!Keyboard.Keys[up] && player.IsWalking())
        {
            player.StopWalk();
        }

        if(Keyboard.Keys[shoot] && this.nextShoot <= +new Date)
        {
            player.Shoot(Tools.Unique());
            this.nextShoot = +new Date + SHOT_DELAY;
        }
    }
}