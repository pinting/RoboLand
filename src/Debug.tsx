import * as React from "react";
import { Keyboard } from "./lib/Util/Keyboard";
import { World } from "./lib/World";
import { Renderer } from "./lib/Renderer";
import { FakeChannel } from "./lib/Net/Channel/FakeChannel";
import { Client } from "./lib/Net/Client";
import { IDump } from "./lib/IDump";
import { Server } from "./lib/Net/Server";
import { Exportable } from "./lib/Exportable";
import { Host } from "./lib/Net/Host";
import { Http } from "./lib/Util/Http";
import { Vector } from "./lib/Geometry/Vector";
import { Matrix } from "./lib/Geometry/Matrix";
import { GroundCell } from "./lib/Unit/Cell/GroundCell";
import { PlayerActor } from "./lib/Unit/Actor/PlayerActor";
import { StoneCell } from "./lib/Unit/Cell/StoneCell";
import { Logger } from "./lib/Util/Logger";
import { SimplexNoise } from "./lib/Util/SimplexNoise";
import { Shared } from "./Shared";
import { Tools } from "./lib/Util/Tools";
import { Constants } from "./Constants";
import { Polygon } from "./lib/Geometry/Polygon";
import { Body } from "./lib/Physics/Body";
import { Overlap } from "./lib/Geometry/Overlap";

export class Debug extends Shared
{
    public static Name = "debug";

    private canvasA: HTMLCanvasElement;
    private canvasB: HTMLCanvasElement;
    private canvasS: HTMLCanvasElement;

    /**
     * Create 2 clients and 1 server and render everthing onto the 3 canvases.
     */
    public async Main()
    {
        Keyboard.Init();

        const delay = Constants.DebugDelay;

        const worldA: World = new World();
        const worldB: World = new World();
    
        // Tagging for debug purposes
        worldA["_Name"] = "worldA";
        worldB["_Name"] = "worldB";
        
        const rendererA = new Renderer({ canvas: this.canvasA, world: worldA, debug: true });
        const rendererB = new Renderer({ canvas: this.canvasB, world: worldB, debug: true });
        
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
        
        const raw: IDump = JSON.parse(await Http.Get("res/world.json"));
        const worldS: World = Exportable.Import(raw);
        const server = new Server(worldS);
        
        server.Add(new Host(channelA2, server));
        server.Add(new Host(channelB2, server));
        
        receiverA.OnPlayer = async player =>
        {
            worldA.Origin = player.GetId();
    
            await rendererA.Load();
            
            const keys = 
            {
                up: "ARROWUP", 
                left: "ARROWLEFT", 
                down: "ARROWDOWN", 
                right: "ARROWRIGHT",
                space: " "
            };
    
            rendererA.OnDraw.Add(() => this.OnDraw(player, keys));
            rendererA.Start();
        };
        
        receiverB.OnPlayer = async player =>
        {
            worldB.Origin = player.GetId();
    
            await rendererB.Load();
    
            const keys = 
            {
                up: "W", 
                left: "A", 
                down: "S", 
                right: "D",
                space: "E"
            };
            
            rendererB.OnDraw.Add(() => this.OnDraw(player, keys));
            rendererB.Start();
        };
    
        // Render the server
        const rendererS = new Renderer({ canvas: this.canvasS, world: worldS, debug: true });
    
        await rendererS.Load();
    
        rendererS.Start();
    
        // For debug
        Tools.Extract(window, {
            // Instances
            boardA: worldA,
            boardB: worldB,
            boardServer: worldS,
            // Classes
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
    }

    /**
     * Execute the main function when the component is mounted.
     */
    public componentDidMount(): void
    {
        this.Main();
    }

    /**
     * Render the Debug view.
     */
    public render(): JSX.Element
    {
        return (
            <div>
                <canvas ref={c => this.canvasA = c}></canvas>
                <span>A</span>
                <canvas ref={c => this.canvasB = c}></canvas>
                <span>B</span>
                <canvas ref={c => this.canvasS = c}></canvas>
                <span>S</span>
            </div>
        );
    }
}