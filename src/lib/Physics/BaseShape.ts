import { Vector } from "./Vector";
import { IMTVector } from "./IMTVector";
import { Projection } from "./Projection";
import { Exportable, ExportType } from "../Exportable";

export abstract class BaseShape extends Exportable
{
    private axes: Vector[];

    @Exportable.Register(ExportType.User, () => this.FindAxes())
    protected vertices: Vector[];

    /**
     * Do stuff to the underlying vectors.
     * @param callback 
     */
    public abstract F(callback: (v: Vector) => Vector): BaseShape;

    /**
     * Check if the shape collides with another shape.
     * @param other 
     */
    public Collide(other: BaseShape): IMTVector
    {
        let overlap: number = Infinity;
        let smallest: Vector = null;
        
        const thisAxes: Vector[] = this.FindAxes();
        const otherAxes: Vector[] = other.FindAxes();

        for (let axis of thisAxes.concat(otherAxes)) 
        {
            const p1 = this.Project(axis);
            const p2 = other.Project(axis);
            const o = Math.abs(p1.Overlap(p2));

            if (o == 0)
            {
                return null;
            }
            else if (o < overlap) {
                overlap = o;
                smallest = axis;
            }
        }
        
        return {
            Smallest: smallest,
            Overlap: overlap
        };
    }

    /**
     * Project the shape onto an axis (2D -> 1D).
     * @param axis 
     */
    public Project(axis: Vector): Projection
    {
        let min = Infinity;
        let max = -Infinity;

        for (let vertice of this.vertices) 
        {
            const p = vertice.Dot(axis);

            if (p < min)
            {
                min = p;
            }
            
            if (p > max)
            {
                max = p;
            }
        }

        return new Projection(min, max);
    }

    /**
     * Find the axes of the shape.
     */
    public FindAxes(): Vector[] 
    {
        if(this.axes) 
        {
            return this.axes;
        }

        this.axes = [];

        for (let i = 0; i < this.vertices.length; i++) 
        {
            const p1 = this.vertices[i];
            const p2 = this.vertices[i + 1 == this.vertices.length ? 0 : i + 1];

            const edge = p1.Sub(p2);
            const normal = edge.Perp();

            this.axes[i] = normal.Normalize();
        }

        return this.axes;
    }

    /**
     * Get the vertices of the object.
     */
    public GetVertices() {
        return this.vertices;
    }
}