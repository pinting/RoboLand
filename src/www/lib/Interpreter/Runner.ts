import { Adapter } from './Adapter';
import { Processor } from './Processor';
import { IRobot } from './../Element/Robot/IRobot';
import { Parser } from './Parser';

export class Runner
{
    private readonly speed: number = 300;

    // Set at every parse
    private counter: number;
    private context: { [id: string] : number | Function; };
    private interval;

    // Set in constructor
    private adapter: Adapter;
    private processor: Processor;
    private parser: Parser;

    public constructor(robot: IRobot)
    {
        this.adapter = new Adapter(robot);
        this.processor = new Processor;
        this.parser = new Parser;
    }

    /**
     * Start the execution
     * @param code
     */
    public Run(code: string)
    {
        this.Stop();
        this.parser.Parse(code);

        this.counter = 0;
        this.context = {
            move: this.adapter.move.bind(this.adapter),
            test: this.adapter.test.bind(this.adapter),
            attack: this.adapter.attack.bind(this.adapter)
        };

        this.interval = setInterval(() => this.ExecuteLine(), this.speed);
    }

    /**
     * Stop the execution.
     */
    public Stop()
    {
        if(this.interval)
        {
            clearInterval(this.interval);
        }
    }

    /**
     * Execute the next line
     */
    private ExecuteLine(): void
    {
        if(this.counter < 0 && this.counter >= this.parser.Code.length)
        {
            this.Stop();
            return;
        }

        let line = this.parser.Code[this.counter++];

        try
        {
            switch(line[0])
            {
                case "LABEL":
                    break;
                case "GOTO":
                    this.ExecuteGoto(line);
                    break;
                case "CALL":
                    this.ExecuteCall(line);
                    break;
                case "SET":
                    this.ExecuteSet(line);
                    break;
            }
        }
        catch(e)
        {
            this.Stop();
        }
    }

    /**
     * Execute a GOTO command.
     * @param parameters 
     */
    private ExecuteGoto(parameters: string[]): void
    {
        if(parameters.length == 2)
        {
            this.counter = this.parser.Labels[parameters[1]] || -1;
        }
        else if(parameters.length >= 4)
        {
            let condition = parameters.slice(3).join(" ");
            
            if(this.processor.Resolve(condition, this.context) != 0)
            {
                this.counter = this.parser.Labels[parameters[1]] || -1;
            }
        }
        else
        {
            throw new Error("Invalid GOTO");
        }
    }

    /**
     * Execute a CALL command.
     * @param parameters 
     */
    private ExecuteCall(parameters: string[]): void
    {
        if(parameters.length < 2)
        {
            throw new Error("Invalid CALL");
        }
        
        let call = parameters.slice(1).join(" ");

        this.processor.Resolve(call, this.context);
    }

    /**
     * Execute a SET command.
     * @param parameters 
     */
    private ExecuteSet(parameters: string[]): void
    {
        if(parameters.length < 3)
        {
            throw new Error("Invalid SET");
        }

        let call = parameters.slice(2).join(" ");

        this.context[parameters[1]] = this.processor.Resolve(call, this.context);
    }
}