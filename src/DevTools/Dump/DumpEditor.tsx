import * as React from "react";
import Cristal from "react-cristal";
import classnames from "classnames";
import * as Bootstrap from "reactstrap";

import { Shared } from "../../Game/Shared";
import { IDump } from "../../lib/IDump";
import { TreeView } from "./TreeView";

interface DumpEditorProps {
    dump: IDump;
    onClose: () => void;
    onSave: (dump: IDump) => void;
}

interface DumpEditorState {
    editMode: number;
}

export class DumpEditor extends React.PureComponent<DumpEditorProps, DumpEditorState>
{
    private draft: IDump;
    
    constructor(props)
    {
        super(props);

        this.state = {
            editMode: 1
        };
    }

    private updateDraft(dump: string | IDump)
    {
        if(typeof dump != "string")
        {
            this.draft = dump;
            return;
        }

        try
        {
            this.draft = JSON.parse(dump);
        }
        catch(e)
        {
            // Silent
        }
    }

    public renderInner(): JSX.Element
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
                                dump={this.props.dump}
                                save={dump => this.updateDraft(dump)} />
                        </div>
                    </Bootstrap.TabPane>
                    <Bootstrap.TabPane tabId="2">
                        <textarea
                            value={JSON.stringify(this.props.dump, null, 4)}
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
                    onClick={() => this.props.onSave(this.draft)}>
                        Save
                </Bootstrap.Button>
                <Bootstrap.Button 
                    color="danger"
                    style={{ margin: 0, width: "50%" }}
                    onClick={() => this.props.onSave(null)}>
                        Delete
                </Bootstrap.Button>
            </div>
        );
    }
    
    public render(): JSX.Element
    {
        return (
            <Cristal 
                onClose={() => this.props.onClose()}
                title="Dump Editor"
                initialSize={{width: 700, height: 560}}
                isResizable={true}
                initialPosition="top-center">
                    {this.renderInner()}
            </Cristal>
        );
    }
}