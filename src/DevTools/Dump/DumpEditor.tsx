import * as React from "react";
import Cristal from "react-cristal";
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

    public renderInner(): JSX.Element
    {
        return (
            <div>
                <Bootstrap.TabContent activeTab={this.state.editMode.toString()}>
                    <Bootstrap.TabPane tabId="1">
                        <div style={{ overflowY: "scroll", height: 400 }}>
                            <TreeView 
                                head={true}
                                dump={this.props.dump}
                                save={dump => this.draft = dump} />
                        </div>
                    </Bootstrap.TabPane>
                    <Bootstrap.TabPane tabId="2">
                        <textarea
                            value={JSON.stringify(this.props.dump, null, 4)}
                            style={{
                                width: "100%",
                                height: 400,
                                fontFamily: "monospace",
                                fontSize: 12,
                                border: "1px solid lightgray",
                                borderRadius: 5
                            }}
                            onChange={v => this.draft = JSON.parse(v.target.value)}>
                        </textarea>
                    </Bootstrap.TabPane>
                </Bootstrap.TabContent>
                <Bootstrap.Button 
                    block
                    color="primary"
                    onClick={() => this.props.onSave(this.draft)}>
                        Save
                </Bootstrap.Button>
                <Bootstrap.Button 
                    block
                    color="danger"
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
                initialSize={{width: 700, height: 550}}
                isResizable={true}
                initialPosition="top-center">
                    {this.renderInner()}
            </Cristal>
        );
    }
}