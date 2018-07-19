import { LogType } from "./LogType";

export class Logger
{
    public static Type: LogType = LogType.Silent;

    /**
     * Log message.
     * @param self
     * @param args 
     */
    public static Log(self: Object, type: LogType, ...args: any[])
    {
        if(this.Type >= type)
        {
            console.log(`(${type}) [${self.constructor.name}] `, ...args);
        }
    }
}