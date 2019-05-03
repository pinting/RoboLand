import { Board } from "./Board";
import { BaseElement } from "./Element/BaseElement";
import { Event } from "./Tools/Event";
import { Vector } from "./Physics/Vector";

const NOT_FOUND_COLOR = "purple";
const DPI = 30;

export class Renderer
{
    private readonly board: Board;
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    
    private textures: { [id: string]: HTMLImageElement } = {};
    private stop: boolean = false;

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
            const elements = this.board.GetElements();
            let i = 0;
    
            elements.ForEach((element: BaseElement) =>
            {
                if(!element)
                {
                    i++;
                    return;
                }
    
                const path = element.GetTexture();

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
     * Draw the given element onto the canvas.
     * @param element
     */
    private DrawElement(element: BaseElement)
    {
        if(!element || !element.GetPosition() || !element.GetSize())
        {
            return;
        }
        
        const vector = element.GetPosition();
        const size = element.GetSize();
        const texture = this.textures[element.GetTexture()];
    
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

        rot(element.GetAngle());
    
        if(texture) {
            this.context.drawImage(texture, x, y, w, h);
        }
        else {
            this.context.fillStyle = NOT_FOUND_COLOR;
            this.context.fillRect(x, y, w, h);
        }

        rot(-element.GetAngle());
    }
    
    /**
     * Update the canvas.
     */
    private Render()
    {
        const size = this.board.GetSize();
    
        const w = DPI * size.X;
        const h = DPI * size.Y;

        this.canvas.width = w;
        this.canvas.height = h;
        this.canvas.style.width = w + "px";
        this.canvas.style.height = h + "px";

        this.context.fillStyle = "black";
        this.context.fillRect(0, 0, w, h);
        
        this.board.GetCells().ForEach(e => this.DrawElement(e));
        this.board.GetActors().ForEach(e => this.DrawElement(e));
    
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