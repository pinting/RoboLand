import * as React from "react";
import * as Bootstrap from "reactstrap";

import { Resource } from "../lib/Util/RoboPack";
import { Dump } from "../lib/Dump";

interface IChildViewProps
{
    dump: Dump;
    save: (dump: Dump) => void;
    find: (current?: string) => Promise<Resource>;
}

interface IChildViewState
{

}    

export class ChildView extends React.PureComponent<IChildViewProps, IChildViewState>
{
    private getInputType(): string
    {
        switch(this.props.dump.Class)
        {
            case "boolean":
                return "text";
            case "number":
                return "text";
            case "string":
                return "text";
        }
    }

    private format(data: string): string | boolean | number
    {
        switch(this.props.dump.Class)
        {
            case "boolean":
                return data == "true";
            case "number":
                return data; // Because of Infinity, strings are need to be used
            case "string":
                return data;
        }
    }

    private save(data: string)
    {
        this.props.save({
            ...this.props.dump,
            Payload: this.format(data)
        });
    }
    
    public render(): JSX.Element
    {
        const dump = this.props.dump;

        if(!dump)
        {
            return null;
        }

        return (
            <Bootstrap.Table size="100%">
                <tbody>
                    <tr>
                        <td style={{ width: "40%" }}>
                            <Bootstrap.Label>
                                {dump.Name} ({dump.Class}) {dump.Base && <i>+ {dump.Base}</i>}
                            </Bootstrap.Label>
                        </td>
                        <td style={{ width: "60%" }}>
                            <Bootstrap.Input 
                                onChange={e => this.save(e.target.value)}
                                type={this.getInputType() as any} 
                                defaultValue={dump.Payload && dump.Payload.toString()} />
                        </td>
                        <td style={{ width: "5%" }}>
                            <Bootstrap.Input 
                                onChange={e => this.save(e.target.value)}
                                type={this.getInputType() as any} 
                                defaultValue={dump.Payload && dump.Payload.toString()} />
                        </td>
                    </tr>
                </tbody>
            </Bootstrap.Table>
        );
    }
} 