import * as webrtc from "webrtc-adapter"
import { IChannel } from "./IChannel";
import { Tools } from "../../Util/Tools";
import { Logger } from "../../Util/Logger";

interface IPacketMeta
{
    Id: string;
    Index: number;
    Count: number;
}

export class PeerChannel implements IChannel
{
    private static MaxByteLength = 16384;

    private readonly config = {
        "iceServers": [
            {
                "urls": ["stun:stun.l.google.com:19302"]
            }
        ]
    };

    private packets: { [id: string]: ArrayBuffer[] } = {};
    private peerConnection: RTCPeerConnection;
    private dataChannel: RTCDataChannel;

    /**
     * Create a new offer. Return the offer negotiation string.
     */
    public Offer(): Promise<string>
    {
        if(this.peerConnection)
        {
            return Promise.reject(null);
        }

        return new Promise<string>((resolve, reject) => 
        {
            this.peerConnection = new RTCPeerConnection(this.config);
            this.dataChannel = this.peerConnection.createDataChannel("data");

            this.dataChannel.binaryType = "arraybuffer";

            this.peerConnection.onicecandidate = e => 
            {
                if(e.candidate == null)
                {
                    const offer = this.peerConnection.localDescription;

                    Logger.Info(this, "Offer was created", offer);

                    resolve(JSON.stringify(offer));
                }
            };
    
            this.peerConnection.createOffer().then(
                desc => this.peerConnection.setLocalDescription(desc),
                error => reject(error)
            );
    
            this.dataChannel.onmessage = event => this.ParseMessage(event);
            this.dataChannel.onopen = () => this.OnOpen();
            this.dataChannel.onclose = () => this.OnClose();
        });
    }

    /**
     * Create an answer for the given offer. Return the finish negotiation string.
     * @param offer 
     */
    public Answer(offer: string): Promise<string> 
    {
        if(this.peerConnection)
        {
            return Promise.reject(null);
        }

        return new Promise<string>((resolve, reject) =>
        {
            this.peerConnection = new RTCPeerConnection(this.config);
    
            this.peerConnection.onicecandidate = e => 
            {
                if(e.candidate == null)
                {
                    const answer = this.peerConnection.localDescription;

                    Logger.Info(this, "Answer was created", answer);

                    resolve(JSON.stringify(answer));
                }
            };
    
            this.peerConnection.ondatachannel = event =>
            {
                this.dataChannel = event.channel;

                this.dataChannel.onmessage = event => this.ParseMessage(event);
                this.dataChannel.onopen = () => this.OnOpen();
                this.dataChannel.onclose = () => this.OnClose();
            };
    
            try 
            {
                const parsedOffer = JSON.parse(offer);

                this.peerConnection.setRemoteDescription(
                    new RTCSessionDescription(parsedOffer));

                this.peerConnection.createAnswer().then(
                    desc => this.peerConnection.setLocalDescription(desc),
                    error => reject(error));
                
                Logger.Info(this, "Offer was received", parsedOffer);
            }
            catch(e)
            {
                reject(e);
            }
        });
    }

    /**
     * Finish negotiation.
     * @param answer 
     */
    public Finish(answer: string): void
    {
        if(this.IsOfferor())
        {
            Logger.Info(this, "Answer was received", answer);

            this.peerConnection.setRemoteDescription(
                new RTCSessionDescription(JSON.parse(answer)));
        }
        else
        {
            throw new Error("Failed to finish negotiation!");
        }
    }

    /**
     * Parse an incoming message.
     * @param event 
     */
    public ParseMessage(event: { data?: ArrayBuffer }): void
    {
        if(!event || !event.data || !event.data.byteLength)
        {
            return;
        }

        const merged = event.data;
        const endOfMeta = Tools.FindEndOfMeta(merged);
        const rawMeta = merged.slice(0, endOfMeta);
        const meta = JSON.parse(Tools.ANSIToUTF16(rawMeta)) as IPacketMeta;
        const slice = merged.slice(endOfMeta, merged.byteLength);

        if(!this.packets.hasOwnProperty(meta.Id))
        {
            this.packets[meta.Id] = [];
        }

        const slices = this.packets[meta.Id];

        slices[meta.Index] = slice;

        if(slices.length === meta.Count)
        {
            const message = Tools.MergeBuffers(slices);
            const decompressed = Tools.ZLibInflate(message);

            this.OnMessage(decompressed);
        }
    }

    /**
     * Send a message through the channel.
     * @param message 
     */
    public async SendMessage(message: ArrayBuffer): Promise<void>
    {
        if(!this.IsOpen())
        {
            Logger.Warn(this, "Channel is closed, but trying to send message")
            return;
        }

        const compressed = Tools.ZLibDeflate(message);

        const id = Tools.Unique();
        const count = Math.ceil(compressed.byteLength / PeerChannel.MaxByteLength);

        for(let i = 0; i < count; i++)
        {
            const rawMeta = {
                Id: id,
                Index: i,
                Count: count
            };

            const meta = Tools.UTF16ToANSI(JSON.stringify(rawMeta));
            const start = i * PeerChannel.MaxByteLength;
            const length = PeerChannel.MaxByteLength;
            const slice = compressed.slice(start, start + length);
            const merged = Tools.MergeBuffers([meta, slice]);

            Tools.RunAsync(() => this.dataChannel.send(merged));
        }
    }

    /**
     * Close the channel.
     */
    public Close()
    {
        if(this.IsOpen())
        {
            Logger.Info(this, "Closing channel");
            this.peerConnection.close();
        }
    }

    /**
     * Is this PeerConnection created the offer?
     */
    public IsOfferor(): boolean
    {
        return this.peerConnection && this.peerConnection.localDescription &&
            this.peerConnection.localDescription.type == "offer";
    }

    /**
     * Check if the channel is open.
     */
    public IsOpen(): boolean
    {
        return this.dataChannel && this.dataChannel.readyState == "open" && 
            this.peerConnection && this.peerConnection.signalingState == "stable";
    }

    /**
     * Called when channel is opened.
     */
    public OnOpen: () => void = Tools.Noop;

    /**
     * Called when channel is closed.
     */
    public OnClose: () => void = Tools.Noop;

    /**
     * Receive a message from the other peer.
     */
    public OnMessage: (message: ArrayBuffer) => void = Tools.Noop;
}