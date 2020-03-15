import { Tools } from "./Tools";
import { Logger } from "./Logger";

export const FILE_EXT = "roboland";

export interface BufferMeta
{
    Extension: string;
    Mime: string;
}

interface IPackMeta
{
    Items: IPackItem[]; 
}

interface IPackItem
{
    Length: number;
    Uri: string;
    Hash: string;
}

/**
 * A loaded resource. Buffer still needs to parsed into string or bitmap.
 */
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
        const head = Tools.ANSIToUTF16(buffer.slice(0, 16));

        if(head.slice(1, 5).includes("PNG"))
        {
            return { Extension: "png", Mime: "image/png" };
        }
        else if(head.slice(0, 1).includes("{"))
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

        const meta = Resource.GetMeta(this.Buffer);

        this.blob = new Blob([this.Buffer], { type: meta.Mime });
        
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

    /**
     * Remove the resource from the memory.
     */
    public Destroy()
    {
        if(this.Uri)
        {
            URL.revokeObjectURL(this.Uri);
        }
    }
}

/**
 * ROBOPACK structure
 * 
 * <ZLibCompression>
 *     <!-- Meta data hold the order of the resources, their length, hash and URI -->
 *     <IPackMeta />
 *     <Buffer />
 *     <Buffer />
 *     <Buffer />
 *     ...
 * </ZLibCompression>
 */
export class RoboPack
{
    public static async Pack(resources: Resource[]): Promise<ArrayBuffer>
    {
        const meta: IPackMeta = {
            Items: resources.map(r => ({
                Uri: r.Uri,
                Length: r.Buffer.byteLength,
                Hash: r.Hash
            }))
        };

        const head = JSON.stringify(meta);
        const slices = [Tools.UTF16ToANSI(head), ...resources.map(r => r.Buffer)];
        const merged = Tools.MergeBuffers(slices);
        
        return Tools.ZLibDeflate(merged);
    }

    public static async Unpack(buffer: ArrayBuffer): Promise<Resource[]>
    {
        Logger.Info("Unpacking RoboPack");

        const result = [] as Resource[];

        const uncompressed = Tools.ZLibInflate(buffer);
        const endOfMeta = Tools.FindEndOfMeta(uncompressed);
        const rawMeta = uncompressed.slice(0, endOfMeta);
        const meta = JSON.parse(Tools.ANSIToUTF16(rawMeta)) as IPackMeta;

        let current = endOfMeta;

        for (let item of meta.Items)
        {
            const length = item.Length;
            const subBuffer = uncompressed.slice(current, current + length);

            const resource = new Resource();

            await resource.Init(item.Uri, subBuffer);

            result.push(resource);

            Logger.Info("Loaded resource", item.Uri);

            current += length;
        }

        return result;
    }

    /**
     * Generate a file name for the bundle.
     */
    public static GenerateName(name: string = null): string
    {
        return (name || Tools.Unique()) + "." + FILE_EXT;
    }
}