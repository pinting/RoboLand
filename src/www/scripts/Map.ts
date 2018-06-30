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
    private cells: Array<ICell>;
    private actors: Array<IActor>;
    private tagged: { [id: string]: IActor };

    private size: Coord;

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
     * Get the size of the map.
     */
    public GetSize(): Coord
    {
        return this.size;
    }

    /**
     * Construct a simple new map. 
     * @param size Size of the map.
     */
    public Init(size: number)
    {
        this.size = new Coord(size, size);
        this.actors = [];
        this.cells = [];

        for(let i = 0; i < size * size; i++)
        {
            let x = i % size;
            let y = Math.floor(i / size);

            this.cells[i] = new GroundCell(new Coord(x, y));
        }

        this.actors.push(new PlayerActor(new Coord(Math.floor(size / 2), 0)));
        this.actors.push(new PlayerActor(new Coord(Math.floor(size / 2), size - 1)));

        this.OnUpdate();
    }

    /**
     * Load a map from an external file.
     * @param url 
     */
    public async Load(url: string): Promise<boolean>
    {
        let raw: IRawMap;

        try 
        {
            raw = JSON.parse(await Utils.Get(url)) || {};

            if(!raw.Cells || !raw.Size || raw.Cells.length != raw.Size.X * raw.Size.Y) 
            {
                return false;
            }
        }
        catch(e)
        {
            return false;
        }

        this.cells = [];
        this.actors = [];
        this.tagged = {};
        this.size = new Coord(raw.Size.X, raw.Size.Y);

        for(let i = 0; i < raw.Cells.length; i++)
        {
            let x = i % this.size.X;
            let y = Math.floor(i / this.size.X);

            let type: ElementType = raw.Cells[i];

            this.cells[i] = <ICell>ElementFactory.FromType(type, new Coord(x, y));
        }

        for(let i = 0; i < raw.Actors.length; i++) 
        {
            const data = raw.Actors[i];

            const tag = data.Tag;
            const type = data.Type;
            const coord = new Coord(data.X, data.Y);

            const actor = <IActor>ElementFactory.FromType(type, coord);

            this.tagged[tag] = actor;
            this.actors.push(actor);
        }

        this.OnUpdate();

        return true;
    }

    /**
     * Return elements of the map (robots and cells).
     */
    public GetElements(): Array<IElement>
    {
        return (<IElement[]>this.cells).concat(<IElement[]>this.actors);
    }

    /**
     * Get the cells of the map.
     */
    public GetCells(): Array<ICell>
    {
        return this.cells;
    }

    /**
     * Get a cell by coord.
     * @param coord 
     */
    public GetCell(coord: Coord): ICell
    {
        const i = coord.X + coord.Y * this.size.X;

        if(i < 0 || i >= this.cells.length)
        {
            return null;
        }

        return this.cells[i];
    }

    /**
     * Get the nearest cell to the given coord.
     * @param coord 
     */
    public GetCellNear(coord: Coord): ICell
    {
        let result: ICell = null;
        let min = Infinity;

        this.cells.forEach(e => 
        {
            const size = e.GetSize();
            const center = e.GetPos().Add(size.F(n => n / 2));
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
     * Get cells between two coordinates.
     * @param from
     * @param to 
     */
    public GetCellBetween(from: Coord, to: Coord): ICell[]
    {
        const result = [];

        from = from.Floor();
        to = to.Ceil();

        for(let y = from.Y; y < to.Y; y++)
        {
            for(let x = from.X; x < to.X; x++)
            {
                result.push(this.GetCell(new Coord(x, y)));
            }
        }

        return result;
    }

    /**
     * Get the actors of the map.
     */
    public GetActors(): Array<IActor>
    {
        return this.actors;
    }

    /**
     * Get a actor by coord or tag.
     * @param id 
     */
    public GetActor(id: Coord | string): IActor
    {
        if(id instanceof Coord) {
            return this.actors.find(e => e.GetPos().Is(<Coord>id));
        }

        return this.tagged[id];
    }

    /**
     * Remove a actor from the list.
     * @param actor 
     */
    public RemoveActor(actor: IActor)
    {
        const index = this.actors.indexOf(actor);

        if(index >= 0)
        {
            this.actors.splice(index, 1);

            Object.keys(this.tagged).some(key => 
            {
                if(this.tagged[key] == actor)
                {
                    delete this.tagged[key];
                    return true;
                }
            });
        }
    }

    /**
     * Called when the map was updated.
     */
    public OnUpdate: () => void = Utils.Noop;
}