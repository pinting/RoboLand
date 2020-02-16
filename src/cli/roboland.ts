#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

import { RoboPack, Resource } from "../lib/RoboPack";
import { Tools } from "../lib/Util/Tools";

export function toBuffer(arrayBuffer: ArrayBuffer): Buffer
{
    let buffer = Buffer.alloc(arrayBuffer.byteLength);
    let view = new Uint8Array(arrayBuffer);

    for (let i = 0; i < buffer.length; i++)
    {
        buffer[i] = view[i];
    }

    return buffer;
}

export function toArrayBuffer(buffer: Buffer): ArrayBuffer
{
    let arrayBuffer = new ArrayBuffer(buffer.length);
    let view = new Uint8Array(arrayBuffer);

    for (var i = 0; i < buffer.length; i++)
    {
        view[i] = buffer[i];
    }

    return arrayBuffer;
}

async function pack()
{
    const cwd = process.cwd();
    const parent = cwd.split(path.sep).pop();

    fs.readdir(cwd, async (error, names) => 
    {
        const resources = [];

        for(let name of names)
        {
            let arrayBuffer: ArrayBuffer;

            if(name.includes(".json"))
            {
                let string = fs.readFileSync(path.resolve(cwd, name), { encoding: "utf8" });

                // Escape all kind of BOM bullshit, because it should start with a bracket
                // TODO: Refactor this
                string = string.slice(string.indexOf("{"));
                arrayBuffer = Tools.UTF16ToANSI(string);
            }
            else
            {
                const buffer = fs.readFileSync(path.resolve(cwd, name));

                arrayBuffer = toArrayBuffer(buffer)
            }
            
            const resource = new Resource();

            resource.Init(name, arrayBuffer);
            resources.push(resource);
        }
        
        const packedList = await RoboPack.Pack(resources);
        const name = RoboPack.GenerateName(parent);
        const finalBuffer = toBuffer(packedList);

        fs.writeFileSync(path.resolve(cwd, name), finalBuffer, { flag: "w" })
    });
}

async function unpack(name: string)
{
    const dot = name.lastIndexOf(".");
    const parent = name.substr(0, dot < 0 ? name.length : dot);

    const cwd = process.cwd();
    const buffer = fs.readFileSync(path.resolve(cwd, name));
    const arrayBuffer = toArrayBuffer(buffer);
    const resources = await RoboPack.Unpack(arrayBuffer);

    if (!fs.existsSync(parent))
    {
        fs.mkdirSync(parent);
    }

    for(let resource of resources)
    {
        const data = toBuffer(resource.Buffer);

        fs.writeFileSync(path.resolve(cwd, parent, resource.Uri), data, { flag: "w" })
    }
}

async function main(args: string[] = [])
{
    const task = args[0];
    const fileName = args[1];

    if(!task || (task == "unpack" && !fileName))
    {
        return console.log("Usage: roboland unpack/pack [file]");
    }

    switch(args[0])
    {
        case "pack":
            return pack();
        case "unpack":
            return unpack(fileName);
    }
}

main(process.argv.slice(2));