import { Processor } from './scripts/Interpreter/Processor';
import { Runner } from './scripts/Interpreter/Runner';
import { Map } from "./scripts/Map";
import { Coord } from "./scripts/Coord";
import { IElement } from "./scripts/Element/IElement";
import { Utils } from "./scripts/Utils";

// For debug
Utils.Extract(window, { Coord, Map, Utils, Processor, Runner });

const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const context = <CanvasRenderingContext2D>canvas.getContext("2d");

const map: Map = Map.GetInstance();

const textures: { [id: string]: HTMLImageElement } = {};
const keys: { [id: string]: boolean } = {};

const dpi: number = 30;

/**
 * Load map and images.
 */
const load = async (url) =>
{
    return new Promise<void>(async (resolve, reject) => 
    {
        await map.Load(url);

        const elements = map.GetElements();
        let i = 0;

        elements.forEach(element =>
        {
            const image = new Image();
                
            image.onload = () => 
            {
                textures[element.GetTexture()] = image;

                if(++i == elements.length) 
                {
                    resolve();
                }
            };
        
            image.onerror = () => reject();
            image.src = element.GetTexture();
        });
    });
}

/**
 * Draw the given element onto the canvas.
 * @param element
 */
const draw = (element: IElement) =>
{
    const coord = element.GetPos();
    const size = element.GetSize();
    const image = textures[element.GetTexture()];

    const x = coord.X;
    const y = coord.Y;
    const w = size.X;
    const h = size.Y;

    context.drawImage(image, x * dpi, y * dpi, w * dpi, h * dpi);
};

/**
 * Update the canvas.
 */
const update = () => 
{
    const size = map.GetSize();

    canvas.width = dpi * size.X;
    canvas.height = dpi * size.Y;
    canvas.style.width = dpi * size.X + "px";
    canvas.style.height = dpi * size.Y + "px";
    
    map.GetCells().forEach(e => draw(e));
    map.GetActors().forEach(e => draw(e));

    const player = map.GetActor("player");

    if(player)
    {
        const direction = new Coord(
            keys["A"] ? -0.1 : keys["D"] ? 0.1 : 0, 
            keys["W"] ? -0.1 : keys["S"] ? 0.1 : 0
        );
    
        player.Move(direction);
    }

    window.requestAnimationFrame(update);
};

/**
 * Executed on key down or up.
 * @param event 
 * @param state 
 */
const onKey = (event, state: boolean) =>
{
    switch (event.keyCode) 
    {
        case 87:
            keys["W"] = state;
            break;
        case 65:
            keys["A"] = state;
            break;
        case 83:
            keys["S"] = state;
            break;
        case 68:
            keys["D"] = state;
            break;
    }
};

window.addEventListener("keydown", e => onKey(e, true), false);
window.addEventListener("keyup", e => onKey(e, false), false);

load("res/map.json").then(() => window.requestAnimationFrame(update));
