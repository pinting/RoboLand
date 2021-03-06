import { Vector } from "./Geometry/Vector";
import { BaseActor } from "./Unit/Actor/BaseActor";
import { Tools } from "./Util/Tools";
import { BaseCell } from "./Unit/Cell/BaseCell";
import { Unit } from "./Unit/Unit";
import { UnitList, IReadOnlyUnitList } from "./UnitList";
import { Exportable, ExportType, IExportableArgs } from "./Exportable";
import { Event } from "./Util/Event";
import { Body } from "./Physics/Body";
import { ICollision } from "./Physics/ICollision";
import { NormalCell } from "./Unit/Cell/NormalCell";
import { Polygon } from "./Geometry/Polygon";
import { PlayerActor } from "./Unit/Actor/PlayerActor";
import { Dump } from "./Dump";
import { Logger } from "./Util/Logger";

export interface IWorldArgs extends IExportableArgs
{
    size?: Vector;
    basePlayer?: PlayerActor;
}

export class World extends Exportable
{
    public static RootDump = "world.json";

    private static DisablePhysics = false;
    private static CollisionIterations = 10;
    private static ShadowDotPerPoint = 10;
    private static ShadowStep = 0.25;
    private static ShadowStepR = 2;

    public static Current: World = null;

    @Exportable.Register(ExportType.NetDisk)
    private basePlayer: PlayerActor = null;
    
    @Exportable.Register(ExportType.NetDisk)
    private cells: Array<BaseCell> = [];

    @Exportable.Register(ExportType.NetDisk)
    private actors: Array<BaseActor> = [];

    @Exportable.Register(ExportType.NetDisk)
    private size: Vector = new Vector();
    
    @Exportable.Register(ExportType.Net)
    private shadowMap: number[];

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

        // Use generated shadow map if available
        if(!this.shadowMap)
        {
            // Or generate a new static shadow map
            this.GenerateShadowMap();
        }

        if(!World.DisablePhysics)
        {
            this.OnTick.Add(dt => this.Step(dt));
        }
    }

    public Add(unit: Unit)
    {
        if(unit instanceof BaseCell)
        {
            this.GetCells().Set(unit);
            
            (unit as any).world = this;

            // Trace each unit when it is added
            this.GenerateShadow(unit);
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

    public Step(dt: number)
    {
        const contacts: ICollision[] = [];
        const units = this.GetUnits();

        // Look for collisions
        for(let i = 0; i < units.GetLength(); i++)
        {
            const a: Unit = units.GetArray()[i];

            for(let j = i + 1; j < units.GetLength(); j++)
            {
                const b: Unit = units.GetArray()[j];
                const aBody = a.GetBody();
                const bBody = b.GetBody();

                if(aBody.GetDensity() == Infinity && bBody.GetDensity() == Infinity)
                {
                    continue;
                }

                const collision = a.Collide(b);

                if(collision && collision.Points.length)
                {
                    contacts.push(collision);
                }
            }
        }

        // Integrate forces
        units.GetArray().forEach(unit => unit.GetBody().IntegrateForces(dt));
        
        // Solve collisions
        for(let contact of contacts)
        {
            Body.ResolveCollision(contact, dt * World.CollisionIterations);
        }

        // Integrate velocities
        units.GetArray().forEach(unit => unit.GetBody().IntegrateVelocity(dt));

        // Correct positions
        for(let contact of contacts)
        {
            Body.PositionalCorrection(contact, dt);
        }
        
        // Clear all forces
        units.GetArray().forEach(unit => unit.GetBody().ClearForces());
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

    /**
     * Generate shadow map for the whole world.
     */
    public GenerateShadowMap()
    {
        const dpp = World.ShadowDotPerPoint;
        const size = this.GetSize();
    
        const w = dpp * size.X;
        const h = dpp * size.Y;

        this.shadowMap = new Array(w * h).fill(1);

        Logger.Info(this, "Generating shadow map");

        this.GetCells().GetArray().forEach(unit => this.GenerateShadow(unit));

        Logger.Info(this, "Shadow map complete");
    }

    /**
     * Generate shadow for a unit by tracing light.
     * @param unit Unit to trace from.
     * @param stepD Step size to go in the direction of the unit.
     * @param stepR Step size to go around the unit.
     * @param set Shadow value for a position.
     */
    private GenerateShadow(unit: Unit)
    {
        if(!unit.GetLight())
        {
            return;
        }
        
        const dpp = World.ShadowDotPerPoint;
        const size = this.GetSize();
    
        const w = dpp * size.X;
        const h = dpp * size.Y;
        
        const testBody = new Body();

        testBody.Init({ shapes: [Polygon.CreateBox(World.ShadowStep)] });

        for(let r = 0; r < 2 * Math.PI; r += World.ShadowStepR * (Math.PI / 180))
        {
            const origin = unit.GetBody().GetPosition();
            const step = Vector.ByRad(r).Scale(World.ShadowStep);

            for(let point = origin; point.Dist(origin) < unit.GetLight(); point = point.Add(step))
            {
                const cx = Math.floor(point.X * dpp);
                const cy = Math.floor(point.Y * dpp);
                
                if(cx >= w || cy >= h || cx < 0 || cy < 0)
                {
                    break;
                }
                
                testBody.SetVirtual(new Vector(1, 1), 0, point);

                let collision = false;

                for(const u of this.GetCells().GetArray())
                {
                    if(u.GetId() == unit.GetId())
                    {
                        continue;
                    }

                    // If the light ray hits a blocking cell, break the loop
                    if(u.IsBlocking() && testBody.Collide(u.GetBody()))
                    {
                        collision = true;
                        break;
                    }
                }

                if(collision)
                {
                    break;
                }

                for(let y = cy - dpp / 2; y < cy + dpp / 2; ++y)
                {
                    for(let x = cx - dpp / 2; x < cx + dpp / 2; ++x)
                    {
                        if(x >= w || y >= h || x < 0 || y < 0)
                        { 
                            continue;
                        }

                        const p = new Vector(x / dpp, y / dpp);
                        const s = p.Dist(origin) / unit.GetLight();

                        if(s >= 0 && s <= 1)
                        {
                            const previous = this.shadowMap[x + y * w];
            
                            // Final value is the most bright (most min) value
                            this.shadowMap[x + y * w] = Math.min(s, previous);
                        }
                    }
                }
            }
        }
    }

    public FindShadow(x: number, y: number, w: number, h: number): number
    {
        if(!this.shadowMap)
        {
            return 0;
        }

        const dpp = World.ShadowDotPerPoint;
        const size = this.GetSize();
    
        const sw = dpp * size.X;
        const sh = dpp * size.Y;

        return this.shadowMap[Math.floor((x / w) * sw) + Math.floor((y / h) * sh) * sw];
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

            world.Add(cell);
        }

        return world;
    }
}

Exportable.Dependency(World);