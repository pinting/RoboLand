import { Vector } from "./Geometry/Vector";
import { BaseActor } from "./Unit/Actor/BaseActor";
import { Tools } from "./Util/Tools";
import { BaseCell } from "./Unit/Cell/BaseCell";
import { Unit } from "./Unit/Unit";
import { UnitList, IReadOnlyUnitList } from "./UnitList";
import { Exportable, ExportType, IExportableArgs } from "./Exportable";
import { Event } from "./Util/Event";
import { PlayerActor } from "./Unit/Actor/PlayerActor";
import { Dump } from "./Dump";
import { NormalCell } from "./Unit/Cell/NormalCell";
import { Body } from "./Physics/Body";

export interface IWorldArgs extends IExportableArgs
{
    size?: Vector;
    basePlayer?: PlayerActor;
}

export class World extends Exportable
{
    public static RootDump = "world.json";
    public static Current: World = null;

    @Exportable.Register(ExportType.Net + ExportType.Disk)
    public ShadowMap: number[] = [];

    @Exportable.Register(ExportType.All)
    private basePlayer: PlayerActor = null;
    
    @Exportable.Register(ExportType.All)
    private cells: Array<BaseCell> = [];

    @Exportable.Register(ExportType.All)
    private actors: Array<BaseActor> = [];

    @Exportable.Register(ExportType.All)
    private size: Vector = new Vector();

    /**
     * Origin of the World.
     */
    public Origin: string = Tools.Unique();

    /**
     * Called when the world was updated.
     */
    public OnUpdate: Event<Unit> = new Event<Unit>();

    /**
     * Called on tick.
     */
    public OnTick: Event<number> = new Event<number>();

    public Init(args: IWorldArgs = {}): void
    {
        super.Init(args);
    }

    public InitPre(args: IWorldArgs = {}): void
    {
        super.InitPre(args);

        this.size = args.size;
        this.cells = [];
        this.actors = [];
        this.basePlayer = args.basePlayer;
    }

    public InitPost(args: IWorldArgs): void
    {
        super.InitPost(args);
    }

    public Set(unit: Unit)
    {
        if(unit instanceof BaseCell)
        {
            this.GetCells().Set(unit);
            
            (unit as any).world = this;
        }
        else if(unit instanceof BaseActor)
        {
            this.GetActors().Set(unit);

            (unit as any).world = this;
        }
        else
        {
            throw new Error("Bad object type for unit")
        }
    }

    public GetSize(): Vector
    {
        return this.size.Clone();
    }

    /**
     * Get all units of the world.
     */
    public GetUnits(): IReadOnlyUnitList<Unit>
    {
        const all = (<Unit[]>this.cells).concat(<Unit[]>this.actors);
        
        return new UnitList<Unit>(all, this.OnUpdate);
    }

    /**
     * Get the cells of the world.
     */
    public GetCells(): UnitList<BaseCell>
    {
        return new UnitList(this.cells, <Event<BaseCell>>this.OnUpdate);
    }

    /**
     * Get the actors of the world.
     */
    public GetActors(): UnitList<BaseActor>
    {
        return new UnitList(this.actors, <Event<BaseActor>>this.OnUpdate);
    }

    /**
     * @inheritDoc
     */
    public Import(input: Dump[]): void
    {
        World.Current = this;
        
        super.Import(input);
    }

    public GetBasePlayer(): PlayerActor
    {
        if(!this.basePlayer)
        {
            throw new Error("No player base is defined in this world!");
        }

        return this.basePlayer;
    }
    
    /**
     * Init world with size * size number of ground cells.
     * @param size 
     */
    public static CreateBox(size: number): World
    {
        const world = new World;

        world.Init({ size: new Vector(size, size) });

        for(let i = 0; i < size * size; i++)
        {
            const cell = new NormalCell();

            cell.Init({
                light: 1,
                world: world,
                body: Body.CreateBox(
                    new Vector(1, 1), 
                    0,
                    new Vector(i % size, (i - (i % size)) / size))
            });

            world.Set(cell);
        }

        return world;
    }
}