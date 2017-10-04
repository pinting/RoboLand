import { Parser } from './Parser';
import { Adapter } from './Adapter';
import { Map } from "../Map";
import { IRobot } from "../Element/Robot/IRobot";
import { Coord } from "../Coord";
import { CellType } from "../Element/Cell/CellType";

declare var self: any;

export class Runner
{
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

        this.worker.onmessage = (e) =>
        {
            if(!e.data || !e.data.length) 
            {
                return;
            }

            switch(e.data[0])
            {
                case "move":
                    this.adapter.move(e.data[1], e.data[2]);
                    break;
                case "test":
                    this.adapter.test(e.data[1], e.data[2]);
                    break;
                case "attack":
                    this.adapter.attack()
                    break;
            }
        };
    }

    /**
     * Push new code to the worker.
     */
    public Push(code: string)
    {
        this.parser.Parse(code);
        this.worker.postMessage({
            code: this.parser.GetCode(),
            labels: this.parser.GetLabels(),
            speed: 100
        });
    }

    /**
     * Terminate the worker.
     */
    public Terimnate()
    {
        this.worker.terminate();
    }

    /**
     * Attention! This is a totally seperate process! Do not try to use any local or global scope
     * functions or variables here!
     */
    private Worker(): void
    {
        let run = f => (new Function(f))();

        (() => 
        {
            let code: string[];
            let labels: { [id: string] : number; };
            
            let runner = null;
            let next = 0;

            self.onmessage = function(e) 
            {
                code = e.data.code;
                labels = e.data.labels;

                if(runner != null) 
                {
                    clearInterval(runner);
                }

                runner = setInterval(function() 
                {
                    if(next >= 0 && next < code.length)
                    {
                        run(code[next]);
                        next = next + 1 < code.length ? next + 1 : -1;
                    }
                    else
                    {
                        clearInterval(runner);
                    }
                }, e.data.speed);
            };

            self.move = function(dx: number, dy: number) 
            {
                self.postMessage(["move", dx, dy]);
            };

            self.test = function(dx: number, dy: number) 
            {
                self.postMessage(["test", dx, dy]);
            };
            
            self.attack = function(dx: number, dy: number) 
            {
                self.postMessage(["attack"]);
            };

            self.goto = function(label: string)
            {
                next = labels[label] || -1;
            };
        })();
    }
}