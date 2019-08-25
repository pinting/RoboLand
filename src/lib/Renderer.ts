import { World } from "./World";
import { Unit } from "./Unit/Unit";
import { Event } from "./Util/Event";
import { Vector } from "./Geometry/Vector";
import { Polygon } from "./Geometry/Polygon";

const DEBUG_COLOR = "purple";
const DPI = 30;

export class Renderer
{
    private readonly world: World;
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    private readonly debug: boolean;
    
    private textures: { [id: string]: HTMLImageElement } = {};
    private stop: boolean = false;
    private lastDate: number;

    /**
     * Called upon redraw.
     */
    public OnDraw: Event<void> = new Event();

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
            const elements = this.world.GetElements();
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
    
        const x = vector.X * DPI;
        const y = vector.Y * DPI;
        const w = size.X * DPI;
        const h = size.Y * DPI;
        
        const rot = (angle: number) =>
        {
            this.context.translate(x + w / 2, y + h / 2);
            this.context.rotate(angle);
            this.context.translate(-(x + w / 2), -(y + h / 2));
        }

        rot(unit.GetAngle());
    
        if(texture) {
            this.context.drawImage(texture, x, y, w, h);
        }
        else {
            this.context.fillStyle = DEBUG_COLOR;
            this.context.fillRect(x, y, w, h);
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
        const body = unit.GetVirtualBody();
        const shapes = body.GetShapes();
        let first = null;

        this.context.beginPath();

        for(let shape of shapes)
        {
            if (shape instanceof Polygon)
            {
                for(let point of shape.GetVertices())
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
        
        this.world.GetCells().ForEach(e => this.DrawElement(e));
        this.world.GetActors().ForEach(e => this.DrawElement(e));
    
        if(!this.stop)
        {
            window.requestAnimationFrame(() => this.Render());
        }

        const now = +new Date;

        this.world.OnTick.Call();
        this.OnDraw.Call();

        this.lastDate = now;
    }

    /**
     * Start rendering.
     */
    public Start()
    {
        this.lastDate = +new Date;
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