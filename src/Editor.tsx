import * as React from "react";
import "./Editor.css";
import { Shared } from "./Shared";
import { Board } from "./lib/Board";
import { Renderer } from "./lib/Renderer";
import { Coord } from "./lib/Coord";
import { Exportable } from "./lib/Exportable";
import { BaseElement } from "./lib/Element/BaseElement";
import { Utils } from "./lib/Tools/Utils";
import { BaseActor } from "./lib/Element/Actor/BaseActor";
import { BaseCell } from "./lib/Element/Cell/BaseCell";
import { IExportObject } from "./lib/IExportObject";
import { WaterCell } from "./lib/Element/Cell/WaterCell";
import { StoneCell } from "./lib/Element/Cell/StoneCell";
import { GroundCell } from "./lib/Element/Cell/GroundCell";
import { FireCell } from "./lib/Element/Cell/FireCell";
import { PlayerActor } from "./lib/Element/Actor/PlayerActor";
import { ArrowActor } from "./lib/Element/Actor/ArrowActor";

/**
 * Props of the Editor view.
 */
interface EditorProps {
    // Empty
}

/**
 * State of the Editor view.
 */
interface EditorState {
    board: string;
    selected: string;
    loaded: string[];
}

export class Editor extends Shared<EditorProps, EditorState>
{
    public static Name = "editor";
    
    private readonly dragWait: number = 100;

    private canvas: HTMLCanvasElement;
    private renderer: Renderer;

    private disableDrag: boolean = true;
    private mouseDown: boolean = false;

    private board: Board;
    private newBoardSize: Coord = new Coord;

    private newElementCoord: Coord = new Coord;
    private newElementName: string;
    
    private selectedCoord: Coord;
    private selectedElement: BaseElement;

    /**
     * Construct a new Editor view.
     * @param props
     */
    constructor(props)
    {
        super(props);

        this.state = {
            board: "",
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
     * Register an element in the editor and also register it
     * in the Exportable dependency list.
     * @param classObj
     * @param name
     */
    private RegisterElement(classObj: any, name?: string)
    {
        const item = classObj.name || name;

        this.state.loaded.push(item);
        Exportable.Register(classObj, name);
    }

    /**
     * Create a new _board.
     */
    private async NewBoard()
    {
        if(!this.newBoardSize)
        {
            return;
        }

        this.board = Board.Current = new Board();
        this.board.Init(this.newBoardSize);

        this.renderer = new Renderer(this.board, this.canvas);
        this.selectedElement = null;
        
        await this.renderer.Load();
    
        this.renderer.Start();
    }

    /**
     * Add a new element onto the _board.
     */
    private async AddElement()
    {
        if(!this.board || !this.newElementCoord || !this.newElementName)
        {
            return;
        }
        
        const element = Exportable.FromName(this.newElementName);

        // If created object is not an element, return
        if(!(element instanceof BaseElement))
        {
            return;
        }

        element.Init({
            size: new Coord(1, 1),
            position: this.newElementCoord.Clone(),
            texture: ""
        });

        if(element instanceof BaseActor)
        {
            this.board.Actors.Set(element);
        }
        else if(element instanceof BaseCell)
        {
            this.board.Cells.Set(element);
        }

        await this.renderer.Load();
    }

    /**
     * Save the selected element back to the map (using state.selected).
     */
    private async SaveSelected(): Promise<void>
    {
        if(!this.board)
        {
            return;
        }

        const raw = this.state.selected;
        let exported: IExportObject;

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

        const element = Exportable.Import(exported);

        // If created object is not an element, return
        if(!(element instanceof BaseElement))
        {
            return;
        }

        if(element instanceof BaseCell)
        {
            this.board.Cells.Set(element);
        }
        else if(element instanceof BaseActor)
        {
            this.board.Actors.Set(element);
        }

        this.selectedElement = element;

        await this.renderer.Load();
    }

    /**
     * Delete the selected element from the app.
     */
    private DeleteSelected(): void
    {
        const element = this.selectedElement;

        if(element instanceof BaseCell)
        {
            this.board.Cells.Remove(element);
        }
        else if(element instanceof BaseActor)
        {
            this.board.Actors.Remove(element);
        }

        this.selectedElement = null;
    }

    /**
     * Import the _board from state.
     */
    private async ImportBoard()
    {
        const raw = this.state.board;
        let exported: IExportObject;

        try 
        {
            exported = JSON.parse(raw);
        }
        catch(e)
        {
            alert("Syntax error!");
            return;
        }

        this.board = Board.Current = Exportable.Import(exported);
        this.renderer = new Renderer(this.board, this.canvas);
        this.selectedElement = null;
        
        await this.renderer.Load();
    
        this.renderer.Start();
    }

    /**
     * Create a new _board.
     */
    private async ExportBoard()
    {
        if(!this.board)
        {
            return;
        }

        const exportable = Exportable.Export(this.board, true);
        const raw = JSON.stringify(exportable, null, 4);

        this.setState({ board: raw });
    }

    /**
     * Handles the on click event on the canvas.
     * @param event
     */
    private OnClick(event: MouseEvent): void
    {
        if(!this.board || !this.renderer)
        {
            return;
        }

        const p = Editor.CanvasP(this.canvas, event);

        this.selectedCoord = this.renderer.Find(p[0], p[1]);
        this.selectedElement = this.board.Elements.FindNear(this.selectedCoord);

        if(this.selectedElement)
        {
            const exportable = Exportable.Export(this.selectedElement, true);
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
        if(this.disableDrag || !this.board || !this.renderer)
        {
            return;
        }

        const p = Editor.CanvasP(this.canvas, event);
        const coord = this.renderer.Find(p[0], p[1]);

        if(this.selectedElement)
        {
            this.selectedElement.SetPos(coord);
        }
    }

    /**
     * Handles the on mouse down event.
     * @param event
     */
    private async OnMouseDown(event: MouseEvent): Promise<void>
    {
        this.mouseDown = true;

        await Utils.Wait(this.dragWait);

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
     * Render the Editor element.
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
                        onChange={e => this.newBoardSize.$X = parseFloat(e.target.value)} />
                    <input 
                        type="number" 
                        placeholder="Height" 
                        onChange={e => this.newBoardSize.$Y = parseFloat(e.target.value)} />
                    <button onClick={this.NewBoard.bind(this)}>New</button>
                </div>
                <div className="editor-box">
                    <input 
                        type="number" 
                        placeholder="X" 
                        onChange={e => this.newElementCoord.$X = parseFloat(e.target.value)} />
                    <input 
                        type="number" 
                        placeholder="Y" 
                        onChange={e => this.newElementCoord.$Y = parseFloat(e.target.value)} />
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
                        value={this.state.board}
                        onChange={v => this.setState({ board: v.target.value })}>
                    </textarea>
                    <button onClick={this.ImportBoard.bind(this)}>Import</button>
                    <button onClick={this.ExportBoard.bind(this)}>Export</button>
                </div>
            </div>
        );
    }
}