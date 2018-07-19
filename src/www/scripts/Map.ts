import { Coord } from "./Coord";
import { BaseActor } from "./Element/Actor/BaseActor";
import { Helper } from "./Util/Helper";
import { BaseCell } from "./Element/Cell/BaseCell";
import { BaseElement } from "./Element/BaseElement";
import { IRawMap } from "./IRawMap";
import { ElementList } from "./ElementList";
import { IReadOnlyElementList } from "./IReadOnlyElementList";
import { Exportable } from "./Exportable";
import { Event } from "./Util/Event";

export class Map
{
    private cells: Array<BaseCell> = [];
    private actors: Array<BaseActor> = [];
    private size: Coord = new Coord();

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
     * Init a map with null cells.
     */
    public Init(size: Coord): void
    {
        this.size = size.Clone();
        this.cells = [];
        this.actors = [];

        this.cells.forEach(cell => this.OnUpdate.Call(cell));
    }

    /**
     * Load a map from an external file.
     * @param url 
     */
    public async Load(url: string): Promise<boolean>
    {
        // Map file structure
        let raw: IRawMap;

        // Read map file
        try 
        {
            raw = JSON.parse(await Helper.Get(url)) || {};

            if(!raw.Size || !raw.Cells || !raw.Actors) 
            {
                return false;
            }
        }
        catch(e)
        {
            return false;
        }

        this.size = new Coord(raw.Size.X, raw.Size.Y);
        this.cells = [];
        this.actors = [];

        // Parse cells
        for(let i = 0; i < raw.Cells.length; i++)
        {
            const data = raw.Cells[i];

            const name = data.Class;
            const coord = new Coord(data.X, data.Y);
            const cell = <BaseCell>Exportable.FromName(name, coord, this);

            this.cells.push(cell);

            this.OnUpdate.Call(cell);
        }

        // Parse actors
        for(let i = 0; i < raw.Actors.length; i++) 
        {
            const data = raw.Actors[i];

            const name = data.Class;
            const coord = new Coord(data.X, data.Y);
            const actor = <BaseActor>Exportable.FromName(name, coord, this);

            this.actors.push(actor);

            this.OnUpdate.Call(actor);
        }

        return true;
    }

    /**
     * Return elements of the map (cells and actors).
     */
    public GetElements(): IReadOnlyElementList<BaseElement>
    {
        const all = (<BaseElement[]>this.cells).concat(<BaseElement[]>this.actors);
        
        return new ElementList<BaseElement>(all, this.OnUpdate);
    }

    /**
     * Get the cells of the map.
     */
    public GetCells(): ElementList<BaseCell>
    {
        return new ElementList(this.cells, <Event<BaseCell>>this.OnUpdate);
    }

    /**
     * Get the actors of the map.
     */
    public GetActors(): ElementList<BaseActor>
    {
        return new ElementList(this.actors, <Event<BaseActor>>this.OnUpdate);
    }

    /**
     * Called when the map was updated.
     */
    public OnUpdate: Event<BaseElement> = new Event<BaseElement>();
}