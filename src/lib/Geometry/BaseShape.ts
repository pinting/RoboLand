import { Vector } from "./Vector";
import { Exportable, ExportType } from "../Exportable";

export abstract class BaseShape extends Exportable
{
    private virtual: Vector[];
    
    @Exportable.Register(ExportType.NetDisk)
    protected points: Vector[];

    @Exportable.Register(ExportType.NetDisk)
    protected position: Vector = new Vector(0, 0);
    
    @Exportable.Register(ExportType.NetDisk)
    protected rotation: number = 0;
    
    @Exportable.Register(ExportType.NetDisk)
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
     * Virtual equals the base points scaled, rotated and increased by an position.
     */
    public GetVirtual(): Vector[]
    {
        if(!this.virtual)
        {
            this.virtual = this.points.map(p => p
                .Scale(this.scale)
                .Rotate(this.rotation)
                .Add(this.position));
        }

        return this.virtual;
    }
    
    public SetVirtual(scale?: Vector, rotation?: number, position?: Vector): void
    {
        scale && (this.scale = scale);
        rotation && (this.rotation = rotation);
        position && (this.position = position);

        this.virtual = null;
    }
}