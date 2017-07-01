import { ICell } from "./Element/Cell/ICell";
import { GroundCell } from "./Element/Cell/GroundCell";
import { Coord } from "./Coord";
import { IRobot } from "./Element/Robot/IRobot";
import { IElement } from "./Element/IElement";
import { Constants } from "./Constants";
import { Utils } from "./Utils";
import { CellFactory } from "./Element/Cell/CellFactory";
import { CellType } from "./Element/Cell/CellType";

export class Map
{
    private robots: Array<IRobot>;
    private map: Array<ICell>;

    private size: number;

    /**
     * Singleton instance of the class.
     */
    private static instance: Map;

    /**
     * Get the singleton instance.
     */
    public static GetInstance(): Map
    {
        if(Map.instance == undefined)
        {
            return Map.instance = new Map(Constants.MapSize);
        }

        return Map.instance;
    }

    /**
     * Construct a new Map. 
     * @param size Size of the map.
     */
    private constructor(size: number)
    {
        this.size = size;
        this.map = [];

        for(var i = 0; i < size * size; i++)
        {
            let x = i % size;
            let y = Math.floor(i / size);

            this.map[i] = new GroundCell(new Coord(x, y));
        }
    }

    /**
     * Load a map from a JSON. The JSON needs to contain an array of numbers. The
     * first number will determinate the size of the map, while the others will
     * tell the compiler the cell type based on the CellType enum.
     * @param url 
     */
    public async Load(url: string): Promise<void>
    {
        var raw: Array<number>;

        try
        {
            raw = JSON.parse(await Utils.Get(url));

            if(raw == null)
            {
                return;
            }
        }
        catch(e)
        {
            return;
        }

        var size = raw.shift();

        for(var i = 0; i < raw.length; i++)
        {
            let x = i % size;
            let y = Math.floor(i / size);

            this.map[i] = CellFactory.Factory(<CellType>raw[i], new Coord(x, y));
        }
    }

    /**
     * Get a cell by coord.
     * @param coord 
     */
    public GetCell(coord: Coord): ICell
    {
        var result: ICell = null;

        this.map.some(cell => 
        {
            if(cell.GetPosition().Is(coord)) 
            {
                result = cell;

                return true;
            }
        });

        return result;
    }

    /**
     * Remove a robot from the list.
     * @param robot 
     */
    public RemoveRobot(robot: IRobot)
    {
        var index = this.robots.indexOf(robot);

        if(index >= 0)
        {
            this.robots.splice(index, 1);
        }
    }

    /**
     * Return elements of the map (robots and cells).
     */
    public GetElements(): Array<IElement>
    {
        return (<IElement[]>this.map).concat(<IElement[]>this.robots);
    }

    /**
     * Called when the map was updated.
     */
    public OnUpdate: () => void = function()
    {
        return; // Noop
    }
}