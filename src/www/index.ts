import { Map } from "./scripts/Map";
import { Coord } from "./scripts/Coord";
import { Utils } from "./scripts/Utils";
import { GroundCell } from './scripts/Element/Cell/GroundCell';
import { PlayerActor } from './scripts/Element/Actor/PlayerActor';
import { Exportable } from './scripts/Exportable';
import { Server } from './scripts/Net/Server';
import { Renderer } from "./scripts/Renderer";
import { Keyboard } from "./scripts/Keyboard";

// For debug
Utils.Extract(window, { 
    Coord, 
    Map,
    Utils,
    Server,
    GroundCell,
    PlayerActor,
    Exportable,
    Keyboard
});

const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const map: Map = new Map;
const renderer = new Renderer(map, canvas);

const cycle = () =>
{
    // TODO: Not this way, this is temporary!
    const player = <PlayerActor>map.GetActors().GetNear(new Coord);
    const direction = new Coord(
        Keyboard.Keys["A"] ? -0.05 : Keyboard.Keys["D"] ? 0.05 : 0, 
        Keyboard.Keys["W"] ? -0.05 : Keyboard.Keys["S"] ? 0.05 : 0
    );

    if(player && direction.GetDistance(new Coord) > 0)
    {
        player.Move(direction);
    }
};

const main = async () =>
{
    await map.Load("res/map.json");
    await renderer.Load();

    Keyboard.Init();
    
    renderer.OnUpdate = () => cycle();
    renderer.Start();
};

main();