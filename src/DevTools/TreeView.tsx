import * as React from "react";
import * as Bootstrap from "reactstrap";

import { ChildView } from "./ChildView";
import { Resource } from "../lib/Util/RoboPack";
import { Dump } from "../lib/Dump";

// The tree should never reach this
const MAX_DEPTH = 100;

interface ViewProps
{
    dump: Dump;
    save: (dump: Dump) => void;
    find: (current?: string) => Promise<Resource>;
    head?: boolean;
    depth?: number;
}

interface ViewState 
{
    isOpen: boolean;
}

export abstract class TreeView extends React.PureComponent<ViewProps, ViewState>
{
    constructor(props: ViewProps) 
    {
        super(props);

        this.state = {
            isOpen: !!this.props.head
        };
    }

    private renderDump(dump: Dump, save: (dump: Dump) => void)
    {
        switch(dump.Class)
        {
            case "string":
            case "number":
            case "boolean":
                return <ChildView 
                    dump={dump} 
                    find={current => this.props.find(current)}
                    save={(dump) => save(dump)}></ChildView>;
            default:
                return <TreeView
                    depth={(this.props.depth || 0) + 1}
                    dump={dump} 
                    find={current => this.props.find(current)}
                    save={(dump) => save(dump)}></TreeView>;
        }
    }

    private saveChildDump(dump: Dump, index: number): void
    {
        const payload = this.props.dump.Payload as Dump[];

        let newPayload = payload.map((e, i) => 
        {
            if(i === index)
            {
                return dump;
            }

            return e;
        });

        newPayload = newPayload.filter(e => e);

        const newDump = {
            ...this.props.dump,
            Payload: newPayload
        };

        this.props.save(newDump);
    }

    private saveBase(base: string): void
    {
        const newDump = {
            ...this.props.dump,
            Base: base
        };

        this.props.save(newDump);
    }

    private async updateBase(): Promise<void>
    {
        try
        {
            const newBase = await this.props.find(this.props.dump.Base);
    
            this.saveBase(newBase && newBase.Uri);
        }
        catch(e)
        {
            // Window was closed
        }
    }

    private renderItems(): JSX.Element
    {
        return (
            <div>
                {this.props.dump.Payload.map((dump: Dump, index: number) =>
                    <div key={dump.Name + dump.Class}>{this.renderDump(dump, (dump) =>
                        this.saveChildDump(dump, index))}</div>)}
            </div>
        );
    }

    public render(): JSX.Element
    {
        const dump = this.props.dump;

        if(!dump || (this.props.depth || 0) > MAX_DEPTH)
        {
            return null;
        }

        if(!dump.Payload)
        {
            return this.renderDump(dump, (dump) => this.props.save(dump));
        }

        return (
            <div style={{ margin: "5px" }}>
                <Bootstrap.Table size="100%">
                    <tbody>
                        <tr>
                            <td style={{ width: "95%" }}>
                                <Bootstrap.Button
                                    style={{ width: "95%", textAlign: "left" }}
                                    color={this.state.isOpen ? "primary" : "secondary"} 
                                    onClick={() => this.setState({isOpen: !this.state.isOpen})}>
                                        {dump.Name} ({dump.Class}) {dump.Base && <i>+ {dump.Base}</i>}
                                </Bootstrap.Button>
                            </td>
                            <td style={{ width: "5%" }}>
                                <Bootstrap.Button
                                    onClick={() => this.updateBase()}>
                                    Base
                                </Bootstrap.Button>
                            </td>
                        </tr>
                    </tbody>
                </Bootstrap.Table>
                <Bootstrap.Collapse isOpen={this.state.isOpen}>
                    <Bootstrap.Card>
                        <Bootstrap.CardBody>
                            {this.renderItems()}
                        </Bootstrap.CardBody>
                    </Bootstrap.Card>
                </Bootstrap.Collapse>
            </div>
        );
    }
}