import { Vector } from "./Vector";
import { Exportable, ExportType } from "../Exportable";

export abstract class BaseShape extends Exportable
{
    private virtual: Vector[];
    
    @Exportable.Register(ExportType.Visible)
    protected points: Vector[];

    @Exportable.Register(ExportType.Visible)
    protected offset: Vector = new Vector(0, 0);
    
    @Exportable.Register(ExportType.Visible)
    protected rotation: number = 0;
    
    @Exportable.Register(ExportType.Visible)
    protected scale: Vector = new Vector(1, 1);

    public constructor(points: Vector[])
    {
        super();

        this.points = points;
    }

    public GetPoints()
    {
        return this.points;
    }

    /**
     * Get virtual points.
     * Virtual equals the base points scaled, rotated and increased by an offset.
     */
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
    
    public SetVirtual(scale?: Vector, rotation?: number, offset?: Vector): void
    {
        scale && (this.scale = scale);
        rotation && (this.rotation = rotation);
        offset && (this.offset = offset);

        this.virtual = null;
    }
}