import { IBlock } from './IBlock';

export class Calculator
{       
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

    private ParseBlock(input: string, a: string, b: string)
    {
        let ap = input.indexOf(a);
        let bp = input.indexOf(b);
    
        if(ap < 0 && bp < 0) return input;
    
        if(ap < 0) ap = input.length;
        if(bp < 0) bp = input.length;
    
        let first = ap < bp ? ap : bp;
        let type = ap < bp ? a : b;
    
        return {
            a: input.substring(0, first),
            m: type,
            b: input.substring(first + 1, input.length)
        };
    }

    private GetBlock(input) 
    {
        if(!input.m) 
        {
            input = this.ParseBlock(input, "+", "-");
    
            if(!input.m) input = this.ParseBlock(input, "*", "/");
        }

        return input;
    }

    private ExtractBlock(block)
    {
        block = this.GetBlock(block);

        if(!block.m) return block;

        block.a = this.ExtractBlock(block.a);
        block.b = this.ExtractBlock(block.b);
    
        return block;
    }

    private CalculateBlock(block)
    {
        if(!block.m) 
        {
            const result = parseFloat(block);

            if(result == NaN) throw new Error("NaN was the result!");

            return result;
        }
    
        switch(block.m)
        {
            case "+":
                return this.CalculateBlock(block.a) + this.CalculateBlock(block.b);
            case "-":
                return this.CalculateBlock(block.a) - this.CalculateBlock(block.b);
            case "*":
                return this.CalculateBlock(block.a) * this.CalculateBlock(block.b);
            case "/":
                return this.CalculateBlock(block.a) / this.CalculateBlock(block.b);
        }
    }

    public Calculate(input: string): number
    {
        let range = null;

        while((range = this.GetInner(input)) != null)
        {
            const result = this.Calculate(input.substring(range[0] + 1, range[1]));

            input = input.substring(0, range[0]) + result + input.substring(range[1] + 1, input.length);
        }

        let block = this.ExtractBlock(input);

        return this.CalculateBlock(block);
    }
}