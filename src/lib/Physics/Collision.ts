import { Contact } from "../Geometry/Contact";
import { Body } from "./Body";
import { Vector } from "../Geometry/Vector";
import { Exportable, ExportType } from "../Exportable";

export class Collision extends Contact
{
    @Exportable.Register(ExportType.All)
    A: Body;

    @Exportable.Register(ExportType.All)
    B: Body;

    public constructor(penetration: number, normal: Vector, points: Vector[], a: Body, b: Body)
    {
        super(penetration, normal, points);

        this.A = a;
        this.B = b;
    }

    public GetContact()
    {
        return new Contact(this.Penetration, this.Normal, this.Points);
    }
}