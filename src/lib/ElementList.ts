import { Vector } from "./Geometry/Vector";
import { BaseElement } from "./Element/BaseElement";
import { IReadOnlyElementList } from "./IReadOnlyElementList";
import { Tools } from "./Util/Tools";
import { Event } from "./Util/Event";
import { Logger } from "./Util/Logger";

export class ElementList<Element extends BaseElement> implements IReadOnlyElementList<Element>
{
    private elements: Element[];
    private updateEvent: Event<Element>;

    /**
     * Contstruct a new ElementList which wraps an element array
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
     * Get element by id.
     * @param id 
     */
    public Get(id: string): Element
    {
        return this.elements.find(e => e && e.GetId() == id);
    }

    /**
     * Get a element(s) by vector.
     * @param position 
     */ 
    public Find(position: Vector): Element[]
    {
        return this.elements.filter(e => e && e.GetPosition().Is(position));
    }

    /**
     * Get the nearest element to the given coordinate.
     * @param position 
     */
    public FindNearest(position: Vector): Element
    {
        let result: Element = null;
        let min = Infinity;

        this.elements.forEach(e => 
        {
            const distance = e.GetCenter().Dist(position);

            if(distance < min) 
            {
                min = distance;
                result = e;
            }
        });

        return result;
    }

    /**
     * Get elements under an element.
     * @param elementOrMesh
     */
    public FindCollisions(element: BaseElement): Element[]
    {
        const result = [];
        
        this.elements.forEach(e => 
        {
            if(e && e.GetId() != element.GetId() && e.Collide(<Element>element))
            {
                result.push(e);
            }
        });

        return result;
    }

    /**
     * Add a new element or overwrite an existing one (by id).
     * @param element 
     */
    public Set(element: Element): void
    {
        if(element.IsDisposed())
        {
            this.Remove(element);
            return;
        }

        const old = this.Get(element.GetId());

        if(old)
        {
            Tools.Extract(old, element);
            Logger.Info(this, "Element was moded!", element);
        }
        else
        {
            this.elements.push(element);
            Logger.Info(this, "Element was added!", element);
        }

        this.updateEvent.Call(element);
    }

    /**
     * Remove an element from the list.
     * @param element 
     */
    public Remove(element: Element): boolean
    {
        const index = this.elements.indexOf(element);

        if(index < 0)
        {
            return false;
        }

        this.elements.splice(index, 1);

        if(!element.IsDisposed()) 
        {
            element.Dispose();
        }

        Logger.Info(this, "Element was removed!", element);
        this.updateEvent.Call(element);

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