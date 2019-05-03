export class Http
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
     * @param url 
     * @param data
     */
    public static async Post(url: string, data: string): Promise<string>
    {
        return await Http.Ajax(url, data, "POST");
    }

    /**
     * Get request to the given URL.
     * @param url 
     */
    public static async Get(url: string): Promise<string>
    {
        return await Http.Ajax(url, null, "GET");
    }
}