import { ICell } from "./Element/Cell/ICell";
import { GroundCell } from "./Element/Cell/GroundCell";
import { Coord } from "./Coord";
import { IRobot } from "./Element/Robot/IRobot";
import { IElement } from "./Element/IElement";
import { Utils } from "./Utils";
import { CellFactory } from "./Element/Cell/CellFactory";
import { CellType } from "./Element/Cell/CellType";
import { BasicRobot } from "./Element/Robot/BasicRobot";

export class Map
{
    private readonly robotCount: number = 2;

    private robots: Array<IRobot>;
    private cells: Array<ICell>;

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
            return Map.instance = new Map();
        }

        return Map.instance;
    }

    /**
     * Construct a simple new map. 
     * @param size Size of the map.
     */
    public Init(size: number)
    {
        this.size = size;
        this.robots = [];
        this.cells = [];

        for(var i = 0; i < size * size; i++)
        {
            let x = i % size;
            let y = Math.floor(i / size);

            this.cells[i] = new GroundCell(new Coord(x, y));
        }

        this.robots.push(new BasicRobot(new Coord(Utils.Random(0, size - 1), 0)));
        this.robots.push(new BasicRobot(new Coord(Utils.Random(0, size - 1), size - 1)));

        this.OnUpdate();
    }

    /**
     * Load a map from an external file. The JSON needs to contain an array of numbers.
     * The first number will determinate the size of the map, while the others will
     * tell the interpreter type of the cell based on the CellType enum.
     * @param url 
     */
    public async Load(url: string): Promise<void>
    {
        var raw: Array<number>;

        try
        {
            raw = JSON.parse(await Utils.Get(url));

            // Check if it is a valid map array
            if(raw == null && raw.length < 2 && raw.length != Math.pow(raw[0], 2) + 1)
            {
                return;
            }
        }
        catch(e)
        {
            return;
        }

        this.cells = [];
        this.robots = [];
        this.size = raw.shift(); // First element is the size

        var robotSpots = new Array<Coord>();
        var robotCount = 0;

        for(let i = 0; i < raw.length; i++)
        {
            let x = i % this.size;
            let y = Math.floor(i / this.size);

            let type: CellType = raw[i];

            // Create cell based on the CellType
            this.cells[i] = CellFactory.FromType(type, new Coord(x, y));

            // If the cell is ground and there is 0 or 1 robot, try to add one
            if(robotCount < this.robotCount && type == CellType.Ground)
            {
                // Give the cell 5% chance
                if(Utils.Random(0, 20) == 1)
                {
                    // Add a new robot and increment robot count
                    this.robots.push(new BasicRobot(new Coord(x, y)));
                    robotCount++;
                }
                else
                {
                    // If the cell lost, save it for later
                    robotSpots.push(new Coord(x, y))
                }
            }
        }

        // If the map is loaded, but too few robots were added, add new ones
        // based on the [save if for later] spots
        for(; robotSpots.length > 0 && robotCount < this.robotCount; robotCount++)
        {
            let coord = robotSpots.splice(Utils.Random(0, robotSpots.length - 1), 1)[0];
            let robot = new BasicRobot(coord);

            this.robots.push(robot);
        }

        this.OnUpdate();
    }

    /**
     * Get an element from the given array by coord.
     * @param form
     * @param coord
     */
    private GetElement(form: IElement[], coord: Coord): IElement
    {
        var result: IElement = null;

        form.some(e => 
        {
            if(e.GetPosition().Is(coord)) 
            {
                result = e;

                return true;
            }
        });

        return result;
    }

    /**
     * Get a cell by coord.
     * @param coord 
     */
    public GetCell(coord: Coord): ICell
    {
        return <ICell>this.GetElement(this.cells, coord);
    }

    /**
     * Get a robot by coord.
     * @param coord 
     */
    public GetRobot(coord: Coord): IRobot
    {
        return <IRobot>this.GetElement(this.robots, coord);
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
     * Get the size of the map.
     */
    public GetSize(): number
    {
        return this.size;
    }

    /**
     * Get the cells of the map.
     */
    public GetCells(): Array<ICell>
    {
        return this.cells;
    }

    /**
     * Get the robots of the map.
     */
    public GetRobots(): Array<IRobot>
    {
        return this.robots;
    }

    /**
     * Return elements of the map (robots and cells).
     */
    public GetElements(): Array<IElement>
    {
        return (<IElement[]>this.cells).concat(<IElement[]>this.robots);
    }

    /**
     * Called when the map was updated.
     */
    public OnUpdate: () => void = Utils.Noop;
}