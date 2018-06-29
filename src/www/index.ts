import { Processor } from './scripts/Interpreter/Processor';
import { Runner } from './scripts/Interpreter/Runner';
import { Map } from "./scripts/Map";
import { Coord } from "./scripts/Coord";
import { IElement } from "./scripts/Element/IElement";
import { Utils } from "./scripts/Utils";

Utils.Extract(window, { Coord, Map, Utils, Processor, Runner });

const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const context = <CanvasRenderingContext2D>canvas.getContext("2d");

const map: Map = Map.GetInstance();

const last: Array<Coord> = [];
const size: number = 30;

let init = true;

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
    if(init) 
    {
        canvas.width = size * map.GetSize();
        canvas.height = size * map.GetSize();
        canvas.onclick = e => update();
        
        let i = 0;

        // Draw cells first
        map.GetCells().forEach(cell => 
        {
            draw(cell, () => 
            {
                // When the last was drawn, start drawing the actors
                if(++i == map.GetSize())
                {
                    map.GetActors().forEach(actor => 
                    {
                        last.push(actor.GetPosition().Clone());
                        draw(actor, Utils.Noop);
                    })
                }
            })
        });

        init = false;
    }
    else
    {
        let i = 0;

        // Only draw cells where the actors were
        last.forEach(c => 
        {
            map.GetCellAround(c).forEach(cell => draw(cell, Utils.Noop));

            if(++i == last.length)
            {
                // Clear the array
                last.length = 0;

                // Redraw actors
                map.GetActors().forEach(actor => 
                {
                    last.push(actor.GetPosition().Clone());
                    draw(actor, Utils.Noop);
                });
            }
        });
    }
};

map.OnUpdate = update;
map.Init(8);

window["map"] = map;
window["out"] = {
    Coord
};