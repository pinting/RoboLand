import { Vector } from "./Vector";
import { Exportable, ExportType } from "../Exportable";

export abstract class BaseShape extends Exportable
{
    private virtual: Vector[];
    
    @Exportable.Register(ExportType.Visible)
    protected points: Vector[];

    protected offset: Vector = new Vector(0, 0);
    protected rotation: number = 0;
    protected scale: number = 1;

    public constructor(points: Vector[])
    {
        super();

        this.points = points;
    }

    public GetPoints()
    {
        return this.points;
    }

    public GetVirtual(): Vector[]
    {
        if(!this.virtual)
        {
            this.virtual = this.points.map(p => p
                .Scale(this.scale)
                .Rotate(this.rotation)
                .Add(this.offset));
        }

        return this.virtual;
    }

    public SetVirtual(scale?: number, rotation?: number, offset?: Vector): void
    {
        scale && (this.scale = scale);
        rotation && (this.rotation = rotation);
        offset && (this.offset = offset);

        this.virtual = null;
    }
}