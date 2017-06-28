/// <reference path="Robot.ts" />

var canvas = document.getElementById("canvas");
var robot = new Robot();

canvas.onclick = () => robot.say();