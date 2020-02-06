import * as React from "react";
import { Game } from "./Game/Game";
import { Helper } from "./Helper";
import { DevTools } from "./DevTools/DevTools";
import { Params } from "./Params";

export class App extends React.Component
{
    render(): JSX.Element
    {
        switch(Helper.GetParam(Params.View))
        {
            case "devtools":
                return <DevTools />;
            case "game":
            default:
                return <Game />;
        }
    }
}