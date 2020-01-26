import * as React from "react";
import { World } from "./lib/World";
import { Exportable } from "./lib/Exportable";
import { Vector } from "./lib/Geometry/Vector";
import { Matrix } from "./lib/Geometry/Matrix";
import { GroundCell } from "./lib/Unit/Cell/GroundCell";
import { PlayerActor } from "./lib/Unit/Actor/PlayerActor";
import { StoneCell } from "./lib/Unit/Cell/StoneCell";
import { Logger, LogType } from "./lib/Util/Logger";
import { SimplexNoise } from "./lib/Util/SimplexNoise";
import { Shared } from "./Shared";
import { Tools } from "./lib/Util/Tools";
import { Polygon } from "./lib/Geometry/Polygon";
import { Body } from "./lib/Physics/Body";
import NetTest from "./lib/Test/NetTest";

export class Test extends Shared
{
    public static Name = "test";

    /**
     * Create 2 clients and 1 server and render everthing onto the 3 canvases.
     */
    public async Main()
    {
        // For debug
        Tools.Extract(window, {
            World,
            Tools,
            Exportable,
            Vector,
            Matrix,
            GroundCell,
            PlayerActor,
            StoneCell,
            Logger,
            SimplexNoise,
            Polygon,
            Body
        });

        // Run tests
        Logger.Type = LogType.Info;

        try
        {
            await NetTest();
        }
        catch(e)
        {
            Logger.Warn(this, e);
        }
        finally
        {
            Logger.Info(this, "Tests complete!");
        }
    }

    /**
     * Execute the main function when the component is mounted.
     */
    public componentDidMount(): void
    {
        this.Main();
    }

    /**
     * Render the Test view.
     */
    public render(): JSX.Element
    {
        return (
            <div>
                Testing...
            </div>
        );
    }
}