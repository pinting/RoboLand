import * as React from "react";
import * as Bootstrap from "reactstrap";

import { Shared } from "../Game/Shared";
import { WorldEditor } from "./WorldEditor";
import { Tools } from "../lib/Util/Tools";
import { DumpEditor } from "./DumpEditor";
import { OnePlayerDebug } from "./OnePlayerDebug";
import { TwoPlayerDebug } from "./TwoPlayerDebug";
import { TestRunner } from "./TestRunner";
import { ResourceBrowser } from "./ResourceBrowser";
import { Helper } from "../Helper";
import { World } from "../lib/World";
import { ResourceManager } from "../lib/Util/ResourceManager";
import { SimplexNoise } from "../lib/Util/SimplexNoise";
import { Http } from "../lib/Util/Http";
import { Body } from "../lib/Physics/Body";
import { Polygon } from "../lib/Geometry/Polygon";
import { Vector } from "../lib/Geometry/Vector";
import { Matrix } from "../lib/Geometry/Matrix";
import { Exportable } from "../lib/Exportable";
import { PlayerActor } from "../lib/Unit/Actor/PlayerActor";
import { ArrowActor } from "../lib/Unit/Actor/ArrowActor";
import { NormalCell } from "../lib/Unit/Cell/NormalCell";
import { DamageCell } from "../lib/Unit/Cell/DamageCell";
import { KillCell } from "../lib/Unit/Cell/KillCell";
import { Logger } from "../lib/Util/Logger";
import { Resource } from "../lib/RoboPack";
import { Dump } from "../lib/Dump";

interface ViewProps
{

}

interface ViewState
{
    windows: JSX.Element[];
}

export class DevTools extends React.PureComponent<ViewProps, ViewState>
{
    private importButton: HTMLInputElement;

    constructor(props: ViewProps) 
    {
        super(props);

        Shared.RegisterDependencies();
        
        // For debug
        Tools.Extract(window, {
            World,
            Tools,
            Exportable,
            Vector,
            Matrix,
            NormalCell,
            DamageCell,
            KillCell,
            PlayerActor,
            ArrowActor,
            Logger,
            SimplexNoise,
            ResourceManager,
            Dump,
            Polygon,
            Body,
            Http
        });
    
        this.state = {
            windows: []
        };
    }

    private async init(): Promise<void>
    {
        const buffer = await Http.Get("res/sample.roboland");
        
        await ResourceManager.Load(buffer);
    }

    public componentDidMount(): void
    {
        this.init();
    }

    private async readFileList(list: FileList): Promise<void>
    {
        for(var i = 0; i < list.length; i++)
        {
            const file = list[i];
            const reader = new FileReader();

            reader.onload = () =>
            {
                const buffer = reader.result as ArrayBuffer;

                ResourceManager.Load(buffer);
            }

            reader.readAsArrayBuffer(file);
        }
    }

    private async addWindow(view: JSX.Element)
    {
        this.setState({
            windows: [
                view,
                ...this.state.windows
            ]
        });
    }

    private closeWindow(id: string)
    {
        this.setState({
            windows: this.state.windows.filter(e => e.key !== id)
        });
    }
    
    private async createResourceFinder(current?: string): Promise<Resource>
    {
        return new Promise<Resource>((resolve, reject) =>
        {
            const id = Tools.Unique();

            this.addWindow(
                <ResourceBrowser 
                    key={id} 
                    current={current}
                    edit={this.createDumpEditor.bind(this)}
                    select={resource => 
                    {
                        this.closeWindow(id);
                        resolve(resource);
                    }}
                    close={(() =>
                    {
                        this.closeWindow(id);
                        reject();
                    })} />
            );
        });
    }
    
    private async createDumpEditor(dump: Dump): Promise<Dump>
    {
        return new Promise<Dump>((resolve, reject) =>
        {
            const id = Tools.Unique();

            this.addWindow(
                <DumpEditor 
                    key={id} 
                    dump={dump}
                    find={this.createResourceFinder.bind(this)}
                    save={newDump => 
                    {
                        this.closeWindow(id);
                        resolve(newDump);
                    }}
                    close={(() =>
                    {
                        this.closeWindow(id);
                        reject();
                    })} />
            );
        });
    }

    private createWorldEditor(): void
    {
        const id = Tools.Unique();

        this.addWindow(
            <WorldEditor 
                key={id}
                edit={this.createDumpEditor.bind(this)}
                close={() => this.closeWindow(id)} />
        );
    }
    
    private createResourceBrowser(): void
    {
        const id = Tools.Unique();

        this.addWindow(
            <ResourceBrowser 
                key={id}
                edit={this.createDumpEditor.bind(this)}
                close={() => this.closeWindow(id)} />
        );
    }
    
    private createOnePlayerDebug(): void
    {
        const id = Tools.Unique();

        this.addWindow(
            <OnePlayerDebug 
                key={id}
                close={() => this.closeWindow(id)} />
        );
    }
    
    private createTwoPlayerDebug(): void
    {
        const id = Tools.Unique();

        this.addWindow(
            <TwoPlayerDebug 
                key={id}
                close={() => this.closeWindow(id)} />
        );
    }
    
    private createTestRunner(): void
    {
        const id = Tools.Unique();

        this.addWindow(
            <TestRunner 
                key={id}
                close={() => this.closeWindow(id)} />
        );
    }

    public render(): JSX.Element
    {
        return (
            <div>
                {this.state.windows}
                <div style={{ textAlign: "center" }}>
                    <Bootstrap.ButtonGroup>
                        <Bootstrap.Button
                            color="primary"
                            onClick={e => this.importButton && this.importButton.click()}>
                                Import
                                <input 
                                    multiple
                                    ref={r => this.importButton = r}
                                    style={{ display: "none" }}
                                    type="file" 
                                    accept=".roboland"
                                    onChange={e => this.readFileList(e.target.files)} />
                        </Bootstrap.Button>
                        <Bootstrap.Button
                            onClick={() => this.createWorldEditor()}>
                                World Editor
                        </Bootstrap.Button>
                        <Bootstrap.Button
                            onClick={() => this.createResourceBrowser()}>
                                Resource Browser
                        </Bootstrap.Button>
                        <Bootstrap.Button
                            onClick={() => this.createOnePlayerDebug()}>
                                One Player Debug
                        </Bootstrap.Button>
                        <Bootstrap.Button
                            onClick={() => this.createTwoPlayerDebug()}>
                                Two Player Debug
                        </Bootstrap.Button>
                        <Bootstrap.Button
                            onClick={() => this.createTestRunner()}>
                                Test Runner
                        </Bootstrap.Button>
                        <Bootstrap.Button
                            color="primary"
                            onClick={() => Helper.Save()}>
                                Export
                        </Bootstrap.Button>
                    </Bootstrap.ButtonGroup>
                </div>
            </div>
        );
    }
}