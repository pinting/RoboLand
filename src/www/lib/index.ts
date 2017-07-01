import { Map } from "./Map";
import { Coord } from "./Coord";
import { IElement } from "./Element/IElement";
import { Utils } from "./Utils";

const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const context = canvas.getContext("2d");
const map = Map.GetInstance();

// Fixed for now
const size: number = 30;

map.OnUpdate = () => 
{
    canvas.width = size * map.GetSize();
    canvas.height = size * map.GetSize();

    /**
     * Draw the given element onto the canvas.
     * @param e
     * @param callback
     */
    var draw = (e: IElement, callback: () => void) =>
    {
        let coord = e.GetPosition();
        let x = coord.X;
        let y = coord.Y;

        let image = new Image();
        
        image.onload = () => 
        {
            context.drawImage(image, x * size, y * size, size, size);
            callback();
        };

        image.src = e.GetTexture();
    };

    var i = 0;

    // Draw cells first
    map.GetMap().forEach(cell => 
    {
        draw(cell, () => 
        {
            // When the last was drawn, start drawing the robots
            if(++i == map.GetSize())
            {
                map.GetRobots().forEach(robot => draw(robot, Utils.Noop))
            }
        })
    });
};

map.Load("res/map.json");