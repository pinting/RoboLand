class Robot {
    say() {
        alert("Beep-beep!");
    }
}
/// <reference path="Robot.ts" />
var canvas = document.getElementById("canvas");
var robot = new Robot();
canvas.onclick = () => robot.say();
