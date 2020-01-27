import { Polygon } from "./Polygon";
import { Ref } from "../Util/Ref";
import { Vector } from "./Vector";
import { IContact } from "./IContact";
import { BaseShape } from "./BaseShape";

export class Overlap
{
    private static Clip(n: Vector, c: number, face: Vector[]): number
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

            out[sp] = face[0].Add(face[1].Sub(face[0]).Scale(alpha));

            ++sp;
        }

        // Assign our new converted values
        face[0] = out[0];
        face[1] = out[1];

        return sp;
    }

    public static PolygonPolygon(a: Polygon, b: Polygon): IContact
    {
        // Check for a separating axis with A's face planes
        const faceA = new Ref<number>();
        const penetrationA = a.FindAxisLeastPenetration(faceA, b);

        if(penetrationA >= 0)
        {
            return null;
        }

        // Check for a separating axis with B's face planes
        const faceB = new Ref<number>();
        const penetrationB = b.FindAxisLeastPenetration(faceB, a);

        if(penetrationB >= 0)
        {
            return null;
        }

        let refIndex: number;
        let flip: boolean; // Always point from a to b

        let ref: Polygon;
        let inc: Polygon;
      
        // Determine which shape contains reference face
        if(Vector.BiasGreaterThan(penetrationA, penetrationB))
        {
            ref = a;
            inc = b;
            refIndex = faceA.Get();
            flip = false;
        }
        else
        {
            ref = b;
            inc = a;
            refIndex = faceB.Get();
            flip = true;
        }

        // World space incident face
        const incidentFace = ref.FindIncidentFace(inc, refIndex);

        /**
         *        Y
         *        ^  ->N       ^^^^^^^^^
         *      +---C ------ positive plane ----
         *  x < | I |\
         *      +---+ C ---- negative plane ----
         *             \       vvvvvvvvv
         *              R
         *
         *  R : reference face
         *  I : incident poly
         *  C : clipped point
         *  N : incident normal
         */

        // Setup reference face points
        let v1 = ref.GetVirtual()[refIndex]

        refIndex = refIndex + 1 >= ref.GetVirtual().length ? 0 : refIndex + 1;

        let v2 = ref.GetVirtual()[refIndex];

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
        if(Overlap.Clip(sidePlaneNormal.Neg(), negSide, incidentFace) < 2)
        {
            // Due to floating point error, possible to not have required points
            return null;
        }

        if(Overlap.Clip(sidePlaneNormal, posSide, incidentFace) < 2) 
        {
            // Due to floating point error, possible to not have required points
            return null;
        }

        // Flip
        const normal = flip ? refFaceNormal.Neg() : refFaceNormal;

        const contacts: Vector[] = [];
        let penetration = 0;

        // Keep points behind reference face
        let cp = 0; // Clipped points behind reference face
        let separation = refFaceNormal.Dot(incidentFace[0]) - refC;

        if (separation <= 0.0)
        {
            contacts[cp] = incidentFace[0];
            penetration = -separation;
            cp++;
        }
        else
        {
            penetration = 0;
        }

        separation = refFaceNormal.Dot(incidentFace[1]) - refC;

        if (separation <= 0.0)
        {
            contacts[cp] = incidentFace[1];

            penetration += -separation;
            cp++;

            // Average penetration
            penetration /= cp;
        }

        return {
            Normal: normal,
            Penetration: penetration,
            Points: contacts
        };
    }

    public static Test(a: BaseShape, b: BaseShape): IContact
    {
        if(a instanceof Polygon && b instanceof Polygon)
        {
            return Overlap.PolygonPolygon(a, b);
        }

        throw new Error("Overlap type is not implemented!");
    }
}