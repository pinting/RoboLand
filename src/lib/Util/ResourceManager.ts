import { Tools } from "./Tools";
import { Event } from "./Event";

export const MIME_TYPE = "application/robosave";
export const FILE_EXT = "roboland";

export interface ISaveMeta
{
    Items: ISaveItem[]; 
}

export interface ISaveItem
{
    Length: number;
    Uri: string;
    Hash: string;
}

export interface BufferMeta
{
    Extension: string;
    Mime: string;
}

export class Resource
{
    public Buffer: ArrayBuffer;
    public Uri: string;
    public Hash: string;
    
    private blob: Blob;
    private url: string;

    /**
     * Get an URL to the resource.
     */
    public GetUrl(): string
    {
        if(this.url)
        {
            return this.url;
        }

        this.Save();

        this.url = URL.createObjectURL(this.blob);

        return this.url;
    }

    /**
     * Try to figure out the MIME data of the buffer.
     * @param buffer 
     */
    public static GetMeta(buffer: ArrayBuffer): BufferMeta
    {
        const head = Tools.BufferToString(buffer.slice(0, 16));

        if(head.slice(1, 5) == "PNG")
        {
            return { Extension: "png", Mime: "image/png" };
        }
        else if(head.slice(0, 1) == "{")
        {
            return { Extension: "json", Mime: "application/json" };
        }

        return { Extension: "", Mime: "application/octet-stream" };
    }

    /**
     * Create a blob object.
     */
    public Save(): Blob
    {
        if(this.blob)
        {
            return this.blob;
        }

        if(Resource.GetMeta(this.Buffer))
        {
            this.blob = new Blob([this.Buffer], { type: "image/png" });
        }
        else
        {
            this.blob = new Blob([this.Buffer]);
        }
        
        return this.blob;
    }

    public async Init(uri: string, buffer: ArrayBuffer): Promise<void>
    {
        this.Uri = uri;

        this.SetBuffer(buffer);
    }

    public async SetBuffer(buffer: ArrayBuffer): Promise<void>
    {
        this.Buffer = buffer;
        this.Hash = await Tools.Sha256(buffer);
    }
}

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
        const meta = Resource.GetMeta(buffer);
        const uri = name + "." + meta.Extension;
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
        
        this.storage.splice(index, 1);
        this.OnChange.Call();
    }

    /**
     * Save the storage of the resource manager into a RoboLand resource buffer.
     * @param buffer 
     */
    public static async Save(): Promise<Blob>
    {
        const meta: ISaveMeta = {
            Items: this.storage.map(r => ({
                Uri: r.Uri,
                Length: r.Buffer.byteLength,
                Hash: r.Hash
            }))
        };

        const head = JSON.stringify(meta);
        const slices = [Tools.StringToBuffer(head), ...this.storage.map(r => r.Buffer)];

        const temp = new Blob(slices);
        const merged = await new Response(temp).arrayBuffer();

        return new Blob([Tools.ZLibDeflate(merged)], { type: MIME_TYPE });
    }

    /**
     * Load a RoboLand resource buffer into the memory. 
     * @param buffer 
     */
    public static async Load(buffer: ArrayBuffer): Promise<void>
    {
        const uncompressed = Tools.ZLibInflate(buffer);
        const stringView = new Uint16Array(uncompressed.slice(0, uncompressed.byteLength * 2));

        let endOfMeta = 0;
        let scope = 0;

        for (let i = 0; i < stringView.length; i++) 
        {
            if(stringView[i] === "{".charCodeAt(0))
            {
                scope++;
            }
            else if(stringView[i] === "}".charCodeAt(0))
            {
                scope--;

                if(scope === 0)
                {
                    endOfMeta = i + 1;
                    break;
                }
            }
        }

        const rawMeta = uncompressed.slice(0, endOfMeta * 2);
        const meta = JSON.parse(Tools.BufferToString(rawMeta)) as ISaveMeta;

        let current = endOfMeta * 2;

        for (let item of meta.Items)
        {
            const length = item.Length;
            const subBuffer = uncompressed.slice(current, current + length);

            const resource = new Resource();

            await resource.Init(item.Uri, subBuffer);

            this.storage.push(resource);

            current += length;
        }
    }

    /**
     * Generate a file name for the bundle.
     */
    public static GenerateName()
    {
        return Tools.Unique() + "." + FILE_EXT;
    }
}