import * as React from "react";
import { Game } from "./Game";
import { Helper } from "./Helper";
import { Debug } from "./Debug";

export class App extends React.Component
{
    /**
     * Construct a new app element which handles routes.
     */
    constructor(props) 
    {
        super(props);
    }

    /**
     * Render the App element - the output depends on the hash string.
     */
    render(): JSX.Element
    {
        switch(Helper.GetParam("view"))
        {
            case "debug":
                return <Debug />;
            case "game":
            default:
                return <Game />
        }
    }
}