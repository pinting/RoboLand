import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./App";

window.onload = window.onhashchange = () => 
{
    ReactDOM.render(React.createElement(App), document.getElementById("root"));
};