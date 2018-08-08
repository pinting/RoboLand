import { Coord } from "./Coord";
import { BaseActor } from "./Element/Actor/BaseActor";
import { Helper } from "./Util/Helper";
import { BaseCell } from "./Element/Cell/BaseCell";
import { BaseElement } from "./Element/BaseElement";
import { ElementList } from "./ElementList";
import { IReadOnlyElementList } from "./IReadOnlyElementList";
import { Exportable } from "./Exportable";
import { Event } from "./Util/Event";
import { IExportObject } from "./IExportObject";

export class Map extends Exportable
{
    public static Current: Map = null;
    
    private cells: Array<BaseCell> = [];
    private actors: Array<BaseActor> = [];
    private size: Coord = new Coord();

    /**
     * Parent of the Map.
     */
    public Parent: string = Helper.Unique();

    /**
     * Called when the map was updated.
     */
    public OnUpdate: Event<BaseElement> = new Event<BaseElement>();

    /**
     * Called on tick.
     */
    public OnTick: Event<void> = new Event<void>();

    /**
     * Init a map with null cells.
     * @param size
     */
    public Init(size: Coord): void
    {
        this.size = size.Clone();
        this.cells = [];
        this.actors = [];
    }

    /**
     * Get the size of the map.
     */
    public get Size(): Coord
    {
        return this.size.Clone();
    }

    /**
     * Get all elements of the map.
     */
    public get Elements(): IReadOnlyElementList<BaseElement>
    {
        const all = (<BaseElement[]>this.cells).concat(<BaseElement[]>this.actors);
        
        return new ElementList<BaseElement>(all, this.OnUpdate);
    }

    /**
     * Get the cells of the map.
     */
    public get Cells(): ElementList<BaseCell>
    {
        return new ElementList(this.cells, <Event<BaseCell>>this.OnUpdate);
    }

    /**
     * Get the actors of the map.
     */
    public get Actors(): ElementList<BaseActor>
    {
        return new ElementList(this.actors, <Event<BaseActor>>this.OnUpdate);
    }

    /**
     * @inheritDoc
     */
    public ImportAll(input: IExportObject[])
    {
        Map.Current = this;

        return super.ImportAll(input);
    }
}