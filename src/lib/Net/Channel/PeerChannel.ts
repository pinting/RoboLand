import * as webrtc from "webrtc-adapter"
import { IChannel } from "./IChannel";
import { Tools } from "../../Util/Tools";
import { Logger } from "../../Util/Logger";

export class PeerChannel implements IChannel
{
    private readonly config = {
        "iceServers": [
            {
                "urls": ["stun:stun.l.google.com:19302"]
            }
        ]
    };

    private peerConnection;
    private dataChannel;

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
     * Parse an incoming Message.
     * @param event 
     */
    public ParseMessage(event)
    {
        if(event && event.data)
        {
            const uncompressed = Tools.BufferToString(Tools.ZLibInflate(event.data));

            this.OnMessage(uncompressed);
        }
    }

    /**
     * Send a Message through the channel.
     * @param message 
     */
    public SendMessage(message: string): void
    {
        if(this.IsOpen())
        {
            const compressed = Tools.ZLibDeflate(Tools.StringToBuffer(message));

            this.dataChannel.send(compressed);
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
     * Receive a Message from the other peer.
     */
    public OnMessage: (message: string) => void = Tools.Noop;
}