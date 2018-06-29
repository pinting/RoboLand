import { ICell } from "./Element/Cell/ICell";
import { GroundCell } from "./Element/Cell/GroundCell";
import { Coord } from "./Coord";
import { IActor } from "./Element/Actor/IActor";
import { IElement } from "./Element/IElement";
import { Utils } from "./Utils";
import { ElementFactory } from "./Element/ElementFactory";
import { ElementType } from "./Element/ElementType";
import { PlayerActor } from "./Element/Actor/PlayerActor";
import { IRawMap } from "./IRawMap";

export class Map
{
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

        for(let i = 0; i < size * size; i++)
        {
            let x = i % size;
            let y = Math.floor(i / size);

            this.cells[i] = new GroundCell(new Coord(x, y));
        }

        this.actors.push(new PlayerActor(new Coord(Utils.Random(0, size - 1), 0)));
        this.actors.push(new PlayerActor(new Coord(Utils.Random(0, size - 1), size - 1)));

        this.OnUpdate();
    }

    /**
     * Load a map from an external file. The JSON needs to contain an array of numbers.
     * The first number will determinate the size of the map, while the others will
     * tell the interpreter type of the cell based on the ElementType enum.
     * @param url 
     */
    public async Load(url: string): Promise<void>
    {
        let raw: IRawMap;

        try
        {
            raw = JSON.parse(await Utils.Get(url));

            // Check if it is a valid map array
            if(raw == null || raw.Size < 2 || raw.Cells.length != Math.pow(raw.Size, 2))
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
        this.size = raw.Size;

        for(let i = 0; i < raw.Cells.length; i++)
        {
            let x = i % this.size;
            let y = Math.floor(i / this.size);

            let type: ElementType = raw.Cells[i];

            this.cells[i] = <ICell>ElementFactory.FromType(type, new Coord(x, y));
        }

        for(let i = 0; i < raw.Actors.length; i++) 
        {
            const data = raw.Actors[i];

            const type = data.T;
            const coord = new Coord(data.X, data.Y);

            this.actors.push(<IActor>ElementFactory.FromType(type, coord));
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
        let result: IElement = null;

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
     * Get the nearest cell to the given coord.
     * @param coord 
     */
    public GetCellNear(coord: Coord): ICell
    {
        if(coord.X < 0 || coord.Y < 0 || coord.X >= this.size || coord.Y >= this.size) 
        {
            return null;
        }

        let result: ICell = null;
        let min = Infinity;

        this.cells.forEach(e => 
        {
            const center = e.GetPosition().Clone();

            center.X = center.X + 0.5;
            center.Y = center.Y + 0.5;

            const distance = center.GetDistance(coord);

            if(distance < min) 
            {
                min = distance;
                result = e;
            }
        });

        return result;
    }

    /**
     * Get cells around coord.
     * @param coord 
     */
    public GetCellAround(coord: Coord): ICell[]
    {
        const result = [];
        const center = coord.Floor();

        for(let x = -1; x <= 1; x++) 
        {
            for(let y = -1; y <= 1; y++) 
            {
                const cell = this.GetCell(center.Add(new Coord(x, y)));

                if(cell) 
                {
                    result.push(cell);
                }
            }
        }

        return result;
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
        let index = this.actors.indexOf(actor);

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