import { Vector } from "./Vector";
import { Projection } from "./Projection";
import { Exportable, ExportType } from "../Exportable";
import { Logger } from "../Util/Logger";
import { IShape } from "./IShape";
import { ICollison } from "./ICollision";
import { IMTVector } from "./IMTVector";
import { Ref } from "../Util/Ref";

export class Polygon extends Exportable implements IShape
{
    private axes: Vector[];
    private rotation: number = 0;

    @Exportable.Register(ExportType.Visible, () => this.FindAxes())
    protected vertices: Vector[];

    constructor(vertices: Vector[]) 
    {
        super();

        this.vertices = vertices;
    }

    public Add(v: Vector): Polygon
    {
        return new Polygon(this.vertices.map(n => n.Add(v)))
    }

    public Rotate(r: number, c: Vector): Polygon
    {
        const p = new Polygon(this.vertices.map(n => n.Rotate(r, c)));

        p.rotation = r;

        return p;
    }

    /**
     * Check if the shape collides with another shape
     * and return the Minimum Translation Vector if they do.
     * @param other
     * @deprecated
     */
    public Collide(other: IShape): IMTVector
    {
        if(!(other instanceof Polygon))
        {
            throw new Error("Collision not implemented!");
        }

        let overlap: number = Infinity;
        let smallest: Vector = null;

        const axes = this.GetAxes().concat(other.GetAxes());
        
        for (let axis of axes) 
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

    public GetSupport(dir: Vector): Vector
    {
        let bestProjection = -Infinity;
        let bestVertex: Vector = null;

        for (let v of this.GetVertices())
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

    public static FindAxisLeastPenetration(faceIndex: Ref<number>, a: Polygon, b: Polygon)
    {
        let bestDistance: number = -Infinity;
        let bestIndex: number;

        for (let i = 0; i < a.GetVertices().length; ++i)
        {
            // Retrieve a face normal from A
            const n = a.GetAxes()[i];

            // Retrieve support point from B along -n
            const s = b.GetSupport(n.Neg());

            // Retrieve vertex on face from A
            const v = a.vertices[i];

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

    public FindIncidentFace(refPoly: Polygon, incPoly: Polygon, referenceIndex: number): Vector[]
    {
        let referenceNormal = refPoly.GetAxes()[referenceIndex];

        // Find most anti-normal face on incident polygon
        let incidentFace = 0;
        let minDot = Infinity;

        for(let i = 0; i < incPoly.GetVertices().length; ++i)
        {
            const dot = referenceNormal.Dot(incPoly.GetAxes()[i]);

                if(dot < minDot)
                {
                    minDot = dot;
                    incidentFace = i;
                }
        }

        const v1 = incPoly.vertices[incidentFace];

        incidentFace = incidentFace + 1 >= incPoly.vertices.length ? 0 : incidentFace + 1;

        const v2 = incPoly.vertices[incidentFace];

        return [v1, v2]
    }

    public Clip(n: Vector, c: number, face: Vector[]): number
    {
        let sp = 0;
        let out = [];

        // Retrieve distances from each endpoint to the line
        // d = ax + by - c
        const d1 = n.Dot(face[0]) - c;
        const d2 = n.Dot(face[1]) - c;

        // If negative (behind plane) clip
        if(d1 <= 0.0) 
        {
            out[sp++] = face[0];
        }

        if(d2 <= 0.0)
        {
            out[sp++] = face[1];
        }

        // If the points are on different sides of the plane
        if(d1 * d2 < 0.0) // less than to ignore -0.0f
        {
            // Push interesection point
            const alpha = d1 / (d1 - d2);

            out[sp] = face[0].Add(new Vector(alpha, alpha).Scale(face[1].Sub(face[0])));

            ++sp;
        }

        // Assign our new converted values
        face[0] = out[0];
        face[1] = out[1];

        return sp;
    }

    public GetPenetration(other: IShape): ICollison
    {
        if(!(other instanceof Polygon)) {
            throw new Error("Collision type not implemented!")
        }
        
        let contactCount = 0;

        // Check for a separating axis with A's face planes
        let faceA = new Ref<number>();
        const penetrationA = Polygon.FindAxisLeastPenetration(faceA, this, other);

        if(penetrationA >= 0)
        {
            console.log(penetrationA)
            return;
        }

        // Check for a separating axis with B's face planes
        let faceB = new Ref<number>();
        const penetrationB = Polygon.FindAxisLeastPenetration(faceB, other, this);

        if(penetrationB >= 0)
        {
            console.log(penetrationB)
            return;
        }

        let referenceIndex: number;
        let flip: boolean; // Always point from a to b

        let refPoly: Polygon;
        let incPoly: Polygon;
      
        // Determine which shape contains reference face
        if(Vector.BiasGreaterThan(penetrationA, penetrationB))
        {
            refPoly = this;
            incPoly = other;
            referenceIndex = faceA.Get();
            flip = false;
        }
        else
        {
            refPoly = other;
            incPoly = this;
            referenceIndex = faceB.Get();
            flip = true;
        }

        // World space incident face
        const incidentFace = this.FindIncidentFace(refPoly, incPoly, referenceIndex );

        //        y
        //        ^  ->n       ^
        //      +---c ------posPlane--
        //  x < | i |\
        //      +---+ c-----negPlane--
        //             \       v
        //              r
        //
        //  r : reference face
        //  i : incident poly
        //  c : clipped point
        //  n : incident normal

        // Setup reference face vertices
        let v1 = refPoly.vertices[referenceIndex]

        referenceIndex = referenceIndex + 1 >= refPoly.vertices.length ? 0 : referenceIndex + 1;

        let v2 = refPoly.vertices[referenceIndex];

        // Calculate reference face side normal in world space
        const sidePlaneNormal = v2.Sub(v1).Normalize();

        // Orthogonalize
        const refFaceNormal = sidePlaneNormal.Perp();

        // ax + by = c
        // c is distance from origin
        const refC = refFaceNormal.Dot(v1);
        const negSide = -sidePlaneNormal.Dot(v1);
        const posSide =  sidePlaneNormal.Dot(v2);

        // Clip incident face to reference face side planes
        if(this.Clip(sidePlaneNormal.Neg(), negSide, incidentFace) < 2)
        {
            // Due to floating point error, possible to not have required points
            return null;
        }

        if(this.Clip(sidePlaneNormal, posSide, incidentFace) < 2) 
        {
            // Due to floating point error, possible to not have required points
            return null;
        }

        // Flip
        const normal = flip ? refFaceNormal.Neg() : refFaceNormal;

        const contacts: Vector[] = [];
        let penetration = 0;

        // Keep points behind reference face
        let clippedPoints = 0; // Clipped points behind reference face
        let separation = refFaceNormal.Dot(incidentFace[0]) - refC;

        if (separation <= 0.0)
        {
            contacts[clippedPoints] = incidentFace[0];
            penetration = -separation;
            clippedPoints++;
        }
        else
        {
            penetration = 0;
        }

        separation = refFaceNormal.Dot(incidentFace[1]) - refC;

        if (separation <= 0.0)
        {
            contacts[clippedPoints] = incidentFace[1];

            penetration += -separation;
            clippedPoints++;

            // Average penetration
            penetration /= clippedPoints;
        }

        contactCount = clippedPoints;

        return {
            Normal: normal,
            Penetration: penetration,
            Contacts: contacts,
            ContactCount: contactCount
        };
    }

    /**
     * Project the shape onto an axis (2D -> 1D).
     * @param axis
     * @deprecated
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
    public GetAxes(): Vector[] 
    {
        if(this.axes) 
        {
            return this.axes;
        }

        this.axes = [];

        for (let i = 0; i < this.vertices.length; i++) 
        {
            const a = this.vertices[i];
            const b = this.vertices[i + 1 == this.vertices.length ? 0 : i + 1];

            if(Number.isNaN(a.X) || Number.isNaN(a.Y) || Number.isNaN(b.Y) || Number.isNaN(b.Y))
            {
                throw new Error("NaN in Vector");
            }

            const edge = a.Sub(b);
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