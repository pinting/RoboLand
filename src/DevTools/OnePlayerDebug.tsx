import * as React from "react";
import * as Bootstrap from "reactstrap";
import Cristal from "react-cristal";

import { Logger, LogType } from "../lib/Util/Logger";
import { Shared } from "../Game/Shared";
import { PlayerActor } from "../lib/Unit/Actor/PlayerActor";
import { Vector } from "../lib/Geometry/Vector";
import { World } from "../lib/World";
import { Tools } from "../lib/Util/Tools";
import { ResourceManager } from "../lib/Util/ResourceManager";
import { Exportable } from "../lib/Exportable";
import { Keyboard } from "../lib/Util/Keyboard";
import { Renderer } from "../lib/Renderer";
import { Dump } from "../lib/Dump";

interface ViewProps
{
    close: () => void;
    world?: Dump;
}

interface ViewState
{

}

export class OnePlayerDebug extends React.PureComponent<ViewProps, ViewState>
{
    private canvas: HTMLCanvasElement;
    private renderer: Renderer;
    
    private async init(): Promise<void>
    {
        Logger.Type = LogType.Warn;
        Keyboard.Init();

        // Load or create the world
        const rootResource = ResourceManager.ByUri(Shared.DEFAULT_WORLD_URI);
        let world: World;

        if(!rootResource)
        {
            Logger.Warn("Default root resource is not available", Shared.DEFAULT_WORLD_URI);
            return;
        }

        const raw = Tools.ANSIToUTF16(rootResource.Buffer);
        const rootDump = JSON.parse(raw) as Dump;
        const dump = Dump.Resolve(rootDump);

        world = Exportable.Import(dump);

        // Add player
        const player = world.GetBasePlayer().Clone() as PlayerActor;

        player.Init({
            ignore: false // IMPORTANT
        });

        world.Add(player);
    
        // Render the server
        this.renderer = new Renderer({
            canvas: this.canvas,
            world: world, 
            debug: true,
            viewport: new Vector(10, 10),
            disableShadows: true
        });
    
        await this.renderer.Load();
            
        const keys = 
        {
            up: "ARROWUP", 
            left: "ARROWLEFT", 
            down: "ARROWDOWN", 
            right: "ARROWRIGHT",
            shoot: " "
        };

        this.renderer.OnDraw.Add(() => 
        {
            Shared.SetupControl(player, keys);
            this.renderer.SetCenter(player.GetBody().GetPosition());
        });

        this.renderer.Start();

        // For debug
        Tools.Extract(window, {
            world: world
        });
    }

    public componentDidMount(): void
    {
        this.init();
    }

    public componentWillUnmount(): void
    {
        this.renderer.Stop();
    }

    private renderInner(): JSX.Element
    {
        return <canvas style={{ width: "100%", background: "black" }} ref={c => this.canvas = c} />;
    }

    public render(): JSX.Element
    {
        return (
            <Cristal 
                onClose={() => this.props.close()}
                title="One Player Debug"
                initialSize={{width: 500, height: 500}}
                isResizable={true}
                initialPosition="top-center">
                    {this.renderInner()}
            </Cristal>
        );
    }
}