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

const last: Array<{from: Coord, to: Coord}> = [];
const dpi: number = 30;

let init = true;

/**
 * Draw the given element onto the canvas.
 * @param e
 * @param callback
 */
const draw = (e: IElement, loaded: () => void) =>
{
    const coord = e.GetPos();
    const size = e.GetSize();

    const x = coord.X;
    const y = coord.Y;
    const w = size.X;
    const h = size.Y;

    const image = new Image();
    
    image.onload = () => 
    {
        context.drawImage(image, x * dpi, y * dpi, w * dpi, h * dpi);
        loaded();
    };

    image.src = e.GetTexture();
};

/**
 * Draw actors.
 */
const drawActors = () => 
{
    map.GetActors().forEach(actor => 
    {
        last.push(
        {
            from: actor.GetPos().Clone(),
            to: actor.GetPos().Add(actor.GetSize())
        });

        draw(actor, Utils.Noop);
    });
}

/**
 * Update the canvas.
 */
const update = () => 
{
    if(init) 
    {
        const size = map.GetSize();

        canvas.width = dpi * size.X;
        canvas.height = dpi * size.Y;
        canvas.style.width = dpi * size.X + "px";
        canvas.style.height = dpi * size.Y + "px";
        canvas.onclick = e => update();
        
        let i = 0;

        // Draw cells first
        map.GetCells().forEach(cell => 
        {
            draw(cell, () => 
            {
                // When the last was drawn, start drawing the actors
                if(++i == size.X * size.Y)
                {
                    drawActors();
                }
            })
        });

        init = false;
    }
    else
    {
        let i = 0;

        // Only draw cells where the actors were
        last.forEach(({from, to}) => 
        {
            map.GetCellBetween(from, to).forEach(cell => draw(cell, Utils.Noop));

            if(++i == last.length)
            {
                // Clear the array
                last.length = 0;

                // Redraw actors
                drawActors();
            }
        });
    }
};

map.OnUpdate = update;
map.Load("res/map.json");