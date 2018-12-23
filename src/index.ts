import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./App";

window.onload = () => 
{
    ReactDOM.render(React.createElement(App), document.getElementById("root"));
};

const ExportMeta = "_exportMeta";

interface ExportDesc
{
    ExportTo: string;
    Access: number;
}

function Property(name: string, access: number = 0) 
{
    return (target, propertyKey: string, descriptor: PropertyDescriptor) =>
    {
        if(!target.hasOwnProperty(ExportMeta))
        {
            target[ExportMeta] = {};
        }

        target[ExportMeta][propertyKey] = <ExportDesc>{
            ExportTo: name,
            Access: access
        };
    }
}

class C {
    private _foobar;

    @Property("foobar", 2)
    get foobar()
    {
        return this._foobar;
    }

    set foobar(value)
    {
        this._foobar = value;
    }
}

window["C"] = C;