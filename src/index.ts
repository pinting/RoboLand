import * as express from "express";
import * as path from "path"

export function main(port: number = 80)
{
    const app = express();
    
    var www = express.static(path.join(__dirname, "www"));

    app.use("/www", www);
    app.use("/", www);

    app.use("/src", express.static(path.join(__dirname, "src")));

    app.listen(port, function () 
    {
        console.log(`RoboLand listening on port ${port}}!`);
    });
}