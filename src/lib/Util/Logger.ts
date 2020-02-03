export enum LogType
{
    Warn = 1,
    Info = 2
}

function StringLogType(type: LogType)
{
    switch(type)
    {
        case LogType.Warn:
            return "WARN";
        case LogType.Info:
            return "INFO";
    }
}

export class Logger
{
    public static Type: LogType = LogType.Warn;
    public static Filter: string = null;

    /**
     * Log a message.
     * @param self
     * @param type 
     * @param args 
     */
    public static Log(self: Object, type: LogType, ...args: any[]): void
    {
        if(typeof self == "string")
        {
            return this.Log(null, type, self, args);
        }

        const name = self ? self.constructor.name : "";

        if(this.Type >= type && (!this.Filter || this.Filter === name))
        {
            console.log(`${type && StringLogType(type)} ${name && `[${name}] `}`, ...args);
        }
    }

    /**
     * Log an info message.
     * @param self
     * @param args 
     */
    public static Info(self: Object, ...args: any[]): void
    {
        this.Log(self, LogType.Info, ...args);
    }

    /**
     * Log an warn message.
     * @param self
     * @param args 
     */
    public static Warn(self: Object, ...args: any[]): void
    {
        this.Log(self, LogType.Warn, ...args);
    }
}