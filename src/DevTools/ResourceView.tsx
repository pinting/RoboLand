import * as React from "react";
import * as Bootstrap from "reactstrap";
import Cristal from "react-cristal";

import { ResourceManager, Resource } from "../lib/Util/ResourceManager";
import { IDump } from "../lib/IDump";
import { Helper } from "../Helper";
import { Tools } from "../lib/Util/Tools";

interface ViewProps {
    onClose: () => void;
    onEditor: (dump: IDump) => Promise<IDump>;
}

interface ViewState {
    resources: Resource[];
}

export class ResourceView extends React.PureComponent<ViewProps, ViewState>
{
    private onChangeEvent: number;

    public constructor(props: ViewProps)
    {
        super(props);

        this.state = {
            resources: ResourceManager.GetList()
        };

        this.onChangeEvent = ResourceManager.OnChange.Add(() => 
        {
            this.setState({
                resources: ResourceManager.GetList()
            });

            this.forceUpdate();
        });
    }

    public async edit(resource: Resource): Promise<void>
    {
        let dump: IDump;

        try {
            const raw = Tools.BufferToString(resource.Buffer);
            
            dump = JSON.parse(raw);
        }
        catch(e)
        {
            // Not a JSON
            return;
        }

        let newDump: IDump;
        
        try 
        {
            newDump = await this.props.onEditor(dump);
        }
        catch(e)
        {
            // Editor was closed
            return;
        }

        if(newDump)
        {
            const newRaw = JSON.stringify(newDump);
            const newBuffer = Tools.StringToBuffer(newRaw);
    
            await resource.SetBuffer(newBuffer);
        }
        else
        {
            ResourceManager.Remove(resource.Uri);
        }
    }

    public componentWillUnmount() 
    {
        ResourceManager.OnChange.Remove(this.onChangeEvent);
    }
    
    public renderInner(): JSX.Element
    {
        return (
            <div style={{ overflowY: "scroll", height: 450 }}>
                <Bootstrap.Table size="100%">
                    <tbody>
                        {this.state.resources.map(r => 
                            <tr key={r.Uri}>
                                <td style={{ width: "80%" }}>
                                    {r.Uri}
                                </td>
                                <td style={{ width: "10%" }}>
                                    <Bootstrap.Button
                                        onClick={() => this.edit(r)}>
                                            Edit
                                    </Bootstrap.Button>
                                </td>
                                <td style={{ width: "10%" }}>
                                    <Bootstrap.Button
                                        onClick={() => ResourceManager.Remove(r.Uri)}>
                                            Remove
                                    </Bootstrap.Button>
                                </td>
                                <td style={{ width: "10%" }}>
                                    <Bootstrap.Button
                                        onClick={() => Helper.Save(r)}>
                                            Save
                                    </Bootstrap.Button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Bootstrap.Table>
            </div>
        );
    }
    
    public render(): JSX.Element
    {
        return (
            <Cristal 
                onClose={() => this.props.onClose()}
                title="Resource Browser"
                initialSize={{width: 500, height: 500}}
                isResizable={true}
                initialPosition="top-center">
                    {this.renderInner()}
            </Cristal>
        );
    }
}