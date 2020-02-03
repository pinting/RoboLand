import { Tools } from "./Tools";

const MIME_TYPE = "application/robosave";

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

export interface IResource
{
    Buffer: ArrayBuffer;
    Uri: string;
    Hash: string;
}

// Use IndexedDB to store between sessions
export class ResourceManager
{
    private static storage: IResource[] = [];
    
    /**
     * Find the file by its hash
     * @param hash 
     */
    public static ByHash(hash: string): IResource
    {
        return this.storage.find(r => r.Hash === hash);
    }

    /**
     * Find the file by its ID
     * @param uri 
     */
    public static ByUri(uri: string): IResource
    {
        return this.storage.find(r => r.Uri === uri);
    }

    /**
     * Add file to the storage.
     * @param uri ID of the file
     * @param buffer 
     */
    public static async Add(uri: string, buffer: ArrayBuffer): Promise<IResource>
    {
        const existing = this.ByUri(uri) !== undefined;

        if(existing)
        {
            return null;
        }

        const hash = await Tools.Sha256(buffer);
        const resource = {
            Hash: hash,
            Buffer: buffer,
            Uri: uri
        };

        this.storage.push(resource);

        return resource;
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
    public static Load(buffer: ArrayBuffer): void
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

        for (let resource of meta.Items)
        {
            const length = resource.Length;
            const subBuffer = uncompressed.slice(current, current + length);

            this.storage.push({
                Buffer: subBuffer,
                Uri: resource.Uri,
                Hash: resource.Hash
            });

            current += length;
        }
    }
}