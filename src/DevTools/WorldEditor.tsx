import * as React from "react";
import Cristal from "react-cristal";
import * as Bootstrap from "reactstrap";

import { World } from "../lib/World";
import { Renderer } from "../lib/Renderer";
import { Vector } from "../lib/Geometry/Vector";
import { Exportable, ExportType } from "../lib/Exportable";
import { Unit } from "../lib/Unit/Unit";
import { Tools } from "../lib/Util/Tools";
import { BaseActor } from "../lib/Unit/Actor/BaseActor";
import { BaseCell } from "../lib/Unit/Cell/BaseCell";
import { NormalCell } from "../lib/Unit/Cell/NormalCell";
import { DamageCell } from "../lib/Unit/Cell/DamageCell";
import { PlayerActor } from "../lib/Unit/Actor/PlayerActor";
import { ArrowActor } from "../lib/Unit/Actor/ArrowActor";
import { Body } from "../lib/Physics/Body";
import { ResourceManager } from "../lib/Util/ResourceManager";
import { Dump } from "../lib/Dump";
import { Master } from "../lib/Master";

interface IViewProps
{
    close: () => void;
    edit: (dump: Dump) => Promise<Dump>;
}

interface IViewState
{
    selected: Dump;
    loaded: string[];
}

export class WorldEditor extends React.PureComponent<IViewProps, IViewState>
{
    public static DragWait = 300;
    public static MinSize = 8;

    private canvas: HTMLCanvasElement;
    private renderer: Renderer;
    private master: Master;

    private disableDrag: boolean = true;
    private mouseDown: boolean = false;

    private world: World;

    private input = {
        newWorldSize: new Vector(WorldEditor.MinSize, WorldEditor.MinSize),
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

        this.registerUnit(ArrowActor);
        this.registerUnit(PlayerActor);
        this.registerUnit(DamageCell);
        this.registerUnit(NormalCell);
    }

    private findClick(canvas: HTMLCanvasElement, event: MouseEvent): Vector
    {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        return new Vector(x, y);
    }

    private registerUnit(classObj: any, name?: string): void
    {
        const item = classObj.name || name;

        this.state.loaded.push(item);

        Exportable.Dependency(classObj, name);
    }

    private async createRenderer(): Promise<void>
    {
        this.master = new Master(this.world);
        this.renderer = new Renderer({
            dotPerPoint: 64,
            canvas: this.canvas, 
            world: this.world,
            master: this.master,
            disableShadows: true,
            viewport: this.world.GetSize(),
            center: this.world.GetSize().Scale(1 / 2)
        });
        
        this.input.selectedUnit = null;
        
        await this.renderer.LoadTextures();
    
        this.renderer.Start();
    }

    private selectZ(z: number): void
    {
        this.renderer.SetSelectedZ(Number.isNaN(z) ? undefined : z);
    }

    private async createWorld(): Promise<void>
    {
        if(!this.input.newWorldSize)
        {
            return;
        }

        this.world = World.Current = new World();
        this.world.Init({ size: this.input.newWorldSize });

        await this.createRenderer();
    }

    private async saveWorld()
    {
        const dump = Exportable.Export(this.world, null, ExportType.Disk);

        await Dump.Save(dump, true);

        await this.init();
    }

    private async editSelected(): Promise<void>
    {
        const unit = this.input.selectedUnit;

        if(!unit)
        {
            return;
        }

        const dump = Exportable.Export(unit, null, ExportType.Disk);

        try 
        {
            const newDump = await this.props.edit(dump);
            
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
            
            await this.renderer.LoadTextures();
        }
        catch(e)
        {
            // Rejected when closed
        }
    }
    
    private async addUnit(): Promise<void>
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
            body: Body.CreateBox(new Vector(1, 1), 0, this.input.newElementVector.Clone()),
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

        await this.renderer.LoadTextures();
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

        const click = this.findClick(this.canvas, event);
        const vector = this.renderer.FindVectorByPixel(click.X, click.Y);
        const unit = this.world.GetUnits().FindNearest(vector);

        if(!unit)
        {
            return;
        }
        
        this.input.selectedUnit = unit;

        this.renderer.SetSelectedUnit(unit);
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

        const click = this.findClick(this.canvas, event);
        const newOffset = this.renderer.FindVectorByPixel(click.X, click.Y);

        if(this.input.selectedUnit)
        {
            this.input.selectedUnit.GetBody().SetVirtual(null, null, newOffset);
        }
    }

    private async onMouseDown(event: MouseEvent): Promise<void>
    {
        this.mouseDown = true;

        await Tools.Wait(WorldEditor.DragWait);

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
        const rootResource = ResourceManager.ByUri(World.RootDump);

        if(rootResource)
        {
            const raw = Tools.ANSIToUTF16(rootResource.Buffer);
            const rootDump = JSON.parse(raw) as Dump;
            const dump = Dump.Resolve(rootDump);
    
            this.world = Exportable.Import(dump);

            this.createRenderer();
        }
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
                            <Bootstrap.Button 
                                block
                                style={{ margin: 0 }}
                                onClick={this.editSelected.bind(this)}
                                color="primary">
                                    Edit Selected
                            </Bootstrap.Button>
                            <Bootstrap.Input
                                style={{ margin: "10% 0 0 0" }}
                                type="number" 
                                placeholder="Selected Z" 
                                min="0"
                                onChange={e => this.selectZ(parseFloat(e.target.value))} />
                            <Bootstrap.Input 
                                type="number" 
                                placeholder="Width" 
                                style={{ margin: "10% 0 0 0" }}
                                min={WorldEditor.MinSize}
                                defaultValue={WorldEditor.MinSize.toString()}
                                onChange={e => this.input.newWorldSize.X = parseFloat(e.target.value)} />
                            <Bootstrap.Input 
                                type="number" 
                                min={WorldEditor.MinSize}
                                defaultValue={WorldEditor.MinSize.toString()}
                                placeholder="Height" 
                                onChange={e => this.input.newWorldSize.Y = parseFloat(e.target.value)} />
                            <Bootstrap.Button
                                block
                                style={{ margin: 0 }}
                                onClick={this.createWorld.bind(this)}>
                                    Generate Empty
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
                            <Bootstrap.Button 
                                block
                                style={{ margin: "10% 0 0 0" }}
                                onClick={this.saveWorld.bind(this)}
                                color="success">
                                    Save
                            </Bootstrap.Button>
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
                onClose={() => this.props.close()}
                title="World Editor"
                initialSize={{width: 700, height: 520}}
                isResizable={true}
                initialPosition="top-center">
                    {this.renderInner()}
            </Cristal>
        );
    }
}