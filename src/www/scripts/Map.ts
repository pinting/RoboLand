import { ICell } from "./Element/Cell/ICell";
import { GroundCell } from "./Element/Cell/GroundCell";
import { Coord } from "./Coord";
import { IActor } from "./Element/Actor/IActor";
import { IElement } from "./Element/IElement";
import { Utils } from "./Utils";
import { CellFactory } from "./Element/Cell/CellFactory";
import { CellType } from "./Element/Cell/CellType";
import { BasicActor } from "./Element/Actor/BasicActor";

export class Map
{
    private readonly actorCount: number = 2;

    private actors: Array<IActor>;
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
        this.actors = [];
        this.cells = [];

        for(var i = 0; i < size * size; i++)
        {
            let x = i % size;
            let y = Math.floor(i / size);

            this.cells[i] = new GroundCell(new Coord(x, y));
        }

        this.actors.push(new BasicActor(new Coord(Utils.Random(0, size - 1), 0)));
        this.actors.push(new BasicActor(new Coord(Utils.Random(0, size - 1), size - 1)));

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
        this.actors = [];
        this.size = raw.shift(); // First element is the size

        var actorSpots = new Array<Coord>();
        var actorCount = 0;

        for(let i = 0; i < raw.length; i++)
        {
            let x = i % this.size;
            let y = Math.floor(i / this.size);

            let type: CellType = raw[i];

            // Create cell based on the CellType
            this.cells[i] = CellFactory.FromType(type, new Coord(x, y));

            // If the cell is ground and there is 0 or 1 actor, try to add one
            if(actorCount < this.actorCount && type == CellType.Ground)
            {
                // Give the cell 5% chance
                if(Utils.Random(0, 20) == 1)
                {
                    // Add a new actor and increment actor count
                    this.actors.push(new BasicActor(new Coord(x, y)));
                    actorCount++;
                }
                else
                {
                    // If the cell lost, save it for later
                    actorSpots.push(new Coord(x, y))
                }
            }
        }

        // If the map is loaded, but too few actors were added, add new ones
        // based on the [save if for later] spots
        for(; actorSpots.length > 0 && actorCount < this.actorCount; actorCount++)
        {
            let coord = actorSpots.splice(Utils.Random(0, actorSpots.length - 1), 1)[0];
            let actor = new BasicActor(coord);

            this.actors.push(actor);
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
     * Get a actor by coord.
     * @param coord 
     */
    public GetActor(coord: Coord): IActor
    {
        return <IActor>this.GetElement(this.actors, coord);
    }

    /**
     * Remove a actor from the list.
     * @param actor 
     */
    public RemoveActor(actor: IActor)
    {
        var index = this.actors.indexOf(actor);

        if(index >= 0)
        {
            this.actors.splice(index, 1);
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
     * Get the actors of the map.
     */
    public GetActors(): Array<IActor>
    {
        return this.actors;
    }

    /**
     * Return elements of the map (actors and cells).
     */
    public GetElements(): Array<IElement>
    {
        return (<IElement[]>this.cells).concat(<IElement[]>this.actors);
    }

    /**
     * Called when the map was updated.
     */
    public OnUpdate: () => void = Utils.Noop;
}