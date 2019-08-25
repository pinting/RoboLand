import { Vector } from "./Vector";
import { Exportable, ExportType } from "../Exportable";
import { IShape } from "./IShape";
import { ICollison } from "./ICollision";
import { IMTVector } from "./IMTVector";

export class Body extends Exportable
{
    @Exportable.Register(ExportType.Visible)
    protected shapes: IShape[] = [];

    /**
     * Construct a new body with the given shapes.
     * @param shapes Can be empty.
     */
    constructor(shapes: IShape[] = []) 
    {
        super();

        this.shapes = shapes;
    }

    /**
     * Do stuff to the underlying shapes.
     * @param callback 
     */
    public F(callback: (v: IShape) => IShape): Body
    {
        return new Body(this.shapes.map(callback));
    }

    /**
     * Add a shape to the body.
     * @param shape 
     */
    public Add(shape: IShape)
    {
        this.shapes.push(shape);
    }

    /**
     * Check if the body collides with another body.
     * @param other 
     */
    public Collide(other: Body): IMTVector
    {
        for(let shape of this.shapes)
        {
            for(let otherShape of other.shapes)
            {
                const collision = shape.Collide(otherShape);

                if(collision)
                {
                    return collision;
                }
            }
        }

        return null;
    }

    public GetPenetration(other: Body): ICollison
    {
        for(let shape of this.shapes)
        {
            for(let otherShape of other.shapes)
            {
                const collision = shape.GetPenetration(otherShape);

                if(collision)
                {
                    return collision;
                }
            }
        }

        return null;
    }

    /**
     * Get the shapes of the object.
     */
    public GetShapes() {
        return this.shapes;
    }
}