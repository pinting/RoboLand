import { Coord } from "./Coord";
import { BaseElement } from "./Element/BaseElement";
import { IReadOnlyElementList } from "./IReadOnlyElementList";
import { Helper } from "./Util/Helper";
import { Event } from "./Util/Event";

export class ElementList<Element extends BaseElement> implements IReadOnlyElementList<Element>
{
    private elements: Element[];
    private onUpdate: Event<Element>;

    /**
     * Contstruct a new ElementList which wraps an element array
     * and adds some awesome functions.
     * @param elements Array to wrap.
     * @param onUpdate Called when there is an update (remove, set).
     */
    public constructor(elements: Element[], onUpdate: Event<Element>)
    {
        this.elements = elements;
        this.onUpdate = onUpdate;
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
    public Tag(tag: string): Element
    {
        return this.elements.find(e => e && e.GetTag() == tag);
    }

    /**
     * Get a element(s) by coord.
     * @param coord 
     */ 
    public Get(coord: Coord): Element[]
    {
        return this.elements.filter(e => e && e.GetPos().Is(<Coord>coord));
    }

    /**
     * Get the nearest cell to the given coord.
     * @param coord 
     */
    public GetNear(coord: Coord): Element
    {
        let result: Element = null;
        let min = Infinity;

        this.elements.forEach(element => 
        {
            if(!element)
            {
                return;
            }

            const size = element.GetSize();
            const center = element.GetPos().Add(size.F(n => n / 2));
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
     * Get cells between two coordinates.
     * @param from
     * @param to 
     */
    public GetBetween(from: Coord, to: Coord): Element[]
    {
        const result = [];

        from = from.Floor();
        to = to.Ceil();

        this.elements.forEach(element => 
        {
            if(!element)
            {
                return;
            }

            const cellFrom = element.GetPos();
            const cellTo = element.GetPos().Add(element.GetSize());

            if(Coord.Collide(from, to, cellFrom, cellTo))
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
        const old = this.Tag(element.GetTag());

        if(old)
        {
            Helper.Extract(old, element);
        }
        else
        {
            this.elements.push(element);
        }

        this.onUpdate.Call(element);
    }

    /**
     * Remove an element from the map (a cell or an actor).
     * @param element 
     */
    public Remove(element: Element): boolean
    {
        const index = this.elements.indexOf(element);

        if(index >= 0)
        {
            this.elements.splice(index, 1);

            element.Dispose();
            this.onUpdate.Call(element);

            return true;
        }

        return false;
    }

    /**
     * Get the internal array.
     */
    public List(): Element[]
    {
        return this.elements;
    }
}