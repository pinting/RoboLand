import * as React from "react";
import * as Bootstrap from "reactstrap";
import Cristal from "react-cristal";

import { Logger } from "../lib/Util/Logger";
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

interface IViewProps
{
    close: () => void;
    world?: Dump;
}

interface IViewState
{

}

export class OnePlayerDebug extends React.PureComponent<IViewProps, IViewState>
{
    private canvas: HTMLCanvasElement;
    private renderer: Renderer;
    
    private async init(): Promise<void>
    {
        Keyboard.Init();

        // Load the world
        const uri = World.RootDump;

        Logger.Info("Loading root resource", uri);

        const rootResource = ResourceManager.ByUri(uri);

        if(!rootResource)
        {
            Logger.Warn("Default root resource is not available", uri);
            return;
        }

        Logger.Info("Parsing JSON", rootResource);

        const rootDump = await Tools.RunAsync<Dump>(() => 
            JSON.parse(Tools.ANSIToUTF16(rootResource.Buffer)));

        Logger.Info("Resolving Dump", rootDump);

        const dump = await Tools.RunAsync<Dump>(() => Dump.Resolve(rootDump));

        Logger.Info("Importing world", dump);

        const world = await Tools.RunAsync<World>(() => Exportable.Import(dump));
        
        // Add player
        Logger.Info("Adding player to the world", world);

        const player = world.GetBasePlayer().Clone() as PlayerActor;

        player.Init({
            ignore: false // IMPORTANT
        });

        world.Add(player);

        // Attach a renderer to the world
        Logger.Info("Adding and loading renderer", world);
    
        this.renderer = new Renderer({
            canvas: this.canvas,
            world: world, 
            debugMode: true,
            viewport: new Vector(10, 10),
            disableShadows: true
        });
    
        await this.renderer.LoadTextures();
            
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
            Shared.DoControl(player, keys);
            this.renderer.SetCenter(player.GetBody().GetPosition());
        });

        Logger.Info("Start rendering", this.renderer);

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