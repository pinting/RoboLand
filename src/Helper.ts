declare var navigator: { clipboard: any } & Navigator;

export class Helper
{
    /**
     * Parse the hash part of the URL.
     */
    public static ParseHash(): { [key: string]: string }
    {
        const result = {};
        const pairs = location.hash.substr(1).split("&");

        for (let i = 0; i < pairs.length; i++) 
        {
            const pair = pairs[i].split("=");

            result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
        }
        
        return result;
    }

    /**
     * Get a parameter from the hash.
     * @param key
     */
    public static GetParam(key: string)
    {
        return Helper.ParseHash()[key];
    }

    /**
     * Generate the hash part of the URL.
     * @param dict
     */
    public static CreateHash(dict: { [key: string]: string }): string
    {
        return Object.entries(dict)
            .map(p => p.map(v => encodeURIComponent(v)).join("="))
            .join("&");
    }


    /**
     * Set the hash part of the URL.
     * @param dict
     */
    public static SetHash(dict: { [key: string]: string }): void
    {
        location.hash = this.CreateHash(dict);
    }
    
    public static async SetClipboard(text: string): Promise<boolean> 
    {
        const fallback = async (text) => 
        {
            return new Promise<boolean>(resolve => 
            {
                // 2nd method
                var field = document.createElement("textarea");
    
                field.value = text;
                document.body.appendChild(field);
    
                field.focus();
                field.select();
    
                try
                {
                    resolve(document.execCommand("copy"));
                }
                catch (e) {
                    // 3rd method
                    prompt("", text);
                    resolve(true);
                }
    
                document.body.removeChild(field);
            });
        }

        if (!navigator.clipboard) 
        {
            return fallback(text);
        }

        try {
            // 1st method
            await navigator.clipboard.writeText(text);
            return true;
        }
        catch(e)
        {
            return fallback(text);
        }
    }
}