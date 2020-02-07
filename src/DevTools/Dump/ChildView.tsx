import * as React from "react";
import * as Bootstrap from "reactstrap";

import { IDump } from "../../lib/IDump";

interface ChildViewProps {
    dump: IDump;
    save: (dump: IDump) => void;
}

interface ChildViewState {

}    

export class ChildView extends React.PureComponent<ChildViewProps, ChildViewState>
{
    private input: string;

    public getInputType(): string
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

    public format(data: string): string | boolean | number
    {
        switch(this.props.dump.Class)
        {
            case "boolean":
                return data == "true";
            case "number":
                return parseFloat(data as string);
            case "string":
                return data;
        }
    }

    public save(data: string)
    {
        this.props.save({
            ...this.props.dump,
            Payload: this.format(data)
        });
    }

    public remove()
    {
        this.props.save(null);
    }
    
    public render(): JSX.Element
    {
        if(!this.props.dump)
        {
            return null;
        }

        return (
            <Bootstrap.Table size="100%">
                <tbody>
                    <tr>
                        <td style={{ width: "40%" }}>
                            <Bootstrap.Label>
                                {this.props.dump.Name} ({this.props.dump.Class})
                            </Bootstrap.Label>
                        </td>
                        <td style={{ width: "55%" }}>
                            <Bootstrap.Input 
                                onChange={e => this.input = e.target.value}
                                type={this.getInputType() as any} 
                                value={this.props.dump.Payload && this.props.dump.Payload.toString()} />
                        </td>
                        <td style={{ width: "5%" }}>
                            <Bootstrap.Button
                                onClick={() => this.save(this.input)}>
                                Save
                            </Bootstrap.Button>
                        </td>
                    </tr>
                </tbody>
            </Bootstrap.Table>
        );
    }
} 