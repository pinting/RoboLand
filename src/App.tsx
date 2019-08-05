import * as React from "react";
import { Game } from "./Game";
import { Helper } from "./Helper";
import { Debug } from "./Debug";
import { Editor } from "./Editor";
import { Constants } from "./Constants";

export class App extends React.Component
{
    /**
     * Construct a new app unit which handles routes.
     */
    constructor(props) 
    {
        super(props);
    }

    /**
     * Render the App unit - the output depends on the hash string.
     */
    render(): JSX.Element
    {
        switch(Helper.GetParam(Constants.Params.View))
        {
            case Editor.Name:
                return <Editor />;
            case Debug.Name:
                return <Debug />;
            case Game.Name:
            default:
                return <Game />;
        }
    }
}