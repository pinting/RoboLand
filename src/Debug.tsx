import * as React from "react";
import { Keyboard } from "./lib/Util/Keyboard";
import { World } from "./lib/World";
import { Renderer } from "./lib/Renderer";
import { FakeChannel } from "./lib/Net/Channel/FakeChannel";
import { Receiver } from "./lib/Net/Receiver";
import { IDump } from "./lib/IDump";
import { Server } from "./lib/Net/Server";
import { Exportable } from "./lib/Exportable";
import { Sender } from "./lib/Net/Sender";
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

        const boardA: World = new World();
        const boardB: World = new World();
    
        // Tagging for debug purposes
        boardA["_Name"] = "boardA";
        boardB["_Name"] = "boardB";
        
        const rendererA = new Renderer(boardA, this.canvasA, false);
        const rendererB = new Renderer(boardB, this.canvasB, false);
        
        const channelA1 = new FakeChannel(delay);
        const channelA2 = new FakeChannel(delay);
        const channelB1 = new FakeChannel(delay);
        const channelB2 = new FakeChannel(delay);
        
        channelA1.SetOther(channelA2);
        channelA2.SetOther(channelA1);
        channelB1.SetOther(channelB2);
        channelB2.SetOther(channelB1);
    
        const receiverA = new Receiver(channelA1, boardA)
        const receiverB = new Receiver(channelB1, boardB);
        
        const raw: IDump = JSON.parse(await Http.Get("res/world.json"));
        const boardServer: World = Exportable.Import(raw);
        const server = new Server(boardServer);
        
        server.Add(new Sender(channelA2, server));
        server.Add(new Sender(channelB2, server));
        
        receiverA.OnPlayer = async player =>
        {
            boardA.Origin = player.GetId();
    
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
            boardB.Origin = player.GetId();
    
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
        const rendererS = new Renderer(boardServer, this.canvasS, true);
    
        await rendererS.Load();
    
        rendererS.Start();
    
        // For debug
        Tools.Extract(window, {
            // Instances
            boardA,
            boardB,
            boardServer,
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
            Polygon
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