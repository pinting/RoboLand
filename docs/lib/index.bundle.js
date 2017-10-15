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
        }
        else if (parameters.length >= 4) {
            let condition = parameters.slice(3).join(" ");
            if (this.processor.Solve(condition) != 0)
                set();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd3d3L2xpYi9Db29yZC50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvQ2VsbC9DZWxsRmFjdG9yeS50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvQ2VsbC9DZWxsVHlwZS50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvQ2VsbC9Hcm91bmRDZWxsLnRzIiwic3JjL3d3dy9saWIvRWxlbWVudC9DZWxsL1dhdGVyQ2VsbC50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvTW92ZVR5cGUudHMiLCJzcmMvd3d3L2xpYi9FbGVtZW50L1JvYm90L0Jhc2ljUm9ib3QudHMiLCJzcmMvd3d3L2xpYi9JbnRlcnByZXRlci9BZGFwdGVyLnRzIiwic3JjL3d3dy9saWIvSW50ZXJwcmV0ZXIvUGFyc2VyLnRzIiwic3JjL3d3dy9saWIvSW50ZXJwcmV0ZXIvUHJvY2Vzc29yLnRzIiwic3JjL3d3dy9saWIvSW50ZXJwcmV0ZXIvUnVubmVyLnRzIiwic3JjL3d3dy9saWIvTWFwLnRzIiwic3JjL3d3dy9saWIvVXRpbHMudHMiLCJzcmMvd3d3L2xpYi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUE7SUFRSSxZQUFZLElBQVksQ0FBQyxFQUFFLElBQVksQ0FBQztRQUVwQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2YsQ0FBQztJQU1NLFdBQVcsQ0FBQyxLQUFZO1FBRTNCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENB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c291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZXhwb3J0IGNsYXNzIENvb3JkXHJcbntcclxuICAgIHB1YmxpYyBYOiBudW1iZXI7XHJcbiAgICBwdWJsaWMgWTogbnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29uc3RydWN0IGEgbmV3IGNvb3JkLlxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIgPSAwLCB5OiBudW1iZXIgPSAwKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuWCA9IHg7XHJcbiAgICAgICAgdGhpcy5ZID0geTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgZGlzdGFuY2UgZnJvbSB0aGUgb3RoZXIgY29vcmQuXHJcbiAgICAgKiBAcGFyYW0gb3RoZXIgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBHZXREaXN0YW5jZShvdGhlcjogQ29vcmQpOiBudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHRoaXMuWCAtIG90aGVyLlgsIDIpICsgTWF0aC5wb3codGhpcy5ZIC0gb3RoZXIuWSwgMikpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2sgaWYgdGhlIGNvb3JkIGlzIHRoZSBzYW1lIGFzIGFuIG90aGVyLlxyXG4gICAgICogQHBhcmFtIG90aGVyIFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgSXMob3RoZXI6IENvb3JkKTogYm9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLlggPT0gb3RoZXIuWCAmJiB0aGlzLlkgPT0gb3RoZXIuWTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGN1bGF0ZSB0aGUgZGlmZmVyZW5jZSB3aXRoIGFub3RoZXIgY29vcmQuXHJcbiAgICAgKiBAcGFyYW0gb3RoZXIgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBEaWZmZXJlbmNlKG90aGVyOiBDb29yZCk6IENvb3JkXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBDb29yZCh0aGlzLlggKyBvdGhlci5YLCB0aGlzLlkgKyBvdGhlci5ZKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENsb25lIHRoZSBjb29yZC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIENsb25lKCk6IENvb3JkXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBDb29yZCh0aGlzLlgsIHRoaXMuWSk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBJQ2VsbCB9IGZyb20gXCIuL0lDZWxsXCI7XHJcbmltcG9ydCB7IENlbGxUeXBlIH0gZnJvbSBcIi4vQ2VsbFR5cGVcIjtcclxuaW1wb3J0IHsgR3JvdW5kQ2VsbCB9IGZyb20gXCIuL0dyb3VuZENlbGxcIjtcclxuaW1wb3J0IHsgV2F0ZXJDZWxsIH0gZnJvbSBcIi4vV2F0ZXJDZWxsXCI7XHJcbmltcG9ydCB7IENvb3JkIH0gZnJvbSBcIi4uLy4uL0Nvb3JkXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQ2VsbEZhY3Rvcnlcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYSBuZXcgSUNlbGwgYmFzZWQgb24gdGhlIGdpdmVuIENlbGxUeXBlIGVudW0uXHJcbiAgICAgKiBAcGFyYW0gdHlwZVxyXG4gICAgICogQHBhcmFtIHBvc2l0aW9uXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgRnJvbVR5cGUodHlwZTogQ2VsbFR5cGUsIHBvc2l0aW9uOiBDb29yZCk6IElDZWxsXHJcbiAgICB7XHJcbiAgICAgICAgc3dpdGNoKHR5cGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlIENlbGxUeXBlLkdyb3VuZDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgR3JvdW5kQ2VsbChwb3NpdGlvbik7XHJcbiAgICAgICAgICAgIGNhc2UgQ2VsbFR5cGUuV2F0ZXI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFdhdGVyQ2VsbChwb3NpdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiZXhwb3J0IGVudW0gQ2VsbFR5cGVcclxue1xyXG4gICAgR3JvdW5kID0gMCxcclxuICAgIFdhdGVyID0gMVxyXG59IiwiaW1wb3J0IHsgSUNlbGwgfSBmcm9tIFwiLi9JQ2VsbFwiXHJcbmltcG9ydCB7IElSb2JvdCB9IGZyb20gXCIuLi9Sb2JvdC9JUm9ib3RcIjtcclxuaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi4vLi4vQ29vcmRcIjtcclxuaW1wb3J0IHsgTW92ZVR5cGUgfSBmcm9tIFwiLi4vTW92ZVR5cGVcIjtcclxuaW1wb3J0IHsgQ2VsbFR5cGUgfSBmcm9tIFwiLi9DZWxsVHlwZVwiXHJcblxyXG5leHBvcnQgY2xhc3MgR3JvdW5kQ2VsbCBpbXBsZW1lbnRzIElDZWxsXHJcbntcclxuICAgIHByb3RlY3RlZCBwb3NpdGlvbjogQ29vcmQ7XHJcbiAgICBwcm90ZWN0ZWQgcm9ib3Q6IElSb2JvdDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnN0cnVjdCBhIG5ldyBlbXB0eSBjZWxsIC0gZ3JvdW5kLlxyXG4gICAgICogQHBhcmFtIHBvc2l0aW9uIENvb3JkIG9mIHRoZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgY29uc3RydWN0b3IocG9zaXRpb246IENvb3JkKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgdHlwZSBvZiB0aGUgY2VsbC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldFR5cGUoKTogQ2VsbFR5cGVcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gQ2VsbFR5cGUuR3JvdW5kO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSB0ZXh0dXJlIG9mIHRoZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgR2V0VGV4dHVyZSgpOiBzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gXCJyZXMvZ3JvdW5kLnBuZ1wiO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgY2VsbCBwb3NpdGlvbi5cclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldFBvc2l0aW9uKCk6IENvb3JkIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnBvc2l0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW50ZXIgYSBjZWxsIHdpdGggYSByb2JvdC5cclxuICAgICAqIEBwYXJhbSByb2JvdCBcclxuICAgICAqL1xyXG4gICAgcHVibGljIE1vdmVIZXJlKHJvYm90OiBJUm9ib3QpOiBNb3ZlVHlwZSBcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLnJvYm90ICE9IG51bGwpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1vdmVUeXBlLkJsb2NrZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnJvYm90ID0gcm9ib3Q7XHJcblxyXG4gICAgICAgIHJldHVybiBNb3ZlVHlwZS5TdWNjZXNzZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMZWF2ZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgTW92ZUF3YXkoKTogdm9pZCBcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJvYm90ID0gbnVsbDtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEdyb3VuZENlbGwgfSBmcm9tIFwiLi9Hcm91bmRDZWxsXCJcclxuaW1wb3J0IHsgSVJvYm90IH0gZnJvbSBcIi4uL1JvYm90L0lSb2JvdFwiO1xyXG5pbXBvcnQgeyBNb3ZlVHlwZSB9IGZyb20gXCIuLi9Nb3ZlVHlwZVwiO1xyXG5pbXBvcnQgeyBDZWxsVHlwZSB9IGZyb20gXCIuL0NlbGxUeXBlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgV2F0ZXJDZWxsIGV4dGVuZHMgR3JvdW5kQ2VsbFxyXG57XHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgdHlwZSBvZiB0aGUgY2VsbC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldFR5cGUoKTogQ2VsbFR5cGVcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gQ2VsbFR5cGUuV2F0ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIHRleHR1cmUgb2YgdGhlIGNlbGwuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBHZXRUZXh0dXJlKCk6IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBcInJlcy93YXRlci5wbmdcIjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEVudGVyIGEgY2VsbCB3aXRoIGEgcm9ib3QgYW5kIGtpbGwgaXQuXHJcbiAgICAgKiBAcGFyYW0gcm9ib3QgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBNb3ZlSGVyZShyb2JvdDogSVJvYm90KTogTW92ZVR5cGUgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIE1vdmVUeXBlLktpbGxlZDtcclxuICAgIH1cclxufSIsImV4cG9ydCBlbnVtIE1vdmVUeXBlXHJcbntcclxuICAgIFN1Y2Nlc3NlZCxcclxuICAgIEJsb2NrZWQsXHJcbiAgICBLaWxsZWRcclxufSIsImltcG9ydCB7IElSb2JvdCB9IGZyb20gXCIuL0lSb2JvdFwiO1xyXG5pbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuLi8uLi9Db29yZFwiO1xyXG5pbXBvcnQgeyBNYXAgfSBmcm9tIFwiLi4vLi4vTWFwXCI7XHJcbmltcG9ydCB7IE1vdmVUeXBlIH0gZnJvbSBcIi4uL01vdmVUeXBlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQmFzaWNSb2JvdCBpbXBsZW1lbnRzIElSb2JvdFxyXG57XHJcbiAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgbWFwID0gTWFwLkdldEluc3RhbmNlKCk7XHJcblxyXG4gICAgcHJvdGVjdGVkIGhlYWx0aDogbnVtYmVyID0gMS4wO1xyXG4gICAgcHJvdGVjdGVkIGRhbWFnZTogbnVtYmVyID0gMS4wO1xyXG5cclxuICAgIHByaXZhdGUgcG9zaXRpb246IENvb3JkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29uc3RydWN0IGEgbmV3IEJhc2ljUm9ib3QuXHJcbiAgICAgKiBAcGFyYW0gcG9zaXRpb25cclxuICAgICAqL1xyXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHBvc2l0aW9uOiBDb29yZClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb247XHJcblxyXG4gICAgICAgIHZhciBjZWxsID0gTWFwLkdldEluc3RhbmNlKCkuR2V0Q2VsbChwb3NpdGlvbik7XHJcblxyXG4gICAgICAgIGlmKGNlbGwgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNlbGwuTW92ZUhlcmUodGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSBjZWxsIHRleHR1cmUuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBHZXRUZXh0dXJlKCk6IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBcInJlcy9yb2JvdC5wbmdcIjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE1vdmUgcm9ib3QgaW4gYSBkaXJlY3Rpb24uXHJcbiAgICAgKiBAcGFyYW0gZGlyZWN0aW9uXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBNb3ZlKGRpcmVjdGlvbjogQ29vcmQpOiBib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYoTWF0aC5hYnMoTWF0aC5hYnMoZGlyZWN0aW9uLlgpIC0gTWF0aC5hYnMoZGlyZWN0aW9uLlkpKSA9PSAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBPbmx5IGFsbG93IGxlZnQsIHJpZ2h0LCB0b3AgYW5kIGJvdHRvbSBtb3ZlbWVudFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGxhc3RDZWxsID0gdGhpcy5tYXAuR2V0Q2VsbCh0aGlzLnBvc2l0aW9uKTtcclxuICAgICAgICB2YXIgbmV4dENvb3JkID0gdGhpcy5wb3NpdGlvbi5EaWZmZXJlbmNlKGRpcmVjdGlvbik7XHJcbiAgICAgICAgdmFyIG5leHRDZWxsID0gdGhpcy5tYXAuR2V0Q2VsbChuZXh0Q29vcmQpO1xyXG5cclxuICAgICAgICBpZihsYXN0Q2VsbCA9PSBudWxsIHx8IG5leHRDZWxsID09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzd2l0Y2gobmV4dENlbGwuTW92ZUhlcmUodGhpcykpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlIE1vdmVUeXBlLkJsb2NrZWQ6IC8vIERvIG5vdGhpbmdcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgY2FzZSBNb3ZlVHlwZS5LaWxsZWQ6IC8vIE1vdmUgYXdheSBhbmQga2lsbCBpdFxyXG4gICAgICAgICAgICAgICAgbGFzdENlbGwuTW92ZUF3YXkoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXh0Q29vcmQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLktpbGwoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgY2FzZSBNb3ZlVHlwZS5TdWNjZXNzZWQ6IC8vIE1vdmUgYXdheVxyXG4gICAgICAgICAgICAgICAgbGFzdENlbGwuTW92ZUF3YXkoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXh0Q29vcmQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1hcC5PblVwZGF0ZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXR0YWNrIGFuIG90aGVyIHJvYm90IGlmIGl0IGlzIG9uZSBjZWxsIGF3YXkuXHJcbiAgICAgKiBAcGFyYW0gcm9ib3QgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBBdHRhY2socm9ib3Q6IElSb2JvdCk6IGJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLnBvc2l0aW9uLkdldERpc3RhbmNlKHJvYm90LkdldFBvc2l0aW9uKCkpID4gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJvYm90LkRhbWFnZSh0aGlzLmRhbWFnZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIHBvc2l0aW9uIG9mIHRoZSByb2JvdC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldFBvc2l0aW9uKCk6IENvb3JkIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnBvc2l0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRG8gZGFtYWdlIHRvIHRoaXMgcm9ib3QuXHJcbiAgICAgKiBAcGFyYW0gZGFtYWdlIEFtb3VudCBvZiB0aGUgZGFtYWdlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgRGFtYWdlKGRhbWFnZTogbnVtYmVyKTogdm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaGVhbHRoIC09IGRhbWFnZTtcclxuXHJcbiAgICAgICAgaWYodGhpcy5oZWFsdGggPD0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuS2lsbCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEtpbGwgdGhlIHJvYm90LlxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIEtpbGwoKTogdm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaGVhbHRoID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5tYXAuUmVtb3ZlUm9ib3QodGhpcyk7XHJcbiAgICAgICAgdGhpcy5tYXAuT25VcGRhdGUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrIGlmIHRoZSByb2JvdCBpcyBhbGl2ZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIElzQWxpdmUoKTogYm9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmhlYWx0aCA+IDA7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBNYXAgfSBmcm9tICcuLi9NYXAnO1xyXG5pbXBvcnQgeyBJUm9ib3QgfSBmcm9tIFwiLi4vRWxlbWVudC9Sb2JvdC9JUm9ib3RcIjtcclxuaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi4vQ29vcmRcIjtcclxuaW1wb3J0IHsgQ2VsbFR5cGUgfSBmcm9tIFwiLi4vRWxlbWVudC9DZWxsL0NlbGxUeXBlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQWRhcHRlclxyXG57XHJcbiAgICBwcml2YXRlIHJvYm90OiBJUm9ib3Q7XHJcbiAgICBwcml2YXRlIG1hcDogTWFwO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHJvYm90OiBJUm9ib3QpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5yb2JvdCA9IHJvYm90O1xyXG4gICAgICAgIHRoaXMubWFwID0gTWFwLkdldEluc3RhbmNlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNb3ZlIHRvIHRoZSBnaXZlbiBkaXJlY3Rpb24uXHJcbiAgICAgKiBAcGFyYW0gZHhcclxuICAgICAqIEBwYXJhbSBkeVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgbW92ZShkeDogbnVtYmVyLCBkeTogbnVtYmVyKTogbnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm9ib3QuTW92ZShuZXcgQ29vcmQoZHgsIGR5KSkgPyAxIDogMDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRlc3QgaWYgdGhlIGdpdmVuIGRpcmVjdGlvbiBpcyBzYWZlLlxyXG4gICAgICogQHBhcmFtIGR4XHJcbiAgICAgKiBAcGFyYW0gZHkgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyB0ZXN0KGR4OiBudW1iZXIsIGR5OiBudW1iZXIpOiBudW1iZXJcclxuICAgIHtcclxuICAgICAgICB2YXIgY2VsbCA9IHRoaXMubWFwLkdldENlbGwodGhpcy5yb2JvdC5HZXRQb3NpdGlvbigpLkRpZmZlcmVuY2UobmV3IENvb3JkKGR4LCBkeSkpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGNlbGwgIT0gbnVsbCAmJiBjZWxsLkdldFR5cGUoKSA9PSBDZWxsVHlwZS5Hcm91bmQgPyAxIDogMDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyeSB0byBhdHRhY2sgc29tZW9uZSBhcm91bmQgdGhlIHBsYXllci5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGF0dGFjaygpOiBudW1iZXJcclxuICAgIHtcclxuICAgICAgICB2YXIgcmVzdWx0OiBJUm9ib3QgPSBudWxsO1xyXG5cclxuICAgICAgICB0aGlzLm1hcC5HZXRSb2JvdHMoKS5zb21lKHJvYm90ID0+IFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYocm9ib3QuR2V0UG9zaXRpb24oKS5HZXREaXN0YW5jZSh0aGlzLnJvYm90LkdldFBvc2l0aW9uKCkpID09IDEpIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSByb2JvdDtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0ICE9IG51bGwgJiYgdGhpcy5yb2JvdC5BdHRhY2socmVzdWx0KSA/IDEgOiAwO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgSVJvYm90IH0gZnJvbSAnLi8uLi9FbGVtZW50L1JvYm90L0lSb2JvdCc7XHJcbmltcG9ydCB7IEFkYXB0ZXIgfSBmcm9tICcuL0FkYXB0ZXInO1xyXG5pbXBvcnQgeyBQcm9jZXNzb3IgfSBmcm9tICcuL1Byb2Nlc3Nvcic7XHJcblxyXG5leHBvcnQgY2xhc3MgUGFyc2VyXHJcbntcclxuICAgIHB1YmxpYyBDb2RlOiBzdHJpbmdbXVtdO1xyXG4gICAgcHVibGljIExhYmVsczogeyBbaWQ6IHN0cmluZ10gOiBudW1iZXI7IH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQYXJzZSB0aGUgZ2l2ZW4gY29kZS5cclxuICAgICAqIEBwYXJhbSBsaW5lc1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgUGFyc2UobGluZXM6IHN0cmluZyk6IHZvaWRcclxuICAgIHtcclxuICAgICAgICB0aGlzLkNvZGUgPSBbXTtcclxuICAgICAgICB0aGlzLkxhYmVscyA9IHt9O1xyXG5cclxuICAgICAgICBsaW5lcy5zcGxpdChcIlxcblwiKS5mb3JFYWNoKGxpbmUgPT4gdGhpcy5QYXJzZUxpbmUobGluZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUGFyc2UgdGhlIGdpdmVuIGxpbmUuXHJcbiAgICAgKiBAcGFyYW0gbGluZVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIFBhcnNlTGluZShsaW5lOiBzdHJpbmcpOiB2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgLy8gU2tpcCB0aGUgbGluZSBpZiBpdCBpcyBjb21tZW50XHJcbiAgICAgICAgaWYobGluZVswXSA9PSBcIiNcIilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBwYXJhbWV0ZXJzID0gbGluZS5zcGxpdChcIiBcIik7XHJcblxyXG4gICAgICAgIHN3aXRjaChwYXJhbWV0ZXJzWzBdKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSBcIkxBQkVMXCI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLlBhcnNlTGFiZWwocGFyYW1ldGVycyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIkdPVE9cIjpcclxuICAgICAgICAgICAgY2FzZSBcIkNBTExcIjpcclxuICAgICAgICAgICAgY2FzZSBcIlNFVFwiOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5QYXJzZUNvZGUocGFyYW1ldGVycyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQYXJzZSBhIExBQkVMIGNvbW1hbmQuXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1ldGVycyBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBQYXJzZUxhYmVsKHBhcmFtZXRlcnM6IHN0cmluZ1tdKTogdm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmKHBhcmFtZXRlcnMubGVuZ3RoICE9IDIpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBMQUJFTFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuTGFiZWxzW3BhcmFtZXRlcnNbMV1dID0gdGhpcy5Db2RlLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFBhcnNlIGEgR09UTy9DQUxML1NFVCBjb21tYW5kLlxyXG4gICAgICogQHBhcmFtIHBhcmFtZXRlcnMgXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgUGFyc2VDb2RlKHBhcmFtZXRlcnM6IHN0cmluZ1tdKTogdm9pZFxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuQ29kZS5wdXNoKHBhcmFtZXRlcnMpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgSUJsb2NrIH0gZnJvbSAnLi9JQmxvY2snO1xyXG5cclxuZXhwb3J0IGNsYXNzIFByb2Nlc3NvclxyXG57XHJcbiAgICBwdWJsaWMgQ29udGV4dDogT2JqZWN0O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSBwb3NpdGlvbiBvZiB0aGUgbmVhcmVzdCBicmFja2V0IGNsb3N1cmUuXHJcbiAgICAgKiBAcGFyYW0gaW5wdXQgXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgR2V0SW5uZXIoaW5wdXQ6IHN0cmluZyk6IEFycmF5PG51bWJlcj5cclxuICAgIHtcclxuICAgICAgICBpZihpbnB1dC5pbmRleE9mKFwiKFwiKSA8IDApIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBsZXQgc3RhcnQgPSAwO1xyXG4gICAgICAgIGxldCBicmFja2V0cyA9IDA7XHJcblxyXG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBpbnB1dC5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaChpbnB1dFtpXSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcIihcIjpcclxuICAgICAgICAgICAgICAgICAgICBpZihicmFja2V0cysrID09IDApIHN0YXJ0ID0gaTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgXCIpXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoYnJhY2tldHMtLSA9PSAxKSByZXR1cm4gW3N0YXJ0LCBpXTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYSBuZXcgSUJsb2NrIGZyb20gYSBzdHJpbmcgaW5wdXQgKG9yIHJldHVybiB0aGUgaW5wdXQgaXRzZWxmKS5cclxuICAgICAqIEBwYXJhbSBpbnB1dCBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBHZXRCbG9jayhpbnB1dCk6IElCbG9jayB8IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGdldCA9IChpbnB1dDogc3RyaW5nLCBhOiBcIipcIiB8IFwiL1wiIHwgXCIrXCIgfCBcIi1cIiwgYjogXCIqXCIgfCBcIi9cIiB8IFwiK1wiIHwgXCItXCIpOiBJQmxvY2sgfCBzdHJpbmcgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBhcCA9IGlucHV0LmluZGV4T2YoYSk7XHJcbiAgICAgICAgICAgIGxldCBicCA9IGlucHV0LmluZGV4T2YoYik7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmKGFwIDwgMCAmJiBicCA8IDApIHJldHVybiBpbnB1dDtcclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYoYXAgPCAwKSBhcCA9IGlucHV0Lmxlbmd0aDtcclxuICAgICAgICAgICAgaWYoYnAgPCAwKSBicCA9IGlucHV0Lmxlbmd0aDtcclxuICAgICAgICBcclxuICAgICAgICAgICAgbGV0IGZpcnN0ID0gYXAgPCBicCA/IGFwIDogYnA7XHJcbiAgICAgICAgICAgIGxldCB0eXBlID0gYXAgPCBicCA/IGEgOiBiO1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgbGVmdDogaW5wdXQuc3Vic3RyaW5nKDAsIGZpcnN0KSxcclxuICAgICAgICAgICAgICAgIHJpZ2h0OiBpbnB1dC5zdWJzdHJpbmcoZmlyc3QgKyAxLCBpbnB1dC5sZW5ndGgpLFxyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiA8XCIqXCIgfCBcIi9cIiB8IFwiK1wiIHwgXCItXCI+dHlwZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoIWlucHV0Lm1ldGhvZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlucHV0ID0gZ2V0KGlucHV0LCBcIitcIiwgXCItXCIpO1xyXG4gICAgXHJcbiAgICAgICAgICAgIGlmKCFpbnB1dC5tZXRob2QpIGlucHV0ID0gZ2V0KGlucHV0LCBcIipcIiwgXCIvXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGlucHV0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJ5IHRvIGNyZWF0ZSBhcyBtYW55IGJsb2NrcyBhcyBwb3NzaWJsZSBmcm9tIGEgYmxvY2suXHJcbiAgICAgKiBAcGFyYW0gYmxvY2sgXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgRXh0cmFjdEJsb2NrKGJsb2NrKTogSUJsb2NrIHwgc3RyaW5nXHJcbiAgICB7XHJcbiAgICAgICAgYmxvY2sgPSB0aGlzLkdldEJsb2NrKGJsb2NrKTtcclxuXHJcbiAgICAgICAgaWYoIWJsb2NrLm1ldGhvZCkgcmV0dXJuIGJsb2NrO1xyXG5cclxuICAgICAgICBibG9jay5sZWZ0ID0gdGhpcy5FeHRyYWN0QmxvY2soYmxvY2subGVmdCk7XHJcbiAgICAgICAgYmxvY2sucmlnaHQgPSB0aGlzLkV4dHJhY3RCbG9jayhibG9jay5yaWdodCk7XHJcbiAgICBcclxuICAgICAgICByZXR1cm4gYmxvY2s7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxjdWxhdGUgdGhlIHJlc3VsdCBvZiBhIGJsb2NrIHRyZWUuXHJcbiAgICAgKiBAcGFyYW0gYmxvY2tcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBDYWxjdWxhdGVCbG9jayhibG9jayk6IG51bWJlclxyXG4gICAge1xyXG4gICAgICAgIGlmKCFibG9jay5tZXRob2QpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYmxvY2subGVuZ3RoID09IDAgPyAwIDogcGFyc2VGbG9hdChibG9jayk7XHJcblxyXG4gICAgICAgICAgICBpZihyZXN1bHQgPT0gTmFOKSB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgYSBudW1iZXIhXCIpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBzd2l0Y2goYmxvY2subWV0aG9kKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSBcIitcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLkNhbGN1bGF0ZUJsb2NrKGJsb2NrLmxlZnQpICsgdGhpcy5DYWxjdWxhdGVCbG9jayhibG9jay5yaWdodCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCItXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5DYWxjdWxhdGVCbG9jayhibG9jay5sZWZ0KSAtIHRoaXMuQ2FsY3VsYXRlQmxvY2soYmxvY2sucmlnaHQpO1xyXG4gICAgICAgICAgICBjYXNlIFwiKlwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuQ2FsY3VsYXRlQmxvY2soYmxvY2subGVmdCkgKiB0aGlzLkNhbGN1bGF0ZUJsb2NrKGJsb2NrLnJpZ2h0KTtcclxuICAgICAgICAgICAgY2FzZSBcIi9cIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLkNhbGN1bGF0ZUJsb2NrKGJsb2NrLmxlZnQpIC8gdGhpcy5DYWxjdWxhdGVCbG9jayhibG9jay5yaWdodCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSByZXN1bHQgb2YgYSBzaW1wbGUgbWF0aCBwcm9ibGVtLiBZb3UgY2FuIHVzZSB0aGUgNCBiYXNpYyBvcGVyYXRvciBwbHVzIGJyYWNrZXRzLlxyXG4gICAgICogQHBhcmFtIGlucHV0IFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgQ2FsY3VsYXRlKGlucHV0OiBzdHJpbmcpOiBudW1iZXJcclxuICAgIHtcclxuICAgICAgICBsZXQgcmFuZ2U6IEFycmF5PG51bWJlcj47XHJcblxyXG4gICAgICAgIHdoaWxlKChyYW5nZSA9IHRoaXMuR2V0SW5uZXIoaW5wdXQpKSAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5DYWxjdWxhdGUoaW5wdXQuc3Vic3RyaW5nKHJhbmdlWzBdICsgMSwgcmFuZ2VbMV0pKTtcclxuXHJcbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQuc3Vic3RyaW5nKDAsIHJhbmdlWzBdKSArIHJlc3VsdCArIGlucHV0LnN1YnN0cmluZyhyYW5nZVsxXSArIDEsIGlucHV0Lmxlbmd0aCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYmxvY2sgPSB0aGlzLkV4dHJhY3RCbG9jayhpbnB1dCk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLkNhbGN1bGF0ZUJsb2NrKGJsb2NrKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlc29sdmUgZnVuY3Rpb25zIGluIGEgc3RyaW5nLlxyXG4gICAgICogQHBhcmFtIGlucHV0IFxyXG4gICAgICogQHBhcmFtIGNvbnRleHQgXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgUmVzb2x2ZUZ1bmN0aW9ucyhpbnB1dDogc3RyaW5nKTogc3RyaW5nXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgcGF0dGVybiA9IC9bQS1aYS16XVtBLVphLXowLTldKlxcKC87XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHN0YXJ0OiBSZWdFeHBNYXRjaEFycmF5ID0gbnVsbDtcclxuXHJcbiAgICAgICAgd2hpbGUoKHN0YXJ0ID0gaW5wdXQubWF0Y2gocGF0dGVybikpICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCByYW5nZSA9IHRoaXMuR2V0SW5uZXIoaW5wdXQuc3Vic3RyKHN0YXJ0LmluZGV4KSkubWFwKHAgPT4gcCArIHN0YXJ0LmluZGV4KTtcclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGlucHV0LnN1YnN0cmluZyhzdGFydC5pbmRleCwgcmFuZ2VbMF0pO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgYXJncyA9IFtdO1xyXG4gICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IFtdO1xyXG4gICAgXHJcbiAgICAgICAgICAgIGxldCBsYXN0ID0gcmFuZ2VbMF0gKyAxO1xyXG4gICAgICAgICAgICBsZXQgYnJhY2tldHMgPSAwO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZm9yKGxldCBpID0gcmFuZ2VbMF0gKyAxOyBpIDw9IHJhbmdlWzFdOyBpKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGMgPSBpbnB1dFtpXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZihjID09IFwiKFwiKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGJyYWNrZXRzKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmKChjID09IFwiKVwiICYmIC0tYnJhY2tldHMgPT0gLTEpIHx8IChjID09IFwiLFwiICYmIGJyYWNrZXRzID09IDApKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MucHVzaChpbnB1dC5zdWJzdHJpbmcobGFzdCwgaSkudHJpbSgpKTtcclxuICAgICAgICAgICAgICAgICAgICBsYXN0ID0gaSArIDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFJlc29sdmUgYXJndW1lbnRzXHJcbiAgICAgICAgICAgIGFyZ3MuZm9yRWFjaChhcmcgPT4gcmVzb2x2ZWQucHVzaCh0aGlzLlNvbHZlKGFyZykpKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCByZXN1bHRcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcGFyc2VGbG9hdCh0aGlzLkNvbnRleHRbbmFtZV0uYXBwbHkodGhpcy5Db250ZXh0LCByZXNvbHZlZCkpO1xyXG5cclxuICAgICAgICAgICAgaWYocmVzdWx0ID09IE5hTikgdGhyb3cgbmV3IEVycm9yKFwiTm90IGEgbnVtYmVyIVwiKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJlcGxhY2UgZnVuY3Rpb24gd2l0aCB0aGUgcmVzdWx0XHJcbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQuc3Vic3RyaW5nKDAsIHN0YXJ0LmluZGV4KSArIHJlc3VsdCArIGlucHV0LnN1YnN0cmluZyhyYW5nZVsxXSArIDEsIGlucHV0Lmxlbmd0aCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaW5wdXQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXNvbHZlIHZhcmlhYmxlcyBpbiBhIHN0cmluZy5cclxuICAgICAqIEBwYXJhbSBpbnB1dCBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBSZXNvbHZlVmFyaWFibGVzKGlucHV0OiBzdHJpbmcpOiBzdHJpbmdcclxuICAgIHtcclxuICAgICAgICBjb25zdCBwYXR0ZXJuID0gL1tBLVphLXpdW0EtWmEtejAtOV0qLztcclxuXHJcbiAgICAgICAgbGV0IHN0YXJ0OiBSZWdFeHBNYXRjaEFycmF5ID0gbnVsbDtcclxuICAgICAgICBcclxuICAgICAgICB3aGlsZSgoc3RhcnQgPSBpbnB1dC5tYXRjaChwYXR0ZXJuKSkgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHBhcnNlRmxvYXQodGhpcy5Db250ZXh0W3N0YXJ0WzBdXSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZihyZXN1bHQgPT0gTmFOKSB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgYSBudW1iZXIhXCIpO1xyXG5cclxuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5zdWJzdHJpbmcoMCwgc3RhcnQuaW5kZXgpICsgcmVzdWx0ICsgaW5wdXQuc3Vic3RyaW5nKHN0YXJ0LmluZGV4ICsgc3RhcnRbMF0ubGVuZ3RoLCBpbnB1dC5sZW5ndGgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGlucHV0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVzb2x2ZSBmdW5jdGlvbnMgYW5kIHZhcmlhYmxlcyB0aGVuIGNhbGN1bGF0ZSB0aGUgbWF0aCBwcm9ibGVtLlxyXG4gICAgICogQHBhcmFtIGlucHV0XHJcbiAgICAgKiBAcGFyYW0gY29udGV4dCBKYXZhU2NyaXB0IE9iamVjdC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIFNvbHZlKGlucHV0OiBzdHJpbmcpOiBudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5DYWxjdWxhdGUodGhpcy5SZXNvbHZlVmFyaWFibGVzKHRoaXMuUmVzb2x2ZUZ1bmN0aW9ucyhpbnB1dCkpKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEFkYXB0ZXIgfSBmcm9tICcuL0FkYXB0ZXInO1xyXG5pbXBvcnQgeyBQcm9jZXNzb3IgfSBmcm9tICcuL1Byb2Nlc3Nvcic7XHJcbmltcG9ydCB7IElSb2JvdCB9IGZyb20gJy4vLi4vRWxlbWVudC9Sb2JvdC9JUm9ib3QnO1xyXG5pbXBvcnQgeyBQYXJzZXIgfSBmcm9tICcuL1BhcnNlcic7XHJcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSAnLi4vVXRpbHMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFJ1bm5lclxyXG57XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNwZWVkOiBudW1iZXIgPSAzMDA7XHJcblxyXG4gICAgLy8gU2V0IGF0IGV2ZXJ5IHBhcnNlXHJcbiAgICBwcml2YXRlIGNvdW50ZXI6IG51bWJlcjtcclxuICAgIHByaXZhdGUgaW50ZXJ2YWw7XHJcblxyXG4gICAgLy8gU2V0IGluIGNvbnN0cnVjdG9yXHJcbiAgICBwcml2YXRlIGFkYXB0ZXI6IEFkYXB0ZXI7XHJcbiAgICBwcml2YXRlIHByb2Nlc3NvcjogUHJvY2Vzc29yO1xyXG4gICAgcHJpdmF0ZSBwYXJzZXI6IFBhcnNlcjtcclxuXHJcbiAgICBwdWJsaWMgY29uc3RydWN0b3Iocm9ib3Q6IElSb2JvdClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmFkYXB0ZXIgPSBuZXcgQWRhcHRlcihyb2JvdCk7XHJcbiAgICAgICAgdGhpcy5wcm9jZXNzb3IgPSBuZXcgUHJvY2Vzc29yO1xyXG4gICAgICAgIHRoaXMucGFyc2VyID0gbmV3IFBhcnNlcjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFN0YXJ0IHRoZSBleGVjdXRpb25cclxuICAgICAqIEBwYXJhbSBjb2RlXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBSdW4oY29kZTogc3RyaW5nKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuU3RvcCgpO1xyXG4gICAgICAgIHRoaXMucGFyc2VyLlBhcnNlKGNvZGUpO1xyXG5cclxuICAgICAgICB0aGlzLnByb2Nlc3Nvci5Db250ZXh0ID0ge1xyXG4gICAgICAgICAgICBtb3ZlOiB0aGlzLmFkYXB0ZXIubW92ZS5iaW5kKHRoaXMuYWRhcHRlciksXHJcbiAgICAgICAgICAgIHRlc3Q6IHRoaXMuYWRhcHRlci50ZXN0LmJpbmQodGhpcy5hZGFwdGVyKSxcclxuICAgICAgICAgICAgYXR0YWNrOiB0aGlzLmFkYXB0ZXIuYXR0YWNrLmJpbmQodGhpcy5hZGFwdGVyKVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuY291bnRlciA9IDA7XHJcbiAgICAgICAgdGhpcy5pbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHRoaXMuRXhlY3V0ZUxpbmUoKSwgdGhpcy5zcGVlZCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTdG9wIHRoZSBleGVjdXRpb24uXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBTdG9wKClcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLmludGVydmFsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeGVjdXRlIHRoZSBuZXh0IGxpbmVcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBFeGVjdXRlTGluZSgpOiB2b2lkXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5jb3VudGVyIDwgMCAmJiB0aGlzLmNvdW50ZXIgPj0gdGhpcy5wYXJzZXIuQ29kZS5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLlN0b3AoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGxpbmUgPSB0aGlzLnBhcnNlci5Db2RlW3RoaXMuY291bnRlcisrXTtcclxuXHJcbiAgICAgICAgdGhpcy5PbkxpbmUobGluZS5qb2luKFwiIFwiKSwgdGhpcy5jb3VudGVyIC0gMSk7XHJcblxyXG4gICAgICAgIHRyeVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoKGxpbmVbMF0pXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJMQUJFTFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcIkdPVE9cIjpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLkV4ZWN1dGVHb3RvKGxpbmUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcIkNBTExcIjpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLkV4ZWN1dGVDYWxsKGxpbmUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcIlNFVFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuRXhlY3V0ZVNldChsaW5lKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaChlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5TdG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXhlY3V0ZSBhIEdPVE8gY29tbWFuZC5cclxuICAgICAqIEBwYXJhbSBwYXJhbWV0ZXJzIFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIEV4ZWN1dGVHb3RvKHBhcmFtZXRlcnM6IHN0cmluZ1tdKTogdm9pZFxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IHNldCA9ICgpID0+IHRoaXMuY291bnRlciA9IHRoaXMucGFyc2VyLkxhYmVscy5oYXNPd25Qcm9wZXJ0eShwYXJhbWV0ZXJzWzFdKSA/IHRoaXMucGFyc2VyLkxhYmVsc1twYXJhbWV0ZXJzWzFdXSA6IC0xO1xyXG5cclxuICAgICAgICBpZihwYXJhbWV0ZXJzLmxlbmd0aCA9PSAyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc2V0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYocGFyYW1ldGVycy5sZW5ndGggPj0gNClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBjb25kaXRpb24gPSBwYXJhbWV0ZXJzLnNsaWNlKDMpLmpvaW4oXCIgXCIpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYodGhpcy5wcm9jZXNzb3IuU29sdmUoY29uZGl0aW9uKSAhPSAwKSBzZXQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBHT1RPXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEV4ZWN1dGUgYSBDQUxMIGNvbW1hbmQuXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1ldGVycyBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBFeGVjdXRlQ2FsbChwYXJhbWV0ZXJzOiBzdHJpbmdbXSk6IHZvaWRcclxuICAgIHtcclxuICAgICAgICBpZihwYXJhbWV0ZXJzLmxlbmd0aCA8IDIpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIENBTExcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBjYWxsID0gcGFyYW1ldGVycy5zbGljZSgxKS5qb2luKFwiIFwiKTtcclxuXHJcbiAgICAgICAgdGhpcy5wcm9jZXNzb3IuU29sdmUoY2FsbCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeGVjdXRlIGEgU0VUIGNvbW1hbmQuXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1ldGVycyBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBFeGVjdXRlU2V0KHBhcmFtZXRlcnM6IHN0cmluZ1tdKTogdm9pZFxyXG4gICAge1xyXG4gICAgICAgIGlmKHBhcmFtZXRlcnMubGVuZ3RoIDwgMylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgU0VUXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGNhbGwgPSBwYXJhbWV0ZXJzLnNsaWNlKDIpLmpvaW4oXCIgXCIpO1xyXG5cclxuICAgICAgICB0aGlzLnByb2Nlc3Nvci5Db250ZXh0W3BhcmFtZXRlcnNbMV1dID0gdGhpcy5wcm9jZXNzb3IuU29sdmUoY2FsbCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIGxpbmUgY291bnRlciB2YWx1ZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldENvdW50ZXIoKTogbnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY291bnRlcjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEV4ZWN1dGVkIHdoZW4gdGhlIG5leHQgbGluZSBpcyBjYWxsZWQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBPbkxpbmU6IChsaW5lOiBzdHJpbmcsIGNvdW50OiBudW1iZXIpID0+IHZvaWQgPSBVdGlscy5Ob29wO1xyXG59IiwiaW1wb3J0IHsgSUNlbGwgfSBmcm9tIFwiLi9FbGVtZW50L0NlbGwvSUNlbGxcIjtcclxuaW1wb3J0IHsgR3JvdW5kQ2VsbCB9IGZyb20gXCIuL0VsZW1lbnQvQ2VsbC9Hcm91bmRDZWxsXCI7XHJcbmltcG9ydCB7IENvb3JkIH0gZnJvbSBcIi4vQ29vcmRcIjtcclxuaW1wb3J0IHsgSVJvYm90IH0gZnJvbSBcIi4vRWxlbWVudC9Sb2JvdC9JUm9ib3RcIjtcclxuaW1wb3J0IHsgSUVsZW1lbnQgfSBmcm9tIFwiLi9FbGVtZW50L0lFbGVtZW50XCI7XHJcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSBcIi4vVXRpbHNcIjtcclxuaW1wb3J0IHsgQ2VsbEZhY3RvcnkgfSBmcm9tIFwiLi9FbGVtZW50L0NlbGwvQ2VsbEZhY3RvcnlcIjtcclxuaW1wb3J0IHsgQ2VsbFR5cGUgfSBmcm9tIFwiLi9FbGVtZW50L0NlbGwvQ2VsbFR5cGVcIjtcclxuaW1wb3J0IHsgQmFzaWNSb2JvdCB9IGZyb20gXCIuL0VsZW1lbnQvUm9ib3QvQmFzaWNSb2JvdFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIE1hcFxyXG57XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJvYm90Q291bnQ6IG51bWJlciA9IDI7XHJcblxyXG4gICAgcHJpdmF0ZSByb2JvdHM6IEFycmF5PElSb2JvdD47XHJcbiAgICBwcml2YXRlIGNlbGxzOiBBcnJheTxJQ2VsbD47XHJcblxyXG4gICAgcHJpdmF0ZSBzaXplOiBudW1iZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaW5nbGV0b24gaW5zdGFuY2Ugb2YgdGhlIGNsYXNzLlxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogTWFwO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSBzaW5nbGV0b24gaW5zdGFuY2UuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgR2V0SW5zdGFuY2UoKTogTWFwXHJcbiAgICB7XHJcbiAgICAgICAgaWYoTWFwLmluc3RhbmNlID09IHVuZGVmaW5lZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXAuaW5zdGFuY2UgPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gTWFwLmluc3RhbmNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29uc3RydWN0IGEgc2ltcGxlIG5ldyBtYXAuIFxyXG4gICAgICogQHBhcmFtIHNpemUgU2l6ZSBvZiB0aGUgbWFwLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgSW5pdChzaXplOiBudW1iZXIpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5zaXplID0gc2l6ZTtcclxuICAgICAgICB0aGlzLnJvYm90cyA9IFtdO1xyXG4gICAgICAgIHRoaXMuY2VsbHMgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHNpemUgKiBzaXplOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgeCA9IGkgJSBzaXplO1xyXG4gICAgICAgICAgICBsZXQgeSA9IE1hdGguZmxvb3IoaSAvIHNpemUpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jZWxsc1tpXSA9IG5ldyBHcm91bmRDZWxsKG5ldyBDb29yZCh4LCB5KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnJvYm90cy5wdXNoKG5ldyBCYXNpY1JvYm90KG5ldyBDb29yZChVdGlscy5SYW5kb20oMCwgc2l6ZSAtIDEpLCAwKSkpO1xyXG4gICAgICAgIHRoaXMucm9ib3RzLnB1c2gobmV3IEJhc2ljUm9ib3QobmV3IENvb3JkKFV0aWxzLlJhbmRvbSgwLCBzaXplIC0gMSksIHNpemUgLSAxKSkpO1xyXG5cclxuICAgICAgICB0aGlzLk9uVXBkYXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMb2FkIGEgbWFwIGZyb20gYW4gZXh0ZXJuYWwgZmlsZS4gVGhlIEpTT04gbmVlZHMgdG8gY29udGFpbiBhbiBhcnJheSBvZiBudW1iZXJzLlxyXG4gICAgICogVGhlIGZpcnN0IG51bWJlciB3aWxsIGRldGVybWluYXRlIHRoZSBzaXplIG9mIHRoZSBtYXAsIHdoaWxlIHRoZSBvdGhlcnMgd2lsbFxyXG4gICAgICogdGVsbCB0aGUgaW50ZXJwcmV0ZXIgdHlwZSBvZiB0aGUgY2VsbCBiYXNlZCBvbiB0aGUgQ2VsbFR5cGUgZW51bS5cclxuICAgICAqIEBwYXJhbSB1cmwgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBhc3luYyBMb2FkKHVybDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPlxyXG4gICAge1xyXG4gICAgICAgIHZhciByYXc6IEFycmF5PG51bWJlcj47XHJcblxyXG4gICAgICAgIHRyeVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmF3ID0gSlNPTi5wYXJzZShhd2FpdCBVdGlscy5HZXQodXJsKSk7XHJcblxyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBpdCBpcyBhIHZhbGlkIG1hcCBhcnJheVxyXG4gICAgICAgICAgICBpZihyYXcgPT0gbnVsbCAmJiByYXcubGVuZ3RoIDwgMiAmJiByYXcubGVuZ3RoICE9IE1hdGgucG93KHJhd1swXSwgMikgKyAxKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2goZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuY2VsbHMgPSBbXTtcclxuICAgICAgICB0aGlzLnJvYm90cyA9IFtdO1xyXG4gICAgICAgIHRoaXMuc2l6ZSA9IHJhdy5zaGlmdCgpOyAvLyBGaXJzdCBlbGVtZW50IGlzIHRoZSBzaXplXHJcblxyXG4gICAgICAgIHZhciByb2JvdFNwb3RzID0gbmV3IEFycmF5PENvb3JkPigpO1xyXG4gICAgICAgIHZhciByb2JvdENvdW50ID0gMDtcclxuXHJcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHJhdy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCB4ID0gaSAlIHRoaXMuc2l6ZTtcclxuICAgICAgICAgICAgbGV0IHkgPSBNYXRoLmZsb29yKGkgLyB0aGlzLnNpemUpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHR5cGU6IENlbGxUeXBlID0gcmF3W2ldO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIGNlbGwgYmFzZWQgb24gdGhlIENlbGxUeXBlXHJcbiAgICAgICAgICAgIHRoaXMuY2VsbHNbaV0gPSBDZWxsRmFjdG9yeS5Gcm9tVHlwZSh0eXBlLCBuZXcgQ29vcmQoeCwgeSkpO1xyXG5cclxuICAgICAgICAgICAgLy8gSWYgdGhlIGNlbGwgaXMgZ3JvdW5kIGFuZCB0aGVyZSBpcyAwIG9yIDEgcm9ib3QsIHRyeSB0byBhZGQgb25lXHJcbiAgICAgICAgICAgIGlmKHJvYm90Q291bnQgPCB0aGlzLnJvYm90Q291bnQgJiYgdHlwZSA9PSBDZWxsVHlwZS5Hcm91bmQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vIEdpdmUgdGhlIGNlbGwgNSUgY2hhbmNlXHJcbiAgICAgICAgICAgICAgICBpZihVdGlscy5SYW5kb20oMCwgMjApID09IDEpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGEgbmV3IHJvYm90IGFuZCBpbmNyZW1lbnQgcm9ib3QgY291bnRcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJvYm90cy5wdXNoKG5ldyBCYXNpY1JvYm90KG5ldyBDb29yZCh4LCB5KSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJvYm90Q291bnQrKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgY2VsbCBsb3N0LCBzYXZlIGl0IGZvciBsYXRlclxyXG4gICAgICAgICAgICAgICAgICAgIHJvYm90U3BvdHMucHVzaChuZXcgQ29vcmQoeCwgeSkpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIHRoZSBtYXAgaXMgbG9hZGVkLCBidXQgdG9vIGZldyByb2JvdHMgd2VyZSBhZGRlZCwgYWRkIG5ldyBvbmVzXHJcbiAgICAgICAgLy8gYmFzZWQgb24gdGhlIFtzYXZlIGlmIGZvciBsYXRlcl0gc3BvdHNcclxuICAgICAgICBmb3IoOyByb2JvdFNwb3RzLmxlbmd0aCA+IDAgJiYgcm9ib3RDb3VudCA8IHRoaXMucm9ib3RDb3VudDsgcm9ib3RDb3VudCsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGNvb3JkID0gcm9ib3RTcG90cy5zcGxpY2UoVXRpbHMuUmFuZG9tKDAsIHJvYm90U3BvdHMubGVuZ3RoIC0gMSksIDEpWzBdO1xyXG4gICAgICAgICAgICBsZXQgcm9ib3QgPSBuZXcgQmFzaWNSb2JvdChjb29yZCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnJvYm90cy5wdXNoKHJvYm90KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuT25VcGRhdGUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBhbiBlbGVtZW50IGZyb20gdGhlIGdpdmVuIGFycmF5IGJ5IGNvb3JkLlxyXG4gICAgICogQHBhcmFtIGZvcm1cclxuICAgICAqIEBwYXJhbSBjb29yZFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIEdldEVsZW1lbnQoZm9ybTogSUVsZW1lbnRbXSwgY29vcmQ6IENvb3JkKTogSUVsZW1lbnRcclxuICAgIHtcclxuICAgICAgICB2YXIgcmVzdWx0OiBJRWxlbWVudCA9IG51bGw7XHJcblxyXG4gICAgICAgIGZvcm0uc29tZShlID0+IFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYoZS5HZXRQb3NpdGlvbigpLklzKGNvb3JkKSkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGU7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBhIGNlbGwgYnkgY29vcmQuXHJcbiAgICAgKiBAcGFyYW0gY29vcmQgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBHZXRDZWxsKGNvb3JkOiBDb29yZCk6IElDZWxsXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIDxJQ2VsbD50aGlzLkdldEVsZW1lbnQodGhpcy5jZWxscywgY29vcmQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IGEgcm9ib3QgYnkgY29vcmQuXHJcbiAgICAgKiBAcGFyYW0gY29vcmQgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBHZXRSb2JvdChjb29yZDogQ29vcmQpOiBJUm9ib3RcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gPElSb2JvdD50aGlzLkdldEVsZW1lbnQodGhpcy5yb2JvdHMsIGNvb3JkKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBhIHJvYm90IGZyb20gdGhlIGxpc3QuXHJcbiAgICAgKiBAcGFyYW0gcm9ib3QgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBSZW1vdmVSb2JvdChyb2JvdDogSVJvYm90KVxyXG4gICAge1xyXG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMucm9ib3RzLmluZGV4T2Yocm9ib3QpO1xyXG5cclxuICAgICAgICBpZihpbmRleCA+PSAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5yb2JvdHMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIHNpemUgb2YgdGhlIG1hcC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldFNpemUoKTogbnVtYmVyXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgY2VsbHMgb2YgdGhlIG1hcC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldENlbGxzKCk6IEFycmF5PElDZWxsPlxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNlbGxzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSByb2JvdHMgb2YgdGhlIG1hcC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIEdldFJvYm90cygpOiBBcnJheTxJUm9ib3Q+XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm9ib3RzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJuIGVsZW1lbnRzIG9mIHRoZSBtYXAgKHJvYm90cyBhbmQgY2VsbHMpLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgR2V0RWxlbWVudHMoKTogQXJyYXk8SUVsZW1lbnQ+XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICg8SUVsZW1lbnRbXT50aGlzLmNlbGxzKS5jb25jYXQoPElFbGVtZW50W10+dGhpcy5yb2JvdHMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbGVkIHdoZW4gdGhlIG1hcCB3YXMgdXBkYXRlZC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIE9uVXBkYXRlOiAoKSA9PiB2b2lkID0gVXRpbHMuTm9vcDtcclxufSIsImV4cG9ydCBjbGFzcyBVdGlsc1xyXG57XHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBhbiBhc3luYyByZXF1ZXN0LlxyXG4gICAgICogQHBhcmFtIHVybCBcclxuICAgICAqIEBwYXJhbSBkYXRhIFxyXG4gICAgICogQHBhcmFtIG1ldGhvZCBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgQWpheCh1cmw6IHN0cmluZywgZGF0YTogc3RyaW5nLCBtZXRob2Q6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPlxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KHJlc29sdmUgPT4gXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG5cclxuICAgICAgICAgICAgcmVxdWVzdC5vcGVuKG1ldGhvZCwgdXJsLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4gXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmKHJlcXVlc3QucmVhZHlTdGF0ZSAhPSA0KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVxdWVzdC5zdGF0dXMgPT0gMjAwKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlcXVlc3QucmVzcG9uc2VUZXh0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmKGRhdGEgIT0gbnVsbCAmJiBkYXRhLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0LnNlbmQoZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0LnNlbmQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUG9zdCByZXF1ZXN0IHdpdGggSlNPTiBkYXRhLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGFzeW5jIFBvc3QodXJsOiBzdHJpbmcsIGRhdGE6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPlxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBhd2FpdCBVdGlscy5BamF4KHVybCwgZGF0YSwgXCJQT1NUXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHJlcXVlc3QgdG8gdGhlIGdpdmVuIFVSTC5cclxuICAgICAqIEBwYXJhbSB1cmwgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgYXN5bmMgR2V0KHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IFV0aWxzLkFqYXgodXJsLCBudWxsLCBcIkdFVFwiKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIG1pbiAoaW5jbHVkZWQpIGFuZCBtYXggKGluY2x1ZGVkKS5cclxuICAgICAqIEBwYXJhbSBtaW4gXHJcbiAgICAgKiBAcGFyYW0gbWF4IFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIFJhbmRvbShtaW46IG51bWJlciwgbWF4OiBudW1iZXIpOiBudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpICsgbWluKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvcHkgcHJvcGVydGllcyBmcm9tIG9uZSBvYmplY3QgdG8gYW5vdGhlci5cclxuICAgICAqIEBwYXJhbSB0byBcclxuICAgICAqIEBwYXJhbSBmcm9tIFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIEV4dHJhY3QodG86IE9iamVjdCwgZnJvbTogT2JqZWN0KSBcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gZnJvbSkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZih0by5oYXNPd25Qcm9wZXJ0eShrZXkpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0b1trZXldID0gZnJvbVtrZXldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQSBub29wIGZ1bmN0aW9uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIE5vb3AoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxufSIsImltcG9ydCB7IElSb2JvdCB9IGZyb20gJy4vRWxlbWVudC9Sb2JvdC9JUm9ib3QnO1xyXG5pbXBvcnQgeyBQcm9jZXNzb3IgfSBmcm9tICcuL0ludGVycHJldGVyL1Byb2Nlc3Nvcic7XHJcbmltcG9ydCB7IFJ1bm5lciB9IGZyb20gJy4vSW50ZXJwcmV0ZXIvUnVubmVyJztcclxuaW1wb3J0IHsgTWFwIH0gZnJvbSBcIi4vTWFwXCI7XHJcbmltcG9ydCB7IENvb3JkIH0gZnJvbSBcIi4vQ29vcmRcIjtcclxuaW1wb3J0IHsgSUVsZW1lbnQgfSBmcm9tIFwiLi9FbGVtZW50L0lFbGVtZW50XCI7XHJcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSBcIi4vVXRpbHNcIjtcclxuXHJcblV0aWxzLkV4dHJhY3Qod2luZG93LCB7IENvb3JkLCBNYXAsIFV0aWxzLCBQcm9jZXNzb3IsIFJ1bm5lciB9KTtcclxuXHJcbmNvbnN0IGNhbnZhcyA9IDxIVE1MQ2FudmFzRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxuY29uc3QgY29udGV4dCA9IDxDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ+Y2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcclxuXHJcbmNvbnN0IGNvZGVUZXh0YXJlYSA9IDxIVE1MVGV4dEFyZWFFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29kZVwiKTtcclxuY29uc3QgcHVzaEJ1dHRvbiA9IDxIVE1MQnV0dG9uRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInB1c2hcIik7XHJcbmNvbnN0IHN0b3BCdXR0b24gPSA8SFRNTEJ1dHRvbkVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdG9wXCIpO1xyXG5jb25zdCBsaW5lSW5wdXQgPSA8SFRNTEJ1dHRvbkVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsaW5lXCIpO1xyXG5cclxubGV0IG1hcDogTWFwID0gTWFwLkdldEluc3RhbmNlKCk7XHJcbmxldCBydW5uZXI6IFJ1bm5lciA9IG51bGw7XHJcblxyXG5jb25zdCBsYXN0OiBBcnJheTxDb29yZD4gPSBbXTtcclxuXHJcbmxldCBwbGF5ZXI6IElSb2JvdCA9IG51bGw7XHJcbmxldCBlbmVteTogSVJvYm90ID0gbnVsbDtcclxuXHJcbmNvbnN0IHNpemU6IG51bWJlciA9IDMwO1xyXG5cclxuLyoqXHJcbiAqIERyYXcgdGhlIGdpdmVuIGVsZW1lbnQgb250byB0aGUgY2FudmFzLlxyXG4gKiBAcGFyYW0gZVxyXG4gKiBAcGFyYW0gY2FsbGJhY2tcclxuICovXHJcbmNvbnN0IGRyYXcgPSAoZTogSUVsZW1lbnQsIGxvYWRlZDogKCkgPT4gdm9pZCkgPT5cclxue1xyXG4gICAgbGV0IGNvb3JkID0gZS5HZXRQb3NpdGlvbigpO1xyXG4gICAgbGV0IHggPSBjb29yZC5YO1xyXG4gICAgbGV0IHkgPSBjb29yZC5ZO1xyXG5cclxuICAgIGxldCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG4gICAgXHJcbiAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiBcclxuICAgIHtcclxuICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpbWFnZSwgeCAqIHNpemUsIHkgKiBzaXplLCBzaXplLCBzaXplKTtcclxuICAgICAgICBsb2FkZWQoKTtcclxuICAgIH07XHJcblxyXG4gICAgaW1hZ2Uuc3JjID0gZS5HZXRUZXh0dXJlKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogVXBkYXRlIHRoZSBjYW52YXMuXHJcbiAqL1xyXG5jb25zdCB1cGRhdGUgPSAoKSA9PiBcclxue1xyXG4gICAgaWYoIXJ1bm5lcikgXHJcbiAgICB7XHJcbiAgICAgICAgcGxheWVyID0gbWFwLkdldFJvYm90cygpWzBdO1xyXG4gICAgICAgIGVuZW15ID0gbWFwLkdldFJvYm90cygpWzFdO1xyXG5cclxuICAgICAgICBydW5uZXIgPSBuZXcgUnVubmVyKHBsYXllcik7XHJcblxyXG4gICAgICAgIHJ1bm5lci5PbkxpbmUgPSAobGluZSwgY291bnQpID0+IFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGluZUlucHV0LnZhbHVlID0gYCR7Y291bnR9OiAke2xpbmV9YDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjYW52YXMud2lkdGggPSBzaXplICogbWFwLkdldFNpemUoKTtcclxuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gc2l6ZSAqIG1hcC5HZXRTaXplKCk7XHJcbiAgICAgICAgY2FudmFzLm9uY2xpY2sgPSBlID0+IHVwZGF0ZSgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBpID0gMDtcclxuXHJcbiAgICAgICAgLy8gRHJhdyBjZWxscyBmaXJzdFxyXG4gICAgICAgIG1hcC5HZXRDZWxscygpLmZvckVhY2goY2VsbCA9PiBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRyYXcoY2VsbCwgKCkgPT4gXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vIFdoZW4gdGhlIGxhc3Qgd2FzIGRyYXduLCBzdGFydCBkcmF3aW5nIHRoZSByb2JvdHNcclxuICAgICAgICAgICAgICAgIGlmKCsraSA9PSBtYXAuR2V0U2l6ZSgpKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG1hcC5HZXRSb2JvdHMoKS5mb3JFYWNoKHJvYm90ID0+IFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdC5wdXNoKHJvYm90LkdldFBvc2l0aW9uKCkuQ2xvbmUoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYXcocm9ib3QsIFV0aWxzLk5vb3ApO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGkgPSAwO1xyXG5cclxuICAgICAgICAvLyBPbmx5IGRyYXcgY2VsbHMgd2hlcmUgdGhlIHJvYm90cyB3ZXJlXHJcbiAgICAgICAgbGFzdC5mb3JFYWNoKGMgPT4gXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkcmF3KG1hcC5HZXRDZWxsKGMpLCBVdGlscy5Ob29wKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCsraSA9PSBsYXN0Lmxlbmd0aClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gQ2xlYXIgdGhlIGFycmF5XHJcbiAgICAgICAgICAgICAgICBsYXN0Lmxlbmd0aCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmVkcmF3IHJvYm90c1xyXG4gICAgICAgICAgICAgICAgbWFwLkdldFJvYm90cygpLmZvckVhY2gocm9ib3QgPT4gXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdC5wdXNoKHJvYm90LkdldFBvc2l0aW9uKCkuQ2xvbmUoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZHJhdyhyb2JvdCwgVXRpbHMuTm9vcCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKCFwbGF5ZXIuSXNBbGl2ZSgpIHx8ICFlbmVteS5Jc0FsaXZlKCkpXHJcbiAgICB7XHJcbiAgICAgICAgYWxlcnQocGxheWVyLklzQWxpdmUoKSA/IFwiWW91IHdvbiFcIiA6IFwiWW91IGxvc2UhXCIpO1xyXG5cclxuICAgICAgICBzdG9wQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgICBwdXNoQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgcnVubmVyLlN0b3AoKTtcclxuICAgIH1cclxufTtcclxuXHJcbnB1c2hCdXR0b24ub25jbGljayA9IGUgPT4gcnVubmVyLlJ1bihjb2RlVGV4dGFyZWEudmFsdWUpO1xyXG5zdG9wQnV0dG9uLm9uY2xpY2sgPSBlID0+IHJ1bm5lci5TdG9wKCk7XHJcblxyXG5VdGlscy5HZXQoXCJyZXMvZXhhbXBsZS50eHRcIikudGhlbihyZXN1bHQgPT4gY29kZVRleHRhcmVhLnZhbHVlID0gcmVzdWx0KTtcclxubWFwLkxvYWQoXCJyZXMvbWFwLmpzb25cIik7XHJcblxyXG5tYXAuT25VcGRhdGUgPSB1cGRhdGU7Il19
