import { IBlock } from './IBlock';

export class Calculator
{
    /**
     * Get the position of the nearest bracket closure.
     * @param input 
     */
    private GetInner(input: string): Array<number>
    {
        if(input.indexOf("(") < 0) return null;

        let start = 0;
        let brackets = 0;

        for(let i = 0; i < input.length; i++)
        {
            switch(input[i])
            {
                case "(":
                    if(brackets++ == 0) start = i;
                    break;
                case ")":
                    if(brackets-- == 1) return [start, i];
                    break;
            }
        }

        return null;
    }

    /**
     * Create a new IBlock from a string input (or return the input itself).
     * @param input 
     */
    private GetBlock(input): IBlock | string
    {
        const get = (input: string, a: "*" | "/" | "+" | "-", b: "*" | "/" | "+" | "-"): IBlock | string =>
        {
            let ap = input.indexOf(a);
            let bp = input.indexOf(b);
        
            if(ap < 0 && bp < 0) return input;
        
            if(ap < 0) ap = input.length;
            if(bp < 0) bp = input.length;
        
            let first = ap < bp ? ap : bp;
            let type = ap < bp ? a : b;
        
            return {
                left: input.substring(0, first),
                right: input.substring(first + 1, input.length),
                method: <"*" | "/" | "+" | "-">type
            };
        }

        if(!input.method)
        {
            input = get(input, "+", "-");
    
            if(!input.method) input = get(input, "*", "/");
        }

        return input;
    }

    /**
     * Try to create as many blocks as possible from a block.
     * @param block 
     */
    private ExtractBlock(block): IBlock | string
    {
        block = this.GetBlock(block);

        if(!block.method) return block;

        block.left = this.ExtractBlock(block.left);
        block.right = this.ExtractBlock(block.right);
    
        return block;
    }

    /**
     * Calculate the result of a block tree.
     * @param block
     */
    private CalculateBlock(block): number
    {
        if(!block.method) 
        {
            const result = parseFloat(block);

            if(result == NaN) throw new Error("NaN was the result!");

            return result;
        }
    
        switch(block.method)
        {
            case "+":
                return this.CalculateBlock(block.left) + this.CalculateBlock(block.right);
            case "-":
                return this.CalculateBlock(block.left) - this.CalculateBlock(block.right);
            case "*":
                return this.CalculateBlock(block.left) * this.CalculateBlock(block.right);
            case "/":
                return this.CalculateBlock(block.left) / this.CalculateBlock(block.right);
        }
    }

    /**
     * Get the result of a simple math problem. You can use the 4 basic operator plus brackets.
     * @param input 
     */
    public Calculate(input: string): number
    {
        let range: Array<number>;

        while((range = this.GetInner(input)) != null)
        {
            const result = this.Calculate(input.substring(range[0] + 1, range[1]));

            input = input.substring(0, range[0]) + result + input.substring(range[1] + 1, input.length);
        }

        let block = this.ExtractBlock(input);

        return this.CalculateBlock(block);
    }

    /**
     * Resolve functions and variables.
     * @param input
     * @param context JavaScript Object.
     */
    public Resolve(input: string, context: Object): number
    {
        let start: RegExpMatchArray;

        // Resolve functions
        while((start = input.match(/[A-Za-z][A-Za-z0-9]*\(/)) != null)
        {
            const range = this.GetInner(input.substr(start.index)).map(p => p + start.index);
            const name = input.substring(start.index, range[0]);

            const args = [];
            const resolved = [];
    
            let last = range[0] + 1;
            let brackets = 0;
            
            for(let i = range[0] + 1; i <= range[1]; i++)
            {
                const c = input[i];

                if(c == "(")
                {
                    brackets++;
                }
                else if((c == ")" && --brackets == -1) || (c == "," && brackets == 0))
                {
                    args.push(input.substring(last, i).trim());
                    last = i + 1;
                }
            }

            // Resolve arguments
            args.forEach(arg => resolved.push(this.Resolve(arg, context)));

            // Get result
            const result = context[name].apply(context, resolved);

            // Replace function with the result
            input = input.substring(0, start.index) + result + input.substring(range[1] + 1, input.length);
        }

        // Replace variables with actual data
        while((start = input.match(/[A-Za-z][A-Za-z0-9]*/)) != null)
        {
            const result = context[start[0]];

            input = input.substring(0, start.index) + result + input.substring(start.index + start[0].length, input.length);
        }

        // Solve the math problem
        return this.Calculate(input);
    }
}