import { World } from "../World";
import { FakeChannel } from "../Net/Channel/FakeChannel";
import { Client } from "../Net/Client";
import { Server } from "../Net/Server";
import { Host } from "../Net/Host";
import { GroundCell } from "../Unit/Cell/GroundCell";
import { Vector } from "../Geometry/Vector";
import { Logger } from "../Util/Logger";

function WorldFactory(size: number): World
{
    const world = new World;

    // Init world with size x size number of GroundCells
    for(let i = 0; i < size * size; i++)
    {
        const cell = new GroundCell();

        cell.Init({
            position: new Vector(i % size, i - (i % size) * size),
            size: new Vector(1, 1),
            world: world
        });

        world.Add(cell);
    }

    return world;
}

async function TestNetSetup(): Promise<void>
{
    Logger.Info(this, "Running TestNetSetup");

    const delay = 1;
    const size = 8;
    
    // Create two worlds for each client
    const worldA: World = new World();
    const worldB: World = new World();
    
    // Create 2 two-way channels
    const channelA1 = new FakeChannel(delay);
    const channelA2 = new FakeChannel(delay);
    const channelB1 = new FakeChannel(delay);
    const channelB2 = new FakeChannel(delay);
    
    channelA1.SetOther(channelA2);
    channelA2.SetOther(channelA1);
    channelB1.SetOther(channelB2);
    channelB2.SetOther(channelB1);

    // Create two client objects
    const clientA = new Client(channelA1, worldA)
    const clientB = new Client(channelB1, worldB);
    
    const world = WorldFactory(size);
    const server = new Server(world);

    // Create two host objects
    const hostA = new Host(channelA2, server);
    const hostB = new Host(channelB2, server);
    
    return new Promise<void>(resolve => 
    {
        let readyCount = 0;

        clientA.OnPlayer = player =>
        {
            if(worldA.GetCells().GetLength() != size * size)
            {
                Logger.Warn(this, "TestNetSetup: worldA cells size mismatch", worldA);
                throw new Error("Assert failed");
            }
            
            if(worldA.GetActors().GetLength() != 2)
            {
                Logger.Warn(this, "TestNetSetup: worldA actors size mismatch", worldA);
                throw new Error("Assert failed");
            }
            
            Logger.Info(this, "Player 1 received successfully!");

            ++readyCount == 2 && resolve();
        };
        
        clientB.OnPlayer = player =>
        {
            if(worldB.GetCells().GetLength() != size * size)
            {
                Logger.Warn(this, "TestNetSetup: worldB cells size mismatch", worldB);
                throw new Error("Assert failed");
            }
            
            if(worldB.GetActors().GetLength() != 2)
            {
                Logger.Warn(this, "TestNetSetup: worldB actors size mismatch", worldB);
                throw new Error("Assert failed");
            }
    
            Logger.Info(this, "Player 2 received successfully!");
            
            ++readyCount == 2 && resolve();
        };
        
        server.Add(hostA);
        server.Add(hostB);
    });
}

export default async () =>
{
    await TestNetSetup();
};