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

    /**
     * Game cycle
     * @param player 
     * @param data.up
     * @param data.left
     * @param data.down
     * @param data.right
     * @param data.space
     */
    protected SetupControl(player: PlayerActor, { up, left, down, right, space })
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

        if(Keyboard.Keys[space] && this.nextShoot <= +new Date)
        {
            player.Shoot(Tools.Unique());
            this.nextShoot = +new Date + SHOT_DELAY;
        }
    }
}