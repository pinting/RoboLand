import { Map } from "./Map"
import { Constants } from "./Constants"
import { Coord } from "./Coord"

const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const context = canvas.getContext("2d");

var map = Map.GetInstance();

map.OnUpdate = () => 
{
    canvas.width = Constants.CellSize * Constants.MapSize;
    canvas.height = Constants.CellSize * Constants.MapSize;

    for(let x = 0; x < Constants.MapSize; x++)
    {
        for(let y = 0; y < Constants.MapSize; y++)
        {
            let cell = map.GetCell(new Coord(x, y));
            let image = new Image();

            image.onload = () => 
            {
                let s = Constants.CellSize;

                context.drawImage(image, x * s, y * s, s, s);
            };

            image.src = cell.GetTexture();
        }
    }
};

map.Load("res/map.json").then(() => map.OnUpdate());