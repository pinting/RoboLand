import * as express from "express";
import * as path from "path"

export function main(port: number = 8080)
{
    const app = express();

    app.use(express.static(path.join(__dirname, "www")));

    app.listen(port, function () 
    {
        console.log(`RoboLand listening on port ${port}}!`);
    });
}