(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Coord {
    constructor(x = 0, y = 0) {
        this.X = x;
        this.Y = y;
    }
    GetDistance(other) {
        return Math.sqrt(Math.pow(this.X - other.X, 2) + Math.pow(this.Y - other.Y, 2));
    }
    Is(other) {
        return this.X == other.X && this.Y == other.Y;
    }
    Difference(other) {
        return new Coord(this.X + other.X, this.Y + other.Y);
    }
    Clone() {
        return new Coord(this.X, this.Y);
    }
}
exports.Coord = Coord;
},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CellType_1 = require("./CellType");
const GroundCell_1 = require("./GroundCell");
const WaterCell_1 = require("./WaterCell");
class CellFactory {
    static FromType(type, position) {
        switch (type) {
            case CellType_1.CellType.Ground:
                return new GroundCell_1.GroundCell(position);
            case CellType_1.CellType.Water:
                return new WaterCell_1.WaterCell(position);
        }
    }
}
exports.CellFactory = CellFactory;
},{"./CellType":3,"./GroundCell":4,"./WaterCell":5}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CellType;
(function (CellType) {
    CellType[CellType["Ground"] = 0] = "Ground";
    CellType[CellType["Water"] = 1] = "Water";
})(CellType = exports.CellType || (exports.CellType = {}));
},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MoveType_1 = require("../MoveType");
const CellType_1 = require("./CellType");
class GroundCell {
    constructor(position) {
        this.position = position;
    }
    GetType() {
        return CellType_1.CellType.Ground;
    }
    GetTexture() {
        return "res/ground.png";
    }
    GetPosition() {
        return this.position;
    }
    MoveHere(actor) {
        if (this.actor != null) {
            return MoveType_1.MoveType.Blocked;
        }
        this.actor = actor;
        return MoveType_1.MoveType.Successed;
    }
    MoveAway() {
        this.actor = null;
    }
}
exports.GroundCell = GroundCell;
},{"../MoveType":6,"./CellType":3}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GroundCell_1 = require("./GroundCell");
const MoveType_1 = require("../MoveType");
const CellType_1 = require("./CellType");
class WaterCell extends GroundCell_1.GroundCell {
    GetType() {
        return CellType_1.CellType.Water;
    }
    GetTexture() {
        return "res/water.png";
    }
    MoveHere(actor) {
        return MoveType_1.MoveType.Killed;
    }
}
exports.WaterCell = WaterCell;
},{"../MoveType":6,"./CellType":3,"./GroundCell":4}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MoveType;
(function (MoveType) {
    MoveType[MoveType["Successed"] = 0] = "Successed";
    MoveType[MoveType["Blocked"] = 1] = "Blocked";
    MoveType[MoveType["Killed"] = 2] = "Killed";
})(MoveType = exports.MoveType || (exports.MoveType = {}));
},{}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Map_1 = require("../../Map");
const MoveType_1 = require("../MoveType");
class BasicActor {
    constructor(position) {
        this.map = Map_1.Map.GetInstance();
        this.health = 1.0;
        this.damage = 1.0;
        this.position = position;
        var cell = Map_1.Map.GetInstance().GetCell(position);
        if (cell != null) {
            cell.MoveHere(this);
        }
    }
    GetTexture() {
        return "res/actor.png";
    }
    Move(direction) {
        if (Math.abs(Math.abs(direction.X) - Math.abs(direction.Y)) == 0) {
            return false;
        }
        var lastCell = this.map.GetCell(this.position);
        var nextCoord = this.position.Difference(direction);
        var nextCell = this.map.GetCell(nextCoord);
        if (lastCell == null || nextCell == null) {
            return false;
        }
        switch (nextCell.MoveHere(this)) {
            case MoveType_1.MoveType.Blocked:
                return false;
            case MoveType_1.MoveType.Killed:
                lastCell.MoveAway();
                this.position = nextCoord;
                this.Kill();
                return false;
            case MoveType_1.MoveType.Successed:
                lastCell.MoveAway();
                this.position = nextCoord;
                this.map.OnUpdate();
                return true;
        }
    }
    Attack(actor) {
        if (this.position.GetDistance(actor.GetPosition()) > 1) {
            return false;
        }
        actor.Damage(this.damage);
    }
    GetPosition() {
        return this.position;
    }
    Damage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.Kill();
        }
    }
    Kill() {
        this.health = 0;
        this.map.RemoveActor(this);
        this.map.OnUpdate();
    }
    IsAlive() {
        return this.health > 0;
    }
}
exports.BasicActor = BasicActor;
},{"../../Map":12,"../MoveType":6}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Map_1 = require("../Map");
const Coord_1 = require("../Coord");
const CellType_1 = require("../Element/Cell/CellType");
class Adapter {
    constructor(actor) {
        this.actor = actor;
        this.map = Map_1.Map.GetInstance();
    }
    inv(n) {
        return n == 0 ? 1 : 0;
    }
    move(dx, dy) {
        return this.actor.Move(new Coord_1.Coord(dx, dy)) ? 1 : 0;
    }
    test(dx, dy) {
        var cell = this.map.GetCell(this.actor.GetPosition().Difference(new Coord_1.Coord(dx, dy)));
        return cell != null && cell.GetType() == CellType_1.CellType.Ground ? 1 : 0;
    }
    attack() {
        var result = null;
        this.map.GetActors().some(actor => {
            if (actor.GetPosition().GetDistance(this.actor.GetPosition()) == 1) {
                result = actor;
                return true;
            }
            return false;
        });
        return result != null && this.actor.Attack(result) ? 1 : 0;
    }
}
exports.Adapter = Adapter;
},{"../Coord":1,"../Element/Cell/CellType":3,"../Map":12}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Parser {
    Parse(lines) {
        this.Code = [];
        this.Labels = {};
        lines.split("\n").forEach(line => this.ParseLine(line));
    }
    ParseLine(line) {
        if (line[0] == "#") {
            return;
        }
        let parameters = line.split(" ");
        switch (parameters[0]) {
            case "LABEL":
                this.ParseLabel(parameters);
                break;
            case "GOTO":
            case "CALL":
            case "SET":
                this.ParseCode(parameters);
                break;
        }
    }
    ParseLabel(parameters) {
        if (parameters.length != 2) {
            throw new Error("Invalid LABEL");
        }
        this.Labels[parameters[1]] = this.Code.length;
    }
    ParseCode(parameters) {
        this.Code.push(parameters);
    }
}
exports.Parser = Parser;
},{}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Processor {
    GetInner(input) {
        if (input.indexOf("(") < 0)
            return null;
        let start = 0;
        let brackets = 0;
        for (let i = 0; i < input.length; i++) {
            switch (input[i]) {
                case "(":
                    if (brackets++ == 0)
                        start = i;
                    break;
                case ")":
                    if (brackets-- == 1)
                        return [start, i];
                    break;
            }
        }
        return null;
    }
    GetBlock(input) {
        const get = (input, a, b) => {
            let ap = input.indexOf(a);
            let bp = input.indexOf(b);
            if (ap < 0 && bp < 0)
                return input;
            if (ap < 0)
                ap = input.length;
            if (bp < 0)
                bp = input.length;
            let first = ap < bp ? ap : bp;
            let type = ap < bp ? a : b;
            return {
                left: input.substring(0, first),
                right: input.substring(first + 1, input.length),
                method: type
            };
        };
        if (!input.method) {
            input = get(input, "+", "-");
            if (!input.method)
                input = get(input, "*", "/");
        }
        return input;
    }
    ExtractBlock(block) {
        block = this.GetBlock(block);
        if (!block.method)
            return block;
        block.left = this.ExtractBlock(block.left);
        block.right = this.ExtractBlock(block.right);
        return block;
    }
    CalculateBlock(block) {
        if (!block.method) {
            const result = block.length == 0 ? 0 : parseFloat(block);
            if (result == NaN)
                throw new Error("Not a number!");
            return result;
        }
        switch (block.method) {
            case "+":
                return this.CalculateBlock(block.left) + this.CalculateBlock(block.right);
            case "-":
                return this.CalculateBlock(block.left) - this.CalculateBlock(block.right);
            case "*":
                return this.CalculateBlock(block.left) * this.CalculateBlock(block.right);
            case "/":
                return this.CalculateBlock(block.left) / this.CalculateBlock(block.right);
        }
    }
    Calculate(input) {
        let range;
        while ((range = this.GetInner(input)) != null) {
            const result = this.Calculate(input.substring(range[0] + 1, range[1]));
            input = input.substring(0, range[0]) + result + input.substring(range[1] + 1, input.length);
        }
        let block = this.ExtractBlock(input);
        return this.CalculateBlock(block);
    }
    ResolveFunctions(input) {
        const pattern = /[A-Za-z][A-Za-z0-9]*\(/;
        let start = null;
        while ((start = input.match(pattern)) != null) {
            const range = this.GetInner(input.substr(start.index)).map(p => p + start.index);
            const name = input.substring(start.index, range[0]);
            const args = [];
            const resolved = [];
            let last = range[0] + 1;
            let brackets = 0;
            for (let i = range[0] + 1; i <= range[1]; i++) {
                const c = input[i];
                if (c == "(") {
                    brackets++;
                }
                else if ((c == ")" && --brackets == -1) || (c == "," && brackets == 0)) {
                    args.push(input.substring(last, i).trim());
                    last = i + 1;
                }
            }
            args.forEach(arg => resolved.push(this.Solve(arg)));
            const result = parseFloat(this.Context[name].apply(this.Context, resolved));
            if (result == NaN)
                throw new Error("Not a number!");
            input = input.substring(0, start.index) + result + input.substring(range[1] + 1, input.length);
        }
        return input;
    }
    ResolveVariables(input) {
        const pattern = /[A-Za-z][A-Za-z0-9]*/;
        let start = null;
        while ((start = input.match(pattern)) != null) {
            const result = parseFloat(this.Context[start[0]]);
            if (result == NaN)
                throw new Error("Not a number!");
            input = input.substring(0, start.index) + result + input.substring(start.index + start[0].length, input.length);
        }
        return input;
    }
    Solve(input) {
        return this.Calculate(this.ResolveVariables(this.ResolveFunctions(input)));
    }
}
exports.Processor = Processor;
},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Adapter_1 = require("./Adapter");
const Processor_1 = require("./Processor");
const Parser_1 = require("./Parser");
const Utils_1 = require("../Utils");
class Runner {
    constructor(actor) {
        this.speed = 300;
        this.OnLine = Utils_1.Utils.Noop;
        this.adapter = new Adapter_1.Adapter(actor);
        this.processor = new Processor_1.Processor;
        this.parser = new Parser_1.Parser;
    }
    Run(code) {
        this.Stop();
        this.parser.Parse(code);
        Utils_1.Utils.Bind(this.processor.Context = {}, this.adapter, [
            "inv",
            "move",
            "test",
            "attack"
        ]);
        this.counter = 0;
        this.interval = setInterval(() => this.ExecuteLine(), this.speed);
    }
    Stop() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
    ExecuteLine() {
        if (this.counter < 0 || this.counter >= this.parser.Code.length) {
            this.Stop();
            return;
        }
        let line = this.parser.Code[this.counter++];
        this.OnLine(line.join(" "), this.counter - 1);
        try {
            switch (line[0]) {
                case "LABEL":
                    break;
                case "GOTO":
                    this.ExecuteGoto(line);
                    break;
                case "CALL":
                    this.ExecuteCall(line);
                    break;
                case "SET":
                    this.ExecuteSet(line);
                    break;
            }
        }
        catch (e) {
            this.Stop();
        }
    }
    ExecuteGoto(parameters) {
        const set = () => this.counter = this.parser.Labels.hasOwnProperty(parameters[1]) ? this.parser.Labels[parameters[1]] : -1;
        if (parameters.length == 2) {
            set();
            this.ExecuteLine();
        }
        else if (parameters.length >= 4) {
            let condition = parameters.slice(3).join(" ");
            if (this.processor.Solve(condition) != 0) {
                set();
                this.ExecuteLine();
            }
        }
        else {
            throw new Error("Invalid GOTO");
        }
    }
    ExecuteCall(parameters) {
        if (parameters.length < 2) {
            throw new Error("Invalid CALL");
        }
        let call = parameters.slice(1).join(" ");
        this.processor.Solve(call);
    }
    ExecuteSet(parameters) {
        if (parameters.length < 3) {
            throw new Error("Invalid SET");
        }
        let call = parameters.slice(2).join(" ");
        this.processor.Context[parameters[1]] = this.processor.Solve(call);
    }
    GetCounter() {
        return this.counter;
    }
}
exports.Runner = Runner;
},{"../Utils":13,"./Adapter":8,"./Parser":9,"./Processor":10}],12:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const GroundCell_1 = require("./Element/Cell/GroundCell");
const Coord_1 = require("./Coord");
const Utils_1 = require("./Utils");
const CellFactory_1 = require("./Element/Cell/CellFactory");
const CellType_1 = require("./Element/Cell/CellType");
const BasicActor_1 = require("./Element/Actor/BasicActor");
class Map {
    constructor() {
        this.actorCount = 2;
        this.OnUpdate = Utils_1.Utils.Noop;
    }
    static GetInstance() {
        if (Map.instance == undefined) {
            return Map.instance = new Map();
        }
        return Map.instance;
    }
    Init(size) {
        this.size = size;
        this.actors = [];
        this.cells = [];
        for (var i = 0; i < size * size; i++) {
            let x = i % size;
            let y = Math.floor(i / size);
            this.cells[i] = new GroundCell_1.GroundCell(new Coord_1.Coord(x, y));
        }
        this.actors.push(new BasicActor_1.BasicActor(new Coord_1.Coord(Utils_1.Utils.Random(0, size - 1), 0)));
        this.actors.push(new BasicActor_1.BasicActor(new Coord_1.Coord(Utils_1.Utils.Random(0, size - 1), size - 1)));
        this.OnUpdate();
    }
    Load(url) {
        return __awaiter(this, void 0, void 0, function* () {
            var raw;
            try {
                raw = JSON.parse(yield Utils_1.Utils.Get(url));
                if (raw == null && raw.length < 2 && raw.length != Math.pow(raw[0], 2) + 1) {
                    return;
                }
            }
            catch (e) {
                return;
            }
            this.cells = [];
            this.actors = [];
            this.size = raw.shift();
            var actorSpots = new Array();
            var actorCount = 0;
            for (let i = 0; i < raw.length; i++) {
                let x = i % this.size;
                let y = Math.floor(i / this.size);
                let type = raw[i];
                this.cells[i] = CellFactory_1.CellFactory.FromType(type, new Coord_1.Coord(x, y));
                if (actorCount < this.actorCount && type == CellType_1.CellType.Ground) {
                    if (Utils_1.Utils.Random(0, 20) == 1) {
                        this.actors.push(new BasicActor_1.BasicActor(new Coord_1.Coord(x, y)));
                        actorCount++;
                    }
                    else {
                        actorSpots.push(new Coord_1.Coord(x, y));
                    }
                }
            }
            for (; actorSpots.length > 0 && actorCount < this.actorCount; actorCount++) {
                let coord = actorSpots.splice(Utils_1.Utils.Random(0, actorSpots.length - 1), 1)[0];
                let actor = new BasicActor_1.BasicActor(coord);
                this.actors.push(actor);
            }
            this.OnUpdate();
        });
    }
    GetElement(form, coord) {
        var result = null;
        form.some(e => {
            if (e.GetPosition().Is(coord)) {
                result = e;
                return true;
            }
        });
        return result;
    }
    GetCell(coord) {
        return this.GetElement(this.cells, coord);
    }
    GetActor(coord) {
        return this.GetElement(this.actors, coord);
    }
    RemoveActor(actor) {
        var index = this.actors.indexOf(actor);
        if (index >= 0) {
            this.actors.splice(index, 1);
        }
    }
    GetSize() {
        return this.size;
    }
    GetCells() {
        return this.cells;
    }
    GetActors() {
        return this.actors;
    }
    GetElements() {
        return this.cells.concat(this.actors);
    }
}
exports.Map = Map;
},{"./Coord":1,"./Element/Cell/CellFactory":2,"./Element/Cell/CellType":3,"./Element/Cell/GroundCell":4,"./Element/Actor/BasicActor":7,"./Utils":13}],13:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class Utils {
    static Ajax(url, data, method) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                let request = new XMLHttpRequest();
                request.open(method, url, true);
                request.onreadystatechange = () => {
                    if (request.readyState != 4) {
                        return;
                    }
                    if (request.status == 200) {
                        resolve(request.responseText);
                    }
                    else {
                        resolve(null);
                    }
                };
                if (data != null && data.length > 0) {
                    request.setRequestHeader("Content-Type", "application/json");
                    request.send(data);
                }
                else {
                    request.send();
                }
            });
        });
    }
    static Post(url, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Utils.Ajax(url, data, "POST");
        });
    }
    static Get(url) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Utils.Ajax(url, null, "GET");
        });
    }
    static Random(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    static Extract(to, from) {
        for (let key in from) {
            if (from.hasOwnProperty(key)) {
                to[key] = from[key];
            }
        }
    }
    static Bind(to, from, properties) {
        for (let key in properties) {
            const p = properties[key];
            if (from[p] !== undefined) {
                to[p] = from[p].bind(from);
            }
        }
    }
    static Noop() {
        return;
    }
}
exports.Utils = Utils;
},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Processor_1 = require("./Interpreter/Processor");
const Runner_1 = require("./Interpreter/Runner");
const Map_1 = require("./Map");
const Coord_1 = require("./Coord");
const Utils_1 = require("./Utils");
Utils_1.Utils.Extract(window, { Coord: Coord_1.Coord, Map: Map_1.Map, Utils: Utils_1.Utils, Processor: Processor_1.Processor, Runner: Runner_1.Runner });
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const codeTextarea = document.getElementById("code");
const pushButton = document.getElementById("push");
const stopButton = document.getElementById("stop");
const lineInput = document.getElementById("line");
let map = Map_1.Map.GetInstance();
let runner = null;
const last = [];
let player = null;
let enemy = null;
const size = 30;
const draw = (e, loaded) => {
    let coord = e.GetPosition();
    let x = coord.X;
    let y = coord.Y;
    let image = new Image();
    image.onload = () => {
        context.drawImage(image, x * size, y * size, size, size);
        loaded();
    };
    image.src = e.GetTexture();
};
const update = () => {
    if (!runner) {
        player = map.GetActors()[0];
        enemy = map.GetActors()[1];
        runner = new Runner_1.Runner(player);
        runner.OnLine = (line, count) => {
            lineInput.value = `${count}: ${line}`;
        };
        canvas.width = size * map.GetSize();
        canvas.height = size * map.GetSize();
        canvas.onclick = e => update();
        let i = 0;
        map.GetCells().forEach(cell => {
            draw(cell, () => {
                if (++i == map.GetSize()) {
                    map.GetActors().forEach(actor => {
                        last.push(actor.GetPosition().Clone());
                        draw(actor, Utils_1.Utils.Noop);
                    });
                }
            });
        });
    }
    else {
        let i = 0;
        last.forEach(c => {
            draw(map.GetCell(c), Utils_1.Utils.Noop);
            if (++i == last.length) {
                last.length = 0;
                map.GetActors().forEach(actor => {
                    last.push(actor.GetPosition().Clone());
                    draw(actor, Utils_1.Utils.Noop);
                });
            }
        });
    }
    if (!player.IsAlive() || !enemy.IsAlive()) {
        alert(player.IsAlive() ? "You won!" : "You lose!");
        stopButton.disabled = true;
        pushButton.disabled = true;
        runner.Stop();
    }
};
pushButton.onclick = e => runner.Run(codeTextarea.value);
stopButton.onclick = e => runner.Stop();
Utils_1.Utils.Get("res/example.txt").then(result => codeTextarea.value = result);
map.Load("res/map.json");
map.OnUpdate = update;
},{"./Coord":1,"./Interpreter/Processor":10,"./Interpreter/Runner":11,"./Map":12,"./Utils":13}]},{},[14])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd3d3L2xpYi9Db29yZC50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvQ2VsbC9DZWxsRmFjdG9yeS50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvQ2VsbC9DZWxsVHlwZS50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvQ2VsbC9Hcm91bmRDZWxsLnRzIiwic3JjL3d3dy9saWIvRWxlbWVudC9DZWxsL1dhdGVyQ2VsbC50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvTW92ZVR5cGUudHMiLCJzcmMvd3d3L2xpYi9FbGVtZW50L1JvYm90L0Jhc2ljUm9ib3QudHMiLCJzcmMvd3d3L2xpYi9JbnRlcnByZXRlci9BZGFwdGVyLnRzIiwic3JjL3d3dy9saWIvSW50ZXJwcmV0ZXIvUGFyc2VyLnRzIiwic3JjL3d3dy9saWIvSW50ZXJwcmV0ZXIvUHJvY2Vzc29yLnRzIiwic3JjL3d3dy9saWIvSW50ZXJwcmV0ZXIvUnVubmVyLnRzIiwic3JjL3d3dy9saWIvTWFwLnRzIiwic3JjL3d3dy9saWIvVXRpbHMudHMiLCJzcmMvd3d3L2xpYi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUE7SUFRSSxZQUFZLElBQVksQ0FBQyxFQUFFLElBQVksQ0FBQztRQUVwQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2YsQ0FBQztJQU1NLFdBQVcsQ0FBQyxLQUFZO1FBRTNCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENB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QUM7SUFDbEIsQ0FBQztBQUNMLENBQUMsQ0FBQztBQUVGLFVBQVUsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pELFVBQVUsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUV4QyxhQUFLLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxZQUFZLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDO0FBQ3pFLEdBQUcsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFekIsR0FBRyxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZXhwb3J0IGNsYXNzIENvb3JkXHJcbntcclxuICAgIHB1YmxpYyBYOiBudW1iZXI7XHJcbiAgICBwdWJsaWMgWTogbnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29uc3RydWN0IGEgbmV3IGNvb3JkLlxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIgPSAwLCB5OiBudW1iZXIgPSAwKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuWCA9IHg7XHJcbiAgICAgICAgdGhpcy5ZID0geTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgZGlzdGFuY2UgZnJvbSB0aGUgb3RoZXIgY29vcmQuXHJcbiAgICAgKiBAcGFyYW0gb3RoZXIgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBHZXREaXN0YW5jZShvdGhlcjogQ29vcmQpOiBudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHRoaXMuWCAtIG90aGVyLlgsIDIpICsgTWF0aC5wb3codGhpcy5ZIC0gb3RoZXIuWSwgMikpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2sgaWYgdGhlIGNvb3JkIGlzIHRoZSBzYW1lIGFzIGFuIG90aGVyLlxyXG4gICAgICogQHBhcmFtIG90aGVyIFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgSXMob3RoZXI6IENvb3JkKTogYm9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLlggPT0gb3RoZXIuWCAmJiB0aGlzLlkgPT0gb3RoZXIuWTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGN1bGF0ZSB0aGUgZGlmZmVyZW5jZSB3aXRoIGFub3RoZXIgY29vcmQuXHJcbiAgICAgKiBAcGFyYW0gb3RoZXIgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBEaWZmZXJlbmNlKG90aGVyOiBDb29yZCk6IENvb3JkXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBDb29yZCh0aGlzLlggKyBvdGhlci5YLCB0aGlzLlkgKyBvdGhlci5ZKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENsb25lIHRoZSBjb29yZC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIENsb25lKCk6IENvb3JkXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBDb29yZCh0aGlzLlgsIHRoaXMuWSk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBJQ2VsbCB9IGZyb20gXCIuL0lDZWxsXCI7XHJcbmltcG9ydCB7IENlbGxUeXBlIH0gZnJvbSBcIi4vQ2VsbFR5cGVcIjtcclxuaW1wb3J0IHsgR3JvdW5kQ2VsbCB9IGZyb20gXCIuL0dyb3VuZENlbGxcIjtcclxuaW1wb3J0IHsgV2F0ZXJDZWxsIH0gZnJvbSBcIi4vV2F0ZXJDZWxsXCI7XHJcbmltcG9ydCB7IENvb3JkIH0gZnJvbSBcIi4uLy4uL0Nvb3JkXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQ2VsbEZhY3Rvcnlcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYSBuZXcgSUNlbGwgYmFzZWQgb24gdGhlIGdpdmVuIENlbGxUeXBlIGVudW0uXHJcbiAgICAgKiBAcGFyYW0gdHlwZVxyXG4gICAgICogQHBhcmFtIHBvc2l0aW9uXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgRnJvbVR5cGUodHlwZTogQ2VsbFR5cGUsIHBvc2l0aW9uOiBDb29yZCk6IElDZWxsXHJcbiAgICB7XHJcbiAgICAgICAgc3dpdGNoKHR5cGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlIENlbGxUeXBlLkdyb3VuZDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgR3JvdW5kQ2VsbChwb3NpdGlvbik7XHJcbiAgICAgICAgICAgIGNhc2UgQ2VsbFR5cGUuV2F0ZXI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFdhdGVyQ2VsbChwb3NpdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiZXhwb3J0IGVudW0gQ2VsbFR5cGVcclxue1xyXG4gICAgR3JvdW5kID0gMCxcclxuICAgIFdhdGVyID0gMVxyXG59IiwiaW1wb3J0IHsgSUNlbGwgfSBmcm9tIFwiLi9JQ2VsbFwiXHJcbmltcG9ydCB7IElSb2JvdCB9IGZyb20gXCIuLi9Sb2JvdC9JUm9ib3RcIjtcclxuaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi4vLi4vQ29vcmRcIjtcclxuaW1wb3J0IHsgTW92ZVR5cGUgfSBmcm9tIFwiLi4vTW92ZVR5cGVcIjtcclxuaW1wb3J0IHsgQ2VsbFR5cGUgfSBmcm9tIFwiLi9DZWxsVHlwZVwiXHJcblxyXG5leHBvcnQgY2xhc3MgR3JvdW5kQ2VsbCBpbXBsZW1lbnRzIElDZWxsXHJcbntcclxuICAgIHByb3RlY3RlZCBwb3NpdGlvbjogQ29vcmQ7XHJcbiAgICBwcm90ZWN0ZWQgcm9ib3Q6IElSb2JvdDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnN0cnVjdCBhIG5ldyBlbXB0eSBjZWxsIC0gZ3JvdW5kLlxyXG4gICAgICogQHBhcmFtIHBvc2l0aW9uIENvb3JkIG9mIHRoZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgY29uc3RydWN0b3IocG9zaXRpb246IENvb3JkKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgdHlwZSBvZiB0aGUgY2VsbC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldFR5cGUoKTogQ2VsbFR5cGVcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gQ2VsbFR5cGUuR3JvdW5kO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSB0ZXh0dXJlIG9mIHRoZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgR2V0VGV4dHVyZSgpOiBzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gXCJyZXMvZ3JvdW5kLnBuZ1wiO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgY2VsbCBwb3NpdGlvbi5cclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldFBvc2l0aW9uKCk6IENvb3JkIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnBvc2l0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW50ZXIgYSBjZWxsIHdpdGggYSByb2JvdC5cclxuICAgICAqIEBwYXJhbSByb2JvdCBcclxuICAgICAqL1xyXG4gICAgcHVibGljIE1vdmVIZXJlKHJvYm90OiBJUm9ib3QpOiBNb3ZlVHlwZSBcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLnJvYm90ICE9IG51bGwpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1vdmVUeXBlLkJsb2NrZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnJvYm90ID0gcm9ib3Q7XHJcblxyXG4gICAgICAgIHJldHVybiBNb3ZlVHlwZS5TdWNjZXNzZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMZWF2ZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgTW92ZUF3YXkoKTogdm9pZCBcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJvYm90ID0gbnVsbDtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEdyb3VuZENlbGwgfSBmcm9tIFwiLi9Hcm91bmRDZWxsXCJcclxuaW1wb3J0IHsgSVJvYm90IH0gZnJvbSBcIi4uL1JvYm90L0lSb2JvdFwiO1xyXG5pbXBvcnQgeyBNb3ZlVHlwZSB9IGZyb20gXCIuLi9Nb3ZlVHlwZVwiO1xyXG5pbXBvcnQgeyBDZWxsVHlwZSB9IGZyb20gXCIuL0NlbGxUeXBlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgV2F0ZXJDZWxsIGV4dGVuZHMgR3JvdW5kQ2VsbFxyXG57XHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgdHlwZSBvZiB0aGUgY2VsbC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldFR5cGUoKTogQ2VsbFR5cGVcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gQ2VsbFR5cGUuV2F0ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIHRleHR1cmUgb2YgdGhlIGNlbGwuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBHZXRUZXh0dXJlKCk6IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBcInJlcy93YXRlci5wbmdcIjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEVudGVyIGEgY2VsbCB3aXRoIGEgcm9ib3QgYW5kIGtpbGwgaXQuXHJcbiAgICAgKiBAcGFyYW0gcm9ib3QgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBNb3ZlSGVyZShyb2JvdDogSVJvYm90KTogTW92ZVR5cGUgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIE1vdmVUeXBlLktpbGxlZDtcclxuICAgIH1cclxufSIsImV4cG9ydCBlbnVtIE1vdmVUeXBlXHJcbntcclxuICAgIFN1Y2Nlc3NlZCxcclxuICAgIEJsb2NrZWQsXHJcbiAgICBLaWxsZWRcclxufSIsImltcG9ydCB7IElSb2JvdCB9IGZyb20gXCIuL0lSb2JvdFwiO1xyXG5pbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuLi8uLi9Db29yZFwiO1xyXG5pbXBvcnQgeyBNYXAgfSBmcm9tIFwiLi4vLi4vTWFwXCI7XHJcbmltcG9ydCB7IE1vdmVUeXBlIH0gZnJvbSBcIi4uL01vdmVUeXBlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQmFzaWNSb2JvdCBpbXBsZW1lbnRzIElSb2JvdFxyXG57XHJcbiAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgbWFwID0gTWFwLkdldEluc3RhbmNlKCk7XHJcblxyXG4gICAgcHJvdGVjdGVkIGhlYWx0aDogbnVtYmVyID0gMS4wO1xyXG4gICAgcHJvdGVjdGVkIGRhbWFnZTogbnVtYmVyID0gMS4wO1xyXG5cclxuICAgIHByaXZhdGUgcG9zaXRpb246IENvb3JkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29uc3RydWN0IGEgbmV3IEJhc2ljUm9ib3QuXHJcbiAgICAgKiBAcGFyYW0gcG9zaXRpb25cclxuICAgICAqL1xyXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHBvc2l0aW9uOiBDb29yZClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb247XHJcblxyXG4gICAgICAgIHZhciBjZWxsID0gTWFwLkdldEluc3RhbmNlKCkuR2V0Q2VsbChwb3NpdGlvbik7XHJcblxyXG4gICAgICAgIGlmKGNlbGwgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNlbGwuTW92ZUhlcmUodGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSBjZWxsIHRleHR1cmUuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBHZXRUZXh0dXJlKCk6IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBcInJlcy9yb2JvdC5wbmdcIjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE1vdmUgcm9ib3QgaW4gYSBkaXJlY3Rpb24uXHJcbiAgICAgKiBAcGFyYW0gZGlyZWN0aW9uXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBNb3ZlKGRpcmVjdGlvbjogQ29vcmQpOiBib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYoTWF0aC5hYnMoTWF0aC5hYnMoZGlyZWN0aW9uLlgpIC0gTWF0aC5hYnMoZGlyZWN0aW9uLlkpKSA9PSAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBPbmx5IGFsbG93IGxlZnQsIHJpZ2h0LCB0b3AgYW5kIGJvdHRvbSBtb3ZlbWVudFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGxhc3RDZWxsID0gdGhpcy5tYXAuR2V0Q2VsbCh0aGlzLnBvc2l0aW9uKTtcclxuICAgICAgICB2YXIgbmV4dENvb3JkID0gdGhpcy5wb3NpdGlvbi5EaWZmZXJlbmNlKGRpcmVjdGlvbik7XHJcbiAgICAgICAgdmFyIG5leHRDZWxsID0gdGhpcy5tYXAuR2V0Q2VsbChuZXh0Q29vcmQpO1xyXG5cclxuICAgICAgICBpZihsYXN0Q2VsbCA9PSBudWxsIHx8IG5leHRDZWxsID09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzd2l0Y2gobmV4dENlbGwuTW92ZUhlcmUodGhpcykpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlIE1vdmVUeXBlLkJsb2NrZWQ6IC8vIERvIG5vdGhpbmdcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgY2FzZSBNb3ZlVHlwZS5LaWxsZWQ6IC8vIE1vdmUgYXdheSBhbmQga2lsbCBpdFxyXG4gICAgICAgICAgICAgICAgbGFzdENlbGwuTW92ZUF3YXkoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXh0Q29vcmQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLktpbGwoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgY2FzZSBNb3ZlVHlwZS5TdWNjZXNzZWQ6IC8vIE1vdmUgYXdheVxyXG4gICAgICAgICAgICAgICAgbGFzdENlbGwuTW92ZUF3YXkoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXh0Q29vcmQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1hcC5PblVwZGF0ZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXR0YWNrIGFuIG90aGVyIHJvYm90IGlmIGl0IGlzIG9uZSBjZWxsIGF3YXkuXHJcbiAgICAgKiBAcGFyYW0gcm9ib3QgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBBdHRhY2socm9ib3Q6IElSb2JvdCk6IGJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLnBvc2l0aW9uLkdldERpc3RhbmNlKHJvYm90LkdldFBvc2l0aW9uKCkpID4gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJvYm90LkRhbWFnZSh0aGlzLmRhbWFnZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIHBvc2l0aW9uIG9mIHRoZSByb2JvdC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldFBvc2l0aW9uKCk6IENvb3JkIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnBvc2l0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRG8gZGFtYWdlIHRvIHRoaXMgcm9ib3QuXHJcbiAgICAgKiBAcGFyYW0gZGFtYWdlIEFtb3VudCBvZiB0aGUgZGFtYWdlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgRGFtYWdlKGRhbWFnZTogbnVtYmVyKTogdm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaGVhbHRoIC09IGRhbWFnZTtcclxuXHJcbiAgICAgICAgaWYodGhpcy5oZWFsdGggPD0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuS2lsbCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEtpbGwgdGhlIHJvYm90LlxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIEtpbGwoKTogdm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaGVhbHRoID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5tYXAuUmVtb3ZlUm9ib3QodGhpcyk7XHJcbiAgICAgICAgdGhpcy5tYXAuT25VcGRhdGUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrIGlmIHRoZSByb2JvdCBpcyBhbGl2ZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIElzQWxpdmUoKTogYm9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmhlYWx0aCA+IDA7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBNYXAgfSBmcm9tICcuLi9NYXAnO1xyXG5pbXBvcnQgeyBJUm9ib3QgfSBmcm9tIFwiLi4vRWxlbWVudC9Sb2JvdC9JUm9ib3RcIjtcclxuaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi4vQ29vcmRcIjtcclxuaW1wb3J0IHsgQ2VsbFR5cGUgfSBmcm9tIFwiLi4vRWxlbWVudC9DZWxsL0NlbGxUeXBlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQWRhcHRlclxyXG57XHJcbiAgICBwcml2YXRlIHJvYm90OiBJUm9ib3Q7XHJcbiAgICBwcml2YXRlIG1hcDogTWFwO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHJvYm90OiBJUm9ib3QpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5yb2JvdCA9IHJvYm90O1xyXG4gICAgICAgIHRoaXMubWFwID0gTWFwLkdldEluc3RhbmNlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnZlcnQgdGhlIGdpdmVuIG51bWJlci5cclxuICAgICAqIEBwYXJhbSBuIFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgaW52KG46IG51bWJlcik6IG51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuID09IDAgPyAxIDogMDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE1vdmUgdG8gdGhlIGdpdmVuIGRpcmVjdGlvbi5cclxuICAgICAqIEBwYXJhbSBkeFxyXG4gICAgICogQHBhcmFtIGR5XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBtb3ZlKGR4OiBudW1iZXIsIGR5OiBudW1iZXIpOiBudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yb2JvdC5Nb3ZlKG5ldyBDb29yZChkeCwgZHkpKSA/IDEgOiAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGVzdCBpZiB0aGUgZ2l2ZW4gZGlyZWN0aW9uIGlzIHNhZmUuXHJcbiAgICAgKiBAcGFyYW0gZHhcclxuICAgICAqIEBwYXJhbSBkeSBcclxuICAgICAqL1xyXG4gICAgcHVibGljIHRlc3QoZHg6IG51bWJlciwgZHk6IG51bWJlcik6IG51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHZhciBjZWxsID0gdGhpcy5tYXAuR2V0Q2VsbCh0aGlzLnJvYm90LkdldFBvc2l0aW9uKCkuRGlmZmVyZW5jZShuZXcgQ29vcmQoZHgsIGR5KSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gY2VsbCAhPSBudWxsICYmIGNlbGwuR2V0VHlwZSgpID09IENlbGxUeXBlLkdyb3VuZCA/IDEgOiAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJ5IHRvIGF0dGFjayBzb21lb25lIGFyb3VuZCB0aGUgcGxheWVyLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgYXR0YWNrKCk6IG51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHZhciByZXN1bHQ6IElSb2JvdCA9IG51bGw7XHJcblxyXG4gICAgICAgIHRoaXMubWFwLkdldFJvYm90cygpLnNvbWUocm9ib3QgPT4gXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZihyb2JvdC5HZXRQb3NpdGlvbigpLkdldERpc3RhbmNlKHRoaXMucm9ib3QuR2V0UG9zaXRpb24oKSkgPT0gMSkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJvYm90O1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQgIT0gbnVsbCAmJiB0aGlzLnJvYm90LkF0dGFjayhyZXN1bHQpID8gMSA6IDA7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBJUm9ib3QgfSBmcm9tICcuLy4uL0VsZW1lbnQvUm9ib3QvSVJvYm90JztcclxuaW1wb3J0IHsgQWRhcHRlciB9IGZyb20gJy4vQWRhcHRlcic7XHJcbmltcG9ydCB7IFByb2Nlc3NvciB9IGZyb20gJy4vUHJvY2Vzc29yJztcclxuXHJcbmV4cG9ydCBjbGFzcyBQYXJzZXJcclxue1xyXG4gICAgcHVibGljIENvZGU6IHN0cmluZ1tdW107XHJcbiAgICBwdWJsaWMgTGFiZWxzOiB7IFtpZDogc3RyaW5nXSA6IG51bWJlcjsgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFBhcnNlIHRoZSBnaXZlbiBjb2RlLlxyXG4gICAgICogQHBhcmFtIGxpbmVzXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBQYXJzZShsaW5lczogc3RyaW5nKTogdm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuQ29kZSA9IFtdO1xyXG4gICAgICAgIHRoaXMuTGFiZWxzID0ge307XHJcblxyXG4gICAgICAgIGxpbmVzLnNwbGl0KFwiXFxuXCIpLmZvckVhY2gobGluZSA9PiB0aGlzLlBhcnNlTGluZShsaW5lKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQYXJzZSB0aGUgZ2l2ZW4gbGluZS5cclxuICAgICAqIEBwYXJhbSBsaW5lXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgUGFyc2VMaW5lKGxpbmU6IHN0cmluZyk6IHZvaWRcclxuICAgIHtcclxuICAgICAgICAvLyBTa2lwIHRoZSBsaW5lIGlmIGl0IGlzIGNvbW1lbnRcclxuICAgICAgICBpZihsaW5lWzBdID09IFwiI1wiKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHBhcmFtZXRlcnMgPSBsaW5lLnNwbGl0KFwiIFwiKTtcclxuXHJcbiAgICAgICAgc3dpdGNoKHBhcmFtZXRlcnNbMF0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlIFwiTEFCRUxcIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuUGFyc2VMYWJlbChwYXJhbWV0ZXJzKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiR09UT1wiOlxyXG4gICAgICAgICAgICBjYXNlIFwiQ0FMTFwiOlxyXG4gICAgICAgICAgICBjYXNlIFwiU0VUXCI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLlBhcnNlQ29kZShwYXJhbWV0ZXJzKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFBhcnNlIGEgTEFCRUwgY29tbWFuZC5cclxuICAgICAqIEBwYXJhbSBwYXJhbWV0ZXJzIFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIFBhcnNlTGFiZWwocGFyYW1ldGVyczogc3RyaW5nW10pOiB2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYocGFyYW1ldGVycy5sZW5ndGggIT0gMikgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIExBQkVMXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5MYWJlbHNbcGFyYW1ldGVyc1sxXV0gPSB0aGlzLkNvZGUubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUGFyc2UgYSBHT1RPL0NBTEwvU0VUIGNvbW1hbmQuXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1ldGVycyBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBQYXJzZUNvZGUocGFyYW1ldGVyczogc3RyaW5nW10pOiB2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5Db2RlLnB1c2gocGFyYW1ldGVycyk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBJQmxvY2sgfSBmcm9tICcuL0lCbG9jayc7XHJcblxyXG5leHBvcnQgY2xhc3MgUHJvY2Vzc29yXHJcbntcclxuICAgIHB1YmxpYyBDb250ZXh0OiBPYmplY3Q7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIHBvc2l0aW9uIG9mIHRoZSBuZWFyZXN0IGJyYWNrZXQgY2xvc3VyZS5cclxuICAgICAqIEBwYXJhbSBpbnB1dCBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBHZXRJbm5lcihpbnB1dDogc3RyaW5nKTogQXJyYXk8bnVtYmVyPlxyXG4gICAge1xyXG4gICAgICAgIGlmKGlucHV0LmluZGV4T2YoXCIoXCIpIDwgMCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIGxldCBzdGFydCA9IDA7XHJcbiAgICAgICAgbGV0IGJyYWNrZXRzID0gMDtcclxuXHJcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IGlucHV0Lmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoKGlucHV0W2ldKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiKFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmKGJyYWNrZXRzKysgPT0gMCkgc3RhcnQgPSBpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcIilcIjpcclxuICAgICAgICAgICAgICAgICAgICBpZihicmFja2V0cy0tID09IDEpIHJldHVybiBbc3RhcnQsIGldO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBhIG5ldyBJQmxvY2sgZnJvbSBhIHN0cmluZyBpbnB1dCAob3IgcmV0dXJuIHRoZSBpbnB1dCBpdHNlbGYpLlxyXG4gICAgICogQHBhcmFtIGlucHV0IFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIEdldEJsb2NrKGlucHV0KTogSUJsb2NrIHwgc3RyaW5nXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgZ2V0ID0gKGlucHV0OiBzdHJpbmcsIGE6IFwiKlwiIHwgXCIvXCIgfCBcIitcIiB8IFwiLVwiLCBiOiBcIipcIiB8IFwiL1wiIHwgXCIrXCIgfCBcIi1cIik6IElCbG9jayB8IHN0cmluZyA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGFwID0gaW5wdXQuaW5kZXhPZihhKTtcclxuICAgICAgICAgICAgbGV0IGJwID0gaW5wdXQuaW5kZXhPZihiKTtcclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYoYXAgPCAwICYmIGJwIDwgMCkgcmV0dXJuIGlucHV0O1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZihhcCA8IDApIGFwID0gaW5wdXQubGVuZ3RoO1xyXG4gICAgICAgICAgICBpZihicCA8IDApIGJwID0gaW5wdXQubGVuZ3RoO1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBsZXQgZmlyc3QgPSBhcCA8IGJwID8gYXAgOiBicDtcclxuICAgICAgICAgICAgbGV0IHR5cGUgPSBhcCA8IGJwID8gYSA6IGI7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBsZWZ0OiBpbnB1dC5zdWJzdHJpbmcoMCwgZmlyc3QpLFxyXG4gICAgICAgICAgICAgICAgcmlnaHQ6IGlucHV0LnN1YnN0cmluZyhmaXJzdCArIDEsIGlucHV0Lmxlbmd0aCksXHJcbiAgICAgICAgICAgICAgICBtZXRob2Q6IDxcIipcIiB8IFwiL1wiIHwgXCIrXCIgfCBcIi1cIj50eXBlXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZighaW5wdXQubWV0aG9kKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaW5wdXQgPSBnZXQoaW5wdXQsIFwiK1wiLCBcIi1cIik7XHJcbiAgICBcclxuICAgICAgICAgICAgaWYoIWlucHV0Lm1ldGhvZCkgaW5wdXQgPSBnZXQoaW5wdXQsIFwiKlwiLCBcIi9cIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaW5wdXQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcnkgdG8gY3JlYXRlIGFzIG1hbnkgYmxvY2tzIGFzIHBvc3NpYmxlIGZyb20gYSBibG9jay5cclxuICAgICAqIEBwYXJhbSBibG9jayBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBFeHRyYWN0QmxvY2soYmxvY2spOiBJQmxvY2sgfCBzdHJpbmdcclxuICAgIHtcclxuICAgICAgICBibG9jayA9IHRoaXMuR2V0QmxvY2soYmxvY2spO1xyXG5cclxuICAgICAgICBpZighYmxvY2subWV0aG9kKSByZXR1cm4gYmxvY2s7XHJcblxyXG4gICAgICAgIGJsb2NrLmxlZnQgPSB0aGlzLkV4dHJhY3RCbG9jayhibG9jay5sZWZ0KTtcclxuICAgICAgICBibG9jay5yaWdodCA9IHRoaXMuRXh0cmFjdEJsb2NrKGJsb2NrLnJpZ2h0KTtcclxuICAgIFxyXG4gICAgICAgIHJldHVybiBibG9jaztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGN1bGF0ZSB0aGUgcmVzdWx0IG9mIGEgYmxvY2sgdHJlZS5cclxuICAgICAqIEBwYXJhbSBibG9ja1xyXG4gICAgICovXHJcbiAgICBwcml2YXRlIENhbGN1bGF0ZUJsb2NrKGJsb2NrKTogbnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgaWYoIWJsb2NrLm1ldGhvZCkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBibG9jay5sZW5ndGggPT0gMCA/IDAgOiBwYXJzZUZsb2F0KGJsb2NrKTtcclxuXHJcbiAgICAgICAgICAgIGlmKHJlc3VsdCA9PSBOYU4pIHRocm93IG5ldyBFcnJvcihcIk5vdCBhIG51bWJlciFcIik7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIHN3aXRjaChibG9jay5tZXRob2QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlIFwiK1wiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuQ2FsY3VsYXRlQmxvY2soYmxvY2subGVmdCkgKyB0aGlzLkNhbGN1bGF0ZUJsb2NrKGJsb2NrLnJpZ2h0KTtcclxuICAgICAgICAgICAgY2FzZSBcIi1cIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLkNhbGN1bGF0ZUJsb2NrKGJsb2NrLmxlZnQpIC0gdGhpcy5DYWxjdWxhdGVCbG9jayhibG9jay5yaWdodCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCIqXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5DYWxjdWxhdGVCbG9jayhibG9jay5sZWZ0KSAqIHRoaXMuQ2FsY3VsYXRlQmxvY2soYmxvY2sucmlnaHQpO1xyXG4gICAgICAgICAgICBjYXNlIFwiL1wiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuQ2FsY3VsYXRlQmxvY2soYmxvY2subGVmdCkgLyB0aGlzLkNhbGN1bGF0ZUJsb2NrKGJsb2NrLnJpZ2h0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIHJlc3VsdCBvZiBhIHNpbXBsZSBtYXRoIHByb2JsZW0uIFlvdSBjYW4gdXNlIHRoZSA0IGJhc2ljIG9wZXJhdG9yIHBsdXMgYnJhY2tldHMuXHJcbiAgICAgKiBAcGFyYW0gaW5wdXQgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBDYWxjdWxhdGUoaW5wdXQ6IHN0cmluZyk6IG51bWJlclxyXG4gICAge1xyXG4gICAgICAgIGxldCByYW5nZTogQXJyYXk8bnVtYmVyPjtcclxuXHJcbiAgICAgICAgd2hpbGUoKHJhbmdlID0gdGhpcy5HZXRJbm5lcihpbnB1dCkpICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLkNhbGN1bGF0ZShpbnB1dC5zdWJzdHJpbmcocmFuZ2VbMF0gKyAxLCByYW5nZVsxXSkpO1xyXG5cclxuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5zdWJzdHJpbmcoMCwgcmFuZ2VbMF0pICsgcmVzdWx0ICsgaW5wdXQuc3Vic3RyaW5nKHJhbmdlWzFdICsgMSwgaW5wdXQubGVuZ3RoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBibG9jayA9IHRoaXMuRXh0cmFjdEJsb2NrKGlucHV0KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuQ2FsY3VsYXRlQmxvY2soYmxvY2spO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVzb2x2ZSBmdW5jdGlvbnMgaW4gYSBzdHJpbmcuXHJcbiAgICAgKiBAcGFyYW0gaW5wdXQgXHJcbiAgICAgKiBAcGFyYW0gY29udGV4dCBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBSZXNvbHZlRnVuY3Rpb25zKGlucHV0OiBzdHJpbmcpOiBzdHJpbmdcclxuICAgIHtcclxuICAgICAgICBjb25zdCBwYXR0ZXJuID0gL1tBLVphLXpdW0EtWmEtejAtOV0qXFwoLztcclxuICAgICAgICBcclxuICAgICAgICBsZXQgc3RhcnQ6IFJlZ0V4cE1hdGNoQXJyYXkgPSBudWxsO1xyXG5cclxuICAgICAgICB3aGlsZSgoc3RhcnQgPSBpbnB1dC5tYXRjaChwYXR0ZXJuKSkgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gdGhpcy5HZXRJbm5lcihpbnB1dC5zdWJzdHIoc3RhcnQuaW5kZXgpKS5tYXAocCA9PiBwICsgc3RhcnQuaW5kZXgpO1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gaW5wdXQuc3Vic3RyaW5nKHN0YXJ0LmluZGV4LCByYW5nZVswXSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBhcmdzID0gW107XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gW107XHJcbiAgICBcclxuICAgICAgICAgICAgbGV0IGxhc3QgPSByYW5nZVswXSArIDE7XHJcbiAgICAgICAgICAgIGxldCBicmFja2V0cyA9IDA7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBmb3IobGV0IGkgPSByYW5nZVswXSArIDE7IGkgPD0gcmFuZ2VbMV07IGkrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYyA9IGlucHV0W2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmKGMgPT0gXCIoXCIpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJhY2tldHMrKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYoKGMgPT0gXCIpXCIgJiYgLS1icmFja2V0cyA9PSAtMSkgfHwgKGMgPT0gXCIsXCIgJiYgYnJhY2tldHMgPT0gMCkpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJncy5wdXNoKGlucHV0LnN1YnN0cmluZyhsYXN0LCBpKS50cmltKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxhc3QgPSBpICsgMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVzb2x2ZSBhcmd1bWVudHNcclxuICAgICAgICAgICAgYXJncy5mb3JFYWNoKGFyZyA9PiByZXNvbHZlZC5wdXNoKHRoaXMuU29sdmUoYXJnKSkpO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IHJlc3VsdFxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBwYXJzZUZsb2F0KHRoaXMuQ29udGV4dFtuYW1lXS5hcHBseSh0aGlzLkNvbnRleHQsIHJlc29sdmVkKSk7XHJcblxyXG4gICAgICAgICAgICBpZihyZXN1bHQgPT0gTmFOKSB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgYSBudW1iZXIhXCIpO1xyXG5cclxuICAgICAgICAgICAgLy8gUmVwbGFjZSBmdW5jdGlvbiB3aXRoIHRoZSByZXN1bHRcclxuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5zdWJzdHJpbmcoMCwgc3RhcnQuaW5kZXgpICsgcmVzdWx0ICsgaW5wdXQuc3Vic3RyaW5nKHJhbmdlWzFdICsgMSwgaW5wdXQubGVuZ3RoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBpbnB1dDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlc29sdmUgdmFyaWFibGVzIGluIGEgc3RyaW5nLlxyXG4gICAgICogQHBhcmFtIGlucHV0IFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIFJlc29sdmVWYXJpYWJsZXMoaW5wdXQ6IHN0cmluZyk6IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IHBhdHRlcm4gPSAvW0EtWmEtel1bQS1aYS16MC05XSovO1xyXG5cclxuICAgICAgICBsZXQgc3RhcnQ6IFJlZ0V4cE1hdGNoQXJyYXkgPSBudWxsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHdoaWxlKChzdGFydCA9IGlucHV0Lm1hdGNoKHBhdHRlcm4pKSAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcGFyc2VGbG9hdCh0aGlzLkNvbnRleHRbc3RhcnRbMF1dKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmKHJlc3VsdCA9PSBOYU4pIHRocm93IG5ldyBFcnJvcihcIk5vdCBhIG51bWJlciFcIik7XHJcblxyXG4gICAgICAgICAgICBpbnB1dCA9IGlucHV0LnN1YnN0cmluZygwLCBzdGFydC5pbmRleCkgKyByZXN1bHQgKyBpbnB1dC5zdWJzdHJpbmcoc3RhcnQuaW5kZXggKyBzdGFydFswXS5sZW5ndGgsIGlucHV0Lmxlbmd0aCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaW5wdXQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXNvbHZlIGZ1bmN0aW9ucyBhbmQgdmFyaWFibGVzIHRoZW4gY2FsY3VsYXRlIHRoZSBtYXRoIHByb2JsZW0uXHJcbiAgICAgKiBAcGFyYW0gaW5wdXRcclxuICAgICAqIEBwYXJhbSBjb250ZXh0IEphdmFTY3JpcHQgT2JqZWN0LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgU29sdmUoaW5wdXQ6IHN0cmluZyk6IG51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLkNhbGN1bGF0ZSh0aGlzLlJlc29sdmVWYXJpYWJsZXModGhpcy5SZXNvbHZlRnVuY3Rpb25zKGlucHV0KSkpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgQWRhcHRlciB9IGZyb20gJy4vQWRhcHRlcic7XHJcbmltcG9ydCB7IFByb2Nlc3NvciB9IGZyb20gJy4vUHJvY2Vzc29yJztcclxuaW1wb3J0IHsgSVJvYm90IH0gZnJvbSAnLi8uLi9FbGVtZW50L1JvYm90L0lSb2JvdCc7XHJcbmltcG9ydCB7IFBhcnNlciB9IGZyb20gJy4vUGFyc2VyJztcclxuaW1wb3J0IHsgVXRpbHMgfSBmcm9tICcuLi9VdGlscyc7XHJcblxyXG5leHBvcnQgY2xhc3MgUnVubmVyXHJcbntcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgc3BlZWQ6IG51bWJlciA9IDMwMDtcclxuXHJcbiAgICAvLyBTZXQgYXQgZXZlcnkgcGFyc2VcclxuICAgIHByaXZhdGUgY291bnRlcjogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBpbnRlcnZhbDtcclxuXHJcbiAgICAvLyBTZXQgaW4gY29uc3RydWN0b3JcclxuICAgIHByaXZhdGUgYWRhcHRlcjogQWRhcHRlcjtcclxuICAgIHByaXZhdGUgcHJvY2Vzc29yOiBQcm9jZXNzb3I7XHJcbiAgICBwcml2YXRlIHBhcnNlcjogUGFyc2VyO1xyXG5cclxuICAgIHB1YmxpYyBjb25zdHJ1Y3Rvcihyb2JvdDogSVJvYm90KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuYWRhcHRlciA9IG5ldyBBZGFwdGVyKHJvYm90KTtcclxuICAgICAgICB0aGlzLnByb2Nlc3NvciA9IG5ldyBQcm9jZXNzb3I7XHJcbiAgICAgICAgdGhpcy5wYXJzZXIgPSBuZXcgUGFyc2VyO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3RhcnQgdGhlIGV4ZWN1dGlvblxyXG4gICAgICogQHBhcmFtIGNvZGVcclxuICAgICAqL1xyXG4gICAgcHVibGljIFJ1bihjb2RlOiBzdHJpbmcpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5TdG9wKCk7XHJcbiAgICAgICAgdGhpcy5wYXJzZXIuUGFyc2UoY29kZSk7XHJcblxyXG4gICAgICAgIFV0aWxzLkJpbmQodGhpcy5wcm9jZXNzb3IuQ29udGV4dCA9IHt9LCB0aGlzLmFkYXB0ZXIsIFtcclxuICAgICAgICAgICAgXCJpbnZcIixcclxuICAgICAgICAgICAgXCJtb3ZlXCIsXHJcbiAgICAgICAgICAgIFwidGVzdFwiLFxyXG4gICAgICAgICAgICBcImF0dGFja1wiXHJcbiAgICAgICAgXSk7XHJcblxyXG4gICAgICAgIHRoaXMuY291bnRlciA9IDA7XHJcbiAgICAgICAgdGhpcy5pbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHRoaXMuRXhlY3V0ZUxpbmUoKSwgdGhpcy5zcGVlZCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTdG9wIHRoZSBleGVjdXRpb24uXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBTdG9wKClcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLmludGVydmFsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeGVjdXRlIHRoZSBuZXh0IGxpbmVcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBFeGVjdXRlTGluZSgpOiB2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5jb3VudGVyIDwgMCB8fCB0aGlzLmNvdW50ZXIgPj0gdGhpcy5wYXJzZXIuQ29kZS5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLlN0b3AoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGxpbmUgPSB0aGlzLnBhcnNlci5Db2RlW3RoaXMuY291bnRlcisrXTtcclxuXHJcbiAgICAgICAgdGhpcy5PbkxpbmUobGluZS5qb2luKFwiIFwiKSwgdGhpcy5jb3VudGVyIC0gMSk7XHJcblxyXG4gICAgICAgIHRyeVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoKGxpbmVbMF0pXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJMQUJFTFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcIkdPVE9cIjpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLkV4ZWN1dGVHb3RvKGxpbmUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcIkNBTExcIjpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLkV4ZWN1dGVDYWxsKGxpbmUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcIlNFVFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuRXhlY3V0ZVNldChsaW5lKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaChlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5TdG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXhlY3V0ZSBhIEdPVE8gY29tbWFuZC5cclxuICAgICAqIEBwYXJhbSBwYXJhbWV0ZXJzIFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIEV4ZWN1dGVHb3RvKHBhcmFtZXRlcnM6IHN0cmluZ1tdKTogdm9pZFxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IHNldCA9ICgpID0+IHRoaXMuY291bnRlciA9IHRoaXMucGFyc2VyLkxhYmVscy5oYXNPd25Qcm9wZXJ0eShwYXJhbWV0ZXJzWzFdKSA/IHRoaXMucGFyc2VyLkxhYmVsc1twYXJhbWV0ZXJzWzFdXSA6IC0xO1xyXG5cclxuICAgICAgICBpZihwYXJhbWV0ZXJzLmxlbmd0aCA9PSAyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc2V0KCk7XHJcbiAgICAgICAgICAgIHRoaXMuRXhlY3V0ZUxpbmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZihwYXJhbWV0ZXJzLmxlbmd0aCA+PSA0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGNvbmRpdGlvbiA9IHBhcmFtZXRlcnMuc2xpY2UoMykuam9pbihcIiBcIik7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZih0aGlzLnByb2Nlc3Nvci5Tb2x2ZShjb25kaXRpb24pICE9IDApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZXQoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuRXhlY3V0ZUxpbmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIEdPVE9cIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXhlY3V0ZSBhIENBTEwgY29tbWFuZC5cclxuICAgICAqIEBwYXJhbSBwYXJhbWV0ZXJzIFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIEV4ZWN1dGVDYWxsKHBhcmFtZXRlcnM6IHN0cmluZ1tdKTogdm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmKHBhcmFtZXRlcnMubGVuZ3RoIDwgMilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgQ0FMTFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGNhbGwgPSBwYXJhbWV0ZXJzLnNsaWNlKDEpLmpvaW4oXCIgXCIpO1xyXG5cclxuICAgICAgICB0aGlzLnByb2Nlc3Nvci5Tb2x2ZShjYWxsKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEV4ZWN1dGUgYSBTRVQgY29tbWFuZC5cclxuICAgICAqIEBwYXJhbSBwYXJhbWV0ZXJzIFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIEV4ZWN1dGVTZXQocGFyYW1ldGVyczogc3RyaW5nW10pOiB2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYocGFyYW1ldGVycy5sZW5ndGggPCAzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBTRVRcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgY2FsbCA9IHBhcmFtZXRlcnMuc2xpY2UoMikuam9pbihcIiBcIik7XHJcblxyXG4gICAgICAgIHRoaXMucHJvY2Vzc29yLkNvbnRleHRbcGFyYW1ldGVyc1sxXV0gPSB0aGlzLnByb2Nlc3Nvci5Tb2x2ZShjYWxsKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgbGluZSBjb3VudGVyIHZhbHVlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgR2V0Q291bnRlcigpOiBudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb3VudGVyO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXhlY3V0ZWQgd2hlbiB0aGUgbmV4dCBsaW5lIGlzIGNhbGxlZC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIE9uTGluZTogKGxpbmU6IHN0cmluZywgY291bnQ6IG51bWJlcikgPT4gdm9pZCA9IFV0aWxzLk5vb3A7XHJcbn0iLCJpbXBvcnQgeyBJQ2VsbCB9IGZyb20gXCIuL0VsZW1lbnQvQ2VsbC9JQ2VsbFwiO1xyXG5pbXBvcnQgeyBHcm91bmRDZWxsIH0gZnJvbSBcIi4vRWxlbWVudC9DZWxsL0dyb3VuZENlbGxcIjtcclxuaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi9Db29yZFwiO1xyXG5pbXBvcnQgeyBJUm9ib3QgfSBmcm9tIFwiLi9FbGVtZW50L1JvYm90L0lSb2JvdFwiO1xyXG5pbXBvcnQgeyBJRWxlbWVudCB9IGZyb20gXCIuL0VsZW1lbnQvSUVsZW1lbnRcIjtcclxuaW1wb3J0IHsgVXRpbHMgfSBmcm9tIFwiLi9VdGlsc1wiO1xyXG5pbXBvcnQgeyBDZWxsRmFjdG9yeSB9IGZyb20gXCIuL0VsZW1lbnQvQ2VsbC9DZWxsRmFjdG9yeVwiO1xyXG5pbXBvcnQgeyBDZWxsVHlwZSB9IGZyb20gXCIuL0VsZW1lbnQvQ2VsbC9DZWxsVHlwZVwiO1xyXG5pbXBvcnQgeyBCYXNpY1JvYm90IH0gZnJvbSBcIi4vRWxlbWVudC9Sb2JvdC9CYXNpY1JvYm90XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgTWFwXHJcbntcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgcm9ib3RDb3VudDogbnVtYmVyID0gMjtcclxuXHJcbiAgICBwcml2YXRlIHJvYm90czogQXJyYXk8SVJvYm90PjtcclxuICAgIHByaXZhdGUgY2VsbHM6IEFycmF5PElDZWxsPjtcclxuXHJcbiAgICBwcml2YXRlIHNpemU6IG51bWJlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNpbmdsZXRvbiBpbnN0YW5jZSBvZiB0aGUgY2xhc3MuXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBNYXA7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIHNpbmdsZXRvbiBpbnN0YW5jZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBHZXRJbnN0YW5jZSgpOiBNYXBcclxuICAgIHtcclxuICAgICAgICBpZihNYXAuaW5zdGFuY2UgPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1hcC5pbnN0YW5jZSA9IG5ldyBNYXAoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBNYXAuaW5zdGFuY2U7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb25zdHJ1Y3QgYSBzaW1wbGUgbmV3IG1hcC4gXHJcbiAgICAgKiBAcGFyYW0gc2l6ZSBTaXplIG9mIHRoZSBtYXAuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBJbml0KHNpemU6IG51bWJlcilcclxuICAgIHtcclxuICAgICAgICB0aGlzLnNpemUgPSBzaXplO1xyXG4gICAgICAgIHRoaXMucm9ib3RzID0gW107XHJcbiAgICAgICAgdGhpcy5jZWxscyA9IFtdO1xyXG5cclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgc2l6ZSAqIHNpemU7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCB4ID0gaSAlIHNpemU7XHJcbiAgICAgICAgICAgIGxldCB5ID0gTWF0aC5mbG9vcihpIC8gc2l6ZSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNlbGxzW2ldID0gbmV3IEdyb3VuZENlbGwobmV3IENvb3JkKHgsIHkpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucm9ib3RzLnB1c2gobmV3IEJhc2ljUm9ib3QobmV3IENvb3JkKFV0aWxzLlJhbmRvbSgwLCBzaXplIC0gMSksIDApKSk7XHJcbiAgICAgICAgdGhpcy5yb2JvdHMucHVzaChuZXcgQmFzaWNSb2JvdChuZXcgQ29vcmQoVXRpbHMuUmFuZG9tKDAsIHNpemUgLSAxKSwgc2l6ZSAtIDEpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuT25VcGRhdGUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIExvYWQgYSBtYXAgZnJvbSBhbiBleHRlcm5hbCBmaWxlLiBUaGUgSlNPTiBuZWVkcyB0byBjb250YWluIGFuIGFycmF5IG9mIG51bWJlcnMuXHJcbiAgICAgKiBUaGUgZmlyc3QgbnVtYmVyIHdpbGwgZGV0ZXJtaW5hdGUgdGhlIHNpemUgb2YgdGhlIG1hcCwgd2hpbGUgdGhlIG90aGVycyB3aWxsXHJcbiAgICAgKiB0ZWxsIHRoZSBpbnRlcnByZXRlciB0eXBlIG9mIHRoZSBjZWxsIGJhc2VkIG9uIHRoZSBDZWxsVHlwZSBlbnVtLlxyXG4gICAgICogQHBhcmFtIHVybCBcclxuICAgICAqL1xyXG4gICAgcHVibGljIGFzeW5jIExvYWQodXJsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+XHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJhdzogQXJyYXk8bnVtYmVyPjtcclxuXHJcbiAgICAgICAgdHJ5XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByYXcgPSBKU09OLnBhcnNlKGF3YWl0IFV0aWxzLkdldCh1cmwpKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIGl0IGlzIGEgdmFsaWQgbWFwIGFycmF5XHJcbiAgICAgICAgICAgIGlmKHJhdyA9PSBudWxsICYmIHJhdy5sZW5ndGggPCAyICYmIHJhdy5sZW5ndGggIT0gTWF0aC5wb3cocmF3WzBdLCAyKSArIDEpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaChlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5jZWxscyA9IFtdO1xyXG4gICAgICAgIHRoaXMucm9ib3RzID0gW107XHJcbiAgICAgICAgdGhpcy5zaXplID0gcmF3LnNoaWZ0KCk7IC8vIEZpcnN0IGVsZW1lbnQgaXMgdGhlIHNpemVcclxuXHJcbiAgICAgICAgdmFyIHJvYm90U3BvdHMgPSBuZXcgQXJyYXk8Q29vcmQ+KCk7XHJcbiAgICAgICAgdmFyIHJvYm90Q291bnQgPSAwO1xyXG5cclxuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgcmF3Lmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHggPSBpICUgdGhpcy5zaXplO1xyXG4gICAgICAgICAgICBsZXQgeSA9IE1hdGguZmxvb3IoaSAvIHRoaXMuc2l6ZSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgdHlwZTogQ2VsbFR5cGUgPSByYXdbaV07XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgY2VsbCBiYXNlZCBvbiB0aGUgQ2VsbFR5cGVcclxuICAgICAgICAgICAgdGhpcy5jZWxsc1tpXSA9IENlbGxGYWN0b3J5LkZyb21UeXBlKHR5cGUsIG5ldyBDb29yZCh4LCB5KSk7XHJcblxyXG4gICAgICAgICAgICAvLyBJZiB0aGUgY2VsbCBpcyBncm91bmQgYW5kIHRoZXJlIGlzIDAgb3IgMSByb2JvdCwgdHJ5IHRvIGFkZCBvbmVcclxuICAgICAgICAgICAgaWYocm9ib3RDb3VudCA8IHRoaXMucm9ib3RDb3VudCAmJiB0eXBlID09IENlbGxUeXBlLkdyb3VuZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gR2l2ZSB0aGUgY2VsbCA1JSBjaGFuY2VcclxuICAgICAgICAgICAgICAgIGlmKFV0aWxzLlJhbmRvbSgwLCAyMCkgPT0gMSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBBZGQgYSBuZXcgcm9ib3QgYW5kIGluY3JlbWVudCByb2JvdCBjb3VudFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucm9ib3RzLnB1c2gobmV3IEJhc2ljUm9ib3QobmV3IENvb3JkKHgsIHkpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcm9ib3RDb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBjZWxsIGxvc3QsIHNhdmUgaXQgZm9yIGxhdGVyXHJcbiAgICAgICAgICAgICAgICAgICAgcm9ib3RTcG90cy5wdXNoKG5ldyBDb29yZCh4LCB5KSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgdGhlIG1hcCBpcyBsb2FkZWQsIGJ1dCB0b28gZmV3IHJvYm90cyB3ZXJlIGFkZGVkLCBhZGQgbmV3IG9uZXNcclxuICAgICAgICAvLyBiYXNlZCBvbiB0aGUgW3NhdmUgaWYgZm9yIGxhdGVyXSBzcG90c1xyXG4gICAgICAgIGZvcig7IHJvYm90U3BvdHMubGVuZ3RoID4gMCAmJiByb2JvdENvdW50IDwgdGhpcy5yb2JvdENvdW50OyByb2JvdENvdW50KyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgY29vcmQgPSByb2JvdFNwb3RzLnNwbGljZShVdGlscy5SYW5kb20oMCwgcm9ib3RTcG90cy5sZW5ndGggLSAxKSwgMSlbMF07XHJcbiAgICAgICAgICAgIGxldCByb2JvdCA9IG5ldyBCYXNpY1JvYm90KGNvb3JkKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucm9ib3RzLnB1c2gocm9ib3QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5PblVwZGF0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IGFuIGVsZW1lbnQgZnJvbSB0aGUgZ2l2ZW4gYXJyYXkgYnkgY29vcmQuXHJcbiAgICAgKiBAcGFyYW0gZm9ybVxyXG4gICAgICogQHBhcmFtIGNvb3JkXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgR2V0RWxlbWVudChmb3JtOiBJRWxlbWVudFtdLCBjb29yZDogQ29vcmQpOiBJRWxlbWVudFxyXG4gICAge1xyXG4gICAgICAgIHZhciByZXN1bHQ6IElFbGVtZW50ID0gbnVsbDtcclxuXHJcbiAgICAgICAgZm9ybS5zb21lKGUgPT4gXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZihlLkdldFBvc2l0aW9uKCkuSXMoY29vcmQpKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IGEgY2VsbCBieSBjb29yZC5cclxuICAgICAqIEBwYXJhbSBjb29yZCBcclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldENlbGwoY29vcmQ6IENvb3JkKTogSUNlbGxcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gPElDZWxsPnRoaXMuR2V0RWxlbWVudCh0aGlzLmNlbGxzLCBjb29yZCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgYSByb2JvdCBieSBjb29yZC5cclxuICAgICAqIEBwYXJhbSBjb29yZCBcclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldFJvYm90KGNvb3JkOiBDb29yZCk6IElSb2JvdFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiA8SVJvYm90PnRoaXMuR2V0RWxlbWVudCh0aGlzLnJvYm90cywgY29vcmQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIGEgcm9ib3QgZnJvbSB0aGUgbGlzdC5cclxuICAgICAqIEBwYXJhbSByb2JvdCBcclxuICAgICAqL1xyXG4gICAgcHVibGljIFJlbW92ZVJvYm90KHJvYm90OiBJUm9ib3QpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5yb2JvdHMuaW5kZXhPZihyb2JvdCk7XHJcblxyXG4gICAgICAgIGlmKGluZGV4ID49IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnJvYm90cy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgc2l6ZSBvZiB0aGUgbWFwLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgR2V0U2l6ZSgpOiBudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zaXplO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSBjZWxscyBvZiB0aGUgbWFwLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgR2V0Q2VsbHMoKTogQXJyYXk8SUNlbGw+XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY2VsbHM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIHJvYm90cyBvZiB0aGUgbWFwLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgR2V0Um9ib3RzKCk6IEFycmF5PElSb2JvdD5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yb2JvdHM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gZWxlbWVudHMgb2YgdGhlIG1hcCAocm9ib3RzIGFuZCBjZWxscykuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBHZXRFbGVtZW50cygpOiBBcnJheTxJRWxlbWVudD5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gKDxJRWxlbWVudFtdPnRoaXMuY2VsbHMpLmNvbmNhdCg8SUVsZW1lbnRbXT50aGlzLnJvYm90cyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsZWQgd2hlbiB0aGUgbWFwIHdhcyB1cGRhdGVkLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgT25VcGRhdGU6ICgpID0+IHZvaWQgPSBVdGlscy5Ob29wO1xyXG59IiwiZXhwb3J0IGNsYXNzIFV0aWxzXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIGFuIGFzeW5jIHJlcXVlc3QuXHJcbiAgICAgKiBAcGFyYW0gdXJsIFxyXG4gICAgICogQHBhcmFtIGRhdGEgXHJcbiAgICAgKiBAcGFyYW0gbWV0aG9kIFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHN0YXRpYyBhc3luYyBBamF4KHVybDogc3RyaW5nLCBkYXRhOiBzdHJpbmcsIG1ldGhvZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHN0cmluZz4ocmVzb2x2ZSA9PiBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblxyXG4gICAgICAgICAgICByZXF1ZXN0Lm9wZW4obWV0aG9kLCB1cmwsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgcmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYocmVxdWVzdC5yZWFkeVN0YXRlICE9IDQpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0LnN0YXR1cyA9PSAyMDApIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVxdWVzdC5yZXNwb25zZVRleHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgaWYoZGF0YSAhPSBudWxsICYmIGRhdGEubGVuZ3RoID4gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3Quc2VuZChkYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3Quc2VuZCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQb3N0IHJlcXVlc3Qgd2l0aCBKU09OIGRhdGEuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgYXN5bmMgUG9zdCh1cmw6IHN0cmluZywgZGF0YTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IFV0aWxzLkFqYXgodXJsLCBkYXRhLCBcIlBPU1RcIik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgcmVxdWVzdCB0byB0aGUgZ2l2ZW4gVVJMLlxyXG4gICAgICogQHBhcmFtIHVybCBcclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBHZXQodXJsOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gYXdhaXQgVXRpbHMuQWpheCh1cmwsIG51bGwsIFwiR0VUXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gbWluIChpbmNsdWRlZCkgYW5kIG1heCAoaW5jbHVkZWQpLlxyXG4gICAgICogQHBhcmFtIG1pbiBcclxuICAgICAqIEBwYXJhbSBtYXggXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgUmFuZG9tKG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcik6IG51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkgKyBtaW4pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29weSBwcm9wZXJ0aWVzIGZyb20gb25lIG9iamVjdCB0byBhbm90aGVyLlxyXG4gICAgICogQHBhcmFtIHRvIFxyXG4gICAgICogQHBhcmFtIGZyb20gXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgRXh0cmFjdCh0bzogT2JqZWN0LCBmcm9tOiBPYmplY3QpIFxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiBmcm9tKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKGZyb20uaGFzT3duUHJvcGVydHkoa2V5KSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdG9ba2V5XSA9IGZyb21ba2V5XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBCaW5kIHByb3BlcnRpZXMgZnJvbSBvbmUgb2JqZWN0IHRvIGFub3RoZXIuXHJcbiAgICAgKiBAcGFyYW0gdG8gXHJcbiAgICAgKiBAcGFyYW0gZnJvbSBcclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBCaW5kKHRvOiBPYmplY3QsIGZyb206IE9iamVjdCwgcHJvcGVydGllczogc3RyaW5nW10pIFxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiBwcm9wZXJ0aWVzKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IHAgPSBwcm9wZXJ0aWVzW2tleV07XHJcblxyXG4gICAgICAgICAgICBpZihmcm9tW3BdICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRvW3BdID0gZnJvbVtwXS5iaW5kKGZyb20pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQSBub29wIGZ1bmN0aW9uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIE5vb3AoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxufSIsImltcG9ydCB7IElSb2JvdCB9IGZyb20gJy4vRWxlbWVudC9Sb2JvdC9JUm9ib3QnO1xyXG5pbXBvcnQgeyBQcm9jZXNzb3IgfSBmcm9tICcuL0ludGVycHJldGVyL1Byb2Nlc3Nvcic7XHJcbmltcG9ydCB7IFJ1bm5lciB9IGZyb20gJy4vSW50ZXJwcmV0ZXIvUnVubmVyJztcclxuaW1wb3J0IHsgTWFwIH0gZnJvbSBcIi4vTWFwXCI7XHJcbmltcG9ydCB7IENvb3JkIH0gZnJvbSBcIi4vQ29vcmRcIjtcclxuaW1wb3J0IHsgSUVsZW1lbnQgfSBmcm9tIFwiLi9FbGVtZW50L0lFbGVtZW50XCI7XHJcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSBcIi4vVXRpbHNcIjtcclxuXHJcblV0aWxzLkV4dHJhY3Qod2luZG93LCB7IENvb3JkLCBNYXAsIFV0aWxzLCBQcm9jZXNzb3IsIFJ1bm5lciB9KTtcclxuXHJcbmNvbnN0IGNhbnZhcyA9IDxIVE1MQ2FudmFzRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxuY29uc3QgY29udGV4dCA9IDxDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ+Y2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcclxuXHJcbmNvbnN0IGNvZGVUZXh0YXJlYSA9IDxIVE1MVGV4dEFyZWFFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29kZVwiKTtcclxuY29uc3QgcHVzaEJ1dHRvbiA9IDxIVE1MQnV0dG9uRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInB1c2hcIik7XHJcbmNvbnN0IHN0b3BCdXR0b24gPSA8SFRNTEJ1dHRvbkVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdG9wXCIpO1xyXG5jb25zdCBsaW5lSW5wdXQgPSA8SFRNTEJ1dHRvbkVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsaW5lXCIpO1xyXG5cclxubGV0IG1hcDogTWFwID0gTWFwLkdldEluc3RhbmNlKCk7XHJcbmxldCBydW5uZXI6IFJ1bm5lciA9IG51bGw7XHJcblxyXG5jb25zdCBsYXN0OiBBcnJheTxDb29yZD4gPSBbXTtcclxuXHJcbmxldCBwbGF5ZXI6IElSb2JvdCA9IG51bGw7XHJcbmxldCBlbmVteTogSVJvYm90ID0gbnVsbDtcclxuXHJcbmNvbnN0IHNpemU6IG51bWJlciA9IDMwO1xyXG5cclxuLyoqXHJcbiAqIERyYXcgdGhlIGdpdmVuIGVsZW1lbnQgb250byB0aGUgY2FudmFzLlxyXG4gKiBAcGFyYW0gZVxyXG4gKiBAcGFyYW0gY2FsbGJhY2tcclxuICovXHJcbmNvbnN0IGRyYXcgPSAoZTogSUVsZW1lbnQsIGxvYWRlZDogKCkgPT4gdm9pZCkgPT5cclxue1xyXG4gICAgbGV0IGNvb3JkID0gZS5HZXRQb3NpdGlvbigpO1xyXG4gICAgbGV0IHggPSBjb29yZC5YO1xyXG4gICAgbGV0IHkgPSBjb29yZC5ZO1xyXG5cclxuICAgIGxldCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG4gICAgXHJcbiAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiBcclxuICAgIHtcclxuICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpbWFnZSwgeCAqIHNpemUsIHkgKiBzaXplLCBzaXplLCBzaXplKTtcclxuICAgICAgICBsb2FkZWQoKTtcclxuICAgIH07XHJcblxyXG4gICAgaW1hZ2Uuc3JjID0gZS5HZXRUZXh0dXJlKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogVXBkYXRlIHRoZSBjYW52YXMuXHJcbiAqL1xyXG5jb25zdCB1cGRhdGUgPSAoKSA9PiBcclxue1xyXG4gICAgaWYoIXJ1bm5lcikgXHJcbiAgICB7XHJcbiAgICAgICAgcGxheWVyID0gbWFwLkdldFJvYm90cygpWzBdO1xyXG4gICAgICAgIGVuZW15ID0gbWFwLkdldFJvYm90cygpWzFdO1xyXG5cclxuICAgICAgICBydW5uZXIgPSBuZXcgUnVubmVyKHBsYXllcik7XHJcblxyXG4gICAgICAgIHJ1bm5lci5PbkxpbmUgPSAobGluZSwgY291bnQpID0+IFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGluZUlucHV0LnZhbHVlID0gYCR7Y291bnR9OiAke2xpbmV9YDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjYW52YXMud2lkdGggPSBzaXplICogbWFwLkdldFNpemUoKTtcclxuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gc2l6ZSAqIG1hcC5HZXRTaXplKCk7XHJcbiAgICAgICAgY2FudmFzLm9uY2xpY2sgPSBlID0+IHVwZGF0ZSgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBpID0gMDtcclxuXHJcbiAgICAgICAgLy8gRHJhdyBjZWxscyBmaXJzdFxyXG4gICAgICAgIG1hcC5HZXRDZWxscygpLmZvckVhY2goY2VsbCA9PiBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRyYXcoY2VsbCwgKCkgPT4gXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vIFdoZW4gdGhlIGxhc3Qgd2FzIGRyYXduLCBzdGFydCBkcmF3aW5nIHRoZSByb2JvdHNcclxuICAgICAgICAgICAgICAgIGlmKCsraSA9PSBtYXAuR2V0U2l6ZSgpKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG1hcC5HZXRSb2JvdHMoKS5mb3JFYWNoKHJvYm90ID0+IFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdC5wdXNoKHJvYm90LkdldFBvc2l0aW9uKCkuQ2xvbmUoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYXcocm9ib3QsIFV0aWxzLk5vb3ApO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGkgPSAwO1xyXG5cclxuICAgICAgICAvLyBPbmx5IGRyYXcgY2VsbHMgd2hlcmUgdGhlIHJvYm90cyB3ZXJlXHJcbiAgICAgICAgbGFzdC5mb3JFYWNoKGMgPT4gXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkcmF3KG1hcC5HZXRDZWxsKGMpLCBVdGlscy5Ob29wKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCsraSA9PSBsYXN0Lmxlbmd0aClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gQ2xlYXIgdGhlIGFycmF5XHJcbiAgICAgICAgICAgICAgICBsYXN0Lmxlbmd0aCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmVkcmF3IHJvYm90c1xyXG4gICAgICAgICAgICAgICAgbWFwLkdldFJvYm90cygpLmZvckVhY2gocm9ib3QgPT4gXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdC5wdXNoKHJvYm90LkdldFBvc2l0aW9uKCkuQ2xvbmUoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZHJhdyhyb2JvdCwgVXRpbHMuTm9vcCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKCFwbGF5ZXIuSXNBbGl2ZSgpIHx8ICFlbmVteS5Jc0FsaXZlKCkpXHJcbiAgICB7XHJcbiAgICAgICAgYWxlcnQocGxheWVyLklzQWxpdmUoKSA/IFwiWW91IHdvbiFcIiA6IFwiWW91IGxvc2UhXCIpO1xyXG5cclxuICAgICAgICBzdG9wQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgICBwdXNoQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgcnVubmVyLlN0b3AoKTtcclxuICAgIH1cclxufTtcclxuXHJcbnB1c2hCdXR0b24ub25jbGljayA9IGUgPT4gcnVubmVyLlJ1bihjb2RlVGV4dGFyZWEudmFsdWUpO1xyXG5zdG9wQnV0dG9uLm9uY2xpY2sgPSBlID0+IHJ1bm5lci5TdG9wKCk7XHJcblxyXG5VdGlscy5HZXQoXCJyZXMvZXhhbXBsZS50eHRcIikudGhlbihyZXN1bHQgPT4gY29kZVRleHRhcmVhLnZhbHVlID0gcmVzdWx0KTtcclxubWFwLkxvYWQoXCJyZXMvbWFwLmpzb25cIik7XHJcblxyXG5tYXAuT25VcGRhdGUgPSB1cGRhdGU7Il19
