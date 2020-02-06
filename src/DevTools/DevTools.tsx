import * as React from "react";
import * as Bootstrap from "reactstrap";
import Cristal from "react-cristal";

import { Shared } from "../Game/Shared";
import { WorldEditor } from "./WorldEditor";
import { Tools } from "../lib/Util/Tools";
import { DumpEditor } from "./Dump/DumpEditor";
import { IDump } from "../lib/IDump";
import { OnePlayerDebug } from "./OnePlayerDebug";
import { TwoPlayerDebug } from "./TwoPlayerDebug";
import { RunTests } from "./RunTests";

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
            <WorldEditor 
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
            <OnePlayerDebug 
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
            <TwoPlayerDebug 
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
            <RunTests 
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
                            onClick={() => this.createWorldEditor()}>
                                World Editor
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
                                Run Tests
                        </Bootstrap.Button>
                    </Bootstrap.ButtonGroup>
                </div>
            </div>
        );
    }
}