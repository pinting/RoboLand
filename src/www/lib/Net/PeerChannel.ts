import { IChannel } from "./IChannel";
import { Helper } from "../Util/Helper";
import { Event } from "../Util/Event";

export class PeerChannel implements IChannel
{
    private peerConnection;
    private dataChannel;

    /**
     * Create a new offer. Return the offer negotiation string.
     */
    public Offer(): Promise<string>
    {
        if(this.peerConnection)
        {
            return Promise.reject();
        }

        return new Promise<string>((resolve, reject) => 
        {
            this.peerConnection = new RTCPeerConnection(null);
            this.dataChannel = this.peerConnection.createDataChannel("data");

            this.peerConnection.onicecandidate = e => 
            {
                if(e.candidate == null)
                {
                    const offer = this.peerConnection.localDescription;

                    resolve(Helper.Base64Encode(JSON.stringify(offer)));
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
            return Promise.reject();
        }

        return new Promise<string>((resolve, reject) =>
        {
            this.peerConnection = new RTCPeerConnection(null);
    
            this.peerConnection.onicecandidate = e => 
            {
                if(e.candidate == null)
                {
                    const answer = this.peerConnection.localDescription;

                    resolve(Helper.Base64Encode(JSON.stringify(answer)));
                }
            };
    
            this.peerConnection.ondatachannel = event =>
            {
                this.dataChannel = event.channel;

                this.dataChannel.onmessage = event => this.ParseMessage(event);
                this.dataChannel.onopen = () => this.OnOpen();
                this.dataChannel.onclose = () => this.OnClose();
            };
    
            this.peerConnection.setRemoteDescription(
                new RTCSessionDescription(JSON.parse(Helper.Base64Decode(offer))));
            
            this.peerConnection.createAnswer().then(
                desc => this.peerConnection.setLocalDescription(desc),
                error => reject(error));
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
            this.peerConnection.setRemoteDescription(
                new RTCSessionDescription(JSON.parse(Helper.Base64Decode(answer))));
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
    public ParseMessage(event)
    {
        if(event && event.data)
        {
            this.OnMessage(event.data);
        }
    }

    /**
     * Send a message through the channel.
     * @param message 
     */
    public SendMessage(message: string): void
    {
        if(this.IsOpen())
        {
            this.dataChannel.send(message);
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
    public OnOpen: () => void = Helper.Noop;

    /**
     * Called when channel is closed.
     */
    public OnClose: () => void = Helper.Noop;

    /**
     * Receive a message from the other peer.
     */
    public OnMessage: (message: string) => void = Helper.Noop;
}