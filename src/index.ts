import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./App";
import { Exportable } from "./lib/Exportable";

window.onload = () => 
{
    ReactDOM.render(React.createElement(App), document.getElementById("root"));
};