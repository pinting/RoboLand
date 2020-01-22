import { Vector } from "./Geometry/Vector";
import { BaseActor } from "./Unit/Actor/BaseActor";
import { Tools } from "./Util/Tools";
import { BaseCell } from "./Unit/Cell/BaseCell";
import { Unit } from "./Unit/Unit";
import { ElementList } from "./ElementList";
import { IReadOnlyElementList } from "./IReadOnlyElementList";
import { Exportable, ExportType } from "./Exportable";
import { Event } from "./Util/Event";
import { IDump } from "./IDump";
import { Body } from "./Physics/Body";
import { ICollision } from "./Physics/ICollision";

const COLLISION_ITERATIONS = 10;

export class World extends Exportable
{
    public static Current: World = null;

    private gravity = new Vector(0, 10.0);
    
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

        this.OnTick.Add(dt =>
        {
            const contacts: ICollision[] = [];

            for(let i = 0; i < this.actors.length; i++)
            {
                const a = this.actors[i].GetBody();

                for(let j = i + 1; j < this.actors.length; j++)
                {
                    const b = this.actors[j].GetBody();
                    const p = a.Collide(b);

                    if(p && p.Points.length)
                    {
                        contacts.push(p);
                    }
                }
            }

            // Integrate forces
            for(let unit of this.actors)
            {
                unit.GetBody().IntegrateForces(dt);
            }
            
            // Solve collisions
            for(let i = 0; i < COLLISION_ITERATIONS; i++)
            {
                for(let contact of contacts)
                {
                    Body.ResolveCollision(contact, dt);
                }
            }

            // Integrate velocities
            for(let unit of this.actors)
            {
                unit.GetBody().IntegrateVelocity(dt);
            }

            // Correct positions
            for(let contact of contacts)
            {
                Body.PositionalCorrection(contact, dt);
            }
            
            // Clear all forces
            for(let unit of this.actors)
            {
                unit.GetBody().ClearForces();
            }
        });
    }

    /**
     * Get the size of the world.
     */
    public GetSize(): Vector
    {
        return this.size.Clone();
    }

    /**
     * Get all elements of the world.
     */
    public GetElements(): IReadOnlyElementList<Unit>
    {
        const all = (<Unit[]>this.cells).concat(<Unit[]>this.actors);
        
        return new ElementList<Unit>(all, this.OnUpdate);
    }

    /**
     * Get the cells of the world.
     */
    public GetCells(): ElementList<BaseCell>
    {
        return new ElementList(this.cells, <Event<BaseCell>>this.OnUpdate);
    }

    /**
     * Get the actors of the world.
     */
    public GetActors(): ElementList<BaseActor>
    {
        return new ElementList(this.actors, <Event<BaseActor>>this.OnUpdate);
    }

    /**
     * @inheritDoc
     */
    public Import(input: IDump[])
    {
        World.Current = this;

        return super.Import(input);
    }

    public GetGravity(): Vector
    {
        return this.gravity;
    }
}

Exportable.Dependency(World);