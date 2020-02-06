import * as React from "react";
import * as Bootstrap from "reactstrap";
import Cristal from "react-cristal";

import { Shared } from "../Game/Shared";
import { WorldView } from "./WorldView";
import { Tools } from "../lib/Util/Tools";
import { DumpEditor } from "./Dump/DumpEditor";
import { IDump } from "../lib/IDump";
import { OnePlayerView } from "./OnePlayerView";
import { TwoPlayerView } from "./TwoPlayerView";
import { TestsView } from "./TestsView";
import { ResourceView } from "./ResourceView";
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
import { NormalCell } from "../lib/Unit/Cell/NormalCell";
import { Logger } from "../lib/Util/Logger";

interface DevToolsProps {

}

interface DevToolsState {
    views: JSX.Element[];
}

export class DevTools extends React.PureComponent<DevToolsProps, DevToolsState>
{
    constructor(props) 
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
            PlayerActor,
            Logger,
            SimplexNoise,
            ResourceManager,
            Polygon,
            Body,
            Http
        });
    
        this.state = {
            views: []
        };
    }

    public async addView(view: JSX.Element)
    {
        this.setState({
            views: [
                view,
                ...this.state.views
            ]
        });
    }
    
    public async createDumpEditor(dump: IDump): Promise<IDump>
    {
        return new Promise<IDump>((resolve, reject) =>
        {
            const id = Tools.Unique();

            this.addView(
                <DumpEditor 
                    key={id} 
                    dump={dump}
                    onSave={newDump => resolve(newDump)}
                    onClose={(() => {
                        reject();
                        this.setState({
                            views: this.state.views.filter(e => e.key !== id)
                        });
                    })} />
            );
        });
    }

    public createWorldEditor(): void
    {
        const id = Tools.Unique();

        this.addView(
            <WorldView 
                key={id}
                onEditor={this.createDumpEditor.bind(this)}
                onClose={(() => this.setState({
                    views: this.state.views.filter(e => e.key !== id)
                }))} />
        );
    }
    
    public createResourceBrowser(): void
    {
        const id = Tools.Unique();

        this.addView(
            <ResourceView 
                key={id}
                onEditor={this.createDumpEditor.bind(this)}
                onClose={(() => this.setState({
                    views: this.state.views.filter(e => e.key !== id)
                }))} />
        );
    }
    
    public createOnePlayerDebug(): void
    {
        const id = Tools.Unique();

        this.addView(
            <OnePlayerView 
                key={id}
                onClose={(() => this.setState({
                    views: this.state.views.filter(e => e.key !== id)
                }))} />
        );
    }
    
    public createTwoPlayerDebug(): void
    {
        const id = Tools.Unique();

        this.addView(
            <TwoPlayerView 
                key={id}
                onClose={(() => this.setState({
                    views: this.state.views.filter(e => e.key !== id)
                }))} />
        );
    }
    
    public createRunTests(): void
    {
        const id = Tools.Unique();

        this.addView(
            <TestsView 
                key={id}
                onClose={(() => this.setState({
                    views: this.state.views.filter(e => e.key !== id)
                }))} />
        );
    }

    public render(): JSX.Element
    {
        return (
            <div>
                {this.state.views}
                <div style={{ textAlign: "center" }}>
                    <Bootstrap.ButtonGroup>
                        <Bootstrap.Button
                            color="primary"
                        onClick={() => Helper.Save()}>
                                Export
                        </Bootstrap.Button>
                        <Bootstrap.Button
                            onClick={() => this.createWorldEditor()}>
                                World Editor
                        </Bootstrap.Button>
                        <Bootstrap.Button
                            onClick={() => this.createResourceBrowser()}>
                                Resource Manager
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
                            onClick={() => this.createRunTests()}>
                                Tests
                        </Bootstrap.Button>
                    </Bootstrap.ButtonGroup>
                </div>
            </div>
        );
    }
}