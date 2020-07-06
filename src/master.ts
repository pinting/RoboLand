import "bootstrap-css";
import * as webrtc from "webrtc-adapter"
import * as React from "react";
import * as ReactDOM from "react-dom";

import { App } from "./App"
import { Boot } from "./lib/Boot";

Boot.Setup();

window.onload = window.onhashchange = () => 
{
    webrtc;
    ReactDOM.render(React.createElement(App), document.getElementById("root"));
};