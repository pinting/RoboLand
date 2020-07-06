import { Vector } from "./Geometry/Vector";
import { Unit } from "./Unit/Unit";
import { Body } from "./Physics/Body";
import { Collision } from "./Physics/Collision";
import { Polygon } from "./Geometry/Polygon";
import { Logger } from "./Util/Logger";
import { World } from "./World";
import { Slave } from "./Slave";
import { Exportable } from "./Exportable";
import { Contact } from "./Geometry/Contact";

export class Master
{
    public static DisableShadows = false;
    public static DisablePhysics = false;

    public static NumberOfSlaves = 4;
    public static CollisionIterations = 10;
    public static ShadowDotPerPoint = 10;
    public static ShadowStep = 0.25;
    public static ShadowStepR = 2;

    private world: World;
    private slaves: Slave[] = [];

    constructor(world: World)
    {
        this.world = world;

        for(let i = 0; i < Master.NumberOfSlaves; i++)
        {
            this.slaves.push(new Slave(world));
        }

        // TODO: Run this.GenerateShadow(unit) on each new Unit
    }

    public async RunOnSlave<T>(args: any[], cb: (world: World, ...args: any[]) => T): Promise<T>
    {
        let minLoad = Infinity;
        let result: Slave;

        for(const slave of this.slaves)
        {
            if(slave.GetLoad() < minLoad)
            {
                result = slave;
            }
        }

        return result.SendEval<T>(args, cb);
    }

    public async Step(dt: number): Promise<void>
    {
        const units = this.world.GetUnits();
        const unitsArray = units.GetArray();
        const tasks = [];

        for(let i = 0; i < unitsArray.length; i++)
        {
            for(let j = i + 1; j < unitsArray.length; j++)
            {
                const a: Unit = unitsArray[i];
                const b: Unit = unitsArray[j];

                // Nothing will happen, so do not waste processor time on this
                if(a.GetBody().GetDensity() == Infinity && b.GetBody().GetDensity() == Infinity)
                {
                    continue;
                }

                const task = this.RunOnSlave([a.GetId(), b.GetId()], (world: World, ai: string, bi: string) =>
                {
                    // This needs to be set because otherwise the slave will fail
                    const Exportable = (self as any).Exportable;
                    
                    const a = world.GetUnits().Get(ai);
                    const b = world.GetUnits().Get(bi);
                    const collision = a.Collide(b);

                    if(!collision)
                    {
                        return null;
                    }
        
                    // Export the contact of the collision
                    // NOTE: We cannot export collisions, because that would
                    // export the underlying units too, we must use IDs
                    const contact = collision.GetContact();
                    const dump = Exportable.Export(contact);

                    return { Ai: ai, Bi: bi, Contact: dump };
                });

                tasks.push(task);
            }
        }

        // Wait for the tasks to complete
        const result = await Promise.all(tasks);

        // Convert unit IDs and contact dump into collisions
        const collisions = result.filter(e => e).map(e => 
        {
            const c = Exportable.Import(e.Contact) as Contact;
            const a = units.Get(e.Ai);
            const b = units.Get(e.Bi);

            return new Collision(c.Penetration, c.Normal, c.Points, a.GetBody(), b.GetBody());
        });

        // Integrate forces
        units.GetArray().forEach(unit => unit.GetBody().IntegrateForces(dt));
        
        // Solve collisions
        for(let c of collisions)
        {
            Body.ResolveCollision(c, dt * Master.CollisionIterations);
        }

        // Integrate velocities
        units.GetArray().forEach(unit => unit.GetBody().IntegrateVelocity(dt));

        // Correct positions
        for(let c of collisions)
        {
            Body.PositionalCorrection(c, dt);
        }
        
        // Clear all forces
        units.GetArray().forEach(unit => unit.GetBody().ClearForces());
    }

    /**
     * Generate shadow map for the whole world.
     */
    public GenerateShadowMap()
    {
        const dpp = Master.ShadowDotPerPoint;
        const size = this.world.GetSize();
    
        const w = dpp * size.X;
        const h = dpp * size.Y;

        this.world.ShadowMap = new Array(w * h).fill(1);

        Logger.Info(this, "Generating shadow map");

        this.world.GetCells().GetArray().forEach(unit => this.GenerateShadow(unit));

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
        
        const dpp = Master.ShadowDotPerPoint;
        const size = this.world.GetSize();
    
        const w = dpp * size.X;
        const h = dpp * size.Y;
        
        const testBody = new Body();

        testBody.Init({ shapes: [Polygon.CreateBox(Master.ShadowStep)] });

        for(let r = 0; r < 2 * Math.PI; r += Master.ShadowStepR * (Math.PI / 180))
        {
            const origin = unit.GetBody().GetPosition();
            const step = Vector.ByRad(r).Scale(Master.ShadowStep);

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

                for(const u of this.world.GetCells().GetArray())
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
                            const previous = this.world.ShadowMap[x + y * w];
            
                            // Final value is the most bright (most min) value
                            this.world.ShadowMap[x + y * w] = Math.min(s, previous);
                        }
                    }
                }
            }
        }
    }

    public FindShadow(x: number, y: number, w: number, h: number): number
    {
        if(!this.world.ShadowMap)
        {
            return 0;
        }

        const dpp = Master.ShadowDotPerPoint;
        const size = this.world.GetSize();
    
        const sw = dpp * size.X;
        const sh = dpp * size.Y;

        return this.world.ShadowMap[Math.floor((x / w) * sw) + Math.floor((y / h) * sh) * sw];
    }
}