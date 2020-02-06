import * as React from "react";
import Cristal from "react-cristal";
import * as Bootstrap from "reactstrap";

import { Shared } from "../Game/Shared";
import { World } from "../lib/World";
import { Renderer } from "../lib/Renderer";
import { Vector } from "../lib/Geometry/Vector";
import { Exportable, ExportType } from "../lib/Exportable";
import { Unit } from "../lib/Unit/Unit";
import { Tools } from "../lib/Util/Tools";
import { BaseActor } from "../lib/Unit/Actor/BaseActor";
import { BaseCell } from "../lib/Unit/Cell/BaseCell";
import { IDump } from "../lib/IDump";
import { NormalCell } from "../lib/Unit/Cell/NormalCell";
import { DamageCell } from "../lib/Unit/Cell/DamageCell";
import { PlayerActor } from "../lib/Unit/Actor/PlayerActor";
import { ArrowActor } from "../lib/Unit/Actor/ArrowActor";
import { Body } from "../lib/Physics/Body";

interface WorldEditorProps {
    onClose: () => void;
    onEditor: (dump: IDump) => Promise<IDump>;
}

interface WorldEditorState {
    selected: IDump;
    loaded: string[];
}

const DRAG_WAIT = 300;

export class WorldEditor extends React.PureComponent<WorldEditorProps, WorldEditorState>
{
    private canvas: HTMLCanvasElement;
    private renderer: Renderer;

    private disableDrag: boolean = true;
    private mouseDown: boolean = false;

    private world: World;

    private input = {
        newWorldSize: new Vector,
        newElementVector: new Vector,
        newElementName: null,
        selectedUnit: null
    }

    constructor(props)
    {
        super(props);

        this.state = {
            selected: null,
            loaded: []
        };

        this.world = Shared.CreateSampleWorld(10);

        this.createRenderer();

        this.registerUnit(ArrowActor);
        this.registerUnit(PlayerActor);
        this.registerUnit(DamageCell);
        this.registerUnit(NormalCell);
    }

    private static CanvasP(canvas: HTMLCanvasElement, event: MouseEvent): Array<number>
    {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        return [x, y];
    }

    private registerUnit(classObj: any, name?: string)
    {
        const item = classObj.name || name;

        this.state.loaded.push(item);

        Exportable.Dependency(classObj, name);
    }

    private async createRenderer()
    {
        this.renderer = new Renderer({
            dotPerPoint: 64,
            canvas: this.canvas, 
            world: this.world,
            disableShadows: true,
            viewport: this.world.GetSize(),
            center: this.world.GetSize().Scale(1 / 2)
        });
        
        this.input.selectedUnit = null;
        
        await this.renderer.Load();
    
        this.renderer.Start();
    }

    private selectZ(z: number): void
    {
        this.renderer.SetSelectedZ(Number.isNaN(z) ? undefined : z);
    }

    private async createWorld()
    {
        if(!this.input.newWorldSize)
        {
            return;
        }

        this.world = World.Current = new World();
        this.world.Init(this.input.newWorldSize);

        await this.createRenderer();
    }

    private async createSampleWorld()
    {
        if(!this.input.newWorldSize)
        {
            return;
        }

        this.world = World.Current = Shared.CreateSampleWorld(this.input.newWorldSize.X || this.input.newWorldSize.Y);

        await this.createRenderer();
    }
    
