import { Polygon } from "./Polygon";
import { Vector } from "./Vector";
import { Contact } from "./Contact";
import { BaseShape } from "./BaseShape";
import { Logger } from "../Util/Logger";
import { Tools } from "../Util/Tools";

/**
 * Based on ImpulseEngine by Randy Gaul.
 */
export class Overlap
{
    private static Clip(n: Vector, c: number, face: { V1: Vector, V2: Vector }): number
    {
        let sp = 0;
        let out = [];

        // Retrieve distances from each endpoint to the line
        // d = ax + by - c
        const d1 = n.Dot(face.V1) - c;
        const d2 = n.Dot(face.V2) - c;

        // If negative (behind plane) clip
        if(d1 <= 0.0) 
        {
            out[sp++] = face.V1;
        }

        if(d2 <= 0.0)
        {
            out[sp++] = face.V2;
        }

        // If the points are on different sides of the plane
        if(d1 * d2 < 0.0) // less than to ignore -0.0f
        {
            // Push interesection point
            const alpha = d1 / (d1 - d2);

            out[sp] = face.V1.Add(face.V2.Sub(face.V1).Scale(alpha));

            ++sp;
        }

        // Assign our new converted values
        face.V1 = out[0];
        face.V2 = out[1];

        return sp;
    }

    public static PolygonPolygon(a: Polygon, b: Polygon): Contact
    {
        // Check for a separating axis with A's face planes
        const { BestIndex: faceA, BestDistance: penetrationA } = a.FindAxisLeastPenetration(b);

        if(penetrationA >= 0)
        {
            return null;
        }

        // Check for a separating axis with B's face planes
        const { BestIndex: faceB, BestDistance: penetrationB } = b.FindAxisLeastPenetration(a);

        if(penetrationB >= 0)
        {
            return null;
        }

        let refIndex: number;
        let flip: boolean; // Always point from a to b

        let ref: Polygon;
        let inc: Polygon;
      
        // Determine which shape contains reference face
        if(Tools.BiasGreaterThan(penetrationA, penetrationB))
        {
            ref = a;
            inc = b;
            refIndex = faceA;
            flip = false;
        }
        else
        {
            ref = b;
            inc = a;
            refIndex = faceB;
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

        refIndex = refIndex + 1 >= ref.GetLength() ? 0 : refIndex + 1;

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
        let separation = refFaceNormal.Dot(incidentFace.V1) - refC;

        if (separation <= 0.0)
        {
            contacts[cp] = incidentFace.V1;
            penetration = -separation;
            cp++;
        }
        else
        {
            penetration = 0;
        }

        separation = refFaceNormal.Dot(incidentFace.V2) - refC;

        if (separation <= 0.0)
        {
            contacts[cp] = incidentFace.V2;
            penetration += -separation;
            cp++;

            // Average penetration
            penetration /= cp;
        }

        return new Contact(penetration, normal, contacts);
    }

    public static Test(a: BaseShape, b: BaseShape): Contact
    {
        let contact: Contact;

        if(a instanceof Polygon && b instanceof Polygon)
        {
            contact = Overlap.PolygonPolygon(a, b);
        }
        else
        {
            throw new Error("Overlap type is not implemented!");
        }

        Logger.Debug(this, "Testing if A and B overlap", a, b, contact);

        return contact;
    }
}