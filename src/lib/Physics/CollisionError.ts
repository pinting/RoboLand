import { Body } from "./Body";

export class CollisionError extends Error
{
    Bodies: Body[];

    constructor(bodies: Body[])
    {
        super("Collision error!");

        this.Bodies = bodies; 
    }
}