    private async addUnit()
    {
        if(!this.world || !this.input.newElementVector || !this.input.newElementName)
        {
            return;
        }
        
        const unit = Exportable.FromName(this.input.newElementName);

        // If created object is not an unit, return
        if(!(unit instanceof Unit))
        {
            return;
        }

        unit.Init({
            body: Body.CreateBoxBody(new Vector(1, 1), 0, this.input.newElementVector.Clone()),
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
     * Handles the on click event on the canvas.
     * @param event
     */
    private async onClick(event: MouseEvent): Promise<void>
    {
        if(!this.world || !this.renderer)
        {
            return;
        }

        const p = WorldEditor.CanvasP(this.canvas, event);

        const vector = this.renderer.FindVector(p[0], p[1]);
        const unit = this.world.GetUnits().FindNearest(vector);

        if(!unit)
        {
            return;
        }
        
        this.input.selectedUnit = unit;
        this.renderer.SetSelectedUnit(unit);

        const dump = Exportable.Export(unit, null, ExportType.Visible);

        try 
        {
            const newDump = await this.props.onEditor(dump);
            
            if(unit instanceof BaseCell)
            {
                this.world.GetCells().Remove(unit);
            }
            else if(unit instanceof BaseActor)
            {
                this.world.GetActors().Remove(unit);
            }

            if(!newDump)
            {
                return;
            }

            const newUnit = Exportable.Import(newDump);

            // If created object is not an unit, return
            if(!(newUnit instanceof Unit))
            {
                return;
            }
    
            if(newUnit instanceof BaseCell)
            {
                this.world.GetCells().Set(newUnit);
            }
            else if(newUnit instanceof BaseActor)
            {
                this.world.GetActors().Set(newUnit);
            }
            
            await this.renderer.Load();
        }
        catch(e)
        {
            // Rejected when closed
        }
    }

    /**
     * Handles the on drag event on the canvas.
     * Makes the elements moveable by mouse.
     * @param event
     */
    private onMouseMove(event: MouseEvent): void
    {
        if(this.disableDrag || !this.world || !this.renderer)
        {
            return;
        }

        const p = WorldEditor.CanvasP(this.canvas, event);
        const newOffset = this.renderer.FindVector(p[0], p[1]);

        if(this.input.selectedUnit)
        {
            this.input.selectedUnit.GetBody().SetVirtual(null, null, newOffset);
        }
    }

    private async onMouseDown(event: MouseEvent): Promise<void>
    {
        this.mouseDown = true;

        await Tools.Wait(DRAG_WAIT);

        if(this.mouseDown)
        {
            this.disableDrag = false;
        }
    }

    private onMouseUp(event: MouseEvent): void
    {
        this.mouseDown = false;
        this.disableDrag = true;
    }
    
    private async init(): Promise<void>
    {
        this.world = Shared.CreateSampleWorld(10);

        this.createRenderer();
    }

    public componentDidMount(): void
    {
        this.init();
    }

    public renderInner(): JSX.Element
    {
        const selectStyle: React.CSSProperties = {
            width: "100%",
            height: 40,
            border: "1px solid lightgray",
            borderRadius: 5,
        };

        const canvasStyle: React.CSSProperties = {
            width: "100%",
            background: "black"
        };

        return (
            <Bootstrap.Table size="100%">
                <tbody>
                    <tr>
                        <td>
                            <Bootstrap.Input 
                                block
                                type="number" 
                                placeholder="Width" 
                                min="4"
                                onChange={e => this.input.newWorldSize.X = parseFloat(e.target.value)} />
                            <Bootstrap.Input 
                                block
                                type="number" 
                                min="4"
                                placeholder="Height" 
                                onChange={e => this.input.newWorldSize.Y = parseFloat(e.target.value)} />
                            <Bootstrap.Button
                                block
                                style={{ margin: 0 }}
                                onClick={this.createWorld.bind(this)}>
                                    New
                            </Bootstrap.Button>
                            <Bootstrap.Button
                                block
                                style={{ margin: 0 }}
                                onClick={this.createSampleWorld.bind(this)}>
                                New Generated
                            </Bootstrap.Button>
                            <Bootstrap.Button 
                                block
                                style={{ margin: "10% 0 0 0" }}
                                color="primary">
                                    Save
                            </Bootstrap.Button>
                            <Bootstrap.Button 
                                block
                                color="danger"
                                style={{ margin: 0 }}>
                                    Delete
                            </Bootstrap.Button>
                            <Bootstrap.Input 
                                style={{ margin: "10% 0 0 0" }}
                                type="number" 
                                placeholder="X" 
                                onChange={e => this.input.newElementVector.X = parseFloat(e.target.value)} />
                            <Bootstrap.Input 
                                type="number" 
                                placeholder="Y" 
                                onChange={e => this.input.newElementVector.Y = parseFloat(e.target.value)} />
                            <select 
                                style={selectStyle}
                                onChange={v => this.input.newElementName = v.target.value}>
                                <option>-</option>
                                {this.state.loaded.map(n => <option key={n}>{n}</option>)}
                            </select>
                            <Bootstrap.Button 
                                block
                                onClick={this.addUnit.bind(this)}>
                                    Add
                            </Bootstrap.Button>
                            <Bootstrap.Input
                                block
                                style={{ margin: "10% 0 0 0" }}
                                type="number" 
                                placeholder="Selected Z" 
                                min="0"
                                onChange={e => this.selectZ(parseFloat(e.target.value))} />
                        </td>
                        <td>
                            <canvas
                                style={canvasStyle}
                                onClick={this.onClick.bind(this)}
                                onMouseMove={this.onMouseMove.bind(this)}
                                onMouseDown={this.onMouseDown.bind(this)}
                                onMouseUp={this.onMouseUp.bind(this)}
                                ref={c => this.canvas = c}>
                            </canvas>
                        </td>
                    </tr>
                </tbody>
            </Bootstrap.Table>
        );
    }

    public render(): JSX.Element
    {
        return (
            <Cristal 
                onClose={() => this.props.onClose()}
                title="World Editor"
                initialSize={{width: 700, height: 550}}
                isResizable={true}
                initialPosition="top-center">
                    {this.renderInner()}
            </Cristal>
        );
    }
}