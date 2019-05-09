import { BaseShape } from "./BaseShape";
import { IMTVector } from "./IMTVector";
import { Vector } from "./Vector";
import { Exportable, ExportType } from "../Exportable";

export abstract class BasePolygon<Shape extends BaseShape> extends Exportable
{
    @Exportable.Register(ExportType.User)
    protected shapes: Shape[] = [];

    /**
     * Construct a new BasePolygon with the given shapes.
     * @param shapes Can be empty.
     */
    constructor(shapes: Shape[] = []) 
    {
        super();

        this.shapes = shapes;
    }

    /**
     * Do stuff to the underlying vectors.
     * @param callback 
     */
    public abstract F(callback: (v: Vector) => Vector): BasePolygon<Shape>;

    /**
     * Add a shape to the polygon.
     * @param shape 
     */
    public Add(shape: Shape)
    {
        this.shapes.push(shape);
    }

    /**
     * Check if the polygon collides with another polygon.
     * @param other 
     */
    public Collide(other: BasePolygon<Shape>): IMTVector
    {
        for(let shape of this.shapes)
        {
            for(let otherShape of other.shapes)
            {
                const mtv = shape.Collide(otherShape);

                if(mtv)
                {
                    return mtv;
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