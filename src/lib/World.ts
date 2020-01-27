import { Vector } from "./Geometry/Vector";
import { BaseActor } from "./Unit/Actor/BaseActor";
import { Tools } from "./Util/Tools";
import { BaseCell } from "./Unit/Cell/BaseCell";
import { Unit } from "./Unit/Unit";
import { UnitList } from "./UnitList";
import { IReadOnlyElementList } from "./IReadOnlyElementList";
import { Exportable, ExportType } from "./Exportable";
import { Event } from "./Util/Event";
import { IDump } from "./IDump";
import { Body } from "./Physics/Body";
import { ICollision } from "./Physics/ICollision";
import { GroundCell } from "./Unit/Cell/GroundCell";
import { StoneCell } from "./Unit/Cell/StoneCell";

const COLLISION_ITERATIONS = 50;

export class World extends Exportable
{
    public static Current: World = null;
    
    @Exportable.Register(ExportType.Visible)
    private cells: Array<BaseCell> = [];

    @Exportable.Register(ExportType.Visible)
    private actors: Array<BaseActor> = [];

    @Exportable.Register(ExportType.Visible)
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

    /**
     * Init a world with null cells.
     * @param size
     */
    public Init(size: Vector): void
    {
        this.size = size.Clone();
        this.cells = [];
        this.actors = [];

        this.OnTick.Add(dt => this.Step(dt));
    }

    public Add(unit: Unit)
    {
        if(unit instanceof BaseCell)
        {
            this.cells.push(unit);
        }
        else if(unit instanceof BaseActor)
        {
            this.actors.push(unit);
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
                const collision = a.IsBlocking() && b.IsBlocking() && a.Collide(b);

                if(collision && collision.Points.length)
                {
                    contacts.push(collision);
                }
            }
        }

        // Integrate forces
        units.Some(unit => unit.GetBody().IntegrateForces(dt));
        
        // Solve collisions
        for(let i = 0; i < COLLISION_ITERATIONS; i++)
        {
            for(let contact of contacts)
            {
                Body.ResolveCollision(contact, dt);
            }
        }

        // Integrate velocities
        units.Some(unit => unit.GetBody().IntegrateVelocity(dt));

        // Correct positions
        for(let contact of contacts)
        {
            Body.PositionalCorrection(contact, dt);
        }
        
        // Clear all forces
        units.Some(unit => unit.GetBody().ClearForces());
    }

    public GetSize(): Vector
    {
        return this.size.Clone();
    }

    /**
     * Get all elements of the world.
     */
    public GetUnits(): IReadOnlyElementList<Unit>
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
    public Import(input: IDump[])
    {
        World.Current = this;

        return super.Import(input);
    }
    
    public static CreateBox(size: number, texture: string = null): World
    {
        const world = new World;

        world.Init(new Vector(size, size));

        // Init world with size x size number of GroundCells
        for(let i = 0; i < size * size; i++)
        {
            let args = {};
            let cell: BaseCell;
            
            // TODO: Remove this, refactor this
            if(i == 0)
            {
                cell = new StoneCell();
                args = {
                    texture: "res/stone.png"
                };
            }
            else
            { 
                cell = new GroundCell();
                args = {
                    texture: "res/ground.png"
                };
            }

            cell.Init({
                ...args,
                world: world,
                body: Body.CreateBoxBody(
                    new Vector(1, 1), 
                    0,
                    new Vector(i % size, (i -  (i % size)) / size),
                    { z: 0 })
            });

            world.Add(cell);
        }

        return world;
    }
}

Exportable.Dependency(World);