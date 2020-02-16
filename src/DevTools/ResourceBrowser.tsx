import * as React from "react";
import * as Bootstrap from "reactstrap";
import Cristal from "react-cristal";

import { ResourceManager } from "../lib/Util/ResourceManager";
import { Helper } from "../Helper";
import { Tools } from "../lib/Util/Tools";
import { Resource } from "../lib/RoboPack";
import { Dump } from "../lib/Dump";

interface ViewProps
{
    close: () => void;
    edit: (dump: Dump) => Promise<Dump>;
    select?: (resource: Resource) => void;
    current?: string;
}

interface ViewState
{
    resources: Resource[];
}

export class ResourceBrowser extends React.PureComponent<ViewProps, ViewState>
{
    private onChangeEvent: number;
    private uploadButton: HTMLInputElement;

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

    private async readFileList(list: FileList): Promise<void>
    {
        for(var i = 0; i < list.length; i++)
        {
            const file = list[i];
            const reader = new FileReader();

            reader.onload = () =>
            {
                const buffer = reader.result as ArrayBuffer;
                const meta = Resource.GetMeta(buffer);

                // Only allow parsed types
                if(meta.Extension)
                {
                    ResourceManager.Add(file.name, buffer);
                }
            }

            reader.readAsArrayBuffer(file);
        }
    }

    private async editResource(resource: Resource): Promise<void>
    {
        let dump: Dump;

        try {
            const raw = Tools.ANSIToUTF16(resource.Buffer);
            
            dump = JSON.parse(raw);
        }
        catch(e)
        {
            // Not a JSON
            return;
        }

        let newDump: Dump;
        
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
            const newBuffer = Tools.UTF16ToANSI(newRaw);
    
            await resource.SetBuffer(newBuffer);
        }
        else
        {
            ResourceManager.Remove(resource.Uri);
        }
    }

    private deleteAll(): void
    {
        ResourceManager.Clear();
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
                        onClick={() => this.editResource(resource)}>
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
                <Bootstrap.Button
                    color="primary"
                    style={{ margin: 0, width: "50%" }}
                    onClick={e => this.uploadButton && this.uploadButton.click()}>
                        Add resource
                        <input 
                            multiple
                            ref={r => this.uploadButton = r}
                            style={{ display: "none" }}
                            type="file" 
                            accept="application/json,image/png"
                            onChange={e => this.readFileList(e.target.files)} />
                </Bootstrap.Button>
                <Bootstrap.Button
                    color="danger"
                    style={{ margin: 0, width: "50%" }}
                    onClick={e => this.deleteAll()}>
                    Delete all resources
                </Bootstrap.Button>
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