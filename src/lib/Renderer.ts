import { World } from "./World";
import { Unit } from "./Unit/Unit";
import { Event } from "./Util/Event";
import { Vector } from "./Geometry/Vector";
import { Polygon } from "./Geometry/Polygon";
import { ResourceManager } from "./Util/ResourceManager";
import { Resource } from "./RoboPack";

export interface RendererArgs
{
    world: World;
    canvas: HTMLCanvasElement;

    dotPerPoint?: number;
    debug?: boolean;
    debugColor?: string;
    disableShadows?: boolean;
    viewport?: Vector;
    center?: Vector;
    noTick?: boolean;
    selectedZ?: number;
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

    private textures: { [id: string]: HTMLImageElement } = {};
    private stop: boolean = false;
    private lastTick: number;
    private center: Vector;
    private viewport: Vector;
    private noTick: boolean;
    private selectedZ: number;
    private selectedUnit: Unit;

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

        this.dotPerPoint = args.dotPerPoint || 25;
        this.debug = args.debug || false;
        this.debugColor = args.debugColor || "purple";
        this.disableShadows = args.disableShadows || false;
        this.viewport = args.viewport || new Vector(6, 6);
        this.center = args.center || new Vector(0, 0);
        this.noTick = args.noTick || false;
        this.selectedZ = args.selectedZ || undefined;
    }

    /**
     * Load textures from the resources.
     */
    public async Load(): Promise<void>
    {
        return new Promise<void>((resolve, reject) => 
        {
            const textures = ResourceManager.GetList().filter(r => 
                Resource.GetMeta(r.Buffer).Mime === "image/png");
            
            let i = 0;
    
            for(let resource of textures)
            {
                if(!resource)
                {
                    i++;
                    return;
                }

                const uri = resource.Uri;

                if(this.textures[uri] !== undefined)
                {
                    i++;
                    return;
                }

                const texture = new Image();
    
                texture.onerror = () => reject();
                texture.onload = () => 
                {
                    this.textures[uri] = texture;
    
                    if(++i == textures.length) 
                    {
                        resolve();
                    }
                };

            
                texture.src = resource.GetUrl();

                this.textures[uri] = null;
            }

            if(!textures.length)
            {
                resolve();
            }
        });
    }

    /**
     * Find a Vector under a pixel point.
     */
    public FindVector(x: number, y: number): Vector
    {
        const view = this.viewport.Scale(this.dotPerPoint);

        let dx = this.dotPerPoint;
        let dy = this.dotPerPoint;
        
        dx *= this.canvas.clientWidth / view.X;
        dy *= this.canvas.clientHeight / view.Y;

        return new Vector(x / dx, y / dy);
    }

    /**
     * Draw the given unit onto the canvas.
     * @param unit
     */
    private DrawUnit(unit: Unit)
    {
        if(!unit || !unit.GetBody())
        {
            return;
        }
        
        const body = unit.GetBody();
        const position = body.GetPosition();
        const scale = body.GetScale();
        const texture = this.textures[unit.GetTexture()];
        
        const s = scale.Scale(this.dotPerPoint);
        const c = (position.Sub(this.center).Add(this.viewport.Scale(0.5))).Scale(this.dotPerPoint);
        const p = c.Sub(s.Scale(0.5));
        
        const rot = (angle: number) =>
        {
            this.context.translate(c.X, c.Y);
            this.context.rotate(angle);
            this.context.translate(-c.X, -c.Y);
        }

        rot(body.GetRotation());
    
        if(texture) {
            this.context.drawImage(texture, p.X, p.Y, s.X, s.Y);
        }
        else {
            this.context.fillStyle = this.debugColor;
            this.context.fillRect(p.X, p.Y, s.X, s.Y);
        }

        rot(-unit.GetBody().GetRotation());
    }

    /**
     * Draw grid for an unit.
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
                for(let base of shape.GetVirtual())
                {
                    const p = (base.Sub(this.center).Add(this.viewport.Scale(0.5))).Scale(this.dotPerPoint);

                    if(first)
                    {
                        this.context.lineTo(p.X, p.Y);
                    }
                    else
                    {
                        this.context.moveTo(p.X, p.Y);
                        first = p;
                    }
                }
            }
        }

        first && this.context.lineTo(first.X, first.Y);

        this.context.strokeStyle = color;
        this.context.stroke();
    }
    
    /**
     * Update the canvas.
     */
    private Render()
    {
        const fullView = this.world.GetSize().Scale(this.dotPerPoint);
        const view = this.viewport.Scale(this.dotPerPoint);

        this.canvas.width = view.X;
        this.canvas.height = view.Y;

        this.context.fillStyle = "black";
        this.context.fillRect(0, 0, view.X, view.Y);

        // Draw units in the order of their Z index
        const levels: Unit[][] = [];

        const process = (unit: Unit) =>
        {
            const z = unit.GetBody().GetZ();
            
            if(typeof this.selectedZ == "number" && this.selectedZ != z)
            {
                return;
            }
                
            if(!levels.hasOwnProperty(z))
            {
                levels[z] = [];
            }

            levels[z].push(unit);
        }

        this.world
            .GetCells()
            .GetArray()
            .forEach(process);

        this.world
            .GetActors()
            .GetArray()
            .forEach(process);

        for(let level of levels)
        {
            level && level.forEach(unit => this.DrawUnit(unit));
        }
        
        // Draw grid if debug mode is enabled
        if(this.debug)
        {
            this.world
                .GetUnits()
                .GetArray()
                .forEach(unit => this.DrawGrid(unit, this.debugColor));
        }

        if(this.selectedUnit)
        {
            this.DrawGrid(this.selectedUnit, this.debugColor);
        }

        // Apply shadow map onto the picture
        if(!this.disableShadows)
        {
            const imageData = this.context.getImageData(0, 0, view.X, view.Y);
            
            for(let y = 0; y < view.X; y++)
            {
                for(let x = 0; x < view.Y; x++)
                {
                    const c = this.center.Scale(this.dotPerPoint).Sub(view.Scale(0.5));

                    imageData.data[(y * view.Y + x) * 4 + 3] = 
                        (1 - this.world.GetShadow(x + c.X, y + c.Y, fullView.X, fullView.Y)) * 255;
                }
            }
            
            this.context.putImageData(imageData, 0, 0);
        }
    
        if(!this.stop)
        {
            window.requestAnimationFrame(() => this.Render());
        }

        const now = +new Date;

        if(!this.noTick)
        {
            this.world.OnTick.Call((now - this.lastTick) / 1000);
        }

        this.OnDraw.Call((now - this.lastTick) / 1000);

        this.lastTick = now;
    }

    public SetCenter(center: Vector): void
    {
        this.center = center;
    }

    public Start(): void
    {
        this.lastTick = +new Date;
        this.stop = false;

        window.requestAnimationFrame(() => this.Render());
    }

    public Stop(): void
    {
        this.stop = true;
    }

    /**
     * Only the selected Z index will be rendered.
     */
    public SetSelectedZ(z: number)
    {
        this.selectedZ = z;
    }

    /**
     * The selected unit will have a border around it.
     */
    public SetSelectedUnit(unit: Unit)
    {
        this.selectedUnit = unit;
    }
}