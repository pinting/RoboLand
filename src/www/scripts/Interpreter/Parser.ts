import { IActor } from './../Element/Actor/IActor';
import { Adapter } from './Adapter';
import { Processor } from './Processor';

export class Parser
{
    public Code: string[][];
    public Labels: { [id: string] : number; };

    /**
     * Parse the given code.
     * @param lines
     */
    public Parse(lines: string): void
    {
        this.Code = [];
        this.Labels = {};

        lines.split("\n").forEach(line => this.ParseLine(line));
    }

    /**
     * Parse the given line.
     * @param line
     */
    private ParseLine(line: string): void
    {
        // Skip the line if it is comment
        if(line[0] == "#")
        {
            return;
        }

        let parameters = line.split(" ");

        switch(parameters[0])
        {
            case "LABEL":
                this.ParseLabel(parameters);
                break;
            case "GOTO":
            case "CALL":
            case "SET":
                this.ParseCode(parameters);
                break;
        }
    }

    /**
     * Parse a LABEL command.
     * @param parameters 
     */
    private ParseLabel(parameters: string[]): void
    {
        if(parameters.length != 2) 
        {
            throw new Error("Invalid LABEL");
        }

        this.Labels[parameters[1]] = this.Code.length;
    }

    /**
     * Parse a GOTO/CALL/SET command.
     * @param parameters 
     */
    private ParseCode(parameters: string[]): void
    {
        this.Code.push(parameters);
    }
}