import * as React from "react";
import Cristal from "react-cristal";
import classnames from "classnames";
import * as Bootstrap from "reactstrap";

import { TreeView } from "./TreeView";
import { Resource } from "../lib/RoboPack";
import { Dump } from "../lib/Dump";

interface ViewProps
{
    dump: Dump;
    close: () => void;
    save: (dump: Dump) => void;
    find: (current?: string) => Promise<Resource>
}

interface ViewState
{
    editMode: number;
    draft: Dump;
}

export class DumpEditor extends React.PureComponent<ViewProps, ViewState>
{
    constructor(props)
    {
        super(props);

        this.state = {
            editMode: 1,
            draft: this.props.dump
        };
    }

    private updateDraft(dump: string | Dump)
    {
        if(typeof dump != "string")
        {
            this.setState({ draft: dump });
            return;
        }

        try
        {
            this.setState({ draft: JSON.parse(dump) });
        }
        catch(e)
        {
            // Silent
        }
    }

    private renderInner(): JSX.Element
    {
        return (
            <div>
                <Bootstrap.Nav tabs>
                    <Bootstrap.NavItem>
                        <Bootstrap.NavLink
                            className={classnames({ active: this.state.editMode === 1 })}
                            onClick={() => this.setState({ editMode: 1 })}>
                                Simple
                        </Bootstrap.NavLink>
                    </Bootstrap.NavItem>
                    <Bootstrap.NavItem>
                        <Bootstrap.NavLink
                            className={classnames({ active: this.state.editMode === 2 })}
                            onClick={() => this.setState({ editMode: 2 })}>
                                Code
                        </Bootstrap.NavLink>
                    </Bootstrap.NavItem>
                </Bootstrap.Nav>
                <Bootstrap.TabContent activeTab={this.state.editMode.toString()}>
                    <Bootstrap.TabPane tabId="1">
                        <div style={{ overflowY: "scroll", height: 430 }}>
                            <TreeView 
                                head={true}
                                dump={this.state.draft}
                                find={current => this.props.find(current)}
                                save={dump => this.updateDraft(dump)} />
                        </div>
                    </Bootstrap.TabPane>
                    <Bootstrap.TabPane tabId="2">
                        <textarea
                            value={JSON.stringify(this.state.draft, null, 4)}
                            style={{
                                width: "100%",
                                height: 430,
                                fontFamily: "monospace",
                                fontSize: 12,
                                border: "1px solid lightgray",
                                borderRadius: 5
                            }}
                            onChange={v => this.updateDraft(v.target.value)}>
                        </textarea>
                    </Bootstrap.TabPane>
                </Bootstrap.TabContent>
                <Bootstrap.Button 
                    color="success"
                    style={{ margin: 0, width: "50%" }}
                    onClick={() => this.props.save(this.state.draft)}>
                        Save
                </Bootstrap.Button>
                <Bootstrap.Button 
                    color="danger"
                    style={{ margin: 0, width: "50%" }}
                    onClick={() => this.props.save(null)}>
                        Delete
                </Bootstrap.Button>
            </div>
        );
    }
    
    public render(): JSX.Element
    {
        return (
            <Cristal 
                onClose={() => this.props.close()}
                title="Dump Editor"
                initialSize={{width: 700, height: 560}}
                isResizable={true}
                initialPosition="top-center">
                    {this.renderInner()}
            </Cristal>
        );
    }
}