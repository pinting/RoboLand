import { Robot } from "./Robot"

var canvas = document.getElementById("canvas");
var robot = new Robot();

canvas.onclick = () => robot.say();