import { Adapter } from './Adapter';
import { Processor } from './Processor';
import { IRobot } from './../Element/Robot/IRobot';
import { Parser } from './Parser';
import { Utils } from '../Utils';

export class Runner
{
    private readonly speed: number = 300;

    // Set at every parse
    private counter: number;
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

        this.processor.Context = {
            move: this.adapter.move.bind(this.adapter),
            test: this.adapter.test.bind(this.adapter),
            attack: this.adapter.attack.bind(this.adapter)
        };

        this.counter = 0;
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

        this.OnLine(line.join(" "), this.counter - 1);

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
        const set = () => this.counter = this.parser.Labels.hasOwnProperty(parameters[1]) ? this.parser.Labels[parameters[1]] : -1;

        if(parameters.length == 2)
        {
            set();
            this.ExecuteLine();
        }
        else if(parameters.length >= 4)
        {
            let condition = parameters.slice(3).join(" ");
            
            if(this.processor.Solve(condition) == 1) 
            {
                set();
                this.ExecuteLine();
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

        this.processor.Solve(call);
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

        this.processor.Context[parameters[1]] = this.processor.Solve(call);
    }

    /**
     * Get the line counter value.
     */
    public GetCounter(): number
    {
        return this.counter;
    }

    /**
     * Executed when the next line is called.
     */
    public OnLine: (line: string, count: number) => void = Utils.Noop;
}