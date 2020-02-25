import { Vector } from "./Geometry/Vector";
import { Unit } from "./Unit/Unit";
import { Tools } from "./Util/Tools";
import { Event } from "./Util/Event";
import { Logger } from "./Util/Logger";

export interface IReadOnlyUnitList<U>
{
    GetLength(): number;
    Get(id: string): U;
    Find(position: Vector): U[];
    FindNearest(position: Vector): U;
    FindCollisions(unit: U): U[];
    GetArray(): U[];
}

export class UnitList<U extends Unit> implements IReadOnlyUnitList<U>
{
    private units: U[];
    private updateEvent: Event<U>;

    /**
     * Contstruct a new UnitList which wraps an unit array
     * and adds some extra functions.
     * @param units Array to wrap.
     * @param updateEvent Called when there is an update (remove, set).
     */
    public constructor(units: U[], updateEvent: Event<U>)
    {
        this.units = units;
        this.updateEvent = updateEvent;
    }

    /**
     * Get the length of the internal array.
     */
    public GetLength(): number
    {
        return this.units.length;
    }

    /**
     * Get unit by id.
     * @param id 
     */
    public Get(id: string): U
    {
        return this.units.find(e => e && e.GetId() == id);
    }

    /**
     * Get units by their position.
     * @param position 
     */ 
    public Find(position: Vector): U[]
    {
        return this.units.filter(e => e && e.GetBody().GetPosition().Is(position));
    }

    /**
     * Get the nearest unit to the given coordinate.
     * @param position 
     */
    public FindNearest(position: Vector): U
    {
        let result: U = null;
        let min = Infinity;

        this.units.forEach(e => 
        {
            const distance = e.GetBody().GetPosition().Dist(position);

            if(distance < min) 
            {
                min = distance;
                result = e;
            }
        });

        return result;
    }

    /**
     * Get units under a unit.
     * @param unit
     */
    public FindCollisions(unit: Unit): U[]
    {
        return this.units.filter(e => e.Collide(<U>unit));
    }

    /**
     * Add a new unit or overwrite an existing one (by id).
     * @param unit 
     */
    public Set(unit: U): void
    {
        if(unit.IsDisposed())
        {
            this.Remove(unit);
            return;
        }

        const old = this.Get(unit.GetId());

        if(old)
        {
            Tools.Extract(old, unit);
            Logger.Info(this, "Unit was moded!", unit);
        }
        else
        {
            this.units.push(unit);
            Logger.Info(this, "Unit was added!", unit);
        }

        this.updateEvent.Call(unit);
    }

    /**
     * Remove an unit from the list.
     * @param unit 
     */
    public Remove(unit: U): boolean
    {
        const index = this.units.indexOf(unit);

        if(index < 0)
        {
            return false;
        }

        this.units.splice(index, 1);

        if(!unit.IsDisposed()) 
        {
            unit.Dispose();
        }

        Logger.Info(this, "Unit was removed!", unit);
        this.updateEvent.Call(unit);

        return true;
    }

    /**
     * Get the internal array.
     */
    public GetArray(): U[]
    {
        return this.units;
    }
}