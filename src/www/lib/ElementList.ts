import { Coord } from "./Coord";
import { BaseElement } from "./Element/BaseElement";
import { IReadOnlyElementList } from "./IReadOnlyElementList";
import { Helper } from "./Util/Helper";
import { Event } from "./Util/Event";

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
     * Get element by tag.
     * @param tag 
     */
    public Get(tag: string): Element
    {
        return this.elements.find(e => e && e.Tag == tag);
    }

    /**
     * Get a element(s) by coord.
     * @param coord 
     */ 
    public Find(coord: Coord): Element[]
    {
        return this.elements.filter(e => e && e.Position.Is(<Coord>coord));
    }

    /**
     * Get the nearest element to the given coord.
     * @param coord 
     */
    public FindNear(coord: Coord): Element
    {
        let result: Element = null;
        let min = Infinity;

        this.elements.forEach(element => 
        {
            if(!element)
            {
                return;
            }

            const size = element.Size;
            const center = element.Position.Add(size.F(n => n / 2));
            const distance = center.GetDistance(coord);

            if(distance < min) 
            {
                min = distance;
                result = element;
            }
        });

        return result;
    }

    /**
     * Get elements between two coordinates.
     * @param from
     * @param to 
     */
    public FindBetween(from: Coord, to: Coord): Element[]
    {
        const result = [];

        this.elements.forEach(element => 
        {
            if(!element)
            {
                return;
            }

            const elementFrom = element.Position;
            const elementTo = element.Position.Add(element.Size);

            if(Coord.Collide(from, to, elementFrom, elementTo))
            {
                result.push(element);
            }
        });

        return result;
    }

    /**
     * Add a new element or overwrite an existing one (by tag).
     * @param element 
     */
    public Set(element: Element): void
    {
        const old = this.Get(element.Tag);

        if(old)
        {
            Helper.Extract(old, element);
        }
        else
        {
            this.elements.push(element);
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

        if(index >= 0)
        {
            this.elements.splice(index, 1);

            element.Dispose();
            this.updateEvent.Call(element);

            return true;
        }

        return false;
    }

    /**
     * Get the internal array.
     */
    public get List(): Element[]
    {
        return this.elements;
    }
}