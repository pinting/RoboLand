import { Vector } from "./Physics/Vector";
import { BaseActor } from "./Element/Actor/BaseActor";
import { Utils } from "./Tools/Utils";
import { BaseCell } from "./Element/Cell/BaseCell";
import { BaseElement } from "./Element/BaseElement";
import { ElementList } from "./ElementList";
import { IReadOnlyElementList } from "./IReadOnlyElementList";
import { Exportable, ExportType } from "./Exportable";
import { Event } from "./Tools/Event";
import { IExportObject } from "./IExportObject";

export class Board extends Exportable
{
    public static Current: Board = null;
    
    @Exportable.Register(ExportType.User)
    private cells: Array<BaseCell> = [];

    @Exportable.Register(ExportType.User)
    private actors: Array<BaseActor> = [];

    @Exportable.Register(ExportType.User)
    private size: Vector = new Vector();

    /**
     * Origin of the Board.
     */
    public Origin: string = Utils.Unique();

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
    public Init(size: Vector): void
    {
        this.size = size.Clone();
        this.cells = [];
        this.actors = [];
    }

    /**
     * Get the size of the board.
     */
    public GetSize(): Vector
    {
        return this.size.Clone();
    }

    /**
     * Get all elements of the board.
     */
    public GetElements(): IReadOnlyElementList<BaseElement>
    {
        const all = (<BaseElement[]>this.cells).concat(<BaseElement[]>this.actors);
        
        return new ElementList<BaseElement>(all, this.OnUpdate);
    }

    /**
     * Get the cells of the board.
     */
    public GetCells(): ElementList<BaseCell>
    {
        return new ElementList(this.cells, <Event<BaseCell>>this.OnUpdate);
    }

    /**
     * Get the actors of the board.
     */
    public GetActors(): ElementList<BaseActor>
    {
        return new ElementList(this.actors, <Event<BaseActor>>this.OnUpdate);
    }

    /**
     * @inheritDoc
     */
    public Import(input: IExportObject[])
    {
        Board.Current = this;

        return super.Import(input);
    }
}

Exportable.Dependency(Board);