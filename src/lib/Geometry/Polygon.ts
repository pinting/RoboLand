import { Vector } from "./Vector";
import { BaseShape } from "./BaseShape";
import { Ref } from "../Util/Ref";
import { Matrix } from "./Matrix";
import { Exportable } from "../Exportable";

export class Polygon extends BaseShape
{
    private axes: Vector[];

    public constructor(vertices: Vector[] = [])
    {
        if(!vertices.length)
        {
            super(vertices);
            return;
        }

        let rightMost = 0;
        let highestXCoord = vertices[0].X;

        for (let i = 1; i < vertices.length; ++i) 
        {
            let x = vertices[i].X;

            if (x > highestXCoord)
            {
                highestXCoord = x;
                rightMost = i;
            }

            // If matching X then take farthest negative Y
            else if (x == highestXCoord)
            {
                if (vertices[i].Y < vertices[rightMost].Y)
                {
                    rightMost = i;
                }
            }
        }

        const hull = [];
        let outCount = 0;
        let indexHull = rightMost;

        for (; ;) 
        {
            hull[outCount] = indexHull;

            // Search for next index that wraps around the hull
            // by computing cross products to find the most counter-clockwise
            // vertex in the set, given the previos hull index
            let nextHullIndex = 0;

            for (let i = 1; i < vertices.length; ++i) 
            {
                // Skip if same coordinate as we need three unique
                // points in the set to perform a cross product
                if (nextHullIndex == indexHull) 
                {
                    nextHullIndex = i;
                    continue;
                }

                // Cross every set of three unique vertices
                // Record each counter clockwise third vertex and add
                // to the output hull
                let e1 = vertices[nextHullIndex].Sub(vertices[hull[outCount]]);
                let e2 = vertices[i].Sub(vertices[hull[outCount]]);
                let c = Vector.Cross(e1, e2);

                if (c < 0)
                {
                    nextHullIndex = i;
                }

                // Cross product is zero then e vectors are on same line
                // therefor want to record vertex farthest along that line
                if (c == 0 && e2.Len2() > e1.Len2())
                {
                    nextHullIndex = i;
                }
            }

            ++outCount;
            indexHull = nextHullIndex;

            // Conclude algorithm upon wrap-around
            if (nextHullIndex == rightMost) {
                break;
            }
        }

        const result = [];

        // Copy vertices into shape's vertices
        for (let i = 0; i < outCount; ++i)
        {
            result[i] = vertices[hull[i]];
        }

        super(result);
    }

    public GetSupport(dir: Vector): Vector
    {
        let bestProjection = -Infinity;
        let bestVertex: Vector = null;

        for (let v of this.GetPoints())
        {
            const projection = v.Dot(dir);

            if (projection > bestProjection)
            {
                bestVertex = v;
                bestProjection = projection;
            }
        }

        return bestVertex;
    }

    public FindAxisLeastPenetration(faceIndex: Ref<number>, other: Polygon)
    {
        let bestDistance: number = -Infinity;
        let bestIndex: number;

        for (let i = 0; i < this.GetPoints().length; ++i)
        {
            const au = Matrix.ByRad(this.rotation);
            const bu = Matrix.ByRad(other.rotation);

            // Retrieve a face normal from A
            let n = this.GetAxes()[i];
            const nw = au.ScaleByVector(n);

            // Transform face normal into B's model space
            const buT = bu.Transpose();

            n = buT.ScaleByVector(nw);

            // Retrieve support point from B along -n
            const s = other.GetSupport(n.Neg());

            // Retrieve vertex on face from A, transform into
            // B's model space
            let v = this.GetPoints()[i];

            v = au.ScaleByVector(v).Add(this.offset).Sub(other.offset);
            v = buT.ScaleByVector(v);

            // Compute penetration distance (in B's model space)
            const d = n.Dot(s.Sub(v));

            // Store greatest distance
            if (d > bestDistance)
            {
                bestDistance = d;
                bestIndex = i;
            }
        }

        faceIndex.Set(bestIndex);

        return bestDistance;
    }

    public FindIncidentFace(other: Polygon, i: number): Vector[]
    {
        const normal = this.GetAxes()[i]
            .Rotate(this.rotation) // To world space
            .Rotate(-other.rotation); // To other's model space

        // Find most anti-normal face on the other polygon
        let face = 0;
        let min = Infinity;

        for(let i = 0; i < other.GetPoints().length; ++i)
        {
            const dot = normal.Dot(other.GetAxes()[i]);

            if(dot < min)
            {
                min = dot;
                face = i;
            }
        }

        const v1 = other.GetVirtual()[face];

        face = face + 1 >= other.GetPoints().length ? 0 : face + 1;

        const v2 = other.GetVirtual()[face];

        return [v1, v2];
    }

    /**
     * Find the axes of the shape.
     */
    public GetAxes(): Vector[] 
    {
        if(this.axes) 
        {
            return this.axes;
        }

        this.axes = [];

        // Compute face normals
        for (let i1 = 0; i1 < this.points.length; ++i1)
        {
            let i2 = i1 + 1 < this.points.length ? i1 + 1 : 0;
            let face = this.points[i2].Sub(this.points[i1]);

            // Ensure no zero-length edges, because that's bad
            if (face.Len2() <= Vector.EPSILON * Vector.EPSILON)
            {
                throw new Error("Zero length edges");
            }

            // Calculate normal with 2D cross product between vector and scalar
            this.axes[i1] = new Vector(face.Y, -face.X);
            this.axes[i1].Normalize();
        }

        return this.axes;
    }

    public static CreateBox(size: number): Polygon
    {
        return new Polygon([
            new Vector(-size / 2, size / 2),
            new Vector(-size / 2, -size / 2),
            new Vector(size / 2, -size / 2),
            new Vector(size / 2, size / 2)
        ])
    }
}

Exportable.Dependency(Polygon);