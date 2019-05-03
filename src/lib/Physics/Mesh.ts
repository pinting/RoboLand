import { BasePolygon } from "./BasePolygon";
import { Triangle } from "./Triangle";
import { Vector } from "./Vector";

export class Mesh extends BasePolygon<Triangle>
{
    /**
     * Do stuff to the underlying vectors.
     * @param callback 
     */
    public F(callback: (v: Vector) => Vector): Mesh
    {
        return new Mesh(this.shapes.map(shape => shape.F(callback)));
    }
}