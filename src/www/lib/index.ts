import { IRobot } from './Element/Robot/IRobot';
import { Processor } from './Interpreter/Processor';
import { Runner } from './Interpreter/Runner';
import { Map } from "./Map";
import { Coord } from "./Coord";
import { IElement } from "./Element/IElement";
import { Utils } from "./Utils";

Utils.Extract(window, { Coord, Map, Utils, Processor, Runner });

const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const context = <CanvasRenderingContext2D>canvas.getContext("2d");

const codeTextarea = <HTMLTextAreaElement>document.getElementById("code");
const pushButton = <HTMLButtonElement>document.getElementById("push");
const stopButton = <HTMLButtonElement>document.getElementById("stop");
const lineInput = <HTMLButtonElement>document.getElementById("line");

let map: Map = Map.GetInstance();
let runner: Runner = null;

const last: Array<Coord> = [];

let player: IRobot = null;
let enemy: IRobot = null;

const size: number = 30;

/**
 * Draw the given element onto the canvas.
 * @param e
 * @param callback
 */
const draw = (e: IElement, loaded: () => void) =>
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

/**
 * Update the canvas.
 */
const update = () => 
{
    if(!runner) 
    {
        player = map.GetRobots()[0];
        enemy = map.GetRobots()[1];

        runner = new Runner(player);

        runner.OnLine = (line, count) => 
        {
            lineInput.value = `${count}: ${line}`;
        };

        canvas.width = size * map.GetSize();
        canvas.height = size * map.GetSize();
        canvas.onclick = e => update();
        
        let i = 0;

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
        let i = 0;

        // Only draw cells where the robots were
        last.forEach(c => 
        {
            draw(map.GetCell(c), Utils.Noop);

            if(++i == last.length)
            {
                // Clear the array
                last.length = 0;

                // Redraw robots
                map.GetRobots().forEach(robot => 
                {
                    last.push(robot.GetPosition().Clone());
                    draw(robot, Utils.Noop);
                });
            }
        });
    }

    if(!player.IsAlive() || !enemy.IsAlive())
    {
        alert(player.IsAlive() ? "You won!" : "You lose!");

        stopButton.disabled = true;
        pushButton.disabled = true;

        runner.Stop();
    }
};

pushButton.onclick = e => runner.Run(codeTextarea.value);
stopButton.onclick = e => runner.Stop();

Utils.Get("res/example.txt").then(result => codeTextarea.value = result);
map.Load("res/map.json");

map.OnUpdate = update;