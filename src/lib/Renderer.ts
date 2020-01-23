import { World } from "./World";
import { Unit } from "./Unit/Unit";
import { Event } from "./Util/Event";
import { Vector } from "./Geometry/Vector";
import { Polygon } from "./Geometry/Polygon";
import { LivingActor } from "./Unit/Actor/LivingActor";
import { Body } from "./Physics/Body";

const TEST_BODY_SIZE = 1 / 3;
const DEBUG_COLOR = "purple";
const DYNAMIC_LIGHTING = true;
const DPI = 30;

export interface RendererArgs
{
    debug?: boolean;
    dynamicLightning?: boolean;
}

export class Renderer
{
    private readonly world: World;
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    private readonly debug: boolean;
    
    private textures: { [id: string]: HTMLImageElement } = {};
    private stop: boolean = false;
    private lastTick: number;
    private lightMap: number[] = [];

    /**
     * Called upon redraw.
     */
    public OnDraw: Event<number> = new Event();

    /**
     * Construct a new game object.
     */
    public constructor(world: World, canvas: HTMLCanvasElement, debug: boolean = false)
    {
        this.world = world;
        this.canvas = canvas;
        this.context = <CanvasRenderingContext2D>canvas.getContext("2d");
        this.debug = debug;
    }

    /**
     * Load textures for a loaded world.
     */
    public async Load(): Promise<void>
    {
        return new Promise<void>((resolve, reject) => 
        {
            const elements = this.world.GetUnits();
            let i = 0;
    
            elements.ForEach((unit: Unit) =>
            {
                if(!unit)
                {
                    i++;
                    return;
                }
    
                const path = unit.GetTexture();

                if(!path || this.textures[path] !== undefined)
                {
                    i++;
                    return;
                }

                const texture = new Image();
    
                texture.onerror = () => reject();
                texture.onload = () => 
                {
                    this.textures[path] = texture;
    
                    if(++i == elements.GetLength()) 
                    {
                        resolve();
                    }
                };
            
                texture.src = path;

                this.textures[path] = null;
            });

            if(!elements.GetLength())
            {
                resolve();
            }
        });
    }

    /**
     * Find a Vector under a pixel point.
     */
    public Find(x: number, y: number): Vector
    {
        return new Vector(x / DPI, y / DPI);
    }

    /**
     * Draw the given unit onto the canvas.
     * @param unit
     */
    private DrawElement(unit: Unit)
    {
        if(!unit || !unit.GetPosition() || !unit.GetSize())
        {
            return;
        }
        
        const vector = unit.GetPosition();
        const size = unit.GetSize();
        const texture = this.textures[unit.GetTexture()];
        
        const s = size.Scale(DPI);
        const cx = vector.X * DPI;
        const cy = vector.Y * DPI;
        const x = cx - s.X / 2;
        const y = cy - s.Y / 2;
        
        const rot = (angle: number) =>
        {
            this.context.translate(cx, cy);
            this.context.rotate(angle);
            this.context.translate(-cx, -cy);
        }

        rot(unit.GetAngle());
    
        if(texture) {
            this.context.drawImage(texture, x, y, s.X, s.Y);
        }
        else {
            this.context.fillStyle = DEBUG_COLOR;
            this.context.fillRect(x, y, s.X, s.Y);
        }

        rot(-unit.GetAngle());
        
        // Draw grid if debug mode is enabled
        if(this.debug)
        {
            this.DrawGrid(unit, DEBUG_COLOR);
        }
    }

    /**
     * Draw (debug) grid for an unit.
     * @param unit 
     * @param color 
     */
    private DrawGrid(unit: Unit, color: string)
    {
        const shapes = unit.GetBody().GetShapes();
        let first = null;

        this.context.beginPath();

        for(let shape of shapes)
        {
            if (shape instanceof Polygon)
            {
                for(let point of shape.GetVirtual())
                {
                    if(first)
                    {
                        this.context.lineTo(point.X * DPI, point.Y * DPI);
                    }
                    else
                    {
                        this.context.moveTo(point.X * DPI, point.Y * DPI);
                        first = point;
                    }
                }
            }
        }

        first && this.context.lineTo(first.X * DPI, first.Y * DPI);

        this.context.strokeStyle = color;
        this.context.stroke();
    }

