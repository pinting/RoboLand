import { Vector } from "./Geometry/Vector";
import { Unit } from "./Unit/Unit";
import { IReadOnlyElementList } from "./IReadOnlyElementList";
import { Tools } from "./Util/Tools";
import { Event } from "./Util/Event";
import { Logger } from "./Util/Logger";

export class ElementList<Element extends Unit> implements IReadOnlyElementList<Element>
{
    private elements: Element[];
    private updateEvent: Event<Element>;

    /**
     * Contstruct a new ElementList which wraps an unit array
     * and adds some awesome functions.
     * @param elements Array to wrap.
     * @param updateEvent Called when there is an update (remove, set).
     */
    public constructor(elements: Element[], updateEvent: Event<Element>)
    {
        this.elements = elements;
        this.updateEvent = updateEvent;
    }

    /**
     * Get the length of the internal array.
     */
    public GetLength(): number
    {
        return this.elements.length;
    }

    /**
     * Go over the elements of the array.
     * @param callback 
     */
    public ForEach(callback: (Element) => boolean | void)
    {
        return this.elements.some(<any>callback);
    }

    /**
     * Get unit by id.
     * @param id 
     */
    public Get(id: string): Element
    {
        return this.elements.find(e => e && e.GetId() == id);
    }

    /**
     * Get a unit(s) by vector.
     * @param position 
     */ 
    public Find(position: Vector): Element[]
    {
        return this.elements.filter(e => e && e.GetPosition().Is(position));
    }

    /**
     * Get the nearest unit to the given coordinate.
     * @param position 
     */
    public FindNearest(position: Vector): Element
    {
        let result: Element = null;
        let min = Infinity;

        this.elements.forEach(e => 
        {
            const distance = e.GetPosition().Dist(position);

            if(distance < min) 
            {
                min = distance;
                result = e;
            }
        });

        return result;
    }

    /**
     * Get elements under an unit.
     * @param unit
     */
    public FindCollisions(unit: Unit): Element[]
    {
        const result = [];
        
        this.elements.forEach(e => 
        {
            if(e && e.GetId() != unit.GetId())
            {
                const collision = e.Collide(<Element>unit);
                
                collision && result.push(e);
            }
        });

        return result;
    }

    /**
     * Add a new unit or overwrite an existing one (by id).
     * @param unit 
     */
    public Set(unit: Element): void
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
            Logger.Info(this, "Element was moded!", unit);
        }
        else
        {
            this.elements.push(unit);
            Logger.Info(this, "Element was added!", unit);
        }

        this.updateEvent.Call(unit);
    }

    /**
     * Remove an unit from the list.
     * @param unit 
     */
    public Remove(unit: Element): boolean
    {
        const index = this.elements.indexOf(unit);

        if(index < 0)
        {
            return false;
        }

        this.elements.splice(index, 1);

        if(!unit.IsDisposed()) 
        {
            unit.Dispose();
        }

        Logger.Info(this, "Element was removed!", unit);
        this.updateEvent.Call(unit);

        return true;
    }

    /**
     * Get the internal array.
     */
    public GetList(): Element[]
    {
        return this.elements;
    }
}