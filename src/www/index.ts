import { Processor } from './scripts/Interpreter/Processor';
import { Runner } from './scripts/Interpreter/Runner';
import { Map } from "./scripts/Map";
import { Coord } from "./scripts/Coord";
import { BaseElement } from "./scripts/Element/BaseElement";
import { Utils } from "./scripts/Utils";
import { BaseActor } from './scripts/Element/Actor/BaseActor';
import { PlayerActor } from './scripts/Element/Actor/PlayerActor';

// For debug
Utils.Extract(window, { 
    Coord, 
    Map,
    Utils,
    Processor,
    Runner,
    BaseActor,
    PlayerActor
});

const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const context = <CanvasRenderingContext2D>canvas.getContext("2d");

const map: Map = Map.GetInstance();

const textures: { [id: string]: HTMLImageElement } = {};
const keys: { [id: string]: boolean } = {};

const dpi: number = 30;

/**
 * Load map and images.
 */
const load = async (url): Promise<void> =>
{
    const loadTextures = async (): Promise<void> =>
    {
        return new Promise<void>((resolve, reject) => 
        {
            const elements = map.GetElements();
            let i = 0;
    
            elements.ForEach(element =>
            {
                if(!element)
                {
                    i++;
                    return;
                }
    
                const id = element.GetTexture();

                if(textures[id] !== undefined)
                {
                    i++;
                    return;
                }

                const texture = new Image();
    
                texture.onerror = () => reject();
                texture.onload = () => 
                {
                    textures[id] = texture;
    
                    if(++i == elements.GetLength()) 
                    {
                        resolve();
                    }
                };
            
                texture.src = id;
                textures[id] = null;
            });
        });
    }

    await map.Load(url);
    await loadTextures();

    return Promise.resolve();
}

/**
 * Draw the given element onto the canvas.
 * @param element
 */
const draw = (element: BaseElement) =>
{
    if(!element)
    {
        return;
    }
    
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
    
    map.GetCells().ForEach(e => draw(e));
    map.GetActors().ForEach(e => draw(e));

    const player = <PlayerActor>map.GetActors().Get("player")[0];

    if(player)
    {
        const direction = new Coord(
            keys["A"] ? -0.05 : keys["D"] ? 0.05 : 0, 
            keys["W"] ? -0.05 : keys["S"] ? 0.05 : 0
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
