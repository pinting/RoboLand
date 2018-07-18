import { Coord } from "./Coord";
import { BaseElement } from "./Element/BaseElement";
import { IReadOnlyElementList } from "./IReadOnlyElementList";
import { Utils } from "./Utils";

export class ElementList<Element extends BaseElement> implements IReadOnlyElementList<Element>
{
    private elements: Element[];

    /**
     * Contstruct a new ElementList which wraps a normal Array
     * and adds some awesome functions.
     * @param elements Array to wrap.
     * @param onUpdate Called when there is an update (remove, set).
     */
    public constructor(elements: Element[], onUpdate: (e: Element) => void)
    {
        this.elements = elements;
        this.OnUpdate = onUpdate;
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
     * Get a element(s) by coord or tag.
     * @param id 
     */ 
    public Get(id: Coord | string): Element[]
    {
        if(id instanceof Coord) {
            return this.elements.filter(e => e && e.GetPos().Is(<Coord>id));
        }

        return this.elements.filter(e => e && e.GetTag() == id);
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
     * @param BaseActor 
     */
    public Set(newElement: Element): void
    {
        const oldActors = this.Get(newElement.GetTag());

        if(oldActors.length)
        {
            oldActors.forEach(actor => this.Remove(actor));
        }

        this.elements.push(newElement);
        this.OnUpdate(newElement);
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
            this.OnUpdate(element);

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

    /**
     * Called when the list was updated.
     */
    public OnUpdate: (element: Element) => void = Utils.Noop;
}