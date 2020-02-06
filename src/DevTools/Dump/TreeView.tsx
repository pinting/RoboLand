import * as React from "react";
import * as Bootstrap from "reactstrap";

import { IDump } from "../../lib/IDump";
import { ChildView } from "./ChildView";

interface TreeViewProps
{
    dump: IDump;
    save: (dump: IDump) => void;
    head?: boolean;
}

interface TreeViewState 
{
    isOpen: boolean;
}

export abstract class TreeView extends React.PureComponent<TreeViewProps, TreeViewState>
{
    constructor(props: TreeViewProps) 
    {
        super(props);

        this.state = {
            isOpen: false
        };
    }

    private renderDump(dump: IDump, save: (dump: IDump) => void)
    {
        switch(dump.Class)
        {
            case "string":
            case "number":
            case "boolean":
                return <ChildView 
                    dump={dump} 
                    save={(dump) => save(dump)}></ChildView>;
            default:
                return <TreeView
                    dump={dump} 
                    save={(dump) => save(dump)}></TreeView>;
        }
    }

    public saveChildDump(dump: IDump, index: number): void
    {
        const payload = this.props.dump.Payload as IDump[];

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

    public Remove()
    {
        this.props.save(null);
    }

    public renderItems(): JSX.Element
    {
        return (
            <div>
                {this.props.dump.Payload.map((dump: IDump, index: number) =>
                    <div key={dump.Name + dump.Class}>{this.renderDump(dump, (dump) =>
                        this.saveChildDump(dump, index))}</div>)}
            </div>
        );
    }

    public render(): JSX.Element
    {
        if(!this.props.dump)
        {
            return null;
        }

        if(!this.props.dump.Payload || !this.props.dump.Payload.length)
        {
            return this.renderDump(this.props.dump, (dump) => this.props.save(dump));
        }

        if(this.props.head)
        {
            return this.renderItems();
        }

        return (
            <div style={{ margin: "5px" }}>
                <Bootstrap.Table size="100%">
                    <tbody>
                        <tr>
                            <td style={{ width: "100%" }}>
                                <Bootstrap.Button
                                    style={{ width: "100%", textAlign: "left" }}
                                    color={this.state.isOpen ? "primary" : "secondary"} 
                                    onClick={() => this.setState({isOpen: !this.state.isOpen})}>
                                        {this.props.dump.Name} ({this.props.dump.Class})
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