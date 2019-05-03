import { Vector } from "./Vector";
import { BaseShape } from "./BaseShape";
import { Logger } from "../Tools/Logger";
import { ExportType, Exportable } from "../Exportable";

export class Triangle extends BaseShape
{
    @Exportable.Register(ExportType.User, () => this.FindAxes())
    protected vertices: [Vector, Vector, Vector];

    constructor(vertices: [Vector, Vector, Vector]) 
    {
        super();

        if(vertices.length != 3)
        {
            Logger.Warn(this, "Triangle with NOT 3 vertices!");
        }

        this.vertices = vertices;
    }

    /**
     * Do stuff to the underlying vectors.
     * @param callback 
     */
    public F(callback: (v: Vector) => Vector): Triangle
    {
        return new Triangle(<[Vector, Vector, Vector]>this.vertices.map(callback))
    }
}