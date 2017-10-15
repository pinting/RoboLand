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
    MoveHere(robot) {
        if (this.robot != null) {
            return MoveType_1.MoveType.Blocked;
        }
        this.robot = robot;
        return MoveType_1.MoveType.Successed;
    }
    MoveAway() {
        this.robot = null;
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
    MoveHere(robot) {
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
class BasicRobot {
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
        return "res/robot.png";
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
    Attack(robot) {
        if (this.position.GetDistance(robot.GetPosition()) > 1) {
            return false;
        }
        robot.Damage(this.damage);
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
        this.map.RemoveRobot(this);
        this.map.OnUpdate();
    }
    IsAlive() {
        return this.health > 0;
    }
}
exports.BasicRobot = BasicRobot;
},{"../../Map":12,"../MoveType":6}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Map_1 = require("../Map");
const Coord_1 = require("../Coord");
const CellType_1 = require("../Element/Cell/CellType");
class Adapter {
    constructor(robot) {
        this.robot = robot;
        this.map = Map_1.Map.GetInstance();
    }
    move(dx, dy) {
        return this.robot.Move(new Coord_1.Coord(dx, dy)) ? 1 : 0;
    }
    test(dx, dy) {
        var cell = this.map.GetCell(this.robot.GetPosition().Difference(new Coord_1.Coord(dx, dy)));
        return cell != null && cell.GetType() == CellType_1.CellType.Ground ? 1 : 0;
    }
    attack() {
        var result = null;
        this.map.GetRobots().some(robot => {
            if (robot.GetPosition().GetDistance(this.robot.GetPosition()) == 1) {
                result = robot;
                return true;
            }
            return false;
        });
        return result != null && this.robot.Attack(result) ? 1 : 0;
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
    constructor(robot) {
        this.speed = 300;
        this.OnLine = Utils_1.Utils.Noop;
        this.adapter = new Adapter_1.Adapter(robot);
        this.processor = new Processor_1.Processor;
        this.parser = new Parser_1.Parser;
    }
    Run(code) {
        this.Stop();
        this.parser.Parse(code);
        this.processor.Context = {
            move: this.adapter.move.bind(this.adapter),
            test: this.adapter.test.bind(this.adapter),
            attack: this.adapter.attack.bind(this.adapter)
        };
        this.counter = 0;
        this.interval = setInterval(() => this.ExecuteLine(), this.speed);
    }
    Stop() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
    ExecuteLine() {
        if (this.counter < 0 && this.counter >= this.parser.Code.length) {
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
            if (this.processor.Solve(condition) == 1) {
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
const BasicRobot_1 = require("./Element/Robot/BasicRobot");
class Map {
    constructor() {
        this.robotCount = 2;
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
        this.robots = [];
        this.cells = [];
        for (var i = 0; i < size * size; i++) {
            let x = i % size;
            let y = Math.floor(i / size);
            this.cells[i] = new GroundCell_1.GroundCell(new Coord_1.Coord(x, y));
        }
        this.robots.push(new BasicRobot_1.BasicRobot(new Coord_1.Coord(Utils_1.Utils.Random(0, size - 1), 0)));
        this.robots.push(new BasicRobot_1.BasicRobot(new Coord_1.Coord(Utils_1.Utils.Random(0, size - 1), size - 1)));
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
            this.robots = [];
            this.size = raw.shift();
            var robotSpots = new Array();
            var robotCount = 0;
            for (let i = 0; i < raw.length; i++) {
                let x = i % this.size;
                let y = Math.floor(i / this.size);
                let type = raw[i];
                this.cells[i] = CellFactory_1.CellFactory.FromType(type, new Coord_1.Coord(x, y));
                if (robotCount < this.robotCount && type == CellType_1.CellType.Ground) {
                    if (Utils_1.Utils.Random(0, 20) == 1) {
                        this.robots.push(new BasicRobot_1.BasicRobot(new Coord_1.Coord(x, y)));
                        robotCount++;
                    }
                    else {
                        robotSpots.push(new Coord_1.Coord(x, y));
                    }
                }
            }
            for (; robotSpots.length > 0 && robotCount < this.robotCount; robotCount++) {
                let coord = robotSpots.splice(Utils_1.Utils.Random(0, robotSpots.length - 1), 1)[0];
                let robot = new BasicRobot_1.BasicRobot(coord);
                this.robots.push(robot);
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
    GetRobot(coord) {
        return this.GetElement(this.robots, coord);
    }
    RemoveRobot(robot) {
        var index = this.robots.indexOf(robot);
        if (index >= 0) {
            this.robots.splice(index, 1);
        }
    }
    GetSize() {
        return this.size;
    }
    GetCells() {
        return this.cells;
    }
    GetRobots() {
        return this.robots;
    }
    GetElements() {
        return this.cells.concat(this.robots);
    }
}
exports.Map = Map;
},{"./Coord":1,"./Element/Cell/CellFactory":2,"./Element/Cell/CellType":3,"./Element/Cell/GroundCell":4,"./Element/Robot/BasicRobot":7,"./Utils":13}],13:[function(require,module,exports){
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
            if (to.hasOwnProperty(key)) {
                to[key] = from[key];
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
        player = map.GetRobots()[0];
        enemy = map.GetRobots()[1];
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
                    map.GetRobots().forEach(robot => {
                        last.push(robot.GetPosition().Clone());
                        draw(robot, Utils_1.Utils.Noop);
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
                map.GetRobots().forEach(robot => {
                    last.push(robot.GetPosition().Clone());
                    draw(robot, Utils_1.Utils.Noop);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd3d3L2xpYi9Db29yZC50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvQ2VsbC9DZWxsRmFjdG9yeS50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvQ2VsbC9DZWxsVHlwZS50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvQ2VsbC9Hcm91bmRDZWxsLnRzIiwic3JjL3d3dy9saWIvRWxlbWVudC9DZWxsL1dhdGVyQ2VsbC50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvTW92ZVR5cGUudHMiLCJzcmMvd3d3L2xpYi9FbGVtZW50L1JvYm90L0Jhc2ljUm9ib3QudHMiLCJzcmMvd3d3L2xpYi9JbnRlcnByZXRlci9BZGFwdGVyLnRzIiwic3JjL3d3dy9saWIvSW50ZXJwcmV0ZXIvUGFyc2VyLnRzIiwic3JjL3d3dy9saWIvSW50ZXJwcmV0ZXIvUHJvY2Vzc29yLnRzIiwic3JjL3d3dy9saWIvSW50ZXJwcmV0ZXIvUnVubmVyLnRzIiwic3JjL3d3dy9saWIvTWFwLnRzIiwic3JjL3d3dy9saWIvVXRpbHMudHMiLCJzcmMvd3d3L2xpYi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUE7SUFRSSxZQUFZLElBQVksQ0FBQyxFQUFFLElBQVksQ0FBQztRQUVwQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2YsQ0FBQztJQU1NLFdBQVcsQ0FBQyxLQUFZO1FBRTNCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENB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QUksQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUV6QixHQUFHLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJleHBvcnQgY2xhc3MgQ29vcmRcclxue1xyXG4gICAgcHVibGljIFg6IG51bWJlcjtcclxuICAgIHB1YmxpYyBZOiBudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb25zdHJ1Y3QgYSBuZXcgY29vcmQuXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHg6IG51bWJlciA9IDAsIHk6IG51bWJlciA9IDApXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5YID0geDtcclxuICAgICAgICB0aGlzLlkgPSB5O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSBkaXN0YW5jZSBmcm9tIHRoZSBvdGhlciBjb29yZC5cclxuICAgICAqIEBwYXJhbSBvdGhlciBcclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldERpc3RhbmNlKG90aGVyOiBDb29yZCk6IG51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3codGhpcy5YIC0gb3RoZXIuWCwgMikgKyBNYXRoLnBvdyh0aGlzLlkgLSBvdGhlci5ZLCAyKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVjayBpZiB0aGUgY29vcmQgaXMgdGhlIHNhbWUgYXMgYW4gb3RoZXIuXHJcbiAgICAgKiBAcGFyYW0gb3RoZXIgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBJcyhvdGhlcjogQ29vcmQpOiBib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuWCA9PSBvdGhlci5YICYmIHRoaXMuWSA9PSBvdGhlci5ZO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsY3VsYXRlIHRoZSBkaWZmZXJlbmNlIHdpdGggYW5vdGhlciBjb29yZC5cclxuICAgICAqIEBwYXJhbSBvdGhlciBcclxuICAgICAqL1xyXG4gICAgcHVibGljIERpZmZlcmVuY2Uob3RoZXI6IENvb3JkKTogQ29vcmRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IENvb3JkKHRoaXMuWCArIG90aGVyLlgsIHRoaXMuWSArIG90aGVyLlkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2xvbmUgdGhlIGNvb3JkLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgQ2xvbmUoKTogQ29vcmRcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IENvb3JkKHRoaXMuWCwgdGhpcy5ZKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IElDZWxsIH0gZnJvbSBcIi4vSUNlbGxcIjtcclxuaW1wb3J0IHsgQ2VsbFR5cGUgfSBmcm9tIFwiLi9DZWxsVHlwZVwiO1xyXG5pbXBvcnQgeyBHcm91bmRDZWxsIH0gZnJvbSBcIi4vR3JvdW5kQ2VsbFwiO1xyXG5pbXBvcnQgeyBXYXRlckNlbGwgfSBmcm9tIFwiLi9XYXRlckNlbGxcIjtcclxuaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi4vLi4vQ29vcmRcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBDZWxsRmFjdG9yeVxyXG57XHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBhIG5ldyBJQ2VsbCBiYXNlZCBvbiB0aGUgZ2l2ZW4gQ2VsbFR5cGUgZW51bS5cclxuICAgICAqIEBwYXJhbSB0eXBlXHJcbiAgICAgKiBAcGFyYW0gcG9zaXRpb25cclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBGcm9tVHlwZSh0eXBlOiBDZWxsVHlwZSwgcG9zaXRpb246IENvb3JkKTogSUNlbGxcclxuICAgIHtcclxuICAgICAgICBzd2l0Y2godHlwZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhc2UgQ2VsbFR5cGUuR3JvdW5kOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBHcm91bmRDZWxsKHBvc2l0aW9uKTtcclxuICAgICAgICAgICAgY2FzZSBDZWxsVHlwZS5XYXRlcjpcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgV2F0ZXJDZWxsKHBvc2l0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJleHBvcnQgZW51bSBDZWxsVHlwZVxyXG57XHJcbiAgICBHcm91bmQgPSAwLFxyXG4gICAgV2F0ZXIgPSAxXHJcbn0iLCJpbXBvcnQgeyBJQ2VsbCB9IGZyb20gXCIuL0lDZWxsXCJcclxuaW1wb3J0IHsgSVJvYm90IH0gZnJvbSBcIi4uL1JvYm90L0lSb2JvdFwiO1xyXG5pbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuLi8uLi9Db29yZFwiO1xyXG5pbXBvcnQgeyBNb3ZlVHlwZSB9IGZyb20gXCIuLi9Nb3ZlVHlwZVwiO1xyXG5pbXBvcnQgeyBDZWxsVHlwZSB9IGZyb20gXCIuL0NlbGxUeXBlXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBHcm91bmRDZWxsIGltcGxlbWVudHMgSUNlbGxcclxue1xyXG4gICAgcHJvdGVjdGVkIHBvc2l0aW9uOiBDb29yZDtcclxuICAgIHByb3RlY3RlZCByb2JvdDogSVJvYm90O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29uc3RydWN0IGEgbmV3IGVtcHR5IGNlbGwgLSBncm91bmQuXHJcbiAgICAgKiBAcGFyYW0gcG9zaXRpb24gQ29vcmQgb2YgdGhlIGNlbGwuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBjb25zdHJ1Y3Rvcihwb3NpdGlvbjogQ29vcmQpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSB0eXBlIG9mIHRoZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgR2V0VHlwZSgpOiBDZWxsVHlwZVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBDZWxsVHlwZS5Hcm91bmQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIHRleHR1cmUgb2YgdGhlIGNlbGwuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBHZXRUZXh0dXJlKCk6IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBcInJlcy9ncm91bmQucG5nXCI7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSBjZWxsIHBvc2l0aW9uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgR2V0UG9zaXRpb24oKTogQ29vcmQgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucG9zaXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbnRlciBhIGNlbGwgd2l0aCBhIHJvYm90LlxyXG4gICAgICogQHBhcmFtIHJvYm90IFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgTW92ZUhlcmUocm9ib3Q6IElSb2JvdCk6IE1vdmVUeXBlIFxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMucm9ib3QgIT0gbnVsbCkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gTW92ZVR5cGUuQmxvY2tlZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucm9ib3QgPSByb2JvdDtcclxuXHJcbiAgICAgICAgcmV0dXJuIE1vdmVUeXBlLlN1Y2Nlc3NlZDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIExlYXZlIGNlbGwuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBNb3ZlQXdheSgpOiB2b2lkIFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucm9ib3QgPSBudWxsO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgR3JvdW5kQ2VsbCB9IGZyb20gXCIuL0dyb3VuZENlbGxcIlxyXG5pbXBvcnQgeyBJUm9ib3QgfSBmcm9tIFwiLi4vUm9ib3QvSVJvYm90XCI7XHJcbmltcG9ydCB7IE1vdmVUeXBlIH0gZnJvbSBcIi4uL01vdmVUeXBlXCI7XHJcbmltcG9ydCB7IENlbGxUeXBlIH0gZnJvbSBcIi4vQ2VsbFR5cGVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBXYXRlckNlbGwgZXh0ZW5kcyBHcm91bmRDZWxsXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSB0eXBlIG9mIHRoZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgR2V0VHlwZSgpOiBDZWxsVHlwZVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBDZWxsVHlwZS5XYXRlcjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgdGV4dHVyZSBvZiB0aGUgY2VsbC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldFRleHR1cmUoKTogc3RyaW5nXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIFwicmVzL3dhdGVyLnBuZ1wiO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW50ZXIgYSBjZWxsIHdpdGggYSByb2JvdCBhbmQga2lsbCBpdC5cclxuICAgICAqIEBwYXJhbSByb2JvdCBcclxuICAgICAqL1xyXG4gICAgcHVibGljIE1vdmVIZXJlKHJvYm90OiBJUm9ib3QpOiBNb3ZlVHlwZSBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gTW92ZVR5cGUuS2lsbGVkO1xyXG4gICAgfVxyXG59IiwiZXhwb3J0IGVudW0gTW92ZVR5cGVcclxue1xyXG4gICAgU3VjY2Vzc2VkLFxyXG4gICAgQmxvY2tlZCxcclxuICAgIEtpbGxlZFxyXG59IiwiaW1wb3J0IHsgSVJvYm90IH0gZnJvbSBcIi4vSVJvYm90XCI7XHJcbmltcG9ydCB7IENvb3JkIH0gZnJvbSBcIi4uLy4uL0Nvb3JkXCI7XHJcbmltcG9ydCB7IE1hcCB9IGZyb20gXCIuLi8uLi9NYXBcIjtcclxuaW1wb3J0IHsgTW92ZVR5cGUgfSBmcm9tIFwiLi4vTW92ZVR5cGVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBCYXNpY1JvYm90IGltcGxlbWVudHMgSVJvYm90XHJcbntcclxuICAgIHByb3RlY3RlZCByZWFkb25seSBtYXAgPSBNYXAuR2V0SW5zdGFuY2UoKTtcclxuXHJcbiAgICBwcm90ZWN0ZWQgaGVhbHRoOiBudW1iZXIgPSAxLjA7XHJcbiAgICBwcm90ZWN0ZWQgZGFtYWdlOiBudW1iZXIgPSAxLjA7XHJcblxyXG4gICAgcHJpdmF0ZSBwb3NpdGlvbjogQ29vcmQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb25zdHJ1Y3QgYSBuZXcgQmFzaWNSb2JvdC5cclxuICAgICAqIEBwYXJhbSBwb3NpdGlvblxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgY29uc3RydWN0b3IocG9zaXRpb246IENvb3JkKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcclxuXHJcbiAgICAgICAgdmFyIGNlbGwgPSBNYXAuR2V0SW5zdGFuY2UoKS5HZXRDZWxsKHBvc2l0aW9uKTtcclxuXHJcbiAgICAgICAgaWYoY2VsbCAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2VsbC5Nb3ZlSGVyZSh0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIGNlbGwgdGV4dHVyZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldFRleHR1cmUoKTogc3RyaW5nXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIFwicmVzL3JvYm90LnBuZ1wiO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTW92ZSByb2JvdCBpbiBhIGRpcmVjdGlvbi5cclxuICAgICAqIEBwYXJhbSBkaXJlY3Rpb25cclxuICAgICAqL1xyXG4gICAgcHVibGljIE1vdmUoZGlyZWN0aW9uOiBDb29yZCk6IGJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZihNYXRoLmFicyhNYXRoLmFicyhkaXJlY3Rpb24uWCkgLSBNYXRoLmFicyhkaXJlY3Rpb24uWSkpID09IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIE9ubHkgYWxsb3cgbGVmdCwgcmlnaHQsIHRvcCBhbmQgYm90dG9tIG1vdmVtZW50XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgbGFzdENlbGwgPSB0aGlzLm1hcC5HZXRDZWxsKHRoaXMucG9zaXRpb24pO1xyXG4gICAgICAgIHZhciBuZXh0Q29vcmQgPSB0aGlzLnBvc2l0aW9uLkRpZmZlcmVuY2UoZGlyZWN0aW9uKTtcclxuICAgICAgICB2YXIgbmV4dENlbGwgPSB0aGlzLm1hcC5HZXRDZWxsKG5leHRDb29yZCk7XHJcblxyXG4gICAgICAgIGlmKGxhc3RDZWxsID09IG51bGwgfHwgbmV4dENlbGwgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN3aXRjaChuZXh0Q2VsbC5Nb3ZlSGVyZSh0aGlzKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhc2UgTW92ZVR5cGUuQmxvY2tlZDogLy8gRG8gbm90aGluZ1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICBjYXNlIE1vdmVUeXBlLktpbGxlZDogLy8gTW92ZSBhd2F5IGFuZCBraWxsIGl0XHJcbiAgICAgICAgICAgICAgICBsYXN0Q2VsbC5Nb3ZlQXdheSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5leHRDb29yZDtcclxuICAgICAgICAgICAgICAgIHRoaXMuS2lsbCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICBjYXNlIE1vdmVUeXBlLlN1Y2Nlc3NlZDogLy8gTW92ZSBhd2F5XHJcbiAgICAgICAgICAgICAgICBsYXN0Q2VsbC5Nb3ZlQXdheSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5leHRDb29yZDtcclxuICAgICAgICAgICAgICAgIHRoaXMubWFwLk9uVXBkYXRlKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBdHRhY2sgYW4gb3RoZXIgcm9ib3QgaWYgaXQgaXMgb25lIGNlbGwgYXdheS5cclxuICAgICAqIEBwYXJhbSByb2JvdCBcclxuICAgICAqL1xyXG4gICAgcHVibGljIEF0dGFjayhyb2JvdDogSVJvYm90KTogYm9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMucG9zaXRpb24uR2V0RGlzdGFuY2Uocm9ib3QuR2V0UG9zaXRpb24oKSkgPiAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcm9ib3QuRGFtYWdlKHRoaXMuZGFtYWdlKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgcG9zaXRpb24gb2YgdGhlIHJvYm90LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgR2V0UG9zaXRpb24oKTogQ29vcmQgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucG9zaXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEbyBkYW1hZ2UgdG8gdGhpcyByb2JvdC5cclxuICAgICAqIEBwYXJhbSBkYW1hZ2UgQW1vdW50IG9mIHRoZSBkYW1hZ2UuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBEYW1hZ2UoZGFtYWdlOiBudW1iZXIpOiB2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5oZWFsdGggLT0gZGFtYWdlO1xyXG5cclxuICAgICAgICBpZih0aGlzLmhlYWx0aCA8PSAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5LaWxsKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogS2lsbCB0aGUgcm9ib3QuXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgS2lsbCgpOiB2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5oZWFsdGggPSAwO1xyXG5cclxuICAgICAgICB0aGlzLm1hcC5SZW1vdmVSb2JvdCh0aGlzKTtcclxuICAgICAgICB0aGlzLm1hcC5PblVwZGF0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2sgaWYgdGhlIHJvYm90IGlzIGFsaXZlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgSXNBbGl2ZSgpOiBib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaGVhbHRoID4gMDtcclxuICAgIH1cclxufSIsImltcG9ydCB7IE1hcCB9IGZyb20gJy4uL01hcCc7XHJcbmltcG9ydCB7IElSb2JvdCB9IGZyb20gXCIuLi9FbGVtZW50L1JvYm90L0lSb2JvdFwiO1xyXG5pbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuLi9Db29yZFwiO1xyXG5pbXBvcnQgeyBDZWxsVHlwZSB9IGZyb20gXCIuLi9FbGVtZW50L0NlbGwvQ2VsbFR5cGVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBBZGFwdGVyXHJcbntcclxuICAgIHByaXZhdGUgcm9ib3Q6IElSb2JvdDtcclxuICAgIHByaXZhdGUgbWFwOiBNYXA7XHJcblxyXG4gICAgY29uc3RydWN0b3Iocm9ib3Q6IElSb2JvdClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJvYm90ID0gcm9ib3Q7XHJcbiAgICAgICAgdGhpcy5tYXAgPSBNYXAuR2V0SW5zdGFuY2UoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE1vdmUgdG8gdGhlIGdpdmVuIGRpcmVjdGlvbi5cclxuICAgICAqIEBwYXJhbSBkeFxyXG4gICAgICogQHBhcmFtIGR5XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBtb3ZlKGR4OiBudW1iZXIsIGR5OiBudW1iZXIpOiBudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yb2JvdC5Nb3ZlKG5ldyBDb29yZChkeCwgZHkpKSA/IDEgOiAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGVzdCBpZiB0aGUgZ2l2ZW4gZGlyZWN0aW9uIGlzIHNhZmUuXHJcbiAgICAgKiBAcGFyYW0gZHhcclxuICAgICAqIEBwYXJhbSBkeSBcclxuICAgICAqL1xyXG4gICAgcHVibGljIHRlc3QoZHg6IG51bWJlciwgZHk6IG51bWJlcik6IG51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHZhciBjZWxsID0gdGhpcy5tYXAuR2V0Q2VsbCh0aGlzLnJvYm90LkdldFBvc2l0aW9uKCkuRGlmZmVyZW5jZShuZXcgQ29vcmQoZHgsIGR5KSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gY2VsbCAhPSBudWxsICYmIGNlbGwuR2V0VHlwZSgpID09IENlbGxUeXBlLkdyb3VuZCA/IDEgOiAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJ5IHRvIGF0dGFjayBzb21lb25lIGFyb3VuZCB0aGUgcGxheWVyLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgYXR0YWNrKCk6IG51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHZhciByZXN1bHQ6IElSb2JvdCA9IG51bGw7XHJcblxyXG4gICAgICAgIHRoaXMubWFwLkdldFJvYm90cygpLnNvbWUocm9ib3QgPT4gXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZihyb2JvdC5HZXRQb3NpdGlvbigpLkdldERpc3RhbmNlKHRoaXMucm9ib3QuR2V0UG9zaXRpb24oKSkgPT0gMSkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJvYm90O1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQgIT0gbnVsbCAmJiB0aGlzLnJvYm90LkF0dGFjayhyZXN1bHQpID8gMSA6IDA7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBJUm9ib3QgfSBmcm9tICcuLy4uL0VsZW1lbnQvUm9ib3QvSVJvYm90JztcclxuaW1wb3J0IHsgQWRhcHRlciB9IGZyb20gJy4vQWRhcHRlcic7XHJcbmltcG9ydCB7IFByb2Nlc3NvciB9IGZyb20gJy4vUHJvY2Vzc29yJztcclxuXHJcbmV4cG9ydCBjbGFzcyBQYXJzZXJcclxue1xyXG4gICAgcHVibGljIENvZGU6IHN0cmluZ1tdW107XHJcbiAgICBwdWJsaWMgTGFiZWxzOiB7IFtpZDogc3RyaW5nXSA6IG51bWJlcjsgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFBhcnNlIHRoZSBnaXZlbiBjb2RlLlxyXG4gICAgICogQHBhcmFtIGxpbmVzXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBQYXJzZShsaW5lczogc3RyaW5nKTogdm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuQ29kZSA9IFtdO1xyXG4gICAgICAgIHRoaXMuTGFiZWxzID0ge307XHJcblxyXG4gICAgICAgIGxpbmVzLnNwbGl0KFwiXFxuXCIpLmZvckVhY2gobGluZSA9PiB0aGlzLlBhcnNlTGluZShsaW5lKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQYXJzZSB0aGUgZ2l2ZW4gbGluZS5cclxuICAgICAqIEBwYXJhbSBsaW5lXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgUGFyc2VMaW5lKGxpbmU6IHN0cmluZyk6IHZvaWRcclxuICAgIHtcclxuICAgICAgICAvLyBTa2lwIHRoZSBsaW5lIGlmIGl0IGlzIGNvbW1lbnRcclxuICAgICAgICBpZihsaW5lWzBdID09IFwiI1wiKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHBhcmFtZXRlcnMgPSBsaW5lLnNwbGl0KFwiIFwiKTtcclxuXHJcbiAgICAgICAgc3dpdGNoKHBhcmFtZXRlcnNbMF0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlIFwiTEFCRUxcIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuUGFyc2VMYWJlbChwYXJhbWV0ZXJzKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiR09UT1wiOlxyXG4gICAgICAgICAgICBjYXNlIFwiQ0FMTFwiOlxyXG4gICAgICAgICAgICBjYXNlIFwiU0VUXCI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLlBhcnNlQ29kZShwYXJhbWV0ZXJzKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFBhcnNlIGEgTEFCRUwgY29tbWFuZC5cclxuICAgICAqIEBwYXJhbSBwYXJhbWV0ZXJzIFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIFBhcnNlTGFiZWwocGFyYW1ldGVyczogc3RyaW5nW10pOiB2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYocGFyYW1ldGVycy5sZW5ndGggIT0gMikgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIExBQkVMXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5MYWJlbHNbcGFyYW1ldGVyc1sxXV0gPSB0aGlzLkNvZGUubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUGFyc2UgYSBHT1RPL0NBTEwvU0VUIGNvbW1hbmQuXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1ldGVycyBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBQYXJzZUNvZGUocGFyYW1ldGVyczogc3RyaW5nW10pOiB2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5Db2RlLnB1c2gocGFyYW1ldGVycyk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBJQmxvY2sgfSBmcm9tICcuL0lCbG9jayc7XHJcblxyXG5leHBvcnQgY2xhc3MgUHJvY2Vzc29yXHJcbntcclxuICAgIHB1YmxpYyBDb250ZXh0OiBPYmplY3Q7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIHBvc2l0aW9uIG9mIHRoZSBuZWFyZXN0IGJyYWNrZXQgY2xvc3VyZS5cclxuICAgICAqIEBwYXJhbSBpbnB1dCBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBHZXRJbm5lcihpbnB1dDogc3RyaW5nKTogQXJyYXk8bnVtYmVyPlxyXG4gICAge1xyXG4gICAgICAgIGlmKGlucHV0LmluZGV4T2YoXCIoXCIpIDwgMCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIGxldCBzdGFydCA9IDA7XHJcbiAgICAgICAgbGV0IGJyYWNrZXRzID0gMDtcclxuXHJcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IGlucHV0Lmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoKGlucHV0W2ldKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiKFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmKGJyYWNrZXRzKysgPT0gMCkgc3RhcnQgPSBpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcIilcIjpcclxuICAgICAgICAgICAgICAgICAgICBpZihicmFja2V0cy0tID09IDEpIHJldHVybiBbc3RhcnQsIGldO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBhIG5ldyBJQmxvY2sgZnJvbSBhIHN0cmluZyBpbnB1dCAob3IgcmV0dXJuIHRoZSBpbnB1dCBpdHNlbGYpLlxyXG4gICAgICogQHBhcmFtIGlucHV0IFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIEdldEJsb2NrKGlucHV0KTogSUJsb2NrIHwgc3RyaW5nXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgZ2V0ID0gKGlucHV0OiBzdHJpbmcsIGE6IFwiKlwiIHwgXCIvXCIgfCBcIitcIiB8IFwiLVwiLCBiOiBcIipcIiB8IFwiL1wiIHwgXCIrXCIgfCBcIi1cIik6IElCbG9jayB8IHN0cmluZyA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGFwID0gaW5wdXQuaW5kZXhPZihhKTtcclxuICAgICAgICAgICAgbGV0IGJwID0gaW5wdXQuaW5kZXhPZihiKTtcclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYoYXAgPCAwICYmIGJwIDwgMCkgcmV0dXJuIGlucHV0O1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZihhcCA8IDApIGFwID0gaW5wdXQubGVuZ3RoO1xyXG4gICAgICAgICAgICBpZihicCA8IDApIGJwID0gaW5wdXQubGVuZ3RoO1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBsZXQgZmlyc3QgPSBhcCA8IGJwID8gYXAgOiBicDtcclxuICAgICAgICAgICAgbGV0IHR5cGUgPSBhcCA8IGJwID8gYSA6IGI7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBsZWZ0OiBpbnB1dC5zdWJzdHJpbmcoMCwgZmlyc3QpLFxyXG4gICAgICAgICAgICAgICAgcmlnaHQ6IGlucHV0LnN1YnN0cmluZyhmaXJzdCArIDEsIGlucHV0Lmxlbmd0aCksXHJcbiAgICAgICAgICAgICAgICBtZXRob2Q6IDxcIipcIiB8IFwiL1wiIHwgXCIrXCIgfCBcIi1cIj50eXBlXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZighaW5wdXQubWV0aG9kKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaW5wdXQgPSBnZXQoaW5wdXQsIFwiK1wiLCBcIi1cIik7XHJcbiAgICBcclxuICAgICAgICAgICAgaWYoIWlucHV0Lm1ldGhvZCkgaW5wdXQgPSBnZXQoaW5wdXQsIFwiKlwiLCBcIi9cIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaW5wdXQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcnkgdG8gY3JlYXRlIGFzIG1hbnkgYmxvY2tzIGFzIHBvc3NpYmxlIGZyb20gYSBibG9jay5cclxuICAgICAqIEBwYXJhbSBibG9jayBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBFeHRyYWN0QmxvY2soYmxvY2spOiBJQmxvY2sgfCBzdHJpbmdcclxuICAgIHtcclxuICAgICAgICBibG9jayA9IHRoaXMuR2V0QmxvY2soYmxvY2spO1xyXG5cclxuICAgICAgICBpZighYmxvY2subWV0aG9kKSByZXR1cm4gYmxvY2s7XHJcblxyXG4gICAgICAgIGJsb2NrLmxlZnQgPSB0aGlzLkV4dHJhY3RCbG9jayhibG9jay5sZWZ0KTtcclxuICAgICAgICBibG9jay5yaWdodCA9IHRoaXMuRXh0cmFjdEJsb2NrKGJsb2NrLnJpZ2h0KTtcclxuICAgIFxyXG4gICAgICAgIHJldHVybiBibG9jaztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGN1bGF0ZSB0aGUgcmVzdWx0IG9mIGEgYmxvY2sgdHJlZS5cclxuICAgICAqIEBwYXJhbSBibG9ja1xyXG4gICAgICovXHJcbiAgICBwcml2YXRlIENhbGN1bGF0ZUJsb2NrKGJsb2NrKTogbnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgaWYoIWJsb2NrLm1ldGhvZCkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBibG9jay5sZW5ndGggPT0gMCA/IDAgOiBwYXJzZUZsb2F0KGJsb2NrKTtcclxuXHJcbiAgICAgICAgICAgIGlmKHJlc3VsdCA9PSBOYU4pIHRocm93IG5ldyBFcnJvcihcIk5vdCBhIG51bWJlciFcIik7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIHN3aXRjaChibG9jay5tZXRob2QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlIFwiK1wiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuQ2FsY3VsYXRlQmxvY2soYmxvY2subGVmdCkgKyB0aGlzLkNhbGN1bGF0ZUJsb2NrKGJsb2NrLnJpZ2h0KTtcclxuICAgICAgICAgICAgY2FzZSBcIi1cIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLkNhbGN1bGF0ZUJsb2NrKGJsb2NrLmxlZnQpIC0gdGhpcy5DYWxjdWxhdGVCbG9jayhibG9jay5yaWdodCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCIqXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5DYWxjdWxhdGVCbG9jayhibG9jay5sZWZ0KSAqIHRoaXMuQ2FsY3VsYXRlQmxvY2soYmxvY2sucmlnaHQpO1xyXG4gICAgICAgICAgICBjYXNlIFwiL1wiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuQ2FsY3VsYXRlQmxvY2soYmxvY2subGVmdCkgLyB0aGlzLkNhbGN1bGF0ZUJsb2NrKGJsb2NrLnJpZ2h0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIHJlc3VsdCBvZiBhIHNpbXBsZSBtYXRoIHByb2JsZW0uIFlvdSBjYW4gdXNlIHRoZSA0IGJhc2ljIG9wZXJhdG9yIHBsdXMgYnJhY2tldHMuXHJcbiAgICAgKiBAcGFyYW0gaW5wdXQgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBDYWxjdWxhdGUoaW5wdXQ6IHN0cmluZyk6IG51bWJlclxyXG4gICAge1xyXG4gICAgICAgIGxldCByYW5nZTogQXJyYXk8bnVtYmVyPjtcclxuXHJcbiAgICAgICAgd2hpbGUoKHJhbmdlID0gdGhpcy5HZXRJbm5lcihpbnB1dCkpICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLkNhbGN1bGF0ZShpbnB1dC5zdWJzdHJpbmcocmFuZ2VbMF0gKyAxLCByYW5nZVsxXSkpO1xyXG5cclxuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5zdWJzdHJpbmcoMCwgcmFuZ2VbMF0pICsgcmVzdWx0ICsgaW5wdXQuc3Vic3RyaW5nKHJhbmdlWzFdICsgMSwgaW5wdXQubGVuZ3RoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBibG9jayA9IHRoaXMuRXh0cmFjdEJsb2NrKGlucHV0KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuQ2FsY3VsYXRlQmxvY2soYmxvY2spO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVzb2x2ZSBmdW5jdGlvbnMgaW4gYSBzdHJpbmcuXHJcbiAgICAgKiBAcGFyYW0gaW5wdXQgXHJcbiAgICAgKiBAcGFyYW0gY29udGV4dCBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBSZXNvbHZlRnVuY3Rpb25zKGlucHV0OiBzdHJpbmcpOiBzdHJpbmdcclxuICAgIHtcclxuICAgICAgICBjb25zdCBwYXR0ZXJuID0gL1tBLVphLXpdW0EtWmEtejAtOV0qXFwoLztcclxuICAgICAgICBcclxuICAgICAgICBsZXQgc3RhcnQ6IFJlZ0V4cE1hdGNoQXJyYXkgPSBudWxsO1xyXG5cclxuICAgICAgICB3aGlsZSgoc3RhcnQgPSBpbnB1dC5tYXRjaChwYXR0ZXJuKSkgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gdGhpcy5HZXRJbm5lcihpbnB1dC5zdWJzdHIoc3RhcnQuaW5kZXgpKS5tYXAocCA9PiBwICsgc3RhcnQuaW5kZXgpO1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gaW5wdXQuc3Vic3RyaW5nKHN0YXJ0LmluZGV4LCByYW5nZVswXSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBhcmdzID0gW107XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gW107XHJcbiAgICBcclxuICAgICAgICAgICAgbGV0IGxhc3QgPSByYW5nZVswXSArIDE7XHJcbiAgICAgICAgICAgIGxldCBicmFja2V0cyA9IDA7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBmb3IobGV0IGkgPSByYW5nZVswXSArIDE7IGkgPD0gcmFuZ2VbMV07IGkrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYyA9IGlucHV0W2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmKGMgPT0gXCIoXCIpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJhY2tldHMrKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYoKGMgPT0gXCIpXCIgJiYgLS1icmFja2V0cyA9PSAtMSkgfHwgKGMgPT0gXCIsXCIgJiYgYnJhY2tldHMgPT0gMCkpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJncy5wdXNoKGlucHV0LnN1YnN0cmluZyhsYXN0LCBpKS50cmltKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxhc3QgPSBpICsgMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVzb2x2ZSBhcmd1bWVudHNcclxuICAgICAgICAgICAgYXJncy5mb3JFYWNoKGFyZyA9PiByZXNvbHZlZC5wdXNoKHRoaXMuU29sdmUoYXJnKSkpO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IHJlc3VsdFxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBwYXJzZUZsb2F0KHRoaXMuQ29udGV4dFtuYW1lXS5hcHBseSh0aGlzLkNvbnRleHQsIHJlc29sdmVkKSk7XHJcblxyXG4gICAgICAgICAgICBpZihyZXN1bHQgPT0gTmFOKSB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgYSBudW1iZXIhXCIpO1xyXG5cclxuICAgICAgICAgICAgLy8gUmVwbGFjZSBmdW5jdGlvbiB3aXRoIHRoZSByZXN1bHRcclxuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5zdWJzdHJpbmcoMCwgc3RhcnQuaW5kZXgpICsgcmVzdWx0ICsgaW5wdXQuc3Vic3RyaW5nKHJhbmdlWzFdICsgMSwgaW5wdXQubGVuZ3RoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBpbnB1dDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlc29sdmUgdmFyaWFibGVzIGluIGEgc3RyaW5nLlxyXG4gICAgICogQHBhcmFtIGlucHV0IFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIFJlc29sdmVWYXJpYWJsZXMoaW5wdXQ6IHN0cmluZyk6IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IHBhdHRlcm4gPSAvW0EtWmEtel1bQS1aYS16MC05XSovO1xyXG5cclxuICAgICAgICBsZXQgc3RhcnQ6IFJlZ0V4cE1hdGNoQXJyYXkgPSBudWxsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHdoaWxlKChzdGFydCA9IGlucHV0Lm1hdGNoKHBhdHRlcm4pKSAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcGFyc2VGbG9hdCh0aGlzLkNvbnRleHRbc3RhcnRbMF1dKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmKHJlc3VsdCA9PSBOYU4pIHRocm93IG5ldyBFcnJvcihcIk5vdCBhIG51bWJlciFcIik7XHJcblxyXG4gICAgICAgICAgICBpbnB1dCA9IGlucHV0LnN1YnN0cmluZygwLCBzdGFydC5pbmRleCkgKyByZXN1bHQgKyBpbnB1dC5zdWJzdHJpbmcoc3RhcnQuaW5kZXggKyBzdGFydFswXS5sZW5ndGgsIGlucHV0Lmxlbmd0aCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaW5wdXQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXNvbHZlIGZ1bmN0aW9ucyBhbmQgdmFyaWFibGVzIHRoZW4gY2FsY3VsYXRlIHRoZSBtYXRoIHByb2JsZW0uXHJcbiAgICAgKiBAcGFyYW0gaW5wdXRcclxuICAgICAqIEBwYXJhbSBjb250ZXh0IEphdmFTY3JpcHQgT2JqZWN0LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgU29sdmUoaW5wdXQ6IHN0cmluZyk6IG51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLkNhbGN1bGF0ZSh0aGlzLlJlc29sdmVWYXJpYWJsZXModGhpcy5SZXNvbHZlRnVuY3Rpb25zKGlucHV0KSkpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgQWRhcHRlciB9IGZyb20gJy4vQWRhcHRlcic7XHJcbmltcG9ydCB7IFByb2Nlc3NvciB9IGZyb20gJy4vUHJvY2Vzc29yJztcclxuaW1wb3J0IHsgSVJvYm90IH0gZnJvbSAnLi8uLi9FbGVtZW50L1JvYm90L0lSb2JvdCc7XHJcbmltcG9ydCB7IFBhcnNlciB9IGZyb20gJy4vUGFyc2VyJztcclxuaW1wb3J0IHsgVXRpbHMgfSBmcm9tICcuLi9VdGlscyc7XHJcblxyXG5leHBvcnQgY2xhc3MgUnVubmVyXHJcbntcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgc3BlZWQ6IG51bWJlciA9IDMwMDtcclxuXHJcbiAgICAvLyBTZXQgYXQgZXZlcnkgcGFyc2VcclxuICAgIHByaXZhdGUgY291bnRlcjogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBpbnRlcnZhbDtcclxuXHJcbiAgICAvLyBTZXQgaW4gY29uc3RydWN0b3JcclxuICAgIHByaXZhdGUgYWRhcHRlcjogQWRhcHRlcjtcclxuICAgIHByaXZhdGUgcHJvY2Vzc29yOiBQcm9jZXNzb3I7XHJcbiAgICBwcml2YXRlIHBhcnNlcjogUGFyc2VyO1xyXG5cclxuICAgIHB1YmxpYyBjb25zdHJ1Y3Rvcihyb2JvdDogSVJvYm90KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuYWRhcHRlciA9IG5ldyBBZGFwdGVyKHJvYm90KTtcclxuICAgICAgICB0aGlzLnByb2Nlc3NvciA9IG5ldyBQcm9jZXNzb3I7XHJcbiAgICAgICAgdGhpcy5wYXJzZXIgPSBuZXcgUGFyc2VyO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3RhcnQgdGhlIGV4ZWN1dGlvblxyXG4gICAgICogQHBhcmFtIGNvZGVcclxuICAgICAqL1xyXG4gICAgcHVibGljIFJ1bihjb2RlOiBzdHJpbmcpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5TdG9wKCk7XHJcbiAgICAgICAgdGhpcy5wYXJzZXIuUGFyc2UoY29kZSk7XHJcblxyXG4gICAgICAgIHRoaXMucHJvY2Vzc29yLkNvbnRleHQgPSB7XHJcbiAgICAgICAgICAgIG1vdmU6IHRoaXMuYWRhcHRlci5tb3ZlLmJpbmQodGhpcy5hZGFwdGVyKSxcclxuICAgICAgICAgICAgdGVzdDogdGhpcy5hZGFwdGVyLnRlc3QuYmluZCh0aGlzLmFkYXB0ZXIpLFxyXG4gICAgICAgICAgICBhdHRhY2s6IHRoaXMuYWRhcHRlci5hdHRhY2suYmluZCh0aGlzLmFkYXB0ZXIpXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5jb3VudGVyID0gMDtcclxuICAgICAgICB0aGlzLmludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4gdGhpcy5FeGVjdXRlTGluZSgpLCB0aGlzLnNwZWVkKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFN0b3AgdGhlIGV4ZWN1dGlvbi5cclxuICAgICAqL1xyXG4gICAgcHVibGljIFN0b3AoKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuaW50ZXJ2YWwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEV4ZWN1dGUgdGhlIG5leHQgbGluZVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIEV4ZWN1dGVMaW5lKCk6IHZvaWRcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLmNvdW50ZXIgPCAwICYmIHRoaXMuY291bnRlciA+PSB0aGlzLnBhcnNlci5Db2RlLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuU3RvcCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbGluZSA9IHRoaXMucGFyc2VyLkNvZGVbdGhpcy5jb3VudGVyKytdO1xyXG5cclxuICAgICAgICB0aGlzLk9uTGluZShsaW5lLmpvaW4oXCIgXCIpLCB0aGlzLmNvdW50ZXIgLSAxKTtcclxuXHJcbiAgICAgICAgdHJ5XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzd2l0Y2gobGluZVswXSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcIkxBQkVMXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiR09UT1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuRXhlY3V0ZUdvdG8obGluZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiQ0FMTFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuRXhlY3V0ZUNhbGwobGluZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiU0VUXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5FeGVjdXRlU2V0KGxpbmUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoKGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLlN0b3AoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeGVjdXRlIGEgR09UTyBjb21tYW5kLlxyXG4gICAgICogQHBhcmFtIHBhcmFtZXRlcnMgXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgRXhlY3V0ZUdvdG8ocGFyYW1ldGVyczogc3RyaW5nW10pOiB2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3Qgc2V0ID0gKCkgPT4gdGhpcy5jb3VudGVyID0gdGhpcy5wYXJzZXIuTGFiZWxzLmhhc093blByb3BlcnR5KHBhcmFtZXRlcnNbMV0pID8gdGhpcy5wYXJzZXIuTGFiZWxzW3BhcmFtZXRlcnNbMV1dIDogLTE7XHJcblxyXG4gICAgICAgIGlmKHBhcmFtZXRlcnMubGVuZ3RoID09IDIpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzZXQoKTtcclxuICAgICAgICAgICAgdGhpcy5FeGVjdXRlTGluZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKHBhcmFtZXRlcnMubGVuZ3RoID49IDQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgY29uZGl0aW9uID0gcGFyYW1ldGVycy5zbGljZSgzKS5qb2luKFwiIFwiKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmKHRoaXMucHJvY2Vzc29yLlNvbHZlKGNvbmRpdGlvbikgPT0gMSkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNldCgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5FeGVjdXRlTGluZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgR09UT1wiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeGVjdXRlIGEgQ0FMTCBjb21tYW5kLlxyXG4gICAgICogQHBhcmFtIHBhcmFtZXRlcnMgXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgRXhlY3V0ZUNhbGwocGFyYW1ldGVyczogc3RyaW5nW10pOiB2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYocGFyYW1ldGVycy5sZW5ndGggPCAyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBDQUxMXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBsZXQgY2FsbCA9IHBhcmFtZXRlcnMuc2xpY2UoMSkuam9pbihcIiBcIik7XHJcblxyXG4gICAgICAgIHRoaXMucHJvY2Vzc29yLlNvbHZlKGNhbGwpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXhlY3V0ZSBhIFNFVCBjb21tYW5kLlxyXG4gICAgICogQHBhcmFtIHBhcmFtZXRlcnMgXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgRXhlY3V0ZVNldChwYXJhbWV0ZXJzOiBzdHJpbmdbXSk6IHZvaWRcclxuICAgIHtcclxuICAgICAgICBpZihwYXJhbWV0ZXJzLmxlbmd0aCA8IDMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIFNFVFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBjYWxsID0gcGFyYW1ldGVycy5zbGljZSgyKS5qb2luKFwiIFwiKTtcclxuXHJcbiAgICAgICAgdGhpcy5wcm9jZXNzb3IuQ29udGV4dFtwYXJhbWV0ZXJzWzFdXSA9IHRoaXMucHJvY2Vzc29yLlNvbHZlKGNhbGwpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSBsaW5lIGNvdW50ZXIgdmFsdWUuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBHZXRDb3VudGVyKCk6IG51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvdW50ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeGVjdXRlZCB3aGVuIHRoZSBuZXh0IGxpbmUgaXMgY2FsbGVkLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgT25MaW5lOiAobGluZTogc3RyaW5nLCBjb3VudDogbnVtYmVyKSA9PiB2b2lkID0gVXRpbHMuTm9vcDtcclxufSIsImltcG9ydCB7IElDZWxsIH0gZnJvbSBcIi4vRWxlbWVudC9DZWxsL0lDZWxsXCI7XHJcbmltcG9ydCB7IEdyb3VuZENlbGwgfSBmcm9tIFwiLi9FbGVtZW50L0NlbGwvR3JvdW5kQ2VsbFwiO1xyXG5pbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuL0Nvb3JkXCI7XHJcbmltcG9ydCB7IElSb2JvdCB9IGZyb20gXCIuL0VsZW1lbnQvUm9ib3QvSVJvYm90XCI7XHJcbmltcG9ydCB7IElFbGVtZW50IH0gZnJvbSBcIi4vRWxlbWVudC9JRWxlbWVudFwiO1xyXG5pbXBvcnQgeyBVdGlscyB9IGZyb20gXCIuL1V0aWxzXCI7XHJcbmltcG9ydCB7IENlbGxGYWN0b3J5IH0gZnJvbSBcIi4vRWxlbWVudC9DZWxsL0NlbGxGYWN0b3J5XCI7XHJcbmltcG9ydCB7IENlbGxUeXBlIH0gZnJvbSBcIi4vRWxlbWVudC9DZWxsL0NlbGxUeXBlXCI7XHJcbmltcG9ydCB7IEJhc2ljUm9ib3QgfSBmcm9tIFwiLi9FbGVtZW50L1JvYm90L0Jhc2ljUm9ib3RcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBNYXBcclxue1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSByb2JvdENvdW50OiBudW1iZXIgPSAyO1xyXG5cclxuICAgIHByaXZhdGUgcm9ib3RzOiBBcnJheTxJUm9ib3Q+O1xyXG4gICAgcHJpdmF0ZSBjZWxsczogQXJyYXk8SUNlbGw+O1xyXG5cclxuICAgIHByaXZhdGUgc2l6ZTogbnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2luZ2xldG9uIGluc3RhbmNlIG9mIHRoZSBjbGFzcy5cclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6IE1hcDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgc2luZ2xldG9uIGluc3RhbmNlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIEdldEluc3RhbmNlKCk6IE1hcFxyXG4gICAge1xyXG4gICAgICAgIGlmKE1hcC5pbnN0YW5jZSA9PSB1bmRlZmluZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gTWFwLmluc3RhbmNlID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIE1hcC5pbnN0YW5jZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnN0cnVjdCBhIHNpbXBsZSBuZXcgbWFwLiBcclxuICAgICAqIEBwYXJhbSBzaXplIFNpemUgb2YgdGhlIG1hcC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIEluaXQoc2l6ZTogbnVtYmVyKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc2l6ZSA9IHNpemU7XHJcbiAgICAgICAgdGhpcy5yb2JvdHMgPSBbXTtcclxuICAgICAgICB0aGlzLmNlbGxzID0gW107XHJcblxyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBzaXplICogc2l6ZTsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHggPSBpICUgc2l6ZTtcclxuICAgICAgICAgICAgbGV0IHkgPSBNYXRoLmZsb29yKGkgLyBzaXplKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2VsbHNbaV0gPSBuZXcgR3JvdW5kQ2VsbChuZXcgQ29vcmQoeCwgeSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5yb2JvdHMucHVzaChuZXcgQmFzaWNSb2JvdChuZXcgQ29vcmQoVXRpbHMuUmFuZG9tKDAsIHNpemUgLSAxKSwgMCkpKTtcclxuICAgICAgICB0aGlzLnJvYm90cy5wdXNoKG5ldyBCYXNpY1JvYm90KG5ldyBDb29yZChVdGlscy5SYW5kb20oMCwgc2l6ZSAtIDEpLCBzaXplIC0gMSkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5PblVwZGF0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTG9hZCBhIG1hcCBmcm9tIGFuIGV4dGVybmFsIGZpbGUuIFRoZSBKU09OIG5lZWRzIHRvIGNvbnRhaW4gYW4gYXJyYXkgb2YgbnVtYmVycy5cclxuICAgICAqIFRoZSBmaXJzdCBudW1iZXIgd2lsbCBkZXRlcm1pbmF0ZSB0aGUgc2l6ZSBvZiB0aGUgbWFwLCB3aGlsZSB0aGUgb3RoZXJzIHdpbGxcclxuICAgICAqIHRlbGwgdGhlIGludGVycHJldGVyIHR5cGUgb2YgdGhlIGNlbGwgYmFzZWQgb24gdGhlIENlbGxUeXBlIGVudW0uXHJcbiAgICAgKiBAcGFyYW0gdXJsIFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgYXN5bmMgTG9hZCh1cmw6IHN0cmluZyk6IFByb21pc2U8dm9pZD5cclxuICAgIHtcclxuICAgICAgICB2YXIgcmF3OiBBcnJheTxudW1iZXI+O1xyXG5cclxuICAgICAgICB0cnlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJhdyA9IEpTT04ucGFyc2UoYXdhaXQgVXRpbHMuR2V0KHVybCkpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgaXQgaXMgYSB2YWxpZCBtYXAgYXJyYXlcclxuICAgICAgICAgICAgaWYocmF3ID09IG51bGwgJiYgcmF3Lmxlbmd0aCA8IDIgJiYgcmF3Lmxlbmd0aCAhPSBNYXRoLnBvdyhyYXdbMF0sIDIpICsgMSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoKGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmNlbGxzID0gW107XHJcbiAgICAgICAgdGhpcy5yb2JvdHMgPSBbXTtcclxuICAgICAgICB0aGlzLnNpemUgPSByYXcuc2hpZnQoKTsgLy8gRmlyc3QgZWxlbWVudCBpcyB0aGUgc2l6ZVxyXG5cclxuICAgICAgICB2YXIgcm9ib3RTcG90cyA9IG5ldyBBcnJheTxDb29yZD4oKTtcclxuICAgICAgICB2YXIgcm9ib3RDb3VudCA9IDA7XHJcblxyXG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCByYXcubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgeCA9IGkgJSB0aGlzLnNpemU7XHJcbiAgICAgICAgICAgIGxldCB5ID0gTWF0aC5mbG9vcihpIC8gdGhpcy5zaXplKTtcclxuXHJcbiAgICAgICAgICAgIGxldCB0eXBlOiBDZWxsVHlwZSA9IHJhd1tpXTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBjZWxsIGJhc2VkIG9uIHRoZSBDZWxsVHlwZVxyXG4gICAgICAgICAgICB0aGlzLmNlbGxzW2ldID0gQ2VsbEZhY3RvcnkuRnJvbVR5cGUodHlwZSwgbmV3IENvb3JkKHgsIHkpKTtcclxuXHJcbiAgICAgICAgICAgIC8vIElmIHRoZSBjZWxsIGlzIGdyb3VuZCBhbmQgdGhlcmUgaXMgMCBvciAxIHJvYm90LCB0cnkgdG8gYWRkIG9uZVxyXG4gICAgICAgICAgICBpZihyb2JvdENvdW50IDwgdGhpcy5yb2JvdENvdW50ICYmIHR5cGUgPT0gQ2VsbFR5cGUuR3JvdW5kKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvLyBHaXZlIHRoZSBjZWxsIDUlIGNoYW5jZVxyXG4gICAgICAgICAgICAgICAgaWYoVXRpbHMuUmFuZG9tKDAsIDIwKSA9PSAxKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEFkZCBhIG5ldyByb2JvdCBhbmQgaW5jcmVtZW50IHJvYm90IGNvdW50XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yb2JvdHMucHVzaChuZXcgQmFzaWNSb2JvdChuZXcgQ29vcmQoeCwgeSkpKTtcclxuICAgICAgICAgICAgICAgICAgICByb2JvdENvdW50Kys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGNlbGwgbG9zdCwgc2F2ZSBpdCBmb3IgbGF0ZXJcclxuICAgICAgICAgICAgICAgICAgICByb2JvdFNwb3RzLnB1c2gobmV3IENvb3JkKHgsIHkpKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiB0aGUgbWFwIGlzIGxvYWRlZCwgYnV0IHRvbyBmZXcgcm9ib3RzIHdlcmUgYWRkZWQsIGFkZCBuZXcgb25lc1xyXG4gICAgICAgIC8vIGJhc2VkIG9uIHRoZSBbc2F2ZSBpZiBmb3IgbGF0ZXJdIHNwb3RzXHJcbiAgICAgICAgZm9yKDsgcm9ib3RTcG90cy5sZW5ndGggPiAwICYmIHJvYm90Q291bnQgPCB0aGlzLnJvYm90Q291bnQ7IHJvYm90Q291bnQrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBjb29yZCA9IHJvYm90U3BvdHMuc3BsaWNlKFV0aWxzLlJhbmRvbSgwLCByb2JvdFNwb3RzLmxlbmd0aCAtIDEpLCAxKVswXTtcclxuICAgICAgICAgICAgbGV0IHJvYm90ID0gbmV3IEJhc2ljUm9ib3QoY29vcmQpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5yb2JvdHMucHVzaChyb2JvdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLk9uVXBkYXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgYW4gZWxlbWVudCBmcm9tIHRoZSBnaXZlbiBhcnJheSBieSBjb29yZC5cclxuICAgICAqIEBwYXJhbSBmb3JtXHJcbiAgICAgKiBAcGFyYW0gY29vcmRcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBHZXRFbGVtZW50KGZvcm06IElFbGVtZW50W10sIGNvb3JkOiBDb29yZCk6IElFbGVtZW50XHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJlc3VsdDogSUVsZW1lbnQgPSBudWxsO1xyXG5cclxuICAgICAgICBmb3JtLnNvbWUoZSA9PiBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKGUuR2V0UG9zaXRpb24oKS5Jcyhjb29yZCkpIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBlO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgYSBjZWxsIGJ5IGNvb3JkLlxyXG4gICAgICogQHBhcmFtIGNvb3JkIFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgR2V0Q2VsbChjb29yZDogQ29vcmQpOiBJQ2VsbFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiA8SUNlbGw+dGhpcy5HZXRFbGVtZW50KHRoaXMuY2VsbHMsIGNvb3JkKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBhIHJvYm90IGJ5IGNvb3JkLlxyXG4gICAgICogQHBhcmFtIGNvb3JkIFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgR2V0Um9ib3QoY29vcmQ6IENvb3JkKTogSVJvYm90XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIDxJUm9ib3Q+dGhpcy5HZXRFbGVtZW50KHRoaXMucm9ib3RzLCBjb29yZCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmUgYSByb2JvdCBmcm9tIHRoZSBsaXN0LlxyXG4gICAgICogQHBhcmFtIHJvYm90IFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgUmVtb3ZlUm9ib3Qocm9ib3Q6IElSb2JvdClcclxuICAgIHtcclxuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnJvYm90cy5pbmRleE9mKHJvYm90KTtcclxuXHJcbiAgICAgICAgaWYoaW5kZXggPj0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMucm9ib3RzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSBzaXplIG9mIHRoZSBtYXAuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBHZXRTaXplKCk6IG51bWJlclxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNpemU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIGNlbGxzIG9mIHRoZSBtYXAuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBHZXRDZWxscygpOiBBcnJheTxJQ2VsbD5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jZWxscztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgcm9ib3RzIG9mIHRoZSBtYXAuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBHZXRSb2JvdHMoKTogQXJyYXk8SVJvYm90PlxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJvYm90cztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiBlbGVtZW50cyBvZiB0aGUgbWFwIChyb2JvdHMgYW5kIGNlbGxzKS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldEVsZW1lbnRzKCk6IEFycmF5PElFbGVtZW50PlxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAoPElFbGVtZW50W10+dGhpcy5jZWxscykuY29uY2F0KDxJRWxlbWVudFtdPnRoaXMucm9ib3RzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGxlZCB3aGVuIHRoZSBtYXAgd2FzIHVwZGF0ZWQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBPblVwZGF0ZTogKCkgPT4gdm9pZCA9IFV0aWxzLk5vb3A7XHJcbn0iLCJleHBvcnQgY2xhc3MgVXRpbHNcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYW4gYXN5bmMgcmVxdWVzdC5cclxuICAgICAqIEBwYXJhbSB1cmwgXHJcbiAgICAgKiBAcGFyYW0gZGF0YSBcclxuICAgICAqIEBwYXJhbSBtZXRob2QgXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgc3RhdGljIGFzeW5jIEFqYXgodXJsOiBzdHJpbmcsIGRhdGE6IHN0cmluZywgbWV0aG9kOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8c3RyaW5nPihyZXNvbHZlID0+IFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHJcbiAgICAgICAgICAgIHJlcXVlc3Qub3BlbihtZXRob2QsIHVybCwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZihyZXF1ZXN0LnJlYWR5U3RhdGUgIT0gNClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHJlcXVlc3Quc3RhdHVzID09IDIwMCkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBpZihkYXRhICE9IG51bGwgJiYgZGF0YS5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdC5zZW5kKGRhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdC5zZW5kKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFBvc3QgcmVxdWVzdCB3aXRoIEpTT04gZGF0YS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBQb3N0KHVybDogc3RyaW5nLCBkYXRhOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gYXdhaXQgVXRpbHMuQWpheCh1cmwsIGRhdGEsIFwiUE9TVFwiKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCByZXF1ZXN0IHRvIHRoZSBnaXZlbiBVUkwuXHJcbiAgICAgKiBAcGFyYW0gdXJsIFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGFzeW5jIEdldCh1cmw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPlxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBhd2FpdCBVdGlscy5BamF4KHVybCwgbnVsbCwgXCJHRVRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGEgcmFuZG9tIGludGVnZXIgYmV0d2VlbiBtaW4gKGluY2x1ZGVkKSBhbmQgbWF4IChpbmNsdWRlZCkuXHJcbiAgICAgKiBAcGFyYW0gbWluIFxyXG4gICAgICogQHBhcmFtIG1heCBcclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBSYW5kb20obWluOiBudW1iZXIsIG1heDogbnVtYmVyKTogbnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSArIG1pbik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb3B5IHByb3BlcnRpZXMgZnJvbSBvbmUgb2JqZWN0IHRvIGFub3RoZXIuXHJcbiAgICAgKiBAcGFyYW0gdG8gXHJcbiAgICAgKiBAcGFyYW0gZnJvbSBcclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBFeHRyYWN0KHRvOiBPYmplY3QsIGZyb206IE9iamVjdCkgXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIGZyb20pIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYodG8uaGFzT3duUHJvcGVydHkoa2V5KSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdG9ba2V5XSA9IGZyb21ba2V5XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEEgbm9vcCBmdW5jdGlvbi5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBOb29wKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBJUm9ib3QgfSBmcm9tICcuL0VsZW1lbnQvUm9ib3QvSVJvYm90JztcclxuaW1wb3J0IHsgUHJvY2Vzc29yIH0gZnJvbSAnLi9JbnRlcnByZXRlci9Qcm9jZXNzb3InO1xyXG5pbXBvcnQgeyBSdW5uZXIgfSBmcm9tICcuL0ludGVycHJldGVyL1J1bm5lcic7XHJcbmltcG9ydCB7IE1hcCB9IGZyb20gXCIuL01hcFwiO1xyXG5pbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuL0Nvb3JkXCI7XHJcbmltcG9ydCB7IElFbGVtZW50IH0gZnJvbSBcIi4vRWxlbWVudC9JRWxlbWVudFwiO1xyXG5pbXBvcnQgeyBVdGlscyB9IGZyb20gXCIuL1V0aWxzXCI7XHJcblxyXG5VdGlscy5FeHRyYWN0KHdpbmRvdywgeyBDb29yZCwgTWFwLCBVdGlscywgUHJvY2Vzc29yLCBSdW5uZXIgfSk7XHJcblxyXG5jb25zdCBjYW52YXMgPSA8SFRNTENhbnZhc0VsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNcIik7XHJcbmNvbnN0IGNvbnRleHQgPSA8Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEPmNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG5jb25zdCBjb2RlVGV4dGFyZWEgPSA8SFRNTFRleHRBcmVhRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvZGVcIik7XHJcbmNvbnN0IHB1c2hCdXR0b24gPSA8SFRNTEJ1dHRvbkVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwdXNoXCIpO1xyXG5jb25zdCBzdG9wQnV0dG9uID0gPEhUTUxCdXR0b25FbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RvcFwiKTtcclxuY29uc3QgbGluZUlucHV0ID0gPEhUTUxCdXR0b25FbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGluZVwiKTtcclxuXHJcbmxldCBtYXA6IE1hcCA9IE1hcC5HZXRJbnN0YW5jZSgpO1xyXG5sZXQgcnVubmVyOiBSdW5uZXIgPSBudWxsO1xyXG5cclxuY29uc3QgbGFzdDogQXJyYXk8Q29vcmQ+ID0gW107XHJcblxyXG5sZXQgcGxheWVyOiBJUm9ib3QgPSBudWxsO1xyXG5sZXQgZW5lbXk6IElSb2JvdCA9IG51bGw7XHJcblxyXG5jb25zdCBzaXplOiBudW1iZXIgPSAzMDtcclxuXHJcbi8qKlxyXG4gKiBEcmF3IHRoZSBnaXZlbiBlbGVtZW50IG9udG8gdGhlIGNhbnZhcy5cclxuICogQHBhcmFtIGVcclxuICogQHBhcmFtIGNhbGxiYWNrXHJcbiAqL1xyXG5jb25zdCBkcmF3ID0gKGU6IElFbGVtZW50LCBsb2FkZWQ6ICgpID0+IHZvaWQpID0+XHJcbntcclxuICAgIGxldCBjb29yZCA9IGUuR2V0UG9zaXRpb24oKTtcclxuICAgIGxldCB4ID0gY29vcmQuWDtcclxuICAgIGxldCB5ID0gY29vcmQuWTtcclxuXHJcbiAgICBsZXQgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuICAgIFxyXG4gICAgaW1hZ2Uub25sb2FkID0gKCkgPT4gXHJcbiAgICB7XHJcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaW1hZ2UsIHggKiBzaXplLCB5ICogc2l6ZSwgc2l6ZSwgc2l6ZSk7XHJcbiAgICAgICAgbG9hZGVkKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGltYWdlLnNyYyA9IGUuR2V0VGV4dHVyZSgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFVwZGF0ZSB0aGUgY2FudmFzLlxyXG4gKi9cclxuY29uc3QgdXBkYXRlID0gKCkgPT4gXHJcbntcclxuICAgIGlmKCFydW5uZXIpIFxyXG4gICAge1xyXG4gICAgICAgIHBsYXllciA9IG1hcC5HZXRSb2JvdHMoKVswXTtcclxuICAgICAgICBlbmVteSA9IG1hcC5HZXRSb2JvdHMoKVsxXTtcclxuXHJcbiAgICAgICAgcnVubmVyID0gbmV3IFJ1bm5lcihwbGF5ZXIpO1xyXG5cclxuICAgICAgICBydW5uZXIuT25MaW5lID0gKGxpbmUsIGNvdW50KSA9PiBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxpbmVJbnB1dC52YWx1ZSA9IGAke2NvdW50fTogJHtsaW5lfWA7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY2FudmFzLndpZHRoID0gc2l6ZSAqIG1hcC5HZXRTaXplKCk7XHJcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IHNpemUgKiBtYXAuR2V0U2l6ZSgpO1xyXG4gICAgICAgIGNhbnZhcy5vbmNsaWNrID0gZSA9PiB1cGRhdGUoKTtcclxuICAgICAgICBcclxuICAgICAgICBsZXQgaSA9IDA7XHJcblxyXG4gICAgICAgIC8vIERyYXcgY2VsbHMgZmlyc3RcclxuICAgICAgICBtYXAuR2V0Q2VsbHMoKS5mb3JFYWNoKGNlbGwgPT4gXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkcmF3KGNlbGwsICgpID0+IFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvLyBXaGVuIHRoZSBsYXN0IHdhcyBkcmF3biwgc3RhcnQgZHJhd2luZyB0aGUgcm9ib3RzXHJcbiAgICAgICAgICAgICAgICBpZigrK2kgPT0gbWFwLkdldFNpemUoKSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBtYXAuR2V0Um9ib3RzKCkuZm9yRWFjaChyb2JvdCA9PiBcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3QucHVzaChyb2JvdC5HZXRQb3NpdGlvbigpLkNsb25lKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkcmF3KHJvYm90LCBVdGlscy5Ob29wKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgZWxzZVxyXG4gICAge1xyXG4gICAgICAgIGxldCBpID0gMDtcclxuXHJcbiAgICAgICAgLy8gT25seSBkcmF3IGNlbGxzIHdoZXJlIHRoZSByb2JvdHMgd2VyZVxyXG4gICAgICAgIGxhc3QuZm9yRWFjaChjID0+IFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZHJhdyhtYXAuR2V0Q2VsbChjKSwgVXRpbHMuTm9vcCk7XHJcblxyXG4gICAgICAgICAgICBpZigrK2kgPT0gbGFzdC5sZW5ndGgpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vIENsZWFyIHRoZSBhcnJheVxyXG4gICAgICAgICAgICAgICAgbGFzdC5sZW5ndGggPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFJlZHJhdyByb2JvdHNcclxuICAgICAgICAgICAgICAgIG1hcC5HZXRSb2JvdHMoKS5mb3JFYWNoKHJvYm90ID0+IFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhc3QucHVzaChyb2JvdC5HZXRQb3NpdGlvbigpLkNsb25lKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRyYXcocm9ib3QsIFV0aWxzLk5vb3ApO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZighcGxheWVyLklzQWxpdmUoKSB8fCAhZW5lbXkuSXNBbGl2ZSgpKVxyXG4gICAge1xyXG4gICAgICAgIGFsZXJ0KHBsYXllci5Jc0FsaXZlKCkgPyBcIllvdSB3b24hXCIgOiBcIllvdSBsb3NlIVwiKTtcclxuXHJcbiAgICAgICAgc3RvcEJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICAgICAgcHVzaEJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIHJ1bm5lci5TdG9wKCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5wdXNoQnV0dG9uLm9uY2xpY2sgPSBlID0+IHJ1bm5lci5SdW4oY29kZVRleHRhcmVhLnZhbHVlKTtcclxuc3RvcEJ1dHRvbi5vbmNsaWNrID0gZSA9PiBydW5uZXIuU3RvcCgpO1xyXG5cclxuVXRpbHMuR2V0KFwicmVzL2V4YW1wbGUudHh0XCIpLnRoZW4ocmVzdWx0ID0+IGNvZGVUZXh0YXJlYS52YWx1ZSA9IHJlc3VsdCk7XHJcbm1hcC5Mb2FkKFwicmVzL21hcC5qc29uXCIpO1xyXG5cclxubWFwLk9uVXBkYXRlID0gdXBkYXRlOyJdfQ==
