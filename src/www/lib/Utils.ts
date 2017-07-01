export class Utils
{
    private static async Ajax(url: string, data: string, type: string): Promise<string>
    {
        return new Promise<string>(resolve => 
        {
            var request = new XMLHttpRequest();

            request.onreadystatechange = () => 
            {
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

            request.open(type, url, true);
        });
    }

    public static async Post(url: string, data: string): Promise<string>
    {
        return await Utils.Ajax(url, data, "POST");
    }

    public static async Get(url: string): Promise<string>
    {
        return await Utils.Ajax(url, null, "GET");
    }
}