import * as React from "react";
import * as Bootstrap from "reactstrap";
import Cristal from "react-cristal";

import { ResourceManager, Resource } from "../lib/Util/ResourceManager";
import { IDump } from "../lib/IDump";
import { Helper } from "../Helper";
import { Tools } from "../lib/Util/Tools";

interface ViewProps {
    close: () => void;
    edit: (dump: IDump) => Promise<IDump>;
    select?: (resource: Resource) => void;
    current?: string;
}

interface ViewState {
    resources: Resource[];
}

export class ResourceBrowser extends React.PureComponent<ViewProps, ViewState>
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

    private async edit(resource: Resource): Promise<void>
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
            newDump = await this.props.edit(dump);
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

    private renderResource(resource: Resource, background = "white"): JSX.Element
    {
        return (  
            <tr key={resource.Uri || Tools.Unique()} style={{ background }}>
                <td style={{ width: "60%" }}>
                    {resource.Uri}
                </td>
                <td style={{ width: "10%" }}>
                    <Bootstrap.Button
                        onClick={() => this.edit(resource)}>
                            Edit
                    </Bootstrap.Button>
                </td>
                <td style={{ width: "10%" }}>
                    <Bootstrap.Button
                        onClick={() => ResourceManager.Remove(resource.Uri)}>
                            Remove
                    </Bootstrap.Button>
                </td>
                <td style={{ width: "10%" }}>
                    <Bootstrap.Button
                        onClick={() => Helper.Save(resource)}>
                            Save
                    </Bootstrap.Button>
                </td>
                {this.props.select && <td style={{ width: "10%" }}>
                    <Bootstrap.Button
                        onClick={() => this.props.select(resource)}>
                            Select
                    </Bootstrap.Button>
                </td>}
            </tr>
        );
    }

    public componentWillUnmount() 
    {
        ResourceManager.OnChange.Remove(this.onChangeEvent);
    }
    
    private renderInner(): JSX.Element
    {
        const current = this.state.resources.find(r => this.props.current && r.Uri == this.props.current);

        return (
            <div style={{ overflowY: "scroll", height: 450 }}>
                <Bootstrap.Table size="100%">
                    <tbody>
                        {current && this.renderResource(current, "lightgray")}
                        {this.state.resources
                            .filter(r => !this.props.current || r.Uri != this.props.current)
                                .map(r => this.renderResource(r))}
                    </tbody>
                </Bootstrap.Table>
            </div>
        );
    }
    
    public render(): JSX.Element
    {
        return (
            <Cristal 
                onClose={() => this.props.close()}
                title="Resource Browser"
                initialSize={{width: 600, height: 500}}
                isResizable={true}
                initialPosition="top-center">
                    {this.renderInner()}
            </Cristal>
        );
    }
}