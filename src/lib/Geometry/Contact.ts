import { Vector } from "./Vector";
import { Exportable, ExportType } from "../Exportable";

export class Contact extends Exportable
{
    @Exportable.Register(ExportType.All)
    public Penetration: number;

    @Exportable.Register(ExportType.All)
    public Normal: Vector;

    @Exportable.Register(ExportType.All)
    public Points: Vector[];

    public constructor(penetration: number, normal: Vector, points: Vector[])
    {
        super();

        this.Penetration = penetration;
        this.Normal = normal;
        this.Points = points;
    }
}