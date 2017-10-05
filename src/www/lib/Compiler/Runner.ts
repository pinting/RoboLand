import { ICommand } from './ICommand';
import { IMessage } from './IMessage';
import { Parser } from './Parser';
import { Adapter } from './Adapter';
import { Map } from "../Map";
import { IRobot } from "../Element/Robot/IRobot";
import { Coord } from "../Coord";
import { CellType } from "../Element/Cell/CellType";

declare var self: any;

export class Runner
{
    private readonly speed: number = 200;

    private adapter: Adapter;
    private parser: Parser;
    private worker: Worker;

    /**
     * Construct a new Runner which will control the given robot with the given sets of code.
     * @param robot 
     */
    constructor(robot: IRobot)
    {
        var blob = new Blob(["(function $", this.Worker.toString(), ")()"], { type: "application/javascript" });
        var url = URL.createObjectURL(blob);
        
        this.adapter = new Adapter(robot);
        this.worker = new Worker(url);
        this.parser = new Parser();

        /**
         * Handler for new commands (from the worker)
         */
        this.worker.onmessage = (e) =>
        {
            let command: ICommand = e.data;

            if(!command || command.length < 1) 
            {
                return;
            }

            this.worker.postMessage(<IMessage>{
                type: "result",
                name: command[0],
                result: this.adapter[command[0]].apply(this.adapter, command.slice(1))
            });
        };
    }

    /**
     * Push new code to the worker.
     */
    public Push(code: string): void
    {
        this.parser.Parse(code);
        this.worker.postMessage(<IMessage>{
            type: "init",
            code: this.parser.GetCode(),
            labels: this.parser.GetLabels(),
            speed: this.speed
        });
    }

    /**
     * Terminate the worker.
     */
    public Terimnate(): void
    {
        this.worker.terminate();
    }

    /**
     * Attention! This is a totally seperate process! Do not try to use any local or global scope
     * functions or variables here!
     */
    private Worker(): void
    {
        // Run the code line outside of the init scope
        let run = f => (new Function(f))();

        (() => 
        {
            // Code and labels which can be pushed from the host application
            let code: string[];
            let labels: { [id: string] : number; };

            // Results are coming from the host
            let results: { [id: string] : any; } = {};

            // Wait is true, if the worker is waiting for results
            let wait = false;

            // Current interval
            let runner = null;

            // Next line the execute
            let next = 0;

            /**
             * Message the host to execute a function
             * @param name Name of the function
             * @param args Arguments of the function
             */
            let command = (name: string, args: any[]) =>
            {
                if(results[name]) 
                {
                    let result = results[name];
                    delete results[name];

                    wait = false;

                    return result;
                }
                
                wait = true;
                self.postMessage(<ICommand>[name].concat(args));

                throw new Error("Waiting for results!");
            };

            /**
             * Proceed to the next line of code (or wait)
             */
            let proceed = () =>
            {
                try 
                {
                    run(code[next]);
                    
                    if(!wait)
                    {
                        next = next + 1 < code.length ? next + 1 : -1;
                    }
                }
                catch(e)
                {
                    return;
                }
            };

            /**
             * Handler for new messages (from the host)
             */
            self.onmessage = (e) =>
            {
                var message: IMessage = e.data;

                if(message.type == "init")
                {
                    code = message.code;
                    labels = message.labels;
    
                    // Create a new interval
                    if(runner != null) 
                    {
                        clearInterval(runner);
                    }
    
                    runner = setInterval(() =>
                    {
                        if(next >= 0 && next < code.length)
                        {
                            proceed();
                        }
                        else
                        {
                            // Clear the interval if there is no code left
                            clearInterval(runner);
                        }
                    }, message.speed);
                }
                else if(message.type == "result")
                {
                    results[message.name] = message.result;
                    proceed(); // Do the next line on result
                }
            };

            self.move = (dx, dy) => command("move", [dx, dy]);
            self.test = (dx, dy) => command("test", [dx, dy]);
            self.attack = () => command("attack", []);
            self.goto = (label: string) => next = labels[label] || -1;
        })();
    }
}