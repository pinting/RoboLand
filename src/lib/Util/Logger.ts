import { Event } from "./Event";

export enum LogType
{
    Debug = 0,
    Info = 1,
    Warn = 2,
}

function StringLogType(type: LogType)
{
    switch(type)
    {
        case LogType.Debug:
            return "DEBUG";
        case LogType.Info:
            return "INFO";
        case LogType.Warn:
            return "WARN";
        default:
            return "";
    }
}

export class Logger
{
    public static Level: LogType = LogType.Warn;
    public static Filter: string = null;

    public static OnLog: Event<string> = new Event<string>();

    /**
     * Log a message.
     * @param self
     * @param type 
     * @param args 
     */
    public static Log(self: Object, type: LogType, ...args: any[]): void
    {
        if(typeof self != "object")
        {
            return this.Log(null, type, self, ...args);
        }

        const name = self ? self.constructor.name : "";

        if(this.Level <= type && (!this.Filter || this.Filter === name))
        {
            const typeName = StringLogType(type);
            const title = `${typeName ? `${typeName} ` : ""}${name && `[${name}] `}`;

            console.log(title, ...args);
            this.OnLog.Call([title, ...args].map(e => e.toString()).join(" "));
        }
    }

    public static Debug(self: Object, ...args: any[]): void
    {
        this.Log(self, LogType.Debug, ...args);
    }

    public static Info(self: Object, ...args: any[]): void
    {
        this.Log(self, LogType.Info, ...args);
    }

    public static Warn(self: Object, ...args: any[]): void
    {
        this.Log(self, LogType.Warn, ...args);
    }
}