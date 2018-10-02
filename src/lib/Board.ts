import { Coord } from "./Coord";
import { BaseActor } from "./Element/Actor/BaseActor";
import { Tools } from "./Util/Tools";
import { BaseCell } from "./Element/Cell/BaseCell";
import { BaseElement } from "./Element/BaseElement";
import { ElementList } from "./ElementList";
import { IReadOnlyElementList } from "./IReadOnlyElementList";
import { Exportable } from "./Exportable";
import { Event } from "./Util/Event";
import { IExportObject } from "./IExportObject";

export class Board extends Exportable
{
    public static Current: Board = null;
    
    private cells: Array<BaseCell> = [];
    private actors: Array<BaseActor> = [];
    private size: Coord = new Coord();

    /**
     * Origin of the Board.
     */
    public Origin: string = Tools.Unique();

    /**
     * Called when the board was updated.
     */
    public OnUpdate: Event<BaseElement> = new Event<BaseElement>();

    /**
     * Called on tick.
     */
    public OnTick: Event<void> = new Event<void>();

    /**
     * Init a board with null cells.
     * @param size
     */
    public Init(size: Coord): void
    {
        this.size = size.Clone();
        this.cells = [];
        this.actors = [];
    }

    /**
     * Get the size of the board.
     */
    public get Size(): Coord
    {
        return this.size.Clone();
    }

    /**
     * Get all elements of the board.
     */
    public get Elements(): IReadOnlyElementList<BaseElement>
    {
        const all = (<BaseElement[]>this.cells).concat(<BaseElement[]>this.actors);
        
        return new ElementList<BaseElement>(all, this.OnUpdate);
    }

    /**
     * Get the cells of the board.
     */
    public get Cells(): ElementList<BaseCell>
    {
        return new ElementList(this.cells, <Event<BaseCell>>this.OnUpdate);
    }

    /**
     * Get the actors of the board.
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
        Board.Current = this;

        return super.ImportAll(input);
    }

    /**
     * Register the cell as a dependency.
     */
    public static Register()
    {
        Exportable.Register("Board", Board);
    }
}