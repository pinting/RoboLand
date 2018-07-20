import { Map } from "./scripts/Map";
import { Coord } from "./scripts/Coord";
import { PlayerActor } from './scripts/Element/Actor/PlayerActor';
import { Server } from './scripts/Net/Server';
import { Renderer } from "./scripts/Renderer";
import { Keyboard } from "./scripts/Util/Keyboard";
import { Connection } from "./scripts/Net/Connection";
import { BasicChannel } from "./scripts/Net/BasicChannel";
import { Client } from "./scripts/Net/Client";

const cycle = (player: PlayerActor, { up, left, down, right }) =>
{
    const direction = new Coord(
        Keyboard.Keys[left] ? -0.05 : Keyboard.Keys[right] ? 0.05 : 0, 
        Keyboard.Keys[up] ? -0.05 : Keyboard.Keys[down] ? 0.05 : 0
    );

    if(player && direction.GetDistance(new Coord) > 0)
    {
        player.Move(direction);
    }
};

const main = async () =>
{
    Keyboard.Init();
    
    const map: Map = new Map();

    await map.Load("res/map.json");

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

    const server = new Server(map);
    
    server.Add(new Connection(channelA2));
    server.Add(new Connection(channelB2));
    
    clientA.OnPlayer = async player =>
    {
        await rendererA.Load();
        
        const keys = 
        {
            up: "ARROWUP", 
            left: "ARROWLEFT", 
            down: "ARROWDOWN", 
            right: "ARROWRIGHT"
        };

        rendererA.OnUpdate.Add(() => cycle(player, keys));
        rendererA.Start();
    };
    
    clientB.OnPlayer = async player =>
    {
        await rendererB.Load();

        const keys = 
        {
            up: "W", 
            left: "A", 
            down: "S", 
            right: "D"
        };
        
        rendererB.OnUpdate.Add(() => cycle(player, keys));
        rendererB.Start();
    };
};

main();