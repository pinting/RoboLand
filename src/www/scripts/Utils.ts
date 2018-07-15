export class Utils
{
    /**
     * Create an async request.
     * @param url 
     * @param data 
     * @param method 
     */
    private static async Ajax(url: string, data: string, method: string): Promise<string>
    {
        return new Promise<string>(resolve => 
        {
            let request = new XMLHttpRequest();

            request.open(method, url, true);

            request.onreadystatechange = () => 
            {
                if(request.readyState != 4)
                {
                    return;
                }

                if (request.status == 200) 
                {
                    resolve(request.responseText);
                }
                else 
                {
                    resolve(null);
                }
            };

            if(data != null && data.length > 0)
            {
                request.setRequestHeader("Content-Type", "application/json");
                request.send(data);
            }
            else
            {
                request.send();
            }
        });
    }

    /**
     * Post request with JSON data.
     */
    public static async Post(url: string, data: string): Promise<string>
    {
        return await Utils.Ajax(url, data, "POST");
    }

    /**
     * Get request to the given URL.
     * @param url 
     */
    public static async Get(url: string): Promise<string>
    {
        return await Utils.Ajax(url, null, "GET");
    }

    /**
     * Returns a random integer between min (included) and max (included).
     * @param min 
     * @param max 
     */
    public static Random(min: number, max: number): number
    {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /**
     * Copy properties from one object to another.
     * @param to 
     * @param from 
     */
    public static Extract(to: Object, from: Object) 
    {
        for (let key in from) 
        {
            if(from.hasOwnProperty(key))
            {
                to[key] = from[key];
            }
        }
    }
    
    /**
     * Bind properties from one object to another.
     * @param to 
     * @param from 
     */
    public static Bind(to: Object, from: Object, properties: string[]) 
    {
        for (let key in properties) 
        {
            const p = properties[key];

            if(from[p] !== undefined)
            {
                to[p] = from[p].bind(from);
            }
        }
    }

    /**
     * A noop function.
     */
    public static Noop()
    {
        return;
    }

    /**
     * Unique ID generataion
     */
    public static Unique(): string 
    {
        let date = new Date().getTime();
        
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c =>
        {
            const r = (date + Math.random() * 16) % 16 | 0;

            date = Math.floor(date / 16);

            return (c === "x" ? r : (r & 0x7 | 0x8)).toString(16);
        });
    }

    /**
     * Check if the string is a unique ID generated by the Unique() function.
     */
    public static IsUnique(unique: string): boolean
    {
        const re = RegExp(
            "^[0-9a-fA-F]{8}-" + 
            "[0-9a-fA-F]{4}-" + 
            "4[0-9a-fA-F]{3}-" + 
            "[0-9a-fA-F]{4}-" + 
            "[0-9a-fA-F]{12}")

        return re.test(unique);
    }
}