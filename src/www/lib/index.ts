import { Calculator } from './Interpreter/Calculator';
import { Adapter } from './Compiler/Adapter';
import { Runner } from './Compiler/Runner';
import { Map } from "./Map";
import { Coord } from "./Coord";
import { IElement } from "./Element/IElement";
import { Utils } from "./Utils";
import { Parser } from "./Compiler/Parser";

const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const context = canvas.getContext("2d");

// Fixed for now
const size: number = 30;

let map: Map = Map.GetInstance();
let runner: Runner;

// Make map and some classes available for outside usage
window["map"] = map;
window["out"] = { Coord, Map, Utils, Parser, Runner, Adapter, Calculator };

var last: Array<Coord> = [];

map.OnUpdate = () => 
{
    /**
     * Draw the given element onto the canvas.
     * @param e
     * @param callback
     */
    var draw = (e: IElement, loaded: () => void) =>
    {
        let coord = e.GetPosition();
        let x = coord.X;
        let y = coord.Y;

        let image = new Image();
        
        image.onload = () => 
        {
            context.drawImage(image, x * size, y * size, size, size);
            loaded();
        };

        image.src = e.GetTexture();
    };

    if(!runner) 
    {
        runner = new Runner(map.GetRobots()[0]);
        canvas.width = size * map.GetSize();
        canvas.height = size * map.GetSize();
        
        var i = 0;

        // Draw cells first
        map.GetCells().forEach(cell => 
        {
            draw(cell, () => 
            {
                // When the last was drawn, start drawing the robots
                if(++i == map.GetSize())
                {
                    map.GetRobots().forEach(robot => 
                    {
                        last.push(robot.GetPosition().Clone());
                        draw(robot, Utils.Noop);
                    })
                }
            })
        });
    }
    else
    {
        var i = 0;

        // Only draw cells where the robots were
        last.forEach(c => 
        {
            draw(map.GetCell(c), Utils.Noop);

            if(++i == last.length)
            {
                last = [];

                // Redraw robots
                map.GetRobots().forEach(robot => 
                {
                    last.push(robot.GetPosition().Clone());
                    draw(robot, Utils.Noop);
                });
            }
        });
    }
};

Utils.Get("res/example.txt").then(function(e)
{
    (<HTMLTextAreaElement>document.getElementById("code")).value = e
});

document.getElementById("push").onclick = function(e)
{
    runner.Push((<HTMLTextAreaElement>document.getElementById("code")).value);
};

map.Load("res/map.json");