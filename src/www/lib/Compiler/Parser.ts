export class Parser
{
    private readonly invalid: string[] = [
        "eval",
        "abstract",
        "arguments",
        "await",
        "boolean",
        "break",
        "byte",
        "case",
        "catch",
        "char",
        "class",
        "const",
        "continue",
        "debugger",
        "default",
        "delete",
        "do",
        "double",
        "else",
        "enum",
        "eval",
        "export",
        "extends",
        "final",
        "finally",
        "float",
        "for",
        "function",
        "if",
        "implements",
        "import",
        "in",
        "instanceof",
        "int",
        "interface",
        "let",
        "long",
        "native",
        "new",
        "null",
        "package",
        "private",
        "protected",
        "public",
        "return",
        "short",
        "static",
        "super",
        "switch",
        "synchronized",
        "this",
        "throw",
        "throws",
        "transient",
        "try",
        "typeof",
        "var",
        "void",
        "volatile",
        "while",
        "with",
        "yield",
        "window",
        "goto"
    ];

    private code: string[];
    private labels: { [id: string] : number; };

    /**
     * Parse the given code.
     * 
     * Example:
     * 
     * GOTO v IF test(0, 1)
     * # Move horizontally
     * LABEL h
     * CALL move(1, 0)
     * CALL move(-1, 0)
     * GOTO h
     * # Move vertically
     * LABEL v
     * CALL move(0, 1)
     * CALL move(0, -1)
     * GOTO v
     * 
     * @param lines
     */
    public Parse(lines: string): void
    {
        this.code = [];
        this.labels = {};

        lines.split("\n").forEach(line => this.ParseLine(line));
    }

    /**
     * Parse the given line.
     * @param line
     */
    private ParseLine(line: string): void
    {
        if(this.IsInvalid(line))
        {
            throw new Error("Invalid keyword");
        }

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
                this.ParseGoto(parameters);
                break;
            case "CALL":
                this.ParseCall(parameters);
                break;
            case "SET":
                this.ParseSet(parameters);
                break;
        }
    }

    /**
     * Parse a LABEL command.
     * 
     * Example:
     * 
     * LABEL test  <-\
     * GOTO test ----/ This will be an infinite loop.
     * 
     * @param parameters 
     */
    private ParseLabel(parameters: string[]): void
    {
        if(parameters.length != 2) 
        {
            throw new Error("Invalid LABEL");
        }

        this.labels[parameters[1]] = this.code.length - 1;
    }

    /**
     * Parse a GOTO command.
     * 
     * Example:
     * 
     * SET bar false
     * LABEL test
     * GOTO test IF bar == true
     * SET bar true
     * GOTO test
     * 
     * This will be again an infinite loop.
     * 
     * @param parameters 
     */
    private ParseGoto(parameters: string[]): void
    {
        if(parameters.length == 2)
        {
            this.code.push(`goto("${parameters[1]}");`);
        }
        else if(parameters.length >= 4)
        {
            let condition = parameters.slice(3).join(" ");
            
            this.code.push(`if(${condition}) goto("${parameters[1]}");`);
        }
        else
        {
            throw new Error("Invalid GOTO");
        }
    }

    /**
     * Parse a CALL command.
     * @param parameters 
     */
    private ParseCall(parameters: string[]): void
    {
        if(parameters.length < 2)
        {
            throw new Error("Invalid CALL");
        }
        
        let call = parameters.slice(1).join(" ");

        this.code.push(`${call};`)
    }

    /**
     * Parse a SET command.
     * @param parameters 
     */
    private ParseSet(parameters: string[]): void
    {
        if(parameters.length < 3)
        {
            throw new Error("Invalid SET");
        }

        let call = parameters.slice(2).join(" ");

        this.code.push(`this.${parameters[1]} = ${call};`)
    }

    /**
     * Test a line for invalid keywords.
     * @param line
     */
    private IsInvalid(line: string): boolean
    {
        for(let i in this.invalid)
        {
            let e = this.invalid[i];

            if(line.indexOf(e) >= 0)
            {
                return true;
            }
        }

        return false;
    }
    
    /**
     * Get the parsed code.
     */
    public GetCode(): string[]
    {
        return this.code;
    }

    /**
     * Get the parsed labels.
     */
    public GetLabels(): { [id: string] : number; }
    {
        return this.labels;
    }
}