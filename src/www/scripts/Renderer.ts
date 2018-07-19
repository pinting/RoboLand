import { Map } from "./Map";
import { BaseElement } from "./Element/BaseElement";
import { Helper } from "./Util/Helper";

export class Renderer
{
    private readonly dpi: number = 30;

    private readonly map: Map;
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    
    private textures: { [id: string]: HTMLImageElement } = {};
    private stop;

    /**
     * Construct a new game object.
     */
    public constructor(map: Map, canvas: HTMLCanvasElement)
    {
        this.map = map;
        this.canvas = canvas;
        this.context = <CanvasRenderingContext2D>canvas.getContext("2d");
    }

    /**
     * Load textures for a loaded map.
     */
    public async Load(): Promise<void>
    {
        return new Promise<void>((resolve, reject) => 
        {
            const elements = this.map.GetElements();
            let i = 0;
    
            elements.ForEach(element =>
            {
                if(!element)
                {
                    i++;
                    return;
                }
    
                const id = element.GetTexture();

                if(this.textures[id] !== undefined)
                {
                    i++;
                    return;
                }

                const texture = new Image();
    
                texture.onerror = () => reject();
                texture.onload = () => 
                {
                    this.textures[id] = texture;
    
                    if(++i == elements.GetLength()) 
                    {
                        resolve();
                    }
                };
            
                texture.src = id;

                this.textures[id] = null;
            });
        });
    }
    
    /**
     * Draw the given element onto the canvas.
     * @param element
     */
    private Draw(element: BaseElement)
    {
        if(!element)
        {
            return;
        }
        
        const coord = element.GetPos();
        const size = element.GetSize();
        const texture = this.textures[element.GetTexture()];
    
        const x = coord.X;
        const y = coord.Y;
        const w = size.X;
        const h = size.Y;
    
        this.context.drawImage(
            texture, 
            x * this.dpi, 
            y * this.dpi, 
            w * this.dpi, 
            h * this.dpi);
    }
    
    /**
     * Update the canvas.
     */
    private Update()
    {
        const size = this.map.GetSize();
    
        this.canvas.width = this.dpi * size.X;
        this.canvas.height = this.dpi * size.Y;
        this.canvas.style.width = this.dpi * size.X + "px";
        this.canvas.style.height = this.dpi * size.Y + "px";
        
        this.map.GetCells().ForEach(e => this.Draw(e));
        this.map.GetActors().ForEach(e => this.Draw(e));
    
        if(!this.stop)
        {
            window.requestAnimationFrame(() => this.Update());
        }

        this.OnUpdate();
    }

    /**
     * Start rendering.
     */
    public Start()
    {
        this.stop = false;
        window.requestAnimationFrame(() => this.Update());
    }

    /**
     * Stop rendering.
     */
    public Stop()
    {
        this.stop = true;
    }

    /**
     * Called when the canvas was redrawed.
     */
    public OnUpdate: () => void = Helper.Noop;
}