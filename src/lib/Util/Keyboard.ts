export class Keyboard
{
    public static Keys: { [key: string]: boolean } = {};
    private static Inited = false;

    /**
     * Executed when a key is pressed.
     * @param event 
     * @param state 
     */
    private static OnKey(event, state: boolean): void
    {
        Keyboard.Keys[event.key.toUpperCase()] = state;
        Keyboard.Keys[event.key.toLowerCase()] = state;
        Keyboard.Keys[event.keyCode] = state;
    };

    /**
     * Init keyboard listeners.
     */
    public static Init(): void
    {
        if(Keyboard.Inited)
        {
            return;
        }

        Keyboard.Inited = true;

        window.addEventListener("keydown", e => Keyboard.OnKey(e, true), false);
        window.addEventListener("keyup", e => Keyboard.OnKey(e, false), false);
    }
}