    private ResetLight()
    {
        const size = this.world.GetSize();
        
        for(let i = 0; i < DPI * size.X * DPI * size.Y; i++)
        {
            this.lightMap[i] = 0;
        }
    }

    private LightCalculation(u: Unit)
    {
        if(!u.GetLight())
        {
            return;
        }
        
        const size = this.world.GetSize();
    
        const w = DPI * size.X;
        const h = DPI * size.Y;
        
        const testBody = new Body([Polygon.CreateBox(TEST_BODY_SIZE)]);

        for(let r = 0; r < 2 * Math.PI; r += 20 * (Math.PI / 180))
        {
            const origin = u.GetPosition();
            const step = Vector.ByRad(r).Scale(1 / 2);

            for(let point = origin; point.Dist(origin) < u.GetLight(); point = point.Add(step))
            {
                const startX = Math.floor(point.X * DPI);
                const startY = Math.floor(point.Y * DPI);
                
                if(startX >= w || startY >= h || startX < 0 || startY < 0)
                {
                    break;
                }
                
                testBody.SetVirtual(1, 0, point);

                let collision = false;

                for(const unit of this.world.GetCells().GetList())
                {
                    if(unit.IsBlocking() && testBody.Collide(unit.GetBody()))
                    {
                        collision = true;
                        break;
                    }
                }

                if(collision)
                {
                    break;
                }

                const fillSize = Math.max(Math.floor(point.Dist(origin) * DPI), DPI)

                for(let y = startY; y < startY + fillSize; ++y)
                {
                    for(let x = startX; x < startX + fillSize; ++x)
                    {
                        if(x >= w || y >= h || x < 0 || y < 0)
                        {
                            continue;
                        }

                        const p = new Vector(Math.floor(x / DPI), Math.floor(y / DPI));

                        this.lightMap[x + y * w] += 1 - (p.Dist(origin) / u.GetLight());
                    }
                }
            }
        }
    }
    
    /**
     * Update the canvas.
     */
    private Render()
    {
        const size = this.world.GetSize();
    
        const w = DPI * size.X;
        const h = DPI * size.Y;

        this.canvas.width = w;
        this.canvas.height = h;
        this.canvas.style.width = w + "px";
        this.canvas.style.height = h + "px";

        this.context.fillStyle = "black";
        this.context.fillRect(0, 0, w, h);
        
        if(DYNAMIC_LIGHTING)
        {
            this.ResetLight();
        }
        else if(!this.lightMap.length)
        {
            this.ResetLight();
            this.world.GetCells().ForEach(u => this.LightCalculation(u));
        }

        this.world
            .GetUnits()
            .GetList()
            .sort((a, b) => a.GetZ() - b.GetZ())
            .forEach(u =>
            {
                this.DrawElement(u);

                if(DYNAMIC_LIGHTING)
                {
                    this.LightCalculation(u);
                }
            });

        const imageData = this.context.getImageData(0, 0, w, h);
        
        for(let y = 0; y < h; y++)
        {
            for(let x = 0; x < w; x++)
            {
                imageData.data[(y * imageData.width + x) * 4 + 3] = Math.min(255, this.lightMap[x + y * w] * 255);
            }
        }
        
        this.context.putImageData(imageData, 0, 0);
    
        if(!this.stop)
        {
            window.requestAnimationFrame(() => this.Render());
        }

        const now = +new Date;

        this.world.OnTick.Call((now - this.lastTick) / 1000);
        this.OnDraw.Call((now - this.lastTick) / 1000);

        this.lastTick = now;
    }

    /**
     * Start rendering.
     */
    public Start()
    {
        this.lastTick = +new Date;
        this.stop = false;

        window.requestAnimationFrame(() => this.Render());
    }

    /**
     * Stop rendering.
     */
    public Stop()
    {
        this.stop = true;
    }
}