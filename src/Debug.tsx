import * as React from "react";
import { Keyboard } from "./lib/Tools/Keyboard";
import { Board } from "./lib/Board";
import { Renderer } from "./lib/Renderer";
import { FakeChannel } from "./lib/Net/Channel/FakeChannel";
import { Receiver } from "./lib/Net/Receiver";
import { IExportObject } from "./lib/IExportObject";
import { Server } from "./lib/Net/Server";
import { Exportable } from "./lib/Exportable";
import { Sender } from "./lib/Net/Sender";
import { Http } from "./lib/Tools/Http";
import { Coord } from "./lib/Coord";
import { GroundCell } from "./lib/Element/Cell/GroundCell";
import { PlayerActor } from "./lib/Element/Actor/PlayerActor";
import { StoneCell } from "./lib/Element/Cell/StoneCell";
import { Logger } from "./lib/Tools/Logger";
import { SimplexNoise } from "./lib/Tools/SimplexNoise";
import { Shared } from "./Shared";
import { Utils } from "./lib/Tools/Utils";

export class Debug extends Shared
{
    private readonly delay: number = 10;

    private canvasA: HTMLCanvasElement;
    private canvasB: HTMLCanvasElement;
    private canvasS: HTMLCanvasElement;

    /**
     * Create 2 clients and 1 server and render everthing onto the 3 canvases.
     */
    public async Main()
    {
        Keyboard.Init();

        const boardA: Board = new Board();
        const boardB: Board = new Board();
    
        // Tagging for debug purposes
        boardA["_Name"] = "boardA";
        boardB["_Name"] = "boardB";
        
        const rendererA = new Renderer(boardA, this.canvasA);
        const rendererB = new Renderer(boardB, this.canvasB);
        
        const channelA1 = new FakeChannel(this.delay);
        const channelA2 = new FakeChannel(this.delay);
        const channelB1 = new FakeChannel(this.delay);
        const channelB2 = new FakeChannel(this.delay);
        
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
            boardA.Origin = player.Id;
    
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
            boardB.Origin = player.Id;
    
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
        const rendererS = new Renderer(boardServer, this.canvasS);
    
        await rendererS.Load();
    
        rendererS.Start();
    
        // For debug
        Utils.Extract(window, {
            // Instances
            boardA,
            boardB,
            boardServer,
            // Classes
            Board,
            Utils,
            Exportable,
            Coord,
            GroundCell,
            PlayerActor,
            StoneCell,
            Logger,
            SimplexNoise
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
     * Render the Debug element.
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