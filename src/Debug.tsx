import * as React from "react";
import { Keyboard } from "./lib/Util/Keyboard";
import { Board } from "./lib/Board";
import { Renderer } from "./lib/Renderer";
import { FakeChannel } from "./lib/Net/Channel/FakeChannel";
import { Receiver } from "./lib/Net/Receiver";
import { IExportObject } from "./lib/IExportObject";
import { Server } from "./lib/Net/Server";
import { Exportable } from "./lib/Exportable";
import { Sender } from "./lib/Net/Sender";
import { Http } from "./lib/Util/Http";
import { Vector } from "./lib/Physics/Vector";
import { GroundCell } from "./lib/Element/Cell/GroundCell";
import { PlayerActor } from "./lib/Element/Actor/PlayerActor";
import { StoneCell } from "./lib/Element/Cell/StoneCell";
import { Logger } from "./lib/Util/Logger";
import { SimplexNoise } from "./lib/Util/SimplexNoise";
import { Shared } from "./Shared";
import { Tools } from "./lib/Util/Tools";
import { Constants } from "./Constants";
import { Triangle } from "./lib/Physics/Triangle";
import { Mesh } from "./lib/Physics/Mesh";

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

        const boardA: Board = new Board();
        const boardB: Board = new Board();
    
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
        
        const raw: IExportObject = JSON.parse(await Http.Get("res/board.json"));
        const boardServer: Board = Exportable.Import(raw);
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
            Board,
            Tools,
            Exportable,
            Vector,
            GroundCell,
            PlayerActor,
            StoneCell,
            Logger,
            SimplexNoise,
            Triangle,
            Mesh
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