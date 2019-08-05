import * as React from "react";
import "./Editor.css";
import { Shared } from "./Shared";
import { World } from "./lib/World";
import { Renderer } from "./lib/Renderer";
import { Vector } from "./lib/Geometry/Vector";
import { Exportable, ExportType } from "./lib/Exportable";
import { Unit } from "./lib/Element/Unit";
import { Tools } from "./lib/Util/Tools";
import { BaseActor } from "./lib/Element/Actor/BaseActor";
import { BaseCell } from "./lib/Element/Cell/BaseCell";
import { IDump } from "./lib/IDump";
import { WaterCell } from "./lib/Element/Cell/WaterCell";
import { StoneCell } from "./lib/Element/Cell/StoneCell";
import { GroundCell } from "./lib/Element/Cell/GroundCell";
import { FireCell } from "./lib/Element/Cell/FireCell";
import { PlayerActor } from "./lib/Element/Actor/PlayerActor";
import { ArrowActor } from "./lib/Element/Actor/ArrowActor";

/**
 * Props of the User view.
 */
interface EditorProps {
    // Empty
}

/**
 * State of the User view.
 */
interface EditorState {
    world: string;
    selected: string;
    loaded: string[];
}

const DRAG_WAIT = 300;

export class Editor extends Shared<EditorProps, EditorState>
{
    public static Name = "editor";

    private canvas: HTMLCanvasElement;
    private renderer: Renderer;

    private disableDrag: boolean = true;
    private mouseDown: boolean = false;

    private world: World;
    private newBoardSize: Vector = new Vector;

    private newElementVector: Vector = new Vector;
    private newElementName: string;
    
    private selectedVector: Vector;
    private selectedElement: Unit;

    /**
     * Construct a new User view.
     * @param props
     */
    constructor(props)
    {
        super(props);

        this.state = {
            world: "",
            selected: "",
            loaded: []
        };

        this.RegisterElement(ArrowActor);
        this.RegisterElement(PlayerActor);
        this.RegisterElement(FireCell);
        this.RegisterElement(GroundCell);
        this.RegisterElement(StoneCell);
        this.RegisterElement(WaterCell);
    }

    private static CanvasP(canvas: HTMLCanvasElement, event: MouseEvent): Array<number>
    {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        return [x, y];
    }

    /**
     * Dependency an unit in the editor and also register it
     * in the Exportable dependency list.
     * @param classObj
     * @param name
     */
    private RegisterElement(classObj: any, name?: string)
    {
        const item = classObj.name || name;

        this.state.loaded.push(item);
        Exportable.Dependency(classObj, name);
    }

    /**
     * Create a new world.
     */
    private async NewBoard()
    {
        if(!this.newBoardSize)
        {
            return;
        }

        this.world = World.Current = new World();
        this.world.Init(this.newBoardSize);

        this.renderer = new Renderer(this.world, this.canvas);
        this.selectedElement = null;
        
        await this.renderer.Load();
    
        this.renderer.Start();
    }

    /**
     * Add a new unit onto the world.
     */
    private async AddElement()
    {
        if(!this.world || !this.newElementVector || !this.newElementName)
        {
            return;
        }
        
        const unit = Exportable.FromName(this.newElementName);

        // If created object is not an unit, return
        if(!(unit instanceof Unit))
        {
            return;
        }

        unit.Init({
            size: new Vector(1, 1),
            position: this.newElementVector.Clone(),
            texture: ""
        });

        if(unit instanceof BaseActor)
        {
            this.world.GetActors().Set(unit);
        }
        else if(unit instanceof BaseCell)
        {
            this.world.GetCells().Set(unit);
        }

        await this.renderer.Load();
    }

    /**
     * Save the selected unit back to the map (using state.selected).
     */
    private async SaveSelected(): Promise<void>
    {
        if(!this.world)
        {
            return;
        }

        const raw = this.state.selected;
        let exported: IDump;

        try
        {
            exported = JSON.parse(raw);
        }
        catch
        {
            alert("Syntax error!");
            return;
        }

        this.DeleteSelected();

        const unit = Exportable.Import(exported);

        // If created object is not an unit, return
        if(!(unit instanceof Unit))
        {
            return;
        }

        if(unit instanceof BaseCell)
        {
            this.world.GetCells().Set(unit);
        }
        else if(unit instanceof BaseActor)
        {
            this.world.GetActors().Set(unit);
        }

        this.selectedElement = unit;

        await this.renderer.Load();
    }

    /**
     * Delete the selected unit from the app.
     */
    private DeleteSelected(): void
    {
        const unit = this.selectedElement;

        if(unit instanceof BaseCell)
        {
            this.world.GetCells().Remove(unit);
        }
        else if(unit instanceof BaseActor)
        {
            this.world.GetActors().Remove(unit);
        }

        this.selectedElement = null;
    }

    /**
     * Import the world from state.
     */
    private async ImportBoard()
    {
        const raw = this.state.world;
        let exported: IDump;

        try 
        {
            exported = JSON.parse(raw);
        }
        catch(e)
        {
            alert("Syntax error!");
            return;
        }

        this.world = World.Current = Exportable.Import(exported);
        this.renderer = new Renderer(this.world, this.canvas);
        this.selectedElement = null;
        
        await this.renderer.Load();
    
        this.renderer.Start();
    }

    /**
     * Create a new world.
     */
    private async ExportBoard()
    {
        if(!this.world)
        {
            return;
        }

        const exportable = Exportable.Export(this.world, null, ExportType.Visible);
        const raw = JSON.stringify(exportable, null, 4);

        this.setState({ world: raw });
    }

    /**
     * Handles the on click event on the canvas.
     * @param event
     */
    private OnClick(event: MouseEvent): void
    {
        if(!this.world || !this.renderer)
        {
            return;
        }

        const p = Editor.CanvasP(this.canvas, event);

        this.selectedVector = this.renderer.Find(p[0], p[1]);
        this.selectedElement = this.world.GetElements().FindNearest(this.selectedVector);

        if(this.selectedElement)
        {
            const exportable = Exportable.Export(this.selectedElement, null, ExportType.Visible);
            const raw = JSON.stringify(exportable, null, 4);

            this.setState({ selected: raw })
        }
    }

    /**
     * Handles the on drag event on the canvas.
     * Makes the elements moveable by mouse.
     * @param event
     */
    private OnMouseMove(event: MouseEvent): void
    {
        if(this.disableDrag || !this.world || !this.renderer)
        {
            return;
        }

        const p = Editor.CanvasP(this.canvas, event);
        const Vector = this.renderer.Find(p[0], p[1]);

        if(this.selectedElement)
        {
            this.selectedElement.SetPosition(Vector);
        }
    }

    /**
     * Handles the on mouse down event.
     * @param event
     */
    private async OnMouseDown(event: MouseEvent): Promise<void>
    {
        this.mouseDown = true;

        await Tools.Wait(DRAG_WAIT);

        if(this.mouseDown)
        {
            this.disableDrag = false;
        }
    }

    /**
     * Handles the on mouse up event.
     * @param event
     */
    private OnMouseUp(event: MouseEvent): void
    {
        this.mouseDown = false;
        this.disableDrag = true;
    }

    /**
     * Render the User unit.
     */
    public render(): JSX.Element
    {
        return (
            <div>
                <div className="editor-box editor-box-wide">
                    <canvas
                        onClick={this.OnClick.bind(this)}
                        onMouseMove={this.OnMouseMove.bind(this)}
                        onMouseDown={this.OnMouseDown.bind(this)}
                        onMouseUp={this.OnMouseUp.bind(this)}
                        ref={c => this.canvas = c}>
                    </canvas>
                </div>
                <div className="editor-box">
                    <input 
                        type="number" 
                        placeholder="Width" 
                        onChange={e => this.newBoardSize.X = parseFloat(e.target.value)} />
                    <input 
                        type="number" 
                        placeholder="Height" 
                        onChange={e => this.newBoardSize.Y = parseFloat(e.target.value)} />
                    <button onClick={this.NewBoard.bind(this)}>New</button>
                </div>
                <div className="editor-box">
                    <input 
                        type="number" 
                        placeholder="X" 
                        onChange={e => this.newElementVector.X = parseFloat(e.target.value)} />
                    <input 
                        type="number" 
                        placeholder="Y" 
                        onChange={e => this.newElementVector.Y = parseFloat(e.target.value)} />
                    <select onChange={v => this.newElementName = v.target.value}>
                        <option>-</option>
                        {this.state.loaded.map(n => <option key={n}>{n}</option>)}
                    </select>
                    <button onClick={this.AddElement.bind(this)}>Add</button>
                </div>
                <div className="editor-box">
                    <textarea
                        value={this.state.selected}
                        onChange={v => this.setState({ selected: v.target.value })}>
                    </textarea>
                    <button onClick={this.SaveSelected.bind(this)}>Save</button>
                    <button onClick={this.DeleteSelected.bind(this)}>Delete</button>
                </div>
                <div className="editor-box">
                    <textarea
                        value={this.state.world}
                        onChange={v => this.setState({ world: v.target.value })}>
                    </textarea>
                    <button onClick={this.ImportBoard.bind(this)}>Import</button>
                    <button onClick={this.ExportBoard.bind(this)}>Export</button>
                </div>
            </div>
        );
    }
}