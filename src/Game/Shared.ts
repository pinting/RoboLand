import * as React from "react";
import { PlayerActor } from "../lib/Unit/Actor/PlayerActor";
import { Vector } from "../lib/Geometry/Vector";
import { Keyboard } from "../lib/Util/Keyboard";
import { Tools } from "../lib/Util/Tools";
import { Exportable } from "../lib/Exportable";
import { World } from "../lib/World";
import { KillCell } from "../lib/Unit/Cell/KillCell";
import { NormalCell } from "../lib/Unit/Cell/NormalCell";
import { DamageCell } from "../lib/Unit/Cell/DamageCell";
import { ArrowActor } from "../lib/Unit/Actor/ArrowActor";
import { Polygon } from "../lib/Geometry/Polygon";
import { Body } from "../lib/Physics/Body";
import { Matrix } from "../lib/Geometry/Matrix";
import { ResourceManager } from "../lib/Util/ResourceManager";
import { BaseCell } from "../lib/Unit/Cell/BaseCell";

export class Shared
{
    /**
     * Execution starts here.
     */
    public static DEFAULT_WORLD_URI = "world.json";

    /**
     * Import the inner modules of the engine.
     */
    public static RegisterDependencies()
    {
        Exportable.Dependency(ArrowActor);
        Exportable.Dependency(PlayerActor);
        Exportable.Dependency(DamageCell);
        Exportable.Dependency(NormalCell);
        Exportable.Dependency(KillCell);
        Exportable.Dependency(World);
        Exportable.Dependency(Vector);
        Exportable.Dependency(Matrix);
        Exportable.Dependency(Polygon);
        Exportable.Dependency(Body);
    }
    /**
     * Create a sample world.
     * @param size 
     */
    public static CreateSampleWorld(size: number): World
    {
        const world = new World;

        world.Init(new Vector(size, size));

        // Init world with size x size number of GroundCells
        for(let i = 0; i < size * size; i++)
        {
            let cell: BaseCell;
            
            if(i % (size - 1) == 0)
            {
                // Light
                cell = new NormalCell();
                cell.Init({
                    texture: "res/lamp.png",
                    blocking: false,
                    light: 6,
                    body: Body.CreateBoxBody(
                        new Vector(1, 1), 
                        0,
                        new Vector(i % size, (i -  (i % size)) / size),
                        { 
                            z: 1,
                            density: Infinity
                        })
                });
                
                world.Add(cell);
            }
            
            if(i < size || i >= size * size - size)
            {
                // Stone
                cell = new NormalCell();
                cell.Init({
                    texture: "res/stone.png",
                    blocking: true,
                    body: Body.CreateBoxBody(
                        new Vector(1, 1), 
                        0,
                        new Vector(i % size, (i -  (i % size)) / size),
                        { 
                            z: 0,
                            density: Infinity
                        })
                });
            }
            else
            { 
                // Ground
                cell = new NormalCell();
                cell.Init({
                    texture: "res/ground.png",
                    blocking: false,
                    body: Body.CreateBoxBody(
                        new Vector(1, 1), 
                        0,
                        new Vector(i % size, (i -  (i % size)) / size),
                        { 
                            z: 0,
                            density: Infinity
                        })
                });
            }

            world.Add(cell);
        }

        return world;
    }

    /**
     * Should be used inside the main loop
     * @param player 
     * @param data.up
     * @param data.left
     * @param data.down
     * @param data.right
     * @param data.shoot
     */
    public static SetupControl(player: PlayerActor, { up, left, down, right, shoot })
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

        if(Keyboard.Keys[shoot])
        {
            player.Shoot(Tools.Unique());
        }
    }
}