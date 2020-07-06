import * as React from "react";
import Cristal from "react-cristal";

import { Logger } from "../lib/Util/Logger";
import { Shared } from "../Game/Shared";
import { Renderer } from "../lib/Renderer";
import { World } from "../lib/World";
import { FakeChannel } from "../lib/Net/Channel/FakeChannel";
import { Client } from "../lib/Net/Client";
import { Server } from "../lib/Net/Server";
import { Host } from "../lib/Net/Host";
import { Tools } from "../lib/Util/Tools";
import { ResourceManager } from "../lib/Util/ResourceManager";
import { Exportable } from "../lib/Exportable";
import { Keyboard } from "../lib/Util/Keyboard";
import { Dump } from "../lib/Dump";
import { Master } from "../lib/Master";

interface IViewProps 
{
    world?: Dump;
    close: () => void;
}

interface IViewState 
{

}

export class TwoPlayerDebug extends React.PureComponent<IViewProps, IViewState>
{
    private canvasA: HTMLCanvasElement;
    private canvasB: HTMLCanvasElement;
    private canvasS: HTMLCanvasElement;

    private rendererA: Renderer;
    private masterA: Master;

    private rendererB: Renderer;
    private masterB: Master;

    /**
     * Create 2 clients and 1 server and render everthing onto the 3 canvases.
     */
    protected async init()
    {
        const delay = 1;

        const worldA: World = new World();
        const worldB: World = new World();
    
        // Tagging for debug purposes
        worldA["_Name"] = "worldA";
        worldB["_Name"] = "worldB";
        
        this.masterA = new Master(worldA);
        this.rendererA = new Renderer({
            disableShadows: true,
            canvas: this.canvasA,
            world: worldA,
            master: this.masterA,
            debugMode: true
        });

        this.masterB = new Master(worldB);
        this.rendererB = new Renderer({
            disableShadows: true,
            canvas: this.canvasB,
            world: worldB,
            master: this.masterB,
            debugMode: true
        });
        
        const channelA1 = new FakeChannel(delay);
        const channelA2 = new FakeChannel(delay);
        const channelB1 = new FakeChannel(delay);
        const channelB2 = new FakeChannel(delay);
        
        channelA1.SetOther(channelA2);
        channelA2.SetOther(channelA1);
        channelB1.SetOther(channelB2);
        channelB2.SetOther(channelB1);
    
        const receiverA = new Client(channelA1, worldA)
        const receiverB = new Client(channelB1, worldB);

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

        Logger.Info("Setting up server", world);

        const server = new Server(world);

        Logger.Info("Adding hosts to the server", server);
        
        server.Add(new Host(channelA2, server));
        server.Add(new Host(channelB2, server));
        
        receiverA.OnPlayer = async player =>
        {
            worldA.Origin = player.GetId();
    
            await this.rendererA.LoadTextures();
            
            const keys = 
            {
                up: "ARROWUP", 
                left: "ARROWLEFT", 
                down: "ARROWDOWN", 
                right: "ARROWRIGHT",
                shoot: " "
            };

            this.rendererA.OnDraw.Add(() => 
            {
                Shared.DoControl(player, keys);
                this.rendererA.SetCenter(player.GetBody().GetPosition());
            });

            this.rendererA.Start();

            Logger.Info("Player A loaded", worldA);
        };
        
        receiverB.OnPlayer = async player =>
        {
            worldB.Origin = player.GetId();
    
            await this.rendererB.LoadTextures();
    
            const keys = 
            {
                up: "W", 
                left: "A", 
                down: "S", 
                right: "D",
                shoot: "E"
            };

            this.rendererB.OnDraw.Add(() => 
            {
                Shared.DoControl(player, keys);
                this.rendererB.SetCenter(player.GetBody().GetPosition());
            });

            this.rendererB.Start();

            Logger.Info("Player B loaded", worldB);
        };
    
        // Render the server
        const master = new Master(world);
        const rendererS = new Renderer({ 
            canvas: this.canvasS,
            world: world, 
            master: master,
            debugMode: false,
            disableShadows: true,
            center: world.GetSize().Scale(1 / 2),
            viewport: world.GetSize(),
            dotPerPoint: 10
        });
    
        await rendererS.LoadTextures();
    
        rendererS.Start();

        Logger.Info("Server loaded", server, world, rendererS);

        // For debug
        Tools.Extract(window, {
            worldA: worldA,
            worldB: worldB,
            world: world
        });
    }

    public componentWillUnmount(): void
    {
        this.rendererA.Stop();
        this.rendererB.Stop();
    }

    public componentDidMount(): void
    {
        this.init();
    }

    public renderInner(): JSX.Element
    {
        return (
            <div>
                <canvas style={{ width: "33%", background: "black" }} ref={c => this.canvasA = c} />
                <canvas style={{ width: "33%", background: "black" }} ref={c => this.canvasB = c} />
                <canvas style={{ width: "33%", background: "black" }} ref={c => this.canvasS = c} />
            </div>
        );
    }

    public render(): JSX.Element
    {
        return (
            <Cristal 
                onClose={() => this.props.close()}
                title="Two Player Debug"
                initialSize={{width: 700, height: 300}}
                isResizable={true}
                initialPosition="top-center">
                    {this.renderInner()}
            </Cristal>
        );
    }
}