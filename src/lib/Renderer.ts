import { Board } from "./Board";
import { BaseElement } from "./Element/BaseElement";
import { Event } from "./Tools/Event";
import { Coord } from "./Coord";

export class Renderer
{
    private readonly notFoundColor: string = "purple";
    private readonly dpi: number = 30;

    private readonly board: Board;
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    
    private textures: { [id: string]: HTMLImageElement } = {};
    private stop;

    /**
     * Called upon redraw.
     */
    public OnDraw: Event<void> = new Event();

    /**
     * Construct a new game object.
     */
    public constructor(board: Board, canvas: HTMLCanvasElement)
    {
        this.board = board;
        this.canvas = canvas;
        this.context = <CanvasRenderingContext2D>canvas.getContext("2d");
    }

    /**
     * Load textures for a loaded board.
     */
    public async Load(): Promise<void>
    {
        return new Promise<void>((resolve, reject) => 
        {
            const elements = this.board.Elements;
            let i = 0;
    
            elements.ForEach((element: BaseElement) =>
            {
                if(!element)
                {
                    i++;
                    return;
                }
    
                const path = element.Texture;

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
     * Find a Coord under a pixel point.
     */
    public Find(x: number, y: number): Coord
    {
        return new Coord(x / this.dpi, y / this.dpi);
    }
    
    /**
     * Draw the given element onto the canvas.
     * @param element
     */
    private Draw(element: BaseElement)
    {
        if(!element || !element.Position || !element.Size)
        {
            return;
        }
        
        const coord = element.Position;
        const size = element.Size;
        const texture = this.textures[element.Texture];
    
        const x = coord.$X;
        const y = coord.$Y;
        const w = size.$X;
        const h = size.$Y;
    
        if(texture) {
            this.context.drawImage(
                texture, 
                x * this.dpi, 
                y * this.dpi, 
                w * this.dpi, 
                h * this.dpi);
        }
        else {
            this.context.fillStyle = this.notFoundColor;
            this.context.fillRect(
                x * this.dpi, 
                y * this.dpi, 
                w * this.dpi, 
                h * this.dpi
            );
        }
    }
    
    /**
     * Update the canvas.
     */
    private Render()
    {
        const size = this.board.Size;
    
        const w = this.dpi * size.$X;
        const h = this.dpi * size.$Y;

        this.canvas.width = w;
        this.canvas.height = h;
        this.canvas.style.width = w + "px";
        this.canvas.style.height = h + "px";

        this.context.fillStyle = "black";
        this.context.fillRect(0, 0, w, h);
        
        this.board.Cells.ForEach(e => this.Draw(e));
        this.board.Actors.ForEach(e => this.Draw(e));
    
        if(!this.stop)
        {
            window.requestAnimationFrame(() => this.Render());
        }

        this.board.OnTick.Call();
        this.OnDraw.Call();
    }

    /**
     * Start rendering.
     */
    public Start()
    {
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