"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const path = require("path");
function main(port = 8080) {
    const app = express();
    app.use(express.static(path.join(__dirname, "www")));
    app.listen(port, function () {
        console.log(`RoboLand listening on port ${port}}!`);
    });
}
exports.main = main;
