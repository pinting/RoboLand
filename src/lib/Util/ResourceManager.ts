import { Event } from "./Event";
import { RoboPack, Resource } from "./RoboPack";

// TODO: Use IndexedDB to store between sessions
export class ResourceManager
{
    private static storage: Resource[] = [];

    /**
     * Called when the storage changes.
     */
    public static OnChange = new Event<void>();

    /**
     * Get the list of resources.
     */
    public static GetList(): Resource[]
    {
        return this.storage;
    }
    
    /**
     * Find the file by its hash
     * @param hash 
     */
    public static ByHash(hash: string): Resource
    {
        return this.storage.find(r => r.Hash === hash);
    }

    /**
     * Find the file by its ID
     * @param uri 
     */
    public static ByUri(uri: string): Resource
    {
        return this.storage.find(r => r.Uri === uri);
    }

    /**
     * Add file to the storage.
     * @param uri ID of the file
     * @param buffer 
     */
    public static async RawAdd(name: string, buffer: ArrayBuffer): Promise<Resource>
    {
        let uri: string;

        if(!name.includes("."))
        {
            const meta = Resource.GetMeta(buffer);

            uri = name + "." + meta.Extension;
        }
        else
        {
            uri = name;
        }

        const existing = this.ByUri(uri) !== undefined;

        if(existing)
        {
            this.Remove(uri);
        }

        const resource = new Resource();

        await resource.Init(uri, buffer);

        this.storage.push(resource);
        this.OnChange.Call();

        return resource;
    }

    /**
     * 
     * @param name An URI will be generated from this
     * @param buffer 
     */
    public static async Add(name: string, buffer: ArrayBuffer): Promise<string>
    {
        let uri: string;

        for(let c = 0;; c++)
        {
            uri = name + (c > 0 ? ("-" + c) : "")

            if(this.ByUri(uri) === undefined)
            {
                await ResourceManager.RawAdd(uri, buffer);
                break;
            }
        }

        return uri;
    }
    
    /**
     * Remove file from the storage.
     * @param uri 
     */
    public static Remove(uri: string): void
    {
        const index = this.storage.findIndex(r => r.Uri == uri);

        if(index < 0)
        {
            return;
        }

        this.storage[index].Destroy();
        this.storage.splice(index, 1);
        this.OnChange.Call();
    }

    /**
     * Save the storage of the resource manager into a RoboLand resource buffer.
     * @param buffer 
     */
    public static async Save(): Promise<Blob>
    {
        const buffer = await RoboPack.Pack(this.storage);

        return new Blob([buffer], { type: "application/octet-stream" });
    }

    /**
     * Load a RoboLand resource buffer into the memory. 
     * This clears the previously loaded resources.
     * @param buffer 
     */
    public static async Load(buffer: ArrayBuffer): Promise<void>
    {
        this.Clear();

        this.storage = await RoboPack.Unpack(buffer);
    }

    public static Clear(): void
    {
        ResourceManager.storage.forEach(res => res.Destroy());
        ResourceManager.storage = [];

        this.OnChange.Call();
    }
}