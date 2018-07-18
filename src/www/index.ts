import { Map } from "./scripts/Map";
import { Coord } from "./scripts/Coord";
import { Utils } from "./scripts/Utils";
import { GroundCell } from './scripts/Element/Cell/GroundCell';
import { PlayerActor } from './scripts/Element/Actor/PlayerActor';
import { Exportable } from './scripts/Exportable';
import { Server } from './scripts/Net/Server';
import { Renderer } from "./scripts/Renderer";
import { Keyboard } from "./scripts/Keyboard";
import { ServerClient } from "./scripts/Net/ServerClient";
import { BasicChannel } from "./scripts/Net/BasicChannel";
import { Client } from "./scripts/Net/Client";

const cycle = (player: PlayerActor, keys: string[]) =>
{
    const direction = new Coord(
        Keyboard.Keys[keys[1]] ? -0.05 : Keyboard.Keys[keys[3]] ? 0.05 : 0, 
        Keyboard.Keys[keys[0]] ? -0.05 : Keyboard.Keys[keys[2]] ? 0.05 : 0
    );

    if(player && player.IsAlive() && direction.GetDistance(new Coord) > 0)
    {
        player.Move(direction);
    }
};

const main = async () =>
{
    Keyboard.Init();

    const mapA: Map = new Map();
    const mapB: Map = new Map();
    
    const canvasA = <HTMLCanvasElement>document.getElementById("canvasA");
    const canvasB = <HTMLCanvasElement>document.getElementById("canvasB");
    
    const rendererA = new Renderer(mapA, canvasA);
    const rendererB = new Renderer(mapB, canvasB);
    
    const channelA1 = new BasicChannel();
    const channelA2 = new BasicChannel();
    const channelB1 = new BasicChannel();
    const channelB2 = new BasicChannel();
    
    channelA1.SetOther(channelA2);
    channelA2.SetOther(channelA1);
    channelB1.SetOther(channelB2);
    channelB2.SetOther(channelB1);

    const clientA = new Client(channelA1, mapA);
    const clientB = new Client(channelB1, mapB);
    
    const map: Map = new Map();

    await map.Load("res/map.json");

    const server = new Server(map);
    
    server.Add(new ServerClient(channelA2));
    server.Add(new ServerClient(channelB2));
    
    clientA.OnPlayer = async player =>
    {
        await rendererA.Load();
        
        const keys = ["ARROWUP", "ARROWLEFT", "ARROWDOWN", "ARROWRIGHT"];

        rendererA.OnUpdate = () => cycle(player, keys);
        rendererA.Start();
    };
    
    clientB.OnPlayer = async player =>
    {
        await rendererB.Load();

        const keys = ["W", "A", "S", "D"];
        
        rendererB.OnUpdate = () => cycle(player, keys);
        rendererB.Start();
    };
};

main();