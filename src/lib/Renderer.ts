import { World } from "./World";
import { Unit } from "./Unit/Unit";
import { Event } from "./Util/Event";
import { Vector } from "./Geometry/Vector";
import { Polygon } from "./Geometry/Polygon";
import { Body } from "./Physics/Body";

export interface RendererArgs
{
    world: World;
    canvas: HTMLCanvasElement;

    dotPerPoint?: number;
    debug?: boolean;
    debugColor?: string;
    disableShadows?: boolean;
    shadowStep?: number;
    shadowStepR?: number;
}

export class Renderer
{
    private readonly world: World;
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;

    private readonly dotPerPoint: number;
    private readonly debug: boolean;
    private readonly debugColor: string;
    private readonly disableShadows: boolean;
    private readonly shadowStep: number;
    private readonly shadowStepR: number;

    private textures: { [id: string]: HTMLImageElement } = {};
    private stop: boolean = false;
    private lastTick: number;
    private shadowMap: number[];

    /**
     * Called upon redraw.
     */
    public OnDraw: Event<number> = new Event();

    /**
     * Construct a new game object.
     */
    public constructor(args: RendererArgs)
    {
        this.world = args.world;
        this.canvas = args.canvas;
        this.context = <CanvasRenderingContext2D>this.canvas.getContext("2d");

        this.dotPerPoint = args.dotPerPoint || 30;
        this.debug = args.debug || false;
        this.debugColor = args.debugColor || "purple";
        this.disableShadows = args.disableShadows || false;
        this.shadowStep = args.shadowStep || 1 / 3;
        this.shadowStepR = args.shadowStepR || 2;
    }

    /**
     * Load textures for the world.
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
        return new Vector(x / this.dotPerPoint, y / this.dotPerPoint);
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
        
        const s = size.Scale(this.dotPerPoint);
        const cx = vector.X * this.dotPerPoint;
        const cy = vector.Y * this.dotPerPoint;
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
            this.context.fillStyle = this.debugColor;
            this.context.fillRect(x, y, s.X, s.Y);
        }

        rot(-unit.GetAngle());
        
        // Draw grid if debug mode is enabled
        if(this.debug)
        {
            this.DrawGrid(unit, this.debugColor);
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
                        this.context.lineTo(point.X * this.dotPerPoint, point.Y * this.dotPerPoint);
                    }
                    else
                    {
                        this.context.moveTo(point.X * this.dotPerPoint, point.Y * this.dotPerPoint);
                        first = point;
                    }
                }
            }
        }

        first && this.context.lineTo(first.X * this.dotPerPoint, first.Y * this.dotPerPoint);

        this.context.strokeStyle = color;
        this.context.stroke();
    }

    private GenerateShadows(unit: Unit, stepD: number, stepR: number, set: (s: number, x: number, y: number) => void)
    {
        if(!unit.GetLight())
        {
            return;
        }
        
        const dpp = this.dotPerPoint;
        const size = this.world.GetSize();
    
        const w = dpp * size.X;
        const h = dpp * size.Y;
        
        const testBody = new Body([Polygon.CreateBox(stepD)]);

        for(let r = 0; r < 2 * Math.PI; r += stepR * (Math.PI / 180))
        {
            const origin = unit.GetPosition();
            const step = Vector.ByRad(r).Scale(stepD);

            for(let point = origin; point.Dist(origin) < unit.GetLight(); point = point.Add(step))
            {
                const startX = Math.floor(point.X * dpp);
                const startY = Math.floor(point.Y * dpp);
                
                if(startX >= w || startY >= h || startX < 0 || startY < 0)
                {
                    break;
                }
                
                testBody.SetVirtual(new Vector(1, 1), 0, point);

                let collision = false;

                for(const unit of this.world.GetCells().GetList())
                {
                    // If the light ray hits a blocking cell, break the loop
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

                const delta = Math.max(Math.floor(point.Dist(origin) * dpp), dpp) / 2

                for(let y = startY - delta; y < startY + delta; ++y)
                {
                    for(let x = startX - delta; x < startX + delta; ++x)
                    {
                        if(x >= w || y >= h || x < 0 || y < 0)
                        { 
                            continue;
                        }

                        const p = new Vector(Math.floor(x / dpp), Math.floor(y / dpp));
                        const s = p.Dist(origin) / unit.GetLight();

                        if(s >= 0 && s <= 1)
                        {
                            set(s, x, y);
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Update the canvas.
     */
    private Render(t = 0, dt: number = 1 / 60)
    {
        const size = this.world.GetSize();
    
        const w = this.dotPerPoint * size.X;
        const h = this.dotPerPoint * size.Y;

        this.canvas.width = w;
        this.canvas.height = h;
        this.canvas.style.width = w + "px";
        this.canvas.style.height = h + "px";

        this.context.fillStyle = "black";
        this.context.fillRect(0, 0, w, h);
        
        // Init static shadow map
        if(!this.disableShadows && !this.shadowMap)
        {
            this.shadowMap = new Array(w * h).fill(1);
            this.world.GetCells().ForEach(unit => 
            {
                this.GenerateShadows(unit, this.shadowStep, this.shadowStepR, (light, x, y) =>
                {
                    const previous = this.shadowMap[x + y * w];

                    // Final value is the most bright (most min) value
                    this.shadowMap[x + y * w] = Math.min(light, previous);
                });
            });
        }

        // Draw units in the order of their Z index
        this.world
            .GetUnits()
            .GetList()
            .sort((a, b) => a.GetZ() - b.GetZ())
            .forEach(unit =>
            {
                this.DrawElement(unit);
            });

        // Apply shadow map onto the picture
        if(!this.disableShadows)
        {
            const imageData = this.context.getImageData(0, 0, w, h);
            
            for(let y = 0; y < h; y++)
            {
                for(let x = 0; x < w; x++)
                {
                    imageData.data[(y * imageData.width + x) * 4 + 3] = (1 - this.shadowMap[x + y * w]) * 255;
                }
            }
            
            this.context.putImageData(imageData, 0, 0);
        }
    
        if(!this.stop)
        {
            window.requestAnimationFrame(() => this.Render(now, now - this.lastTick));
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