(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
const Map_1 = require("./lib/Map");
const Coord_1 = require("./lib/Coord");
const Server_1 = require("./lib/Net/Server");
const Renderer_1 = require("./lib/Renderer");
const Keyboard_1 = require("./lib/Util/Keyboard");
const Connection_1 = require("./lib/Net/Connection");
const FakeChannel_1 = require("./lib/Net/FakeChannel");
const Client_1 = require("./lib/Net/Client");
const PeerChannel_1 = require("./lib/Net/PeerChannel");
const Helper_1 = require("./lib/Util/Helper");
const gameCanvas = document.getElementById("game-canvas");
const addButton = document.getElementById("add-button");
const messageDiv = document.getElementById("message-div");
addButton.onclick = () => ClickAdd();
const tabId = Helper_1.Helper.Unique();
const map = new Map_1.Map();
let clientChannel = null;
let server = null;
var HashType;
(function (HashType) {
    HashType[HashType["Offer"] = 0] = "Offer";
    HashType[HashType["Answer"] = 1] = "Answer";
})(HashType || (HashType = {}));
const Main = () => __awaiter(this, void 0, void 0, function* () {
    const hash = ReadHash();
    if (hash.Type == HashType.Offer) {
        clientChannel = new PeerChannel_1.PeerChannel();
        clientChannel.OnOpen = () => Start();
        const answer = yield clientChannel.Answer(hash.Payload);
        const url = ConstructUrl({
            Tab: hash.Tab,
            Type: HashType.Answer,
            Payload: answer
        });
        ClipboardCopy(url);
        SetMessage("Answer copied to clipboard!");
    }
    else if (hash.Type == HashType.Answer) {
        localStorage.setItem(hash.Tab, hash.Payload);
        SetMessage("You can close this tab!");
    }
    else {
        Start();
    }
});
const SetMessage = (message) => {
    messageDiv.innerText = message;
};
const ClipboardCopy = (text) => __awaiter(this, void 0, void 0, function* () {
    const success = yield Helper_1.Helper.ClipboardCopy(text);
    if (!success) {
        prompt("", text);
    }
});
const ConstructUrl = (hashFormat) => {
    return location.origin + location.pathname + "#" +
        encodeURI(btoa(JSON.stringify(hashFormat)));
};
const ReadHash = () => {
    try {
        return JSON.parse(atob(decodeURI(location.hash.substr(1))));
    }
    catch (e) {
        return {
            Tab: null,
            Type: null,
            Payload: null
        };
    }
};
const ClickAdd = () => __awaiter(this, void 0, void 0, function* () {
    if (!server) {
        return;
    }
    const channel = new PeerChannel_1.PeerChannel();
    const offer = yield channel.Offer();
    const url = ConstructUrl({
        Tab: tabId,
        Type: HashType.Offer,
        Payload: offer
    });
    ClipboardCopy(url);
    SetMessage("Offer copied to clipboard!");
    channel.OnOpen = () => {
        SetMessage("A new player joined!");
        server.Add(new Connection_1.Connection(channel));
    };
    while (true) {
        const answer = localStorage.getItem(tabId);
        if (answer) {
            channel.Finish(answer);
            localStorage.removeItem(tabId);
            break;
        }
        yield Helper_1.Helper.Wait(1000);
    }
});
const CreateClient = () => __awaiter(this, void 0, void 0, function* () {
    if (clientChannel && !clientChannel.IsOfferor()) {
        return new Client_1.Client(clientChannel, map);
    }
    addButton.style.display = "block";
    const serverMap = new Map_1.Map();
    yield serverMap.Load("res/map.json");
    server = new Server_1.Server(serverMap);
    const localA = new FakeChannel_1.FakeChannel();
    const localB = new FakeChannel_1.FakeChannel();
    localA.SetOther(localB);
    localB.SetOther(localA);
    server.Add(new Connection_1.Connection(localA));
    return new Client_1.Client(localB, map);
});
const OnUpdate = (player, { up, left, down, right }) => {
    const direction = new Coord_1.Coord(Keyboard_1.Keyboard.Keys[left] ? -0.05 : Keyboard_1.Keyboard.Keys[right] ? 0.05 : 0, Keyboard_1.Keyboard.Keys[up] ? -0.05 : Keyboard_1.Keyboard.Keys[down] ? 0.05 : 0);
    if (player && direction.GetDistance(new Coord_1.Coord) > 0) {
        player.Move(direction);
    }
};
const Start = () => __awaiter(this, void 0, void 0, function* () {
    Keyboard_1.Keyboard.Init();
    const client = yield CreateClient();
    const renderer = new Renderer_1.Renderer(map, gameCanvas);
    client.OnPlayer = (player) => __awaiter(this, void 0, void 0, function* () {
        yield renderer.Load();
        const keys = {
            up: "ARROWUP",
            left: "ARROWLEFT",
            down: "ARROWDOWN",
            right: "ARROWRIGHT"
        };
        renderer.OnUpdate.Add(() => OnUpdate(player, keys));
        renderer.Start();
    });
});
Main();

},{"./lib/Coord":2,"./lib/Map":13,"./lib/Net/Client":14,"./lib/Net/Connection":15,"./lib/Net/FakeChannel":16,"./lib/Net/PeerChannel":19,"./lib/Net/Server":20,"./lib/Renderer":21,"./lib/Util/Helper":23,"./lib/Util/Keyboard":24}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Exportable_1 = require("./Exportable");
class Coord extends Exportable_1.Exportable {
    constructor(x = 0, y = 0) {
        super();
        this.X = x;
        this.Y = y;
    }
    GetDistance(other) {
        return Math.sqrt(Math.pow(this.X - other.X, 2) + Math.pow(this.Y - other.Y, 2));
    }
    Is(other) {
        return this.X == other.X && this.Y == other.Y;
    }
    Add(other) {
        return new Coord(this.X + other.X, this.Y + other.Y);
    }
    Clone() {
        return new Coord(this.X, this.Y);
    }
    Floor() {
        return this.F(n => Math.floor(n));
    }
    Ceil() {
        return this.F(n => Math.ceil(n));
    }
    Round(d = 0) {
        return this.F(n => Math.round(n * Math.pow(10, d)) / Math.pow(10, d));
    }
    Inside(from, to) {
        if (from.X <= this.X && from.Y <= this.Y && to.X >= this.X && to.Y >= this.Y) {
            return true;
        }
        return false;
    }
    static Collide(a, as, b, bs) {
        return as.X > b.X && a.X < bs.X && as.Y > b.Y && a.Y < bs.Y;
    }
    F(f) {
        return new Coord(f(this.X), f(this.Y));
    }
}
exports.Coord = Coord;

},{"./Exportable":12}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseElement_1 = require("../BaseElement");
class BaseActor extends BaseElement_1.BaseElement {
    constructor(position = null, map = null) {
        super(position, map);
        this.SetPos(this.position);
    }
    GetPos() {
        return this.position;
    }
    SetPos(nextPos = null, prevPos = null) {
        const cells = this.map.GetCells();
        const prev = prevPos
            ? cells.GetBetween(prevPos, prevPos.Add(this.GetSize()))
            : [];
        const next = nextPos
            ? cells.GetBetween(nextPos, nextPos.Add(this.GetSize()))
            : [];
        if ((prevPos && !prev.length) || (nextPos && !next.length)) {
            return false;
        }
        const prevFiltered = prev.filter(c => !next.includes(c));
        const nextFiltered = next.filter(c => !prev.includes(c));
        if (nextFiltered.some(cell => !this.HandleMove(cell.MoveHere(this)))) {
            nextFiltered.forEach(c => c.MoveAway(this));
            return false;
        }
        prevFiltered.forEach(c => c.MoveAway(this));
        this.position = nextPos;
        this.map.OnUpdate.Call(this);
        return true;
    }
    Dispose() {
        if (this.disposed) {
            return;
        }
        super.Dispose();
        this.SetPos();
        if (this instanceof BaseActor) {
            this.map.GetActors().Remove(this);
        }
    }
}
exports.BaseActor = BaseActor;

},{"../BaseElement":5}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseActor_1 = require("./BaseActor");
const MoveType_1 = require("../MoveType");
const Coord_1 = require("../../Coord");
class PlayerActor extends BaseActor_1.BaseActor {
    constructor() {
        super(...arguments);
        this.health = 1.0;
        this.damage = 1.0;
    }
    GetTexture() {
        return "res/player.png";
    }
    GetSize() {
        return new Coord_1.Coord(0.8, 0.8);
    }
    Move(direction) {
        if (direction.GetDistance(new Coord_1.Coord(0, 0)) == 0) {
            return false;
        }
        if (Math.abs(Math.abs(direction.X) - Math.abs(direction.Y)) == 0) {
            return false;
        }
        const size = this.GetSize();
        const mapSize = this.map.GetSize();
        const prevPos = this.GetPos().Round(3);
        const nextPos = prevPos.Add(direction).Round(3);
        if (!nextPos.Inside(new Coord_1.Coord(0, 0), mapSize) ||
            !nextPos.Add(size).Inside(new Coord_1.Coord(0, 0), mapSize)) {
            return false;
        }
        return this.SetPos(nextPos, prevPos);
    }
    HandleMove(type) {
        switch (type) {
            case MoveType_1.MoveType.Blocked:
                return false;
            case MoveType_1.MoveType.Killed:
                this.Kill();
                return false;
            case MoveType_1.MoveType.Successed:
                return true;
        }
    }
    Attack(actor) {
        if (this.position.GetDistance(actor.GetPos()) > 1) {
            return false;
        }
        actor.Damage(this.damage);
    }
    Damage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.Kill();
        }
        this.map.OnUpdate.Call(this);
    }
    Kill() {
        this.health = 0;
        this.Dispose();
    }
    IsAlive() {
        return this.health > 0;
    }
}
exports.PlayerActor = PlayerActor;

},{"../../Coord":2,"../MoveType":10,"./BaseActor":3}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Coord_1 = require("../Coord");
const Helper_1 = require("../Util/Helper");
const Map_1 = require("../Map");
const Exportable_1 = require("../Exportable");
class BaseElement extends Exportable_1.Exportable {
    constructor(position = null, map = null) {
        super();
        this.position = position || new Coord_1.Coord;
        this.map = map || Map_1.Map.GetInstance();
        this.disposed = false;
        this.tag = Helper_1.Helper.Unique();
    }
    GetTag() {
        return this.tag;
    }
    ImportAll(input) {
        super.ImportAll(input);
        if (this.disposed) {
            this.Dispose();
        }
    }
    IsDisposed() {
        return this.disposed;
    }
    Dispose() {
        this.disposed = true;
    }
}
exports.BaseElement = BaseElement;

},{"../Coord":2,"../Exportable":12,"../Map":13,"../Util/Helper":23}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MoveType_1 = require("../MoveType");
const BaseElement_1 = require("../BaseElement");
class BaseCell extends BaseElement_1.BaseElement {
    constructor(position = null, map = null) {
        super(position, map);
        this.actors = [];
    }
    GetPos() {
        return this.position;
    }
    MoveHere(actor) {
        const tag = actor.GetTag();
        if (!this.actors.includes(tag)) {
            this.actors.push(tag);
            this.map.OnUpdate.Call(this);
        }
        return MoveType_1.MoveType.Successed;
    }
    MoveAway(actor) {
        const tag = actor.GetTag();
        const index = this.actors.indexOf(tag);
        if (index >= 0) {
            this.actors.splice(index, 1);
            this.map.OnUpdate.Call(this);
        }
    }
    Dispose() {
        if (this.disposed) {
            return;
        }
        super.Dispose();
        if (this instanceof BaseCell) {
            this.map.GetCells().Remove(this);
        }
    }
}
exports.BaseCell = BaseCell;

},{"../BaseElement":5,"../MoveType":10}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Coord_1 = require("../../Coord");
const BaseCell_1 = require("./BaseCell");
class GroundCell extends BaseCell_1.BaseCell {
    GetSize() {
        return new Coord_1.Coord(1.0, 1.0);
    }
    GetTexture() {
        return "res/ground.png";
    }
}
exports.GroundCell = GroundCell;

},{"../../Coord":2,"./BaseCell":6}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MoveType_1 = require("../MoveType");
const Coord_1 = require("../../Coord");
const BaseCell_1 = require("./BaseCell");
class StoneCell extends BaseCell_1.BaseCell {
    GetSize() {
        return new Coord_1.Coord(1.0, 1.0);
    }
    GetTexture() {
        return "res/stone.png";
    }
    MoveHere(actor) {
        return MoveType_1.MoveType.Blocked;
    }
}
exports.StoneCell = StoneCell;

},{"../../Coord":2,"../MoveType":10,"./BaseCell":6}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MoveType_1 = require("../MoveType");
const Coord_1 = require("../../Coord");
const BaseCell_1 = require("./BaseCell");
class WaterCell extends BaseCell_1.BaseCell {
    GetSize() {
        return new Coord_1.Coord(2.0, 1.0);
    }
    GetTexture() {
        return "res/water.png";
    }
    MoveHere(actor) {
        return MoveType_1.MoveType.Killed;
    }
}
exports.WaterCell = WaterCell;

},{"../../Coord":2,"../MoveType":10,"./BaseCell":6}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MoveType;
(function (MoveType) {
    MoveType[MoveType["Successed"] = 0] = "Successed";
    MoveType[MoveType["Blocked"] = 1] = "Blocked";
    MoveType[MoveType["Killed"] = 2] = "Killed";
})(MoveType = exports.MoveType || (exports.MoveType = {}));

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Coord_1 = require("./Coord");
const Helper_1 = require("./Util/Helper");
class ElementList {
    constructor(elements, onUpdate) {
        this.elements = elements;
        this.onUpdate = onUpdate;
    }
    GetLength() {
        return this.elements.length;
    }
    ForEach(callback) {
        return this.elements.some(callback);
    }
    Tag(tag) {
        return this.elements.find(e => e && e.GetTag() == tag);
    }
    Get(coord) {
        return this.elements.filter(e => e && e.GetPos().Is(coord));
    }
    GetNear(coord) {
        let result = null;
        let min = Infinity;
        this.elements.forEach(element => {
            if (!element) {
                return;
            }
            const size = element.GetSize();
            const center = element.GetPos().Add(size.F(n => n / 2));
            const distance = center.GetDistance(coord);
            if (distance < min) {
                min = distance;
                result = element;
            }
        });
        return result;
    }
    GetBetween(from, to) {
        const result = [];
        from = from.Floor();
        to = to.Ceil();
        this.elements.forEach(element => {
            if (!element) {
                return;
            }
            const cellFrom = element.GetPos();
            const cellTo = element.GetPos().Add(element.GetSize());
            if (Coord_1.Coord.Collide(from, to, cellFrom, cellTo)) {
                result.push(element);
            }
        });
        return result;
    }
    Set(element) {
        const old = this.Tag(element.GetTag());
        if (old) {
            Helper_1.Helper.Extract(old, element);
        }
        else {
            this.elements.push(element);
        }
        this.onUpdate.Call(element);
    }
    Remove(element) {
        const index = this.elements.indexOf(element);
        if (index >= 0) {
            this.elements.splice(index, 1);
            element.Dispose();
            this.onUpdate.Call(element);
            return true;
        }
        return false;
    }
    List() {
        return this.elements;
    }
}
exports.ElementList = ElementList;

},{"./Coord":2,"./Util/Helper":23}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Exportable {
    static FromName(name, ...args) {
        const find = (name) => {
            switch (name) {
                case "Coord":
                    return require("./Coord").Coord;
                case "GroundCell":
                    return require("./Element/Cell/GroundCell").GroundCell;
                case "StoneCell":
                    return require("./Element/Cell/StoneCell").StoneCell;
                case "WaterCell":
                    return require("./Element/Cell/WaterCell").WaterCell;
                case "PlayerActor":
                    return require("./Element/Actor/PlayerActor").PlayerActor;
                default:
                    return null;
            }
        };
        const classObj = find(name);
        return classObj && new classObj(...args);
    }
    ExportProperty(name) {
        return Exportable.Export(this[name], name);
    }
    ExportAll() {
        const result = [];
        for (let property in this) {
            const exported = this.ExportProperty(property);
            if (exported) {
                result.push(exported);
            }
        }
        return result;
    }
    static Export(object, name = null) {
        if (object instanceof Array) {
            return {
                Name: name,
                Class: object.constructor.name,
                Payload: object.map((e, i) => Exportable.Export(e, i.toString()))
            };
        }
        if (object instanceof Exportable) {
            return {
                Name: name,
                Class: object.constructor.name,
                Payload: object.ExportAll()
            };
        }
        if (["string", "number", "boolean"].includes(typeof object)) {
            return {
                Name: name,
                Class: typeof object,
                Payload: object
            };
        }
        return null;
    }
    ImportProperty(input) {
        return Exportable.Import(input);
    }
    ImportAll(input) {
        input instanceof Array && input.forEach(element => {
            const imported = this.ImportProperty(element);
            if (imported) {
                this[element.Name] = imported;
            }
        });
    }
    static Import(input) {
        if (input.Class == "Array") {
            return input.Payload.map(e => Exportable.Import(e));
        }
        if (["string", "number", "boolean"].includes(input.Class)) {
            return input.Payload;
        }
        const instance = Exportable.FromName(input.Class, ...(input.Args || []));
        instance && instance.ImportAll(input.Payload);
        return instance;
    }
}
exports.Exportable = Exportable;

},{"./Coord":2,"./Element/Actor/PlayerActor":4,"./Element/Cell/GroundCell":7,"./Element/Cell/StoneCell":8,"./Element/Cell/WaterCell":9}],13:[function(require,module,exports){
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
const Coord_1 = require("./Coord");
const Helper_1 = require("./Util/Helper");
const ElementList_1 = require("./ElementList");
const Exportable_1 = require("./Exportable");
const Event_1 = require("./Util/Event");
class Map {
    constructor() {
        this.cells = [];
        this.actors = [];
        this.size = new Coord_1.Coord();
        this.OnUpdate = new Event_1.Event();
    }
    static GetInstance() {
        if (Map.instance == undefined) {
            return Map.instance = new Map();
        }
        return Map.instance;
    }
    GetSize() {
        return this.size;
    }
    Init(size) {
        this.size = size.Clone();
        this.cells = [];
        this.actors = [];
        this.cells.forEach(cell => this.OnUpdate.Call(cell));
    }
    Load(url) {
        return __awaiter(this, void 0, void 0, function* () {
            let raw;
            try {
                raw = JSON.parse(yield Helper_1.Helper.Get(url)) || {};
                if (!raw.Size || !raw.Cells || !raw.Actors) {
                    return false;
                }
            }
            catch (e) {
                return false;
            }
            this.size = new Coord_1.Coord(raw.Size.X, raw.Size.Y);
            this.cells = [];
            this.actors = [];
            const parse = (data, out) => {
                const name = data.Class;
                const coord = new Coord_1.Coord(data.X, data.Y);
                const cell = Exportable_1.Exportable.FromName(name, coord, this);
                out.push(cell);
                this.OnUpdate.Call(cell);
            };
            raw.Cells.forEach(data => parse(data, this.cells));
            raw.Actors.forEach(data => parse(data, this.actors));
            return true;
        });
    }
    GetElements() {
        const all = this.cells.concat(this.actors);
        return new ElementList_1.ElementList(all, this.OnUpdate);
    }
    GetCells() {
        return new ElementList_1.ElementList(this.cells, this.OnUpdate);
    }
    GetActors() {
        return new ElementList_1.ElementList(this.actors, this.OnUpdate);
    }
}
exports.Map = Map;

},{"./Coord":2,"./ElementList":11,"./Exportable":12,"./Util/Event":22,"./Util/Helper":23}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MessageType_1 = require("./MessageType");
const Exportable_1 = require("../Exportable");
const BaseCell_1 = require("../Element/Cell/BaseCell");
const BaseActor_1 = require("../Element/Actor/BaseActor");
const Helper_1 = require("../Util/Helper");
const Coord_1 = require("../Coord");
const MessageHandler_1 = require("./MessageHandler");
class Client extends MessageHandler_1.MessageHandler {
    constructor(channel, map) {
        super(channel);
        this.OnPlayer = Helper_1.Helper.Noop;
        this.map = map;
    }
    OnMessage(message) {
        switch (message.Type) {
            case MessageType_1.MessageType.Element:
                this.SetElement(message.Payload);
                break;
            case MessageType_1.MessageType.Player:
                this.SetPlayer(message.Payload);
                break;
            case MessageType_1.MessageType.Size:
                this.SetSize(message.Payload);
                break;
            case MessageType_1.MessageType.Kick:
                this.Kick();
                break;
            default:
                break;
        }
    }
    SetElement(exportable) {
        exportable.Args = [null, this.map];
        const element = Exportable_1.Exportable.Import(exportable);
        if (element instanceof BaseCell_1.BaseCell) {
            this.map.GetCells().Set(element);
        }
        else if (element instanceof BaseActor_1.BaseActor) {
            this.map.GetActors().Set(element);
        }
    }
    SetPlayer(tag) {
        const player = this.map.GetActors().Tag(tag);
        this.OnPlayer(Helper_1.Helper.Hook(player, (target, prop, args) => {
            const exportable = Exportable_1.Exportable.Export([prop].concat(args));
            this.SendMessage(MessageType_1.MessageType.Command, exportable);
        }));
    }
    SetSize(exportable) {
        this.map.Init(Exportable_1.Exportable.Import(exportable));
    }
    Kick() {
        this.map.Init(new Coord_1.Coord(0, 0));
    }
}
exports.Client = Client;

},{"../Coord":2,"../Element/Actor/BaseActor":3,"../Element/Cell/BaseCell":6,"../Exportable":12,"../Util/Helper":23,"./MessageHandler":17,"./MessageType":18}],15:[function(require,module,exports){
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
const Helper_1 = require("../Util/Helper");
const Exportable_1 = require("../Exportable");
const MessageType_1 = require("./MessageType");
const MessageHandler_1 = require("./MessageHandler");
class Connection extends MessageHandler_1.MessageHandler {
    constructor(channel) {
        super(channel);
        this.OnCommand = Helper_1.Helper.Noop;
    }
    OnMessage(message) {
        switch (message.Type) {
            case MessageType_1.MessageType.Command:
                this.ParseCommand(message);
                break;
            default:
                break;
        }
    }
    ParseCommand(message) {
        this.OnCommand(message.Payload);
    }
    SetSize(size) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.SendMessage(MessageType_1.MessageType.Size, Exportable_1.Exportable.Export(size));
        });
    }
    SetElement(element) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.SendMessage(MessageType_1.MessageType.Element, Exportable_1.Exportable.Export(element));
        });
    }
    SetPlayer(player) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.player) {
                return Promise.resolve();
            }
            this.player = player;
            return this.SendMessage(MessageType_1.MessageType.Player, player.GetTag());
        });
    }
    GetPlayer() {
        return this.player;
    }
    Kick() {
        this.SendMessage(MessageType_1.MessageType.Kick, null);
    }
}
exports.Connection = Connection;

},{"../Exportable":12,"../Util/Helper":23,"./MessageHandler":17,"./MessageType":18}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Helper_1 = require("../Util/Helper");
class FakeChannel {
    constructor(delay = 0) {
        this.OnMessage = Helper_1.Helper.Noop;
        this.delay = delay;
    }
    SetOther(other) {
        this.other = other;
    }
    SendMessage(message) {
        if (this.other) {
            setTimeout(() => this.other.OnMessage(message), this.delay);
        }
    }
}
exports.FakeChannel = FakeChannel;

},{"../Util/Helper":23}],17:[function(require,module,exports){
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
const MessageType_1 = require("./MessageType");
const Event_1 = require("../Util/Event");
const Logger_1 = require("../Util/Logger");
const LogType_1 = require("../Util/LogType");
class MessageHandler {
    constructor(channel) {
        this.receivedEvent = new Event_1.Event();
        this.outIndex = 0;
        this.channel = channel;
        this.channel.OnMessage = (message) => this.ParseMessage(message);
    }
    ParseMessage(input) {
        let message;
        try {
            message = JSON.parse(input);
        }
        catch (e) {
            return;
        }
        switch (message.Type) {
            case MessageType_1.MessageType.Element:
                if (message.Index > this.inIndex || this.inIndex === undefined) {
                    this.inIndex = message.Index;
                    this.OnMessage(message);
                }
                this.SendReceived(message);
                break;
            case MessageType_1.MessageType.Command:
            case MessageType_1.MessageType.Player:
            case MessageType_1.MessageType.Kick:
            case MessageType_1.MessageType.Size:
                this.OnMessage(message);
                this.SendReceived(message);
                break;
            case MessageType_1.MessageType.Received:
                this.ParseReceived(message);
                break;
        }
        Logger_1.Logger.Log(this, LogType_1.LogType.Verbose, "Message received", message);
    }
    ParseReceived(message) {
        this.receivedEvent.Call(message.Payload);
    }
    SendReceived(message) {
        this.SendMessage(MessageType_1.MessageType.Received, message.Index);
    }
    SendMessage(type, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const message = {
                    Type: type,
                    Index: this.outIndex++,
                    Payload: payload
                };
                if (message.Type != MessageType_1.MessageType.Received) {
                    const listener = this.receivedEvent.Add(index => {
                        if (index === message.Index) {
                            this.receivedEvent.Remove(listener);
                            resolve();
                        }
                        else if (index === null) {
                            reject();
                        }
                    });
                }
                else {
                    resolve();
                }
                this.channel.SendMessage(JSON.stringify(message));
                Logger_1.Logger.Log(this, LogType_1.LogType.Verbose, "Message sent", message);
            });
        });
    }
}
exports.MessageHandler = MessageHandler;

},{"../Util/Event":22,"../Util/LogType":25,"../Util/Logger":26,"./MessageType":18}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MessageType;
(function (MessageType) {
    MessageType[MessageType["Size"] = 0] = "Size";
    MessageType[MessageType["Element"] = 1] = "Element";
    MessageType[MessageType["Player"] = 2] = "Player";
    MessageType[MessageType["Kick"] = 3] = "Kick";
    MessageType[MessageType["Command"] = 4] = "Command";
    MessageType[MessageType["Received"] = 5] = "Received";
})(MessageType = exports.MessageType || (exports.MessageType = {}));

},{}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Helper_1 = require("../Util/Helper");
class PeerChannel {
    constructor() {
        this.config = {
            "iceServers": [
                {
                    "urls": ["stun:stun.l.google.com:19302"]
                }
            ]
        };
        this.OnOpen = Helper_1.Helper.Noop;
        this.OnClose = Helper_1.Helper.Noop;
        this.OnMessage = Helper_1.Helper.Noop;
    }
    Offer() {
        if (this.peerConnection) {
            return Promise.reject();
        }
        return new Promise((resolve, reject) => {
            this.peerConnection = new RTCPeerConnection(this.config);
            this.dataChannel = this.peerConnection.createDataChannel("data");
            this.peerConnection.onicecandidate = e => {
                if (e.candidate == null) {
                    const offer = this.peerConnection.localDescription;
                    resolve(JSON.stringify(offer));
                }
            };
            this.peerConnection.createOffer().then(desc => this.peerConnection.setLocalDescription(desc), error => reject(error));
            this.dataChannel.onmessage = event => this.ParseMessage(event);
            this.dataChannel.onopen = () => this.OnOpen();
            this.dataChannel.onclose = () => this.OnClose();
        });
    }
    Answer(offer) {
        if (this.peerConnection) {
            return Promise.reject();
        }
        return new Promise((resolve, reject) => {
            this.peerConnection = new RTCPeerConnection(this.config);
            this.peerConnection.onicecandidate = e => {
                if (e.candidate == null) {
                    const answer = this.peerConnection.localDescription;
                    resolve(JSON.stringify(answer));
                }
            };
            this.peerConnection.ondatachannel = event => {
                this.dataChannel = event.channel;
                this.dataChannel.onmessage = event => this.ParseMessage(event);
                this.dataChannel.onopen = () => this.OnOpen();
                this.dataChannel.onclose = () => this.OnClose();
            };
            try {
                this.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer)));
                this.peerConnection.createAnswer().then(desc => this.peerConnection.setLocalDescription(desc), error => reject(error));
            }
            catch (e) {
                reject(e);
            }
        });
    }
    Finish(answer) {
        if (this.IsOfferor()) {
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer)));
        }
        else {
            throw new Error("Failed to finish negotiation!");
        }
    }
    ParseMessage(event) {
        if (event && event.data) {
            this.OnMessage(event.data);
        }
    }
    SendMessage(message) {
        if (this.IsOpen()) {
            this.dataChannel.send(message);
        }
    }
    IsOfferor() {
        return this.peerConnection && this.peerConnection.localDescription &&
            this.peerConnection.localDescription.type == "offer";
    }
    IsOpen() {
        return this.dataChannel && this.dataChannel.readyState == "open" &&
            this.peerConnection && this.peerConnection.signalingState == "stable";
    }
}
exports.PeerChannel = PeerChannel;

},{"../Util/Helper":23}],20:[function(require,module,exports){
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
const PlayerActor_1 = require("../Element/Actor/PlayerActor");
const Exportable_1 = require("../Exportable");
const Coord_1 = require("../Coord");
class Server {
    constructor(map) {
        this.conns = [];
        this.map = map;
        this.map.OnUpdate.Add(element => this.conns
            .filter(conn => element.GetTag() != conn.GetPlayer().GetTag())
            .forEach(conn => conn.SetElement(element)));
    }
    OnCommand(conn, command) {
        const args = Exportable_1.Exportable.Import(command);
        if (!args.length) {
            this.Kick(conn);
            return;
        }
        const player = conn.GetPlayer();
        player[args[0]].bind(player)(...args.slice(1));
    }
    Kick(conn) {
        const index = this.conns.indexOf(conn);
        if (index >= 0) {
            this.conns.splice(index, 1);
            this.map.GetActors().Remove(conn.GetPlayer());
            conn.Kick();
        }
    }
    Add(conn) {
        return __awaiter(this, void 0, void 0, function* () {
            const player = new PlayerActor_1.PlayerActor(new Coord_1.Coord(0, 0), this.map);
            this.map.GetActors().Set(player);
            yield conn.SetSize(this.map.GetSize());
            for (let actor of this.map.GetActors().List()) {
                yield conn.SetElement(actor);
            }
            for (let cell of this.map.GetCells().List()) {
                yield conn.SetElement(cell);
            }
            conn.OnCommand = command => this.OnCommand(conn, command);
            yield conn.SetPlayer(player);
            this.conns.push(conn);
        });
    }
}
exports.Server = Server;

},{"../Coord":2,"../Element/Actor/PlayerActor":4,"../Exportable":12}],21:[function(require,module,exports){
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
const Event_1 = require("./Util/Event");
class Renderer {
    constructor(map, canvas) {
        this.dpi = 30;
        this.textures = {};
        this.OnUpdate = new Event_1.Event();
        this.map = map;
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
    }
    Load() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const elements = this.map.GetElements();
                let i = 0;
                elements.ForEach(element => {
                    if (!element) {
                        i++;
                        return;
                    }
                    const id = element.GetTexture();
                    if (this.textures[id] !== undefined) {
                        i++;
                        return;
                    }
                    const texture = new Image();
                    texture.onerror = () => reject();
                    texture.onload = () => {
                        this.textures[id] = texture;
                        if (++i == elements.GetLength()) {
                            resolve();
                        }
                    };
                    texture.src = id;
                    this.textures[id] = null;
                });
            });
        });
    }
    Draw(element) {
        if (!element) {
            return;
        }
        const coord = element.GetPos();
        const size = element.GetSize();
        const texture = this.textures[element.GetTexture()];
        const x = coord.X;
        const y = coord.Y;
        const w = size.X;
        const h = size.Y;
        this.context.drawImage(texture, x * this.dpi, y * this.dpi, w * this.dpi, h * this.dpi);
    }
    Update() {
        const size = this.map.GetSize();
        this.canvas.width = this.dpi * size.X;
        this.canvas.height = this.dpi * size.Y;
        this.canvas.style.width = this.dpi * size.X + "px";
        this.canvas.style.height = this.dpi * size.Y + "px";
        this.map.GetCells().ForEach(e => this.Draw(e));
        this.map.GetActors().ForEach(e => this.Draw(e));
        if (!this.stop) {
            window.requestAnimationFrame(() => this.Update());
        }
        this.OnUpdate.Call(null);
    }
    Start() {
        this.stop = false;
        window.requestAnimationFrame(() => this.Update());
    }
    Stop() {
        this.stop = true;
    }
}
exports.Renderer = Renderer;

},{"./Util/Event":22}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Event {
    constructor() {
        this.listeners = {};
        this.count = 0;
    }
    Add(callback) {
        this.listeners[++this.count] = callback;
        return this.count;
    }
    Remove(id) {
        delete this.listeners[id];
    }
    Call(value) {
        Object.values(this.listeners).forEach(callback => callback(value));
    }
}
exports.Event = Event;

},{}],23:[function(require,module,exports){
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
class Helper {
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
            return yield Helper.Ajax(url, data, "POST");
        });
    }
    static Get(url) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Helper.Ajax(url, null, "GET");
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
    static Unique() {
        let date = new Date().getTime();
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
            const r = (date + Math.random() * 16) % 16 | 0;
            date = Math.floor(date / 16);
            return (c === "x" ? r : (r & 0x7 | 0x8)).toString(16);
        });
    }
    static IsUnique(text) {
        const re = RegExp("^[0-9a-fA-F]{8}-" +
            "[0-9a-fA-F]{4}-" +
            "4[0-9a-fA-F]{3}-" +
            "[0-9a-fA-F]{4}-" +
            "[0-9a-fA-F]{12}");
        return re.test(text);
    }
    static Hook(object, hook) {
        return new Proxy(object, {
            get: (target, prop, receiver) => {
                if (typeof target[prop] != "function") {
                    return Reflect.get(target, prop, receiver);
                }
                return (...args) => {
                    hook(target, prop, args);
                    return target[prop].bind(target)(...args);
                };
            }
        });
    }
    static ClipboardCopy(text) {
        return __awaiter(this, void 0, void 0, function* () {
            const fallback = (text) => __awaiter(this, void 0, void 0, function* () {
                return new Promise(resolve => {
                    var field = document.createElement("textarea");
                    field.value = text;
                    document.body.appendChild(field);
                    field.focus();
                    field.select();
                    try {
                        resolve(document.execCommand("copy"));
                    }
                    catch (e) {
                        resolve(false);
                    }
                    document.body.removeChild(field);
                });
            });
            if (!navigator.clipboard) {
                return fallback(text);
            }
            try {
                yield navigator.clipboard.writeText(text);
                return true;
            }
            catch (e) {
                return fallback(text);
            }
        });
    }
    static Wait(delay) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                setTimeout(() => resolve(), delay);
            });
        });
    }
    static Noop() {
        return;
    }
}
exports.Helper = Helper;

},{}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Keyboard {
    static OnKey(event, state) {
        Keyboard.Keys[event.key.toUpperCase()] = state;
        Keyboard.Keys[event.key.toLowerCase()] = state;
        Keyboard.Keys[event.keyCode] = state;
    }
    ;
    static Init() {
        if (Keyboard.Inited) {
            return;
        }
        Keyboard.Inited = true;
        window.addEventListener("keydown", e => Keyboard.OnKey(e, true), false);
        window.addEventListener("keyup", e => Keyboard.OnKey(e, false), false);
    }
}
Keyboard.Keys = {};
Keyboard.Inited = false;
exports.Keyboard = Keyboard;

},{}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LogType;
(function (LogType) {
    LogType[LogType["Silent"] = 0] = "Silent";
    LogType[LogType["Warn"] = 1] = "Warn";
    LogType[LogType["Info"] = 2] = "Info";
    LogType[LogType["Verbose"] = 3] = "Verbose";
})(LogType = exports.LogType || (exports.LogType = {}));

},{}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LogType_1 = require("./LogType");
class Logger {
    static Log(self, type, ...args) {
        if (this.Type >= type) {
            console.log(`(${type}) [${self.constructor.name}] `, ...args);
        }
    }
}
Logger.Type = LogType_1.LogType.Silent;
exports.Logger = Logger;

},{"./LogType":25}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd3d3L2luZGV4LnRzIiwic3JjL3d3dy9saWIvQ29vcmQudHMiLCJzcmMvd3d3L2xpYi9FbGVtZW50L0FjdG9yL0Jhc2VBY3Rvci50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvQWN0b3IvUGxheWVyQWN0b3IudHMiLCJzcmMvd3d3L2xpYi9FbGVtZW50L0Jhc2VFbGVtZW50LnRzIiwic3JjL3d3dy9saWIvRWxlbWVudC9DZWxsL0Jhc2VDZWxsLnRzIiwic3JjL3d3dy9saWIvRWxlbWVudC9DZWxsL0dyb3VuZENlbGwudHMiLCJzcmMvd3d3L2xpYi9FbGVtZW50L0NlbGwvU3RvbmVDZWxsLnRzIiwic3JjL3d3dy9saWIvRWxlbWVudC9DZWxsL1dhdGVyQ2VsbC50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvTW92ZVR5cGUudHMiLCJzcmMvd3d3L2xpYi9FbGVtZW50TGlzdC50cyIsInNyYy93d3cvbGliL0V4cG9ydGFibGUudHMiLCJzcmMvd3d3L2xpYi9NYXAudHMiLCJzcmMvd3d3L2xpYi9OZXQvQ2xpZW50LnRzIiwic3JjL3d3dy9saWIvTmV0L0Nvbm5lY3Rpb24udHMiLCJzcmMvd3d3L2xpYi9OZXQvRmFrZUNoYW5uZWwudHMiLCJzcmMvd3d3L2xpYi9OZXQvTWVzc2FnZUhhbmRsZXIudHMiLCJzcmMvd3d3L2xpYi9OZXQvTWVzc2FnZVR5cGUudHMiLCJzcmMvd3d3L2xpYi9OZXQvUGVlckNoYW5uZWwudHMiLCJzcmMvd3d3L2xpYi9OZXQvU2VydmVyLnRzIiwic3JjL3d3dy9saWIvUmVuZGVyZXIudHMiLCJzcmMvd3d3L2xpYi9VdGlsL0V2ZW50LnRzIiwic3JjL3d3dy9saWIvVXRpbC9IZWxwZXIudHMiLCJzcmMvd3d3L2xpYi9VdGlsL0tleWJvYXJkLnRzIiwic3JjL3d3dy9saWIvVXRpbC9Mb2dUeXBlLnRzIiwic3JjL3d3dy9saWIvVXRpbC9Mb2dnZXIudHMiXSwibmFt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ZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IHsgTWFwIH0gZnJvbSBcIi4vbGliL01hcFwiO1xuaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi9saWIvQ29vcmRcIjtcbmltcG9ydCB7IFBsYXllckFjdG9yIH0gZnJvbSAnLi9saWIvRWxlbWVudC9BY3Rvci9QbGF5ZXJBY3Rvcic7XG5pbXBvcnQgeyBTZXJ2ZXIgfSBmcm9tICcuL2xpYi9OZXQvU2VydmVyJztcbmltcG9ydCB7IFJlbmRlcmVyIH0gZnJvbSBcIi4vbGliL1JlbmRlcmVyXCI7XG5pbXBvcnQgeyBLZXlib2FyZCB9IGZyb20gXCIuL2xpYi9VdGlsL0tleWJvYXJkXCI7XG5pbXBvcnQgeyBDb25uZWN0aW9uIH0gZnJvbSBcIi4vbGliL05ldC9Db25uZWN0aW9uXCI7XG5pbXBvcnQgeyBGYWtlQ2hhbm5lbCB9IGZyb20gXCIuL2xpYi9OZXQvRmFrZUNoYW5uZWxcIjtcbmltcG9ydCB7IENsaWVudCB9IGZyb20gXCIuL2xpYi9OZXQvQ2xpZW50XCI7XG5pbXBvcnQgeyBQZWVyQ2hhbm5lbCB9IGZyb20gXCIuL2xpYi9OZXQvUGVlckNoYW5uZWxcIjtcbmltcG9ydCB7IEhlbHBlciB9IGZyb20gXCIuL2xpYi9VdGlsL0hlbHBlclwiO1xuXG4vLyBIVE1MIGVsZW1lbnRzXG5jb25zdCBnYW1lQ2FudmFzID0gPEhUTUxDYW52YXNFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZS1jYW52YXNcIik7XG5jb25zdCBhZGRCdXR0b24gPSA8SFRNTEJ1dHRvbkVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZGQtYnV0dG9uXCIpO1xuY29uc3QgbWVzc2FnZURpdiA9IDxIVE1MRGl2RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1lc3NhZ2UtZGl2XCIpO1xuXG4vLyBXaXJlIHVwIGxpc3RlbmVyc1xuYWRkQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiBDbGlja0FkZCgpO1xuXG4vLyBUYWIgSURcbmNvbnN0IHRhYklkID0gSGVscGVyLlVuaXF1ZSgpO1xuXG4vLyBHYW1lIG9iamVjdHNcbmNvbnN0IG1hcDogTWFwID0gbmV3IE1hcCgpO1xuXG4vLyBGb3IgY2xpZW50IG9yIHNlcnZlclxubGV0IGNsaWVudENoYW5uZWw6IFBlZXJDaGFubmVsID0gbnVsbDtcbmxldCBzZXJ2ZXI6IFNlcnZlciA9IG51bGw7XG5cbi8qKlxuICogVHlwZSBvZiB0aGUgaGFzaCBmb3JtYXQuXG4gKi9cbmVudW0gSGFzaFR5cGVcbntcbiAgICBPZmZlcixcbiAgICBBbnN3ZXJcbn1cblxuLyoqXG4gKiBTdHJ1Y3R1cmUgb2YgdGhlIGhhc2ggc3RyaW5nLlxuICovXG5pbnRlcmZhY2UgSGFzaEZvcm1hdFxue1xuICAgIFRhYjogc3RyaW5nO1xuICAgIFR5cGU6IEhhc2hUeXBlLFxuICAgIFBheWxvYWQ6IHN0cmluZztcbn1cblxuLyoqXG4gKiBNYWluIGZ1bmN0aW9uLlxuICovXG5jb25zdCBNYWluID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT5cbntcbiAgICBjb25zdCBoYXNoID0gUmVhZEhhc2goKTtcblxuICAgIC8vIElmIGl0IGlzIGFuIG9mZmVyLCBjcmVhdGUgYW4gYW5zd2VyIGFuZCB3YWl0IGZvciBhbiBvcGVuIGNoYW5uZWwuXG4gICAgaWYoaGFzaC5UeXBlID09IEhhc2hUeXBlLk9mZmVyKVxuICAgIHtcbiAgICAgICAgY2xpZW50Q2hhbm5lbCA9IG5ldyBQZWVyQ2hhbm5lbCgpO1xuICAgICAgICBjbGllbnRDaGFubmVsLk9uT3BlbiA9ICgpID0+IFN0YXJ0KCk7XG5cbiAgICAgICAgY29uc3QgYW5zd2VyID0gYXdhaXQgY2xpZW50Q2hhbm5lbC5BbnN3ZXIoaGFzaC5QYXlsb2FkKTtcbiAgICAgICAgY29uc3QgdXJsID0gQ29uc3RydWN0VXJsKHtcbiAgICAgICAgICAgIFRhYjogaGFzaC5UYWIsXG4gICAgICAgICAgICBUeXBlOiBIYXNoVHlwZS5BbnN3ZXIsXG4gICAgICAgICAgICBQYXlsb2FkOiBhbnN3ZXJcbiAgICAgICAgfSk7XG5cbiAgICAgICAgQ2xpcGJvYXJkQ29weSh1cmwpO1xuICAgICAgICBTZXRNZXNzYWdlKFwiQW5zd2VyIGNvcGllZCB0byBjbGlwYm9hcmQhXCIpO1xuICAgIH1cblxuICAgIC8vIElmIGl0IGlzIGFuIGFuc3dlciwgZ2l2ZSBpdCB0byB0aGUgc2VydmVyIHRhYiB1c2luZyB0aGUgbG9jYWwgc3RvcmFnZVxuICAgIGVsc2UgaWYoaGFzaC5UeXBlID09IEhhc2hUeXBlLkFuc3dlcilcbiAgICB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGhhc2guVGFiLCBoYXNoLlBheWxvYWQpO1xuICAgICAgICBTZXRNZXNzYWdlKFwiWW91IGNhbiBjbG9zZSB0aGlzIHRhYiFcIik7XG4gICAgfVxuXG4gICAgLy8gSWYgbm8gaGFzaCBpcyBwcmVzZW50LCBzdGFydCB0aGUgZ2FtZVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAgIFN0YXJ0KCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBTZXQgYSBtZXNzYWdlIG9uIHRoZSBzY3JlZW4uXG4gKiBAcGFyYW0gbWVzc2FnZSBcbiAqL1xuY29uc3QgU2V0TWVzc2FnZSA9IChtZXNzYWdlOiBzdHJpbmcpOiB2b2lkID0+XG57XG4gICAgbWVzc2FnZURpdi5pbm5lclRleHQgPSBtZXNzYWdlO1xufVxuXG4vKipcbiAqIENvcHkgdGV4dCB0byBjbGlwYm9hcmQuXG4gKiBAcGFyYW0gdGV4dCBcbiAqL1xuY29uc3QgQ2xpcGJvYXJkQ29weSA9IGFzeW5jICh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+ID0+XG57XG4gICAgY29uc3Qgc3VjY2VzcyA9IGF3YWl0IEhlbHBlci5DbGlwYm9hcmRDb3B5KHRleHQpO1xuXG4gICAgaWYoIXN1Y2Nlc3MpXG4gICAge1xuICAgICAgICBwcm9tcHQoXCJcIiwgdGV4dCk7XG4gICAgfVxufVxuXG4vKipcbiAqIENvbnN0cnVjdCBhIG5ldyBVUkwgZnJvbSBIYXNoRm9ybWF0LlxuICogQHBhcmFtIGhhc2hGb3JtYXQgXG4gKi9cbmNvbnN0IENvbnN0cnVjdFVybCA9IChoYXNoRm9ybWF0OiBIYXNoRm9ybWF0KTogc3RyaW5nID0+XG57XG4gICAgcmV0dXJuIGxvY2F0aW9uLm9yaWdpbiArIGxvY2F0aW9uLnBhdGhuYW1lICsgXCIjXCIgKyBcbiAgICAgICAgZW5jb2RlVVJJKGJ0b2EoSlNPTi5zdHJpbmdpZnkoaGFzaEZvcm1hdCkpKTtcbn07XG5cbi8qKlxuICogUmVhZCB0aGUgbG9jYXRpb24gaGFzaC5cbiAqL1xuY29uc3QgUmVhZEhhc2ggPSAoKTogSGFzaEZvcm1hdCA9Plxue1xuICAgIHRyeSBcbiAgICB7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKGF0b2IoZGVjb2RlVVJJKGxvY2F0aW9uLmhhc2guc3Vic3RyKDEpKSkpO1xuICAgIH1cbiAgICBjYXRjaChlKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFRhYjogbnVsbCxcbiAgICAgICAgICAgIFR5cGU6IG51bGwsXG4gICAgICAgICAgICBQYXlsb2FkOiBudWxsXG4gICAgICAgIH07XG4gICAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgYW4gb2ZmZXIuXG4gKi9cbmNvbnN0IENsaWNrQWRkID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT5cbntcbiAgICBpZighc2VydmVyKVxuICAgIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNoYW5uZWwgPSBuZXcgUGVlckNoYW5uZWwoKTtcbiAgICBjb25zdCBvZmZlciA9IGF3YWl0IGNoYW5uZWwuT2ZmZXIoKTtcbiAgICBjb25zdCB1cmwgPSBDb25zdHJ1Y3RVcmwoe1xuICAgICAgICBUYWI6IHRhYklkLFxuICAgICAgICBUeXBlOiBIYXNoVHlwZS5PZmZlcixcbiAgICAgICAgUGF5bG9hZDogb2ZmZXJcbiAgICB9KTtcbiAgICBcbiAgICBDbGlwYm9hcmRDb3B5KHVybCk7XG4gICAgU2V0TWVzc2FnZShcIk9mZmVyIGNvcGllZCB0byBjbGlwYm9hcmQhXCIpO1xuXG4gICAgY2hhbm5lbC5Pbk9wZW4gPSAoKSA9PiBcbiAgICB7XG4gICAgICAgIFNldE1lc3NhZ2UoXCJBIG5ldyBwbGF5ZXIgam9pbmVkIVwiKTtcbiAgICAgICAgc2VydmVyLkFkZChuZXcgQ29ubmVjdGlvbihjaGFubmVsKSk7XG4gICAgfTtcblxuICAgIHdoaWxlKHRydWUpXG4gICAge1xuICAgICAgICBjb25zdCBhbnN3ZXIgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSh0YWJJZCk7XG5cbiAgICAgICAgaWYoYW5zd2VyKVxuICAgICAgICB7XG4gICAgICAgICAgICBjaGFubmVsLkZpbmlzaChhbnN3ZXIpO1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0odGFiSWQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBIZWxwZXIuV2FpdCgxMDAwKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSBjbGllbnQgKGFuZCBzZXJ2ZXIpLlxuICovXG5jb25zdCBDcmVhdGVDbGllbnQgPSBhc3luYyAoKTogUHJvbWlzZTxDbGllbnQ+ID0+XG57XG4gICAgaWYoY2xpZW50Q2hhbm5lbCAmJiAhY2xpZW50Q2hhbm5lbC5Jc09mZmVyb3IoKSlcbiAgICB7XG4gICAgICAgIHJldHVybiBuZXcgQ2xpZW50KGNsaWVudENoYW5uZWwsIG1hcCk7XG4gICAgfVxuXG4gICAgLy8gU2hvdyBhZGQgYnV0dG9uXG4gICAgYWRkQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG5cbiAgICAvLyBDcmVhdGUgc2VydmVyIG1hcCwgbG9hZCBpdCwgY3JlYXRlIHNlcnZlclxuICAgIGNvbnN0IHNlcnZlck1hcDogTWFwID0gbmV3IE1hcCgpO1xuXG4gICAgYXdhaXQgc2VydmVyTWFwLkxvYWQoXCJyZXMvbWFwLmpzb25cIik7XG5cbiAgICBzZXJ2ZXIgPSBuZXcgU2VydmVyKHNlcnZlck1hcCk7XG5cbiAgICAvLyBDcmVhdGUgYSBmYWtlIGNoYW5uZWxcbiAgICBjb25zdCBsb2NhbEEgPSBuZXcgRmFrZUNoYW5uZWwoKTtcbiAgICBjb25zdCBsb2NhbEIgPSBuZXcgRmFrZUNoYW5uZWwoKTtcblxuICAgIGxvY2FsQS5TZXRPdGhlcihsb2NhbEIpO1xuICAgIGxvY2FsQi5TZXRPdGhlcihsb2NhbEEpO1xuXG4gICAgLy8gQWRkIGNvbm5lY3Rpb24gdG8gdGhlIHNlcnZlclxuICAgIHNlcnZlci5BZGQobmV3IENvbm5lY3Rpb24obG9jYWxBKSk7XG5cbiAgICAvLyBDb25uZWN0IGNsaWVudCB0byB0aGUgc2VydmVyXG4gICAgcmV0dXJuIG5ldyBDbGllbnQobG9jYWxCLCBtYXApO1xufVxuXG4vKipcbiAqIEdhbWUgY3ljbGVcbiAqIEBwYXJhbSBwbGF5ZXIgXG4gKiBAcGFyYW0gdXBcbiAqIEBwYXJhbSBsZWZ0XG4gKiBAcGFyYW0gZG93blxuICogQHBhcmFtIHJpZ2h0XG4gKi9cbmNvbnN0IE9uVXBkYXRlID0gKHBsYXllcjogUGxheWVyQWN0b3IsIHsgdXAsIGxlZnQsIGRvd24sIHJpZ2h0IH0pID0+XG57XG4gICAgY29uc3QgZGlyZWN0aW9uID0gbmV3IENvb3JkKFxuICAgICAgICBLZXlib2FyZC5LZXlzW2xlZnRdID8gLTAuMDUgOiBLZXlib2FyZC5LZXlzW3JpZ2h0XSA/IDAuMDUgOiAwLCBcbiAgICAgICAgS2V5Ym9hcmQuS2V5c1t1cF0gPyAtMC4wNSA6IEtleWJvYXJkLktleXNbZG93bl0gPyAwLjA1IDogMFxuICAgICk7XG5cbiAgICBpZihwbGF5ZXIgJiYgZGlyZWN0aW9uLkdldERpc3RhbmNlKG5ldyBDb29yZCkgPiAwKVxuICAgIHtcbiAgICAgICAgcGxheWVyLk1vdmUoZGlyZWN0aW9uKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFN0YXJ0IGdhbWUuXG4gKi9cbmNvbnN0IFN0YXJ0ID0gYXN5bmMgKCkgPT5cbntcbiAgICBLZXlib2FyZC5Jbml0KCk7XG5cbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCBDcmVhdGVDbGllbnQoKTtcbiAgICBjb25zdCByZW5kZXJlciA9IG5ldyBSZW5kZXJlcihtYXAsIGdhbWVDYW52YXMpO1xuXG4gICAgY2xpZW50Lk9uUGxheWVyID0gYXN5bmMgcGxheWVyID0+XG4gICAge1xuICAgICAgICBhd2FpdCByZW5kZXJlci5Mb2FkKCk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBrZXlzID0gXG4gICAgICAgIHtcbiAgICAgICAgICAgIHVwOiBcIkFSUk9XVVBcIiwgXG4gICAgICAgICAgICBsZWZ0OiBcIkFSUk9XTEVGVFwiLCBcbiAgICAgICAgICAgIGRvd246IFwiQVJST1dET1dOXCIsIFxuICAgICAgICAgICAgcmlnaHQ6IFwiQVJST1dSSUdIVFwiXG4gICAgICAgIH07XG5cbiAgICAgICAgcmVuZGVyZXIuT25VcGRhdGUuQWRkKCgpID0+IE9uVXBkYXRlKHBsYXllciwga2V5cykpO1xuICAgICAgICByZW5kZXJlci5TdGFydCgpO1xuICAgIH07XG59O1xuXG4vLyBTdGFydCB0aGUgbWFpbiBmdW5jdGlvblxuTWFpbigpOyIsImltcG9ydCB7IEV4cG9ydGFibGUgfSBmcm9tIFwiLi9FeHBvcnRhYmxlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb29yZCBleHRlbmRzIEV4cG9ydGFibGVcbntcbiAgICBwdWJsaWMgWDogbnVtYmVyO1xuICAgIHB1YmxpYyBZOiBudW1iZXI7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3QgYSBuZXcgY29vcmQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoeDogbnVtYmVyID0gMCwgeTogbnVtYmVyID0gMClcbiAgICB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5YID0geDtcbiAgICAgICAgdGhpcy5ZID0geTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGRpc3RhbmNlIGZyb20gdGhlIG90aGVyIGNvb3JkLlxuICAgICAqIEBwYXJhbSBvdGhlciBcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0RGlzdGFuY2Uob3RoZXI6IENvb3JkKTogbnVtYmVyXG4gICAge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHRoaXMuWCAtIG90aGVyLlgsIDIpICsgTWF0aC5wb3codGhpcy5ZIC0gb3RoZXIuWSwgMikpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHRoZSBjb29yZCBpcyB0aGUgc2FtZSBhcyBhbiBvdGhlci5cbiAgICAgKiBAcGFyYW0gb3RoZXIgXG4gICAgICovXG4gICAgcHVibGljIElzKG90aGVyOiBDb29yZCk6IGJvb2xlYW5cbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLlggPT0gb3RoZXIuWCAmJiB0aGlzLlkgPT0gb3RoZXIuWTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBjb29yZCB0byB0aGlzIG9uZS5cbiAgICAgKiBAcGFyYW0gb3RoZXIgXG4gICAgICovXG4gICAgcHVibGljIEFkZChvdGhlcjogQ29vcmQpOiBDb29yZFxuICAgIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb29yZCh0aGlzLlggKyBvdGhlci5YLCB0aGlzLlkgKyBvdGhlci5ZKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbG9uZSB0aGUgY29vcmQuXG4gICAgICovXG4gICAgcHVibGljIENsb25lKCk6IENvb3JkXG4gICAge1xuICAgICAgICByZXR1cm4gbmV3IENvb3JkKHRoaXMuWCwgdGhpcy5ZKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGbG9vciB0aGUgY29vcmRpbmF0ZXMuXG4gICAgICovXG4gICAgcHVibGljIEZsb29yKCk6IENvb3JkXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5GKG4gPT4gTWF0aC5mbG9vcihuKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2VpbCB0aGUgY29vcmRpbmF0ZXMuXG4gICAgICovXG4gICAgcHVibGljIENlaWwoKTogQ29vcmRcbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLkYobiA9PiBNYXRoLmNlaWwobikpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJvdW5kIHVwIHRoZSBjb29yZGluYXRlcy5cbiAgICAgKiBAcGFyYW0gZCBEZWNpbWFsIHBsYWNlcyB0byByb3VuZCB1cC5cbiAgICAgKi9cbiAgICBwdWJsaWMgUm91bmQoZCA9IDApOiBDb29yZFxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuRihuID0+IE1hdGgucm91bmQobiAqIE1hdGgucG93KDEwLCBkKSkgLyBNYXRoLnBvdygxMCwgZCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHRoZSBjb29yZGluYXRlIGlzIGluc2lkZSB0aGUgaW50ZXJzZWN0aW9uIG9mIHR3byBwb2ludHMuXG4gICAgICogQHBhcmFtIGZyb20gXG4gICAgICogQHBhcmFtIHRvIFxuICAgICAqL1xuICAgIHB1YmxpYyBJbnNpZGUoZnJvbTogQ29vcmQsIHRvOiBDb29yZCk6IGJvb2xlYW5cbiAgICB7XG4gICAgICAgIGlmKGZyb20uWCA8PSB0aGlzLlggJiYgZnJvbS5ZIDw9IHRoaXMuWSAmJiB0by5YID49IHRoaXMuWCAmJiB0by5ZID49IHRoaXMuWSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdHdvIG9iamVjdHMgYWxsIGNvbGxpZGUuXG4gICAgICogQHBhcmFtIGEgQSBmcm9tIHBvaW50XG4gICAgICogQHBhcmFtIGFzIEEgdG8gcG9pbnRcbiAgICAgKiBAcGFyYW0gYiBCIGZyb20gcG9pbnRcbiAgICAgKiBAcGFyYW0gYnMgQiB0byBwb2ludFxuICAgICAqL1xuICAgIHN0YXRpYyBDb2xsaWRlKGE6IENvb3JkLCBhczogQ29vcmQsIGI6IENvb3JkLCBiczogQ29vcmQpOiBib29sZWFuXG4gICAge1xuICAgICAgICByZXR1cm4gYXMuWCA+IGIuWCAmJiBhLlggPCBicy5YICYmIGFzLlkgPiBiLlkgJiYgYS5ZIDwgYnMuWTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlIGEgZnVuY3Rpb24gb24gdGhlIGNvb3JkaW5hdGVzLlxuICAgICAqIEBwYXJhbSBmIEZ1bmN0aW9uIHRvIGV4ZWN1dGUuXG4gICAgICovXG4gICAgcHVibGljIEYoZjogKG46IG51bWJlcikgPT4gbnVtYmVyKTogQ29vcmRcbiAgICB7XG4gICAgICAgIHJldHVybiBuZXcgQ29vcmQoZih0aGlzLlgpLCBmKHRoaXMuWSkpO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuLi8uLi9Db29yZFwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vQmFzZUVsZW1lbnRcIjtcbmltcG9ydCB7IElFeHBvcnRPYmplY3QgfSBmcm9tIFwiLi4vLi4vSUV4cG9ydE9iamVjdFwiO1xuaW1wb3J0IHsgTW92ZVR5cGUgfSBmcm9tIFwiLi4vTW92ZVR5cGVcIjtcbmltcG9ydCB7IE1hcCB9IGZyb20gXCIuLi8uLi9NYXBcIjtcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VBY3RvciBleHRlbmRzIEJhc2VFbGVtZW50XG57XG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0IGEgbmV3IEJhc2VBY3Rvci4gQWJzdHJhY3QhXG4gICAgICogQHBhcmFtIHBvc2l0aW9uXG4gICAgICovXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHBvc2l0aW9uOiBDb29yZCA9IG51bGwsIG1hcDogTWFwID0gbnVsbClcbiAgICB7XG4gICAgICAgIHN1cGVyKHBvc2l0aW9uLCBtYXApO1xuICAgICAgICB0aGlzLlNldFBvcyh0aGlzLnBvc2l0aW9uKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBwb3NpdGlvbiBvZiB0aGUgYWN0b3IuXG4gICAgICovXG4gICAgcHVibGljIEdldFBvcygpOiBDb29yZFxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucG9zaXRpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBwb3NpdGlvbiBvZiB0aGUgYWN0b3IuXG4gICAgICogQHBhcmFtIHBvc2l0aW9uIFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBTZXRQb3MobmV4dFBvczogQ29vcmQgPSBudWxsLCBwcmV2UG9zOiBDb29yZCA9IG51bGwpOiBib29sZWFuXG4gICAge1xuICAgICAgICBjb25zdCBjZWxscyA9IHRoaXMubWFwLkdldENlbGxzKCk7XG5cbiAgICAgICAgLy8gR2V0IHRoZSBjdXJyZW50bHkgY292ZXJlZCBjZWxscyBhbmQgdGhlIG5leHQgb25lc1xuICAgICAgICBjb25zdCBwcmV2ID0gcHJldlBvcyBcbiAgICAgICAgICAgID8gY2VsbHMuR2V0QmV0d2VlbihwcmV2UG9zLCBwcmV2UG9zLkFkZCh0aGlzLkdldFNpemUoKSkpXG4gICAgICAgICAgICA6IFtdO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgbmV4dCA9IG5leHRQb3NcbiAgICAgICAgICAgID8gY2VsbHMuR2V0QmV0d2VlbihuZXh0UG9zLCBuZXh0UG9zLkFkZCh0aGlzLkdldFNpemUoKSkpXG4gICAgICAgICAgICA6IFtdO1xuXG4gICAgICAgIC8vIElmIHByZXZQb3MvbmV4dFBvcyB3YXMgZ2l2ZW4sIGJ1dCBubyBjZWxscyBmb3VuZCwgcmV0dXJuXG4gICAgICAgIGlmKChwcmV2UG9zICYmICFwcmV2Lmxlbmd0aCkgfHwgKG5leHRQb3MgJiYgIW5leHQubGVuZ3RoKSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIGludGVyc2VjdGlvbiBcbiAgICAgICAgY29uc3QgcHJldkZpbHRlcmVkID0gcHJldi5maWx0ZXIoYyA9PiAhbmV4dC5pbmNsdWRlcyhjKSk7XG4gICAgICAgIGNvbnN0IG5leHRGaWx0ZXJlZCA9IG5leHQuZmlsdGVyKGMgPT4gIXByZXYuaW5jbHVkZXMoYykpO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIG9uZSBvZiB0aGUgY2VsbHMgYmxvY2tzIHRoZSBtb3ZlbWVudC5cbiAgICAgICAgLy8gSWYgeWVzLCByZXZlcnQgYWxsIG1vdmVtZW50IGFuZCByZXR1cm4uXG4gICAgICAgIGlmKG5leHRGaWx0ZXJlZC5zb21lKGNlbGwgPT4gIXRoaXMuSGFuZGxlTW92ZShjZWxsLk1vdmVIZXJlKHRoaXMpKSkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIG5leHRGaWx0ZXJlZC5mb3JFYWNoKGMgPT4gYy5Nb3ZlQXdheSh0aGlzKSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBpdCB3YXMgc3VjY2Vzc2Z1bCwgbW92ZSBhd2F5IGZyb20gdGhlIG9sZCBjZWxsc1xuICAgICAgICBwcmV2RmlsdGVyZWQuZm9yRWFjaChjID0+IGMuTW92ZUF3YXkodGhpcykpO1xuXG4gICAgICAgIC8vIFVwZGF0ZSBwb3NpdGlvblxuICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV4dFBvcztcblxuICAgICAgICAvLyBVcGRhdGUgbWFwXG4gICAgICAgIHRoaXMubWFwLk9uVXBkYXRlLkNhbGwodGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGlzcG9zZSB0aGUgY2VsbC5cbiAgICAgKi9cbiAgICBwdWJsaWMgRGlzcG9zZSgpOiB2b2lkXG4gICAge1xuICAgICAgICBpZih0aGlzLmRpc3Bvc2VkKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHN1cGVyLkRpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5TZXRQb3MoKTtcblxuICAgICAgICBpZih0aGlzIGluc3RhbmNlb2YgQmFzZUFjdG9yKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLm1hcC5HZXRBY3RvcnMoKS5SZW1vdmUodGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYWJzdHJhY3QgSGFuZGxlTW92ZSh0eXBlOiBNb3ZlVHlwZSk6IGJvb2xlYW47XG4gICAgcHVibGljIGFic3RyYWN0IEdldFNpemUoKTogQ29vcmQ7XG4gICAgcHVibGljIGFic3RyYWN0IEdldFRleHR1cmUoKTogc3RyaW5nO1xufSIsImltcG9ydCB7IEJhc2VBY3RvciB9IGZyb20gXCIuL0Jhc2VBY3RvclwiO1xuaW1wb3J0IHsgTW92ZVR5cGUgfSBmcm9tIFwiLi4vTW92ZVR5cGVcIjtcbmltcG9ydCB7IENvb3JkIH0gZnJvbSBcIi4uLy4uL0Nvb3JkXCI7XG5cbmV4cG9ydCBjbGFzcyBQbGF5ZXJBY3RvciBleHRlbmRzIEJhc2VBY3Rvclxue1xuICAgIHByb3RlY3RlZCBoZWFsdGg6IG51bWJlciA9IDEuMDtcbiAgICBwcm90ZWN0ZWQgZGFtYWdlOiBudW1iZXIgPSAxLjA7XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHRleHR1cmUgb2YgdGhlIGFjdG9yLlxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRUZXh0dXJlKCk6IHN0cmluZ1xuICAgIHtcbiAgICAgICAgcmV0dXJuIFwicmVzL3BsYXllci5wbmdcIjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHNpemUgb2YgdGhlIGFjdG9yLlxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRTaXplKCk6IENvb3JkXG4gICAge1xuICAgICAgICByZXR1cm4gbmV3IENvb3JkKDAuOCwgMC44KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNb3ZlIGFjdG9yIGluIGEgZGlyZWN0aW9uLlxuICAgICAqIEBwYXJhbSBkaXJlY3Rpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgTW92ZShkaXJlY3Rpb246IENvb3JkKTogYm9vbGVhblxuICAgIHtcbiAgICAgICAgaWYoZGlyZWN0aW9uLkdldERpc3RhbmNlKG5ldyBDb29yZCgwLCAwKSkgPT0gMClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBEb2VzIG5vdCBhbGxvdyAwIGRpc3RhbmNlIG1vdmVtZW50XG4gICAgICAgIH1cblxuICAgICAgICBpZihNYXRoLmFicyhNYXRoLmFicyhkaXJlY3Rpb24uWCkgLSBNYXRoLmFicyhkaXJlY3Rpb24uWSkpID09IDApXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gT25seSBhbGxvdyBsZWZ0LCByaWdodCwgdG9wIGFuZCBib3R0b20gbW92ZW1lbnRcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gR2V0IHNpemVzXG4gICAgICAgIGNvbnN0IHNpemUgPSB0aGlzLkdldFNpemUoKTtcbiAgICAgICAgY29uc3QgbWFwU2l6ZSA9IHRoaXMubWFwLkdldFNpemUoKTtcblxuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIG5leHQgcG9zaXRpb25cbiAgICAgICAgY29uc3QgcHJldlBvcyA9IHRoaXMuR2V0UG9zKCkuUm91bmQoMyk7XG4gICAgICAgIGNvbnN0IG5leHRQb3MgPSBwcmV2UG9zLkFkZChkaXJlY3Rpb24pLlJvdW5kKDMpO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIGl0IGdvZXMgb3V0IG9mIHRoZSBtYXBcbiAgICAgICAgaWYoIW5leHRQb3MuSW5zaWRlKG5ldyBDb29yZCgwLCAwKSwgbWFwU2l6ZSkgfHwgXG4gICAgICAgICAgICAhbmV4dFBvcy5BZGQoc2l6ZSkuSW5zaWRlKG5ldyBDb29yZCgwLCAwKSwgbWFwU2l6ZSkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLlNldFBvcyhuZXh0UG9zLCBwcmV2UG9zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgbW92ZW1lbnQgdHlwZXMuXG4gICAgICogQHBhcmFtIHR5cGUgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIEhhbmRsZU1vdmUodHlwZTogTW92ZVR5cGUpOiBib29sZWFuXG4gICAge1xuICAgICAgICBzd2l0Y2godHlwZSlcbiAgICAgICAge1xuICAgICAgICAgICAgY2FzZSBNb3ZlVHlwZS5CbG9ja2VkOiAvLyBEbyBub3RoaW5nXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgY2FzZSBNb3ZlVHlwZS5LaWxsZWQ6IC8vIEtpbGwgaXRcbiAgICAgICAgICAgICAgICB0aGlzLktpbGwoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBjYXNlIE1vdmVUeXBlLlN1Y2Nlc3NlZDogLy8gTW92ZSBhd2F5XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBdHRhY2sgYW4gb3RoZXIgYWN0b3IgaWYgaXQgaXMgb25lIGNlbGwgYXdheS5cbiAgICAgKiBAcGFyYW0gYWN0b3IgXG4gICAgICovXG4gICAgcHVibGljIEF0dGFjayhhY3RvcjogUGxheWVyQWN0b3IpOiBib29sZWFuXG4gICAge1xuICAgICAgICBpZih0aGlzLnBvc2l0aW9uLkdldERpc3RhbmNlKGFjdG9yLkdldFBvcygpKSA+IDEpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFjdG9yLkRhbWFnZSh0aGlzLmRhbWFnZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRG8gZGFtYWdlIHRvIHRoaXMgYWN0b3IuXG4gICAgICogQHBhcmFtIGRhbWFnZSBBbW91bnQgb2YgdGhlIGRhbWFnZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgRGFtYWdlKGRhbWFnZTogbnVtYmVyKTogdm9pZFxuICAgIHtcbiAgICAgICAgdGhpcy5oZWFsdGggLT0gZGFtYWdlO1xuXG4gICAgICAgIGlmKHRoaXMuaGVhbHRoIDw9IDApXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuS2lsbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5tYXAuT25VcGRhdGUuQ2FsbCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBLaWxsIHRoZSBhY3Rvci5cbiAgICAgKi9cbiAgICBwcml2YXRlIEtpbGwoKTogdm9pZFxuICAgIHtcbiAgICAgICAgdGhpcy5oZWFsdGggPSAwO1xuICAgICAgICBcbiAgICAgICAgLy8gRGlzcG9zZVxuICAgICAgICB0aGlzLkRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0aGUgYWN0b3IgaXMgYWxpdmUuXG4gICAgICovXG4gICAgcHVibGljIElzQWxpdmUoKTogYm9vbGVhblxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGVhbHRoID4gMDtcbiAgICB9XG59IiwiaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi4vQ29vcmRcIjtcbmltcG9ydCB7IEhlbHBlciB9IGZyb20gXCIuLi9VdGlsL0hlbHBlclwiO1xuaW1wb3J0IHsgTWFwIH0gZnJvbSBcIi4uL01hcFwiO1xuaW1wb3J0IHsgRXhwb3J0YWJsZSB9IGZyb20gXCIuLi9FeHBvcnRhYmxlXCI7XG5pbXBvcnQgeyBJRXhwb3J0T2JqZWN0IH0gZnJvbSBcIi4uL0lFeHBvcnRPYmplY3RcIjtcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VFbGVtZW50IGV4dGVuZHMgRXhwb3J0YWJsZVxue1xuICAgIHByb3RlY3RlZCByZWFkb25seSBtYXA6IE1hcDtcblxuICAgIHByb3RlY3RlZCBkaXNwb3NlZDogYm9vbGVhbjtcbiAgICBwcm90ZWN0ZWQgcG9zaXRpb246IENvb3JkO1xuICAgIHByb3RlY3RlZCB0YWc6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yIG9mIHRoZSBCYXNlRWxlbWVudC4gQWJzdHJhY3QhXG4gICAgICogQHBhcmFtIHBvc2l0aW9uXG4gICAgICovXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHBvc2l0aW9uOiBDb29yZCA9IG51bGwsIG1hcDogTWFwID0gbnVsbClcbiAgICB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uIHx8IG5ldyBDb29yZDtcbiAgICAgICAgdGhpcy5tYXAgPSBtYXAgfHwgTWFwLkdldEluc3RhbmNlKCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmRpc3Bvc2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGFnID0gSGVscGVyLlVuaXF1ZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdGFnIG9mIHRoZSBlbGVtZW50LlxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRUYWcoKTogc3RyaW5nXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy50YWc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT3ZlcnJpZGUgaW1wb3J0IGFsbCB0byBoYW5kbGUgcmVtb3ZhbCBmcm9tIHRoZSBtYXAuXG4gICAgICogQHBhcmFtIGlucHV0XG4gICAgICovXG4gICAgcHVibGljIEltcG9ydEFsbChpbnB1dDogSUV4cG9ydE9iamVjdFtdKTogdm9pZFxuICAgIHtcbiAgICAgICAgc3VwZXIuSW1wb3J0QWxsKGlucHV0KTtcblxuICAgICAgICBpZih0aGlzLmRpc3Bvc2VkKVxuICAgICAgICB7XG4gICAgICAgICAgICAvLyBJbiBCYXNlRWxlbWVudCB0aGlzIG1ha2VzIG5vIHNlbnNlLFxuICAgICAgICAgICAgLy8gYnV0IGluIGl0cyBjaGlsZHMgdGhlIGVsZW1lbnQgbmVlZHNcbiAgICAgICAgICAgIC8vIHRvIGJlIHJlbW92ZWQgZnJvbSB0aGUgbWFwXG4gICAgICAgICAgICB0aGlzLkRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHRoZSBlbGVtZW50IGlzIGRpc3Bvc2VkLlxuICAgICAqL1xuICAgIHB1YmxpYyBJc0Rpc3Bvc2VkKCk6IGJvb2xlYW5cbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLmRpc3Bvc2VkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERpc3Bvc2UgdGhlIGVsZW1lbnQuXG4gICAgICovXG4gICAgcHVibGljIERpc3Bvc2UoKTogdm9pZFxuICAgIHtcbiAgICAgICAgdGhpcy5kaXNwb3NlZCA9IHRydWU7XG4gICAgfVxuICAgIFxuICAgIHB1YmxpYyBhYnN0cmFjdCBHZXRTaXplKCk6IENvb3JkO1xuICAgIHB1YmxpYyBhYnN0cmFjdCBHZXRUZXh0dXJlKCk6IHN0cmluZztcbiAgICBwdWJsaWMgYWJzdHJhY3QgR2V0UG9zKCk6IENvb3JkO1xufSIsImltcG9ydCB7IEJhc2VBY3RvciB9IGZyb20gXCIuLi9BY3Rvci9CYXNlQWN0b3JcIjtcbmltcG9ydCB7IE1vdmVUeXBlIH0gZnJvbSBcIi4uL01vdmVUeXBlXCI7XG5pbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuLi8uLi9Db29yZFwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vQmFzZUVsZW1lbnRcIjtcbmltcG9ydCB7IE1hcCB9IGZyb20gXCIuLi8uLi9NYXBcIjtcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VDZWxsIGV4dGVuZHMgQmFzZUVsZW1lbnRcbntcbiAgICBwcm90ZWN0ZWQgYWN0b3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0IGEgQmFzZUNlbGwuIEFic3RyYWN0IVxuICAgICAqIEBwYXJhbSBwb3NpdGlvblxuICAgICAqL1xuICAgIHB1YmxpYyBjb25zdHJ1Y3Rvcihwb3NpdGlvbjogQ29vcmQgPSBudWxsLCBtYXA6IE1hcCA9IG51bGwpXG4gICAge1xuICAgICAgICBzdXBlcihwb3NpdGlvbiwgbWFwKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBwb3NpdGlvbiBvZiB0aGUgY2VsbC5cbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0UG9zKCk6IENvb3JkIFxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucG9zaXRpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRW50ZXIgaW50byB0aGUgY2VsbCB3aXRoIGFuIGFjdG9yLlxuICAgICAqIEBwYXJhbSBhY3RvciBcbiAgICAgKi9cbiAgICBwdWJsaWMgTW92ZUhlcmUoYWN0b3I6IEJhc2VBY3Rvcik6IE1vdmVUeXBlIFxuICAgIHtcbiAgICAgICAgY29uc3QgdGFnID0gYWN0b3IuR2V0VGFnKCk7XG5cbiAgICAgICAgaWYoIXRoaXMuYWN0b3JzLmluY2x1ZGVzKHRhZykpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuYWN0b3JzLnB1c2godGFnKTtcbiAgICAgICAgICAgIHRoaXMubWFwLk9uVXBkYXRlLkNhbGwodGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gTW92ZVR5cGUuU3VjY2Vzc2VkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExlYXZlIGNlbGwgdGhlIGNlbGwgd2l0aCBhbiBhY3Rvci5cbiAgICAgKiBAcGFyYW0gYWN0b3IgXG4gICAgICovXG4gICAgcHVibGljIE1vdmVBd2F5KGFjdG9yOiBCYXNlQWN0b3IpOiB2b2lkIFxuICAgIHtcbiAgICAgICAgY29uc3QgdGFnID0gYWN0b3IuR2V0VGFnKCk7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5hY3RvcnMuaW5kZXhPZih0YWcpO1xuXG4gICAgICAgIGlmKGluZGV4ID49IDApIFxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmFjdG9ycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgdGhpcy5tYXAuT25VcGRhdGUuQ2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERpc3Bvc2UgdGhlIGNlbGwuXG4gICAgICovXG4gICAgcHVibGljIERpc3Bvc2UoKTogdm9pZFxuICAgIHtcbiAgICAgICAgaWYodGhpcy5kaXNwb3NlZClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc3VwZXIuRGlzcG9zZSgpO1xuXG4gICAgICAgIGlmKHRoaXMgaW5zdGFuY2VvZiBCYXNlQ2VsbClcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5tYXAuR2V0Q2VsbHMoKS5SZW1vdmUodGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcHVibGljIGFic3RyYWN0IEdldFNpemUoKTogQ29vcmQ7XG4gICAgcHVibGljIGFic3RyYWN0IEdldFRleHR1cmUoKTogc3RyaW5nO1xufSIsImltcG9ydCB7IENvb3JkIH0gZnJvbSBcIi4uLy4uL0Nvb3JkXCI7XG5pbXBvcnQgeyBCYXNlQ2VsbCB9IGZyb20gXCIuL0Jhc2VDZWxsXCI7XG5cbmV4cG9ydCBjbGFzcyBHcm91bmRDZWxsIGV4dGVuZHMgQmFzZUNlbGxcbntcbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHNpemUgb2YgdGhlIGNlbGwuXG4gICAgICovXG4gICAgcHVibGljIEdldFNpemUoKTogQ29vcmRcbiAgICB7XG4gICAgICAgIHJldHVybiBuZXcgQ29vcmQoMS4wLCAxLjApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdGV4dHVyZSBvZiB0aGUgY2VsbC5cbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0VGV4dHVyZSgpOiBzdHJpbmdcbiAgICB7XG4gICAgICAgIHJldHVybiBcInJlcy9ncm91bmQucG5nXCI7XG4gICAgfVxufSIsImltcG9ydCB7IEJhc2VBY3RvciB9IGZyb20gXCIuLi9BY3Rvci9CYXNlQWN0b3JcIjtcbmltcG9ydCB7IE1vdmVUeXBlIH0gZnJvbSBcIi4uL01vdmVUeXBlXCI7XG5pbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuLi8uLi9Db29yZFwiO1xuaW1wb3J0IHsgQmFzZUNlbGwgfSBmcm9tIFwiLi9CYXNlQ2VsbFwiO1xuXG5leHBvcnQgY2xhc3MgU3RvbmVDZWxsIGV4dGVuZHMgQmFzZUNlbGxcbntcbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHNpemUgb2YgdGhlIGNlbGwuXG4gICAgICovXG4gICAgcHVibGljIEdldFNpemUoKTogQ29vcmRcbiAgICB7XG4gICAgICAgIHJldHVybiBuZXcgQ29vcmQoMS4wLCAxLjApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdGV4dHVyZSBvZiB0aGUgY2VsbC5cbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0VGV4dHVyZSgpOiBzdHJpbmdcbiAgICB7XG4gICAgICAgIHJldHVybiBcInJlcy9zdG9uZS5wbmdcIjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbnRlciBhIGNlbGwgd2l0aCBhIGFjdG9yIGFuZCBibG9jayBpdC5cbiAgICAgKiBAcGFyYW0gYWN0b3IgXG4gICAgICovXG4gICAgcHVibGljIE1vdmVIZXJlKGFjdG9yOiBCYXNlQWN0b3IpOiBNb3ZlVHlwZSBcbiAgICB7XG4gICAgICAgIHJldHVybiBNb3ZlVHlwZS5CbG9ja2VkO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBHcm91bmRDZWxsIH0gZnJvbSBcIi4vR3JvdW5kQ2VsbFwiXG5pbXBvcnQgeyBCYXNlQWN0b3IgfSBmcm9tIFwiLi4vQWN0b3IvQmFzZUFjdG9yXCI7XG5pbXBvcnQgeyBNb3ZlVHlwZSB9IGZyb20gXCIuLi9Nb3ZlVHlwZVwiO1xuaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi4vLi4vQ29vcmRcIjtcbmltcG9ydCB7IEJhc2VDZWxsIH0gZnJvbSBcIi4vQmFzZUNlbGxcIjtcblxuZXhwb3J0IGNsYXNzIFdhdGVyQ2VsbCBleHRlbmRzIEJhc2VDZWxsXG57XG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBzaXplIG9mIHRoZSBjZWxsLlxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRTaXplKCk6IENvb3JkXG4gICAge1xuICAgICAgICByZXR1cm4gbmV3IENvb3JkKDIuMCwgMS4wKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHRleHR1cmUgb2YgdGhlIGNlbGwuXG4gICAgICovXG4gICAgcHVibGljIEdldFRleHR1cmUoKTogc3RyaW5nXG4gICAge1xuICAgICAgICByZXR1cm4gXCJyZXMvd2F0ZXIucG5nXCI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRW50ZXIgYSBjZWxsIHdpdGggYSBhY3RvciBhbmQga2lsbCBpdC5cbiAgICAgKiBAcGFyYW0gYWN0b3IgXG4gICAgICovXG4gICAgcHVibGljIE1vdmVIZXJlKGFjdG9yOiBCYXNlQWN0b3IpOiBNb3ZlVHlwZSBcbiAgICB7XG4gICAgICAgIHJldHVybiBNb3ZlVHlwZS5LaWxsZWQ7XG4gICAgfVxufSIsImV4cG9ydCBlbnVtIE1vdmVUeXBlXG57XG4gICAgU3VjY2Vzc2VkLFxuICAgIEJsb2NrZWQsXG4gICAgS2lsbGVkXG59IiwiaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi9Db29yZFwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9FbGVtZW50L0Jhc2VFbGVtZW50XCI7XG5pbXBvcnQgeyBJUmVhZE9ubHlFbGVtZW50TGlzdCB9IGZyb20gXCIuL0lSZWFkT25seUVsZW1lbnRMaXN0XCI7XG5pbXBvcnQgeyBIZWxwZXIgfSBmcm9tIFwiLi9VdGlsL0hlbHBlclwiO1xuaW1wb3J0IHsgRXZlbnQgfSBmcm9tIFwiLi9VdGlsL0V2ZW50XCI7XG5cbmV4cG9ydCBjbGFzcyBFbGVtZW50TGlzdDxFbGVtZW50IGV4dGVuZHMgQmFzZUVsZW1lbnQ+IGltcGxlbWVudHMgSVJlYWRPbmx5RWxlbWVudExpc3Q8RWxlbWVudD5cbntcbiAgICBwcml2YXRlIGVsZW1lbnRzOiBFbGVtZW50W107XG4gICAgcHJpdmF0ZSBvblVwZGF0ZTogRXZlbnQ8RWxlbWVudD47XG5cbiAgICAvKipcbiAgICAgKiBDb250c3RydWN0IGEgbmV3IEVsZW1lbnRMaXN0IHdoaWNoIHdyYXBzIGFuIGVsZW1lbnQgYXJyYXlcbiAgICAgKiBhbmQgYWRkcyBzb21lIGF3ZXNvbWUgZnVuY3Rpb25zLlxuICAgICAqIEBwYXJhbSBlbGVtZW50cyBBcnJheSB0byB3cmFwLlxuICAgICAqIEBwYXJhbSBvblVwZGF0ZSBDYWxsZWQgd2hlbiB0aGVyZSBpcyBhbiB1cGRhdGUgKHJlbW92ZSwgc2V0KS5cbiAgICAgKi9cbiAgICBwdWJsaWMgY29uc3RydWN0b3IoZWxlbWVudHM6IEVsZW1lbnRbXSwgb25VcGRhdGU6IEV2ZW50PEVsZW1lbnQ+KVxuICAgIHtcbiAgICAgICAgdGhpcy5lbGVtZW50cyA9IGVsZW1lbnRzO1xuICAgICAgICB0aGlzLm9uVXBkYXRlID0gb25VcGRhdGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBsZW5ndGggb2YgdGhlIGludGVybmFsIGFycmF5LlxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRMZW5ndGgoKTogbnVtYmVyXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50cy5sZW5ndGg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR28gb3ZlciB0aGUgZWxlbWVudHMgb2YgdGhlIGFycmF5LlxuICAgICAqIEBwYXJhbSBjYWxsYmFjayBcbiAgICAgKi9cbiAgICBwdWJsaWMgRm9yRWFjaChjYWxsYmFjazogKEVsZW1lbnQpID0+IGJvb2xlYW4gfCB2b2lkKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudHMuc29tZSg8YW55PmNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgZWxlbWVudCBieSB0YWcuXG4gICAgICogQHBhcmFtIHRhZyBcbiAgICAgKi9cbiAgICBwdWJsaWMgVGFnKHRhZzogc3RyaW5nKTogRWxlbWVudFxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudHMuZmluZChlID0+IGUgJiYgZS5HZXRUYWcoKSA9PSB0YWcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBhIGVsZW1lbnQocykgYnkgY29vcmQuXG4gICAgICogQHBhcmFtIGNvb3JkIFxuICAgICAqLyBcbiAgICBwdWJsaWMgR2V0KGNvb3JkOiBDb29yZCk6IEVsZW1lbnRbXVxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudHMuZmlsdGVyKGUgPT4gZSAmJiBlLkdldFBvcygpLklzKDxDb29yZD5jb29yZCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgbmVhcmVzdCBjZWxsIHRvIHRoZSBnaXZlbiBjb29yZC5cbiAgICAgKiBAcGFyYW0gY29vcmQgXG4gICAgICovXG4gICAgcHVibGljIEdldE5lYXIoY29vcmQ6IENvb3JkKTogRWxlbWVudFxuICAgIHtcbiAgICAgICAgbGV0IHJlc3VsdDogRWxlbWVudCA9IG51bGw7XG4gICAgICAgIGxldCBtaW4gPSBJbmZpbml0eTtcblxuICAgICAgICB0aGlzLmVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiBcbiAgICAgICAge1xuICAgICAgICAgICAgaWYoIWVsZW1lbnQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBzaXplID0gZWxlbWVudC5HZXRTaXplKCk7XG4gICAgICAgICAgICBjb25zdCBjZW50ZXIgPSBlbGVtZW50LkdldFBvcygpLkFkZChzaXplLkYobiA9PiBuIC8gMikpO1xuICAgICAgICAgICAgY29uc3QgZGlzdGFuY2UgPSBjZW50ZXIuR2V0RGlzdGFuY2UoY29vcmQpO1xuXG4gICAgICAgICAgICBpZihkaXN0YW5jZSA8IG1pbikgXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWluID0gZGlzdGFuY2U7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZWxlbWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2VsbHMgYmV0d2VlbiB0d28gY29vcmRpbmF0ZXMuXG4gICAgICogQHBhcmFtIGZyb21cbiAgICAgKiBAcGFyYW0gdG8gXG4gICAgICovXG4gICAgcHVibGljIEdldEJldHdlZW4oZnJvbTogQ29vcmQsIHRvOiBDb29yZCk6IEVsZW1lbnRbXVxuICAgIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gW107XG5cbiAgICAgICAgZnJvbSA9IGZyb20uRmxvb3IoKTtcbiAgICAgICAgdG8gPSB0by5DZWlsKCk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4gXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmKCFlbGVtZW50KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY2VsbEZyb20gPSBlbGVtZW50LkdldFBvcygpO1xuICAgICAgICAgICAgY29uc3QgY2VsbFRvID0gZWxlbWVudC5HZXRQb3MoKS5BZGQoZWxlbWVudC5HZXRTaXplKCkpO1xuXG4gICAgICAgICAgICBpZihDb29yZC5Db2xsaWRlKGZyb20sIHRvLCBjZWxsRnJvbSwgY2VsbFRvKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBuZXcgZWxlbWVudCBvciBvdmVyd3JpdGUgYW4gZXhpc3Rpbmcgb25lIChieSB0YWcpLlxuICAgICAqIEBwYXJhbSBlbGVtZW50IFxuICAgICAqL1xuICAgIHB1YmxpYyBTZXQoZWxlbWVudDogRWxlbWVudCk6IHZvaWRcbiAgICB7XG4gICAgICAgIGNvbnN0IG9sZCA9IHRoaXMuVGFnKGVsZW1lbnQuR2V0VGFnKCkpO1xuXG4gICAgICAgIGlmKG9sZClcbiAgICAgICAge1xuICAgICAgICAgICAgSGVscGVyLkV4dHJhY3Qob2xkLCBlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudHMucHVzaChlbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub25VcGRhdGUuQ2FsbChlbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYW4gZWxlbWVudCBmcm9tIHRoZSBtYXAgKGEgY2VsbCBvciBhbiBhY3RvcikuXG4gICAgICogQHBhcmFtIGVsZW1lbnQgXG4gICAgICovXG4gICAgcHVibGljIFJlbW92ZShlbGVtZW50OiBFbGVtZW50KTogYm9vbGVhblxuICAgIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmVsZW1lbnRzLmluZGV4T2YoZWxlbWVudCk7XG5cbiAgICAgICAgaWYoaW5kZXggPj0gMClcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50cy5zcGxpY2UoaW5kZXgsIDEpO1xuXG4gICAgICAgICAgICBlbGVtZW50LkRpc3Bvc2UoKTtcbiAgICAgICAgICAgIHRoaXMub25VcGRhdGUuQ2FsbChlbGVtZW50KTtcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBpbnRlcm5hbCBhcnJheS5cbiAgICAgKi9cbiAgICBwdWJsaWMgTGlzdCgpOiBFbGVtZW50W11cbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRzO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBJRXhwb3J0T2JqZWN0IH0gZnJvbSBcIi4vSUV4cG9ydE9iamVjdFwiO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgRXhwb3J0YWJsZVxue1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbiBpbnN0YW5jZSBvZiBhIGNsYXNzIGJ5IG5hbWUuXG4gICAgICogQHBhcmFtIGNsYXNzTmFtZSBcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIEZyb21OYW1lPFQgZXh0ZW5kcyBFeHBvcnRhYmxlPihuYW1lOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKTogVFxuICAgIHtcbiAgICAgICAgY29uc3QgZmluZCA9IChuYW1lKTogYW55ID0+XG4gICAgICAgIHtcbiAgICAgICAgICAgIHN3aXRjaChuYW1lKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJDb29yZFwiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWlyZShcIi4vQ29vcmRcIikuQ29vcmQ7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkdyb3VuZENlbGxcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVpcmUoXCIuL0VsZW1lbnQvQ2VsbC9Hcm91bmRDZWxsXCIpLkdyb3VuZENlbGw7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlN0b25lQ2VsbFwiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWlyZShcIi4vRWxlbWVudC9DZWxsL1N0b25lQ2VsbFwiKS5TdG9uZUNlbGw7XG4gICAgICAgICAgICAgICAgY2FzZSBcIldhdGVyQ2VsbFwiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWlyZShcIi4vRWxlbWVudC9DZWxsL1dhdGVyQ2VsbFwiKS5XYXRlckNlbGw7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlBsYXllckFjdG9yXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXF1aXJlKFwiLi9FbGVtZW50L0FjdG9yL1BsYXllckFjdG9yXCIpLlBsYXllckFjdG9yO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGNsYXNzT2JqID0gZmluZChuYW1lKTtcblxuICAgICAgICByZXR1cm4gY2xhc3NPYmogJiYgbmV3IGNsYXNzT2JqKC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4cG9ydCBhIHByb3BlcnR5LlxuICAgICAqIEBwYXJhbSBuYW1lXG4gICAgICovXG4gICAgcHJvdGVjdGVkIEV4cG9ydFByb3BlcnR5KG5hbWU6IHN0cmluZyk6IElFeHBvcnRPYmplY3RcbiAgICB7XG4gICAgICAgIHJldHVybiBFeHBvcnRhYmxlLkV4cG9ydCh0aGlzW25hbWVdLCBuYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeHBvcnQgYWxsIHByb3BlcnRpZXMuXG4gICAgICovXG4gICAgcHVibGljIEV4cG9ydEFsbCgpOiBJRXhwb3J0T2JqZWN0W11cbiAgICB7XG4gICAgICAgIGNvbnN0IHJlc3VsdDogSUV4cG9ydE9iamVjdFtdID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgcHJvcGVydHkgaW4gdGhpcylcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgZXhwb3J0ZWQgPSB0aGlzLkV4cG9ydFByb3BlcnR5KHByb3BlcnR5KTtcblxuICAgICAgICAgICAgaWYoZXhwb3J0ZWQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZXhwb3J0ZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeHBvcnQgYSB3aG9sZSBvYmplY3QgLSBpbmNsdWRpbmcgaXRzZWxmLlxuICAgICAqIEBwYXJhbSBvYmplY3QgXG4gICAgICogQHBhcmFtIG5hbWUgXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBFeHBvcnQob2JqZWN0OiBhbnksIG5hbWU6IHN0cmluZyA9IG51bGwpOiBJRXhwb3J0T2JqZWN0XG4gICAge1xuICAgICAgICAvLyBFeHBvcnQgZWFjaCBlbGVtZW50IG9mIGFuIGFycmF5XG4gICAgICAgIGlmKG9iamVjdCBpbnN0YW5jZW9mIEFycmF5KVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIE5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgQ2xhc3M6IG9iamVjdC5jb25zdHJ1Y3Rvci5uYW1lLFxuICAgICAgICAgICAgICAgIFBheWxvYWQ6IG9iamVjdC5tYXAoKGUsIGkpID0+IEV4cG9ydGFibGUuRXhwb3J0KGUsIGkudG9TdHJpbmcoKSkpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRXhwb3J0IGV4cG9ydGFibGVcbiAgICAgICAgaWYob2JqZWN0IGluc3RhbmNlb2YgRXhwb3J0YWJsZSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBOYW1lOiBuYW1lLFxuICAgICAgICAgICAgICAgIENsYXNzOiBvYmplY3QuY29uc3RydWN0b3IubmFtZSxcbiAgICAgICAgICAgICAgICBQYXlsb2FkOiBvYmplY3QuRXhwb3J0QWxsKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFeHBvcnQgbmF0aXZlIHR5cGVzIChzdHJpbmcsIG51bWJlciBvciBib29sZWFuKVxuICAgICAgICBpZihbXCJzdHJpbmdcIiwgXCJudW1iZXJcIiwgXCJib29sZWFuXCJdLmluY2x1ZGVzKHR5cGVvZiBvYmplY3QpKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIE5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgQ2xhc3M6IHR5cGVvZiBvYmplY3QsXG4gICAgICAgICAgICAgICAgUGF5bG9hZDogb2JqZWN0XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW1wb3J0IGEgcHJvcGVydHkuXG4gICAgICogQHBhcmFtIGlucHV0IFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBJbXBvcnRQcm9wZXJ0eShpbnB1dDogSUV4cG9ydE9iamVjdCk6IGFueVxuICAgIHtcbiAgICAgICAgcmV0dXJuIEV4cG9ydGFibGUuSW1wb3J0KGlucHV0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbXBvcnQgYWxsIHByb3BlcnRpZXMuXG4gICAgICogQHBhcmFtIGlucHV0IFxuICAgICAqL1xuICAgIHB1YmxpYyBJbXBvcnRBbGwoaW5wdXQ6IElFeHBvcnRPYmplY3RbXSk6IHZvaWRcbiAgICB7XG4gICAgICAgIGlucHV0IGluc3RhbmNlb2YgQXJyYXkgJiYgaW5wdXQuZm9yRWFjaChlbGVtZW50ID0+XG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IGltcG9ydGVkID0gdGhpcy5JbXBvcnRQcm9wZXJ0eShlbGVtZW50KTtcblxuICAgICAgICAgICAgaWYoaW1wb3J0ZWQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpc1tlbGVtZW50Lk5hbWVdID0gaW1wb3J0ZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIHdob2xlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0gaW5wdXQgXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBJbXBvcnQoaW5wdXQ6IElFeHBvcnRPYmplY3QpOiBhbnlcbiAgICB7XG4gICAgICAgIC8vIEltcG9ydCBhcnJheVxuICAgICAgICBpZihpbnB1dC5DbGFzcyA9PSBcIkFycmF5XCIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dC5QYXlsb2FkLm1hcChlID0+IEV4cG9ydGFibGUuSW1wb3J0KGUpKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gSW1wb3J0IG5hdGl2ZSB0eXBlc1xuICAgICAgICBpZihbXCJzdHJpbmdcIiwgXCJudW1iZXJcIiwgXCJib29sZWFuXCJdLmluY2x1ZGVzKGlucHV0LkNsYXNzKSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0LlBheWxvYWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJbXBvcnQgRXhwb3J0YWJsZSB0eXBlc1xuICAgICAgICBjb25zdCBpbnN0YW5jZSA9IEV4cG9ydGFibGUuRnJvbU5hbWUoaW5wdXQuQ2xhc3MsIC4uLihpbnB1dC5BcmdzIHx8IFtdKSk7XG5cbiAgICAgICAgaW5zdGFuY2UgJiYgaW5zdGFuY2UuSW1wb3J0QWxsKGlucHV0LlBheWxvYWQpO1xuXG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9XG59IiwiaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi9Db29yZFwiO1xuaW1wb3J0IHsgQmFzZUFjdG9yIH0gZnJvbSBcIi4vRWxlbWVudC9BY3Rvci9CYXNlQWN0b3JcIjtcbmltcG9ydCB7IEhlbHBlciB9IGZyb20gXCIuL1V0aWwvSGVscGVyXCI7XG5pbXBvcnQgeyBCYXNlQ2VsbCB9IGZyb20gXCIuL0VsZW1lbnQvQ2VsbC9CYXNlQ2VsbFwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9FbGVtZW50L0Jhc2VFbGVtZW50XCI7XG5pbXBvcnQgeyBJUmF3TWFwIH0gZnJvbSBcIi4vSVJhd01hcFwiO1xuaW1wb3J0IHsgRWxlbWVudExpc3QgfSBmcm9tIFwiLi9FbGVtZW50TGlzdFwiO1xuaW1wb3J0IHsgSVJlYWRPbmx5RWxlbWVudExpc3QgfSBmcm9tIFwiLi9JUmVhZE9ubHlFbGVtZW50TGlzdFwiO1xuaW1wb3J0IHsgRXhwb3J0YWJsZSB9IGZyb20gXCIuL0V4cG9ydGFibGVcIjtcbmltcG9ydCB7IEV2ZW50IH0gZnJvbSBcIi4vVXRpbC9FdmVudFwiO1xuXG5leHBvcnQgY2xhc3MgTWFwXG57XG4gICAgcHJpdmF0ZSBjZWxsczogQXJyYXk8QmFzZUNlbGw+ID0gW107XG4gICAgcHJpdmF0ZSBhY3RvcnM6IEFycmF5PEJhc2VBY3Rvcj4gPSBbXTtcbiAgICBwcml2YXRlIHNpemU6IENvb3JkID0gbmV3IENvb3JkKCk7XG5cbiAgICAvKipcbiAgICAgKiBTaW5nbGV0b24gaW5zdGFuY2Ugb2YgdGhlIGNsYXNzLlxuICAgICAqL1xuICAgIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBNYXA7XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHNpbmdsZXRvbiBpbnN0YW5jZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIEdldEluc3RhbmNlKCk6IE1hcFxuICAgIHtcbiAgICAgICAgaWYoTWFwLmluc3RhbmNlID09IHVuZGVmaW5lZClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIE1hcC5pbnN0YW5jZSA9IG5ldyBNYXAoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBNYXAuaW5zdGFuY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBzaXplIG9mIHRoZSBtYXAuXG4gICAgICovXG4gICAgcHVibGljIEdldFNpemUoKTogQ29vcmRcbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLnNpemU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5pdCBhIG1hcCB3aXRoIG51bGwgY2VsbHMuXG4gICAgICogQHBhcmFtIHNpemVcbiAgICAgKi9cbiAgICBwdWJsaWMgSW5pdChzaXplOiBDb29yZCk6IHZvaWRcbiAgICB7XG4gICAgICAgIHRoaXMuc2l6ZSA9IHNpemUuQ2xvbmUoKTtcbiAgICAgICAgdGhpcy5jZWxscyA9IFtdO1xuICAgICAgICB0aGlzLmFjdG9ycyA9IFtdO1xuXG4gICAgICAgIHRoaXMuY2VsbHMuZm9yRWFjaChjZWxsID0+IHRoaXMuT25VcGRhdGUuQ2FsbChjZWxsKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9hZCBhIG1hcCBmcm9tIGFuIGV4dGVybmFsIGZpbGUuXG4gICAgICogQHBhcmFtIHVybCBcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgTG9hZCh1cmw6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj5cbiAgICB7XG4gICAgICAgIGxldCByYXc6IElSYXdNYXA7XG5cbiAgICAgICAgdHJ5IFxuICAgICAgICB7XG4gICAgICAgICAgICByYXcgPSBKU09OLnBhcnNlKGF3YWl0IEhlbHBlci5HZXQodXJsKSkgfHwge307XG5cbiAgICAgICAgICAgIGlmKCFyYXcuU2l6ZcKgfHwgIXJhdy5DZWxscyB8fCAhcmF3LkFjdG9ycykgXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoKGUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2l6ZSA9IG5ldyBDb29yZChyYXcuU2l6ZS5YLCByYXcuU2l6ZS5ZKTtcbiAgICAgICAgdGhpcy5jZWxscyA9IFtdO1xuICAgICAgICB0aGlzLmFjdG9ycyA9IFtdO1xuXG4gICAgICAgIC8vIFBhcnNlclxuICAgICAgICBjb25zdCBwYXJzZSA9IDxFbGVtZW50IGV4dGVuZHMgQmFzZUVsZW1lbnQ+KGRhdGEsIG91dCkgPT5cbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGRhdGEuQ2xhc3M7XG4gICAgICAgICAgICBjb25zdCBjb29yZCA9IG5ldyBDb29yZChkYXRhLlgsIGRhdGEuWSk7XG4gICAgICAgICAgICBjb25zdCBjZWxsID0gRXhwb3J0YWJsZS5Gcm9tTmFtZTxFbGVtZW50PihuYW1lLCBjb29yZCwgdGhpcyk7XG5cbiAgICAgICAgICAgIG91dC5wdXNoKGNlbGwpO1xuXG4gICAgICAgICAgICB0aGlzLk9uVXBkYXRlLkNhbGwoY2VsbCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQYXJzZSBjZWxscyBhbmQgYWN0b3JzXG4gICAgICAgIHJhdy5DZWxscy5mb3JFYWNoKGRhdGEgPT4gcGFyc2U8QmFzZUNlbGw+KGRhdGEsIHRoaXMuY2VsbHMpKTtcbiAgICAgICAgcmF3LkFjdG9ycy5mb3JFYWNoKGRhdGEgPT4gcGFyc2U8QmFzZUFjdG9yPihkYXRhLCB0aGlzLmFjdG9ycykpO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBhbGwgZWxlbWVudHMgb2YgdGhlIG1hcC5cbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0RWxlbWVudHMoKTogSVJlYWRPbmx5RWxlbWVudExpc3Q8QmFzZUVsZW1lbnQ+XG4gICAge1xuICAgICAgICBjb25zdCBhbGwgPSAoPEJhc2VFbGVtZW50W10+dGhpcy5jZWxscykuY29uY2F0KDxCYXNlRWxlbWVudFtdPnRoaXMuYWN0b3JzKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBuZXcgRWxlbWVudExpc3Q8QmFzZUVsZW1lbnQ+KGFsbCwgdGhpcy5PblVwZGF0ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjZWxscyBvZiB0aGUgbWFwLlxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRDZWxscygpOiBFbGVtZW50TGlzdDxCYXNlQ2VsbD5cbiAgICB7XG4gICAgICAgIHJldHVybiBuZXcgRWxlbWVudExpc3QodGhpcy5jZWxscywgPEV2ZW50PEJhc2VDZWxsPj50aGlzLk9uVXBkYXRlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGFjdG9ycyBvZiB0aGUgbWFwLlxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRBY3RvcnMoKTogRWxlbWVudExpc3Q8QmFzZUFjdG9yPlxuICAgIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFbGVtZW50TGlzdCh0aGlzLmFjdG9ycywgPEV2ZW50PEJhc2VBY3Rvcj4+dGhpcy5PblVwZGF0ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gdGhlIG1hcCB3YXMgdXBkYXRlZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgT25VcGRhdGU6IEV2ZW50PEJhc2VFbGVtZW50PiA9IG5ldyBFdmVudDxCYXNlRWxlbWVudD4oKTtcbn0iLCJpbXBvcnQgeyBJQ2hhbm5lbCB9IGZyb20gXCIuL0lDaGFubmVsXCI7XG5pbXBvcnQgeyBNZXNzYWdlVHlwZSB9IGZyb20gXCIuL01lc3NhZ2VUeXBlXCI7XG5pbXBvcnQgeyBNYXAgfSBmcm9tIFwiLi4vTWFwXCI7XG5pbXBvcnQgeyBFeHBvcnRhYmxlIH0gZnJvbSBcIi4uL0V4cG9ydGFibGVcIjtcbmltcG9ydCB7IEJhc2VDZWxsIH0gZnJvbSBcIi4uL0VsZW1lbnQvQ2VsbC9CYXNlQ2VsbFwiO1xuaW1wb3J0IHsgQmFzZUFjdG9yIH0gZnJvbSBcIi4uL0VsZW1lbnQvQWN0b3IvQmFzZUFjdG9yXCI7XG5pbXBvcnQgeyBQbGF5ZXJBY3RvciB9IGZyb20gXCIuLi9FbGVtZW50L0FjdG9yL1BsYXllckFjdG9yXCI7XG5pbXBvcnQgeyBIZWxwZXIgfSBmcm9tIFwiLi4vVXRpbC9IZWxwZXJcIjtcbmltcG9ydCB7IENvb3JkIH0gZnJvbSBcIi4uL0Nvb3JkXCI7XG5pbXBvcnQgeyBJRXhwb3J0T2JqZWN0IH0gZnJvbSBcIi4uL0lFeHBvcnRPYmplY3RcIjtcbmltcG9ydCB7IElNZXNzYWdlIH0gZnJvbSBcIi4vSU1lc3NhZ2VcIjtcbmltcG9ydCB7IE1lc3NhZ2VIYW5kbGVyIH0gZnJvbSBcIi4vTWVzc2FnZUhhbmRsZXJcIjtcblxuZXhwb3J0IGNsYXNzIENsaWVudCBleHRlbmRzIE1lc3NhZ2VIYW5kbGVyXG57XG4gICAgcHJpdmF0ZSByZWFkb25seSBtYXA6IE1hcDtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdCBhIG5ldyBjbGllbnQgd2hpY2ggY29tbXVuaWNhdGVzIHdpdGggYSBjb25uZWN0aW9uLlxuICAgICAqIEBwYXJhbSBjaGFubmVsIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNoYW5uZWw6IElDaGFubmVsLCBtYXA6IE1hcClcbiAgICB7XG4gICAgICAgIHN1cGVyKGNoYW5uZWwpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5tYXAgPSBtYXA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVjZWl2ZSBhIG1lc3NhZ2UgdGhyb3VnaCB0aGUgY2hhbm5lbC5cbiAgICAgKiBAcGFyYW0gbWVzc2FnZSBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgT25NZXNzYWdlKG1lc3NhZ2U6IElNZXNzYWdlKTogdm9pZFxuICAgIHtcbiAgICAgICAgc3dpdGNoKG1lc3NhZ2UuVHlwZSlcbiAgICAgICAge1xuICAgICAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5FbGVtZW50OlxuICAgICAgICAgICAgICAgIHRoaXMuU2V0RWxlbWVudChtZXNzYWdlLlBheWxvYWQpXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLlBsYXllcjpcbiAgICAgICAgICAgICAgICB0aGlzLlNldFBsYXllcihtZXNzYWdlLlBheWxvYWQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5TaXplOlxuICAgICAgICAgICAgICAgIHRoaXMuU2V0U2l6ZShtZXNzYWdlLlBheWxvYWQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5LaWNrOlxuICAgICAgICAgICAgICAgIHRoaXMuS2ljaygpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAvLyBJbnZhbGlkXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgYW4gZWxlbWVudC5cbiAgICAgKiBAcGFyYW0gZWxlbWVudCBcbiAgICAgKi9cbiAgICBwcml2YXRlIFNldEVsZW1lbnQoZXhwb3J0YWJsZTogSUV4cG9ydE9iamVjdClcbiAgICB7XG4gICAgICAgIC8vIFNldCB0aGUgYXJncyBvZiB0aGUgY29uc3RydWN0b3Igb2YgQmFzZUVsZW1lbnQgXG4gICAgICAgIGV4cG9ydGFibGUuQXJncyA9IFtudWxsLCB0aGlzLm1hcF07XG5cbiAgICAgICAgY29uc3QgZWxlbWVudCA9IEV4cG9ydGFibGUuSW1wb3J0KGV4cG9ydGFibGUpO1xuXG4gICAgICAgIGlmKGVsZW1lbnQgaW5zdGFuY2VvZiBCYXNlQ2VsbClcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5tYXAuR2V0Q2VsbHMoKS5TZXQoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihlbGVtZW50IGluc3RhbmNlb2YgQmFzZUFjdG9yKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLm1hcC5HZXRBY3RvcnMoKS5TZXQoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHBsYXllciBieSB0YWcuXG4gICAgICogQHBhcmFtIHRhZyBcbiAgICAgKi9cbiAgICBwcml2YXRlIFNldFBsYXllcih0YWc6IHN0cmluZylcbiAgICB7XG4gICAgICAgIGNvbnN0IHBsYXllciA9IHRoaXMubWFwLkdldEFjdG9ycygpLlRhZyh0YWcpO1xuXG4gICAgICAgIHRoaXMuT25QbGF5ZXIoSGVscGVyLkhvb2socGxheWVyLCAodGFyZ2V0LCBwcm9wLCBhcmdzKSA9PiBcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgZXhwb3J0YWJsZSA9IEV4cG9ydGFibGUuRXhwb3J0KFtwcm9wXS5jb25jYXQoYXJncykpO1xuXG4gICAgICAgICAgICB0aGlzLlNlbmRNZXNzYWdlKE1lc3NhZ2VUeXBlLkNvbW1hbmQsIGV4cG9ydGFibGUpO1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBzaXplIG9mIHRoZSBtYXAuXG4gICAgICogQHBhcmFtIHNpemUgXG4gICAgICovXG4gICAgcHJpdmF0ZSBTZXRTaXplKGV4cG9ydGFibGU6IElFeHBvcnRPYmplY3QpXG4gICAge1xuICAgICAgICB0aGlzLm1hcC5Jbml0KEV4cG9ydGFibGUuSW1wb3J0KGV4cG9ydGFibGUpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBLaWNrIHRoaXMgY2xpZW50IG9mIHRoZSBzZXJ2ZXIuXG4gICAgICovXG4gICAgcHJpdmF0ZSBLaWNrKClcbiAgICB7XG4gICAgICAgIHRoaXMubWFwLkluaXQobmV3IENvb3JkKDAsIDApKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlZCB3aGVuIHRoZSBwbGF5ZXIgaXMgc2V0LlxuICAgICAqL1xuICAgIHB1YmxpYyBPblBsYXllcjogKHBsYXllcjogUGxheWVyQWN0b3IpID0+IHZvaWQgPSBIZWxwZXIuTm9vcDtcbn0iLCJpbXBvcnQgeyBIZWxwZXIgfSBmcm9tIFwiLi4vVXRpbC9IZWxwZXJcIjtcbmltcG9ydCB7IElDaGFubmVsIH0gZnJvbSBcIi4vSUNoYW5uZWxcIjtcbmltcG9ydCB7IFBsYXllckFjdG9yIH0gZnJvbSBcIi4uL0VsZW1lbnQvQWN0b3IvUGxheWVyQWN0b3JcIjtcbmltcG9ydCB7IEV4cG9ydGFibGUgfSBmcm9tIFwiLi4vRXhwb3J0YWJsZVwiO1xuaW1wb3J0IHsgTWVzc2FnZVR5cGUgfSBmcm9tIFwiLi9NZXNzYWdlVHlwZVwiO1xuaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi4vQ29vcmRcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL0VsZW1lbnQvQmFzZUVsZW1lbnRcIjtcbmltcG9ydCB7IElFeHBvcnRPYmplY3QgfSBmcm9tIFwiLi4vSUV4cG9ydE9iamVjdFwiO1xuaW1wb3J0IHsgSU1lc3NhZ2UgfSBmcm9tIFwiLi9JTWVzc2FnZVwiO1xuaW1wb3J0IHsgTWVzc2FnZUhhbmRsZXIgfSBmcm9tIFwiLi9NZXNzYWdlSGFuZGxlclwiO1xuXG5leHBvcnQgY2xhc3MgQ29ubmVjdGlvbiBleHRlbmRzIE1lc3NhZ2VIYW5kbGVyXG57XG4gICAgcHJpdmF0ZSBwbGF5ZXI6IFBsYXllckFjdG9yO1xuICAgIFxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdCBhIG5ldyBjb25uZWN0aW9uIHdoaWNoIGNvbW11bmljYXRlcyB3aXRoIGEgY2xpZW50LlxuICAgICAqIEBwYXJhbSBjaGFubmVsIERpcmVjdCBjaGFubmVsIHRvIHRoZSBjbGllbnQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY2hhbm5lbDogSUNoYW5uZWwpXG4gICAge1xuICAgICAgICBzdXBlcihjaGFubmVsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWNlaXZlIGEgbWVzc2FnZSB0aHJvdWdoIHRoZSBjaGFubmVsIGFuZCBwYXJzZSBpdC5cbiAgICAgKiBAcGFyYW0gbWVzc2FnZSBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgT25NZXNzYWdlKG1lc3NhZ2U6IElNZXNzYWdlKTogdm9pZFxuICAgIHtcbiAgICAgICAgc3dpdGNoKG1lc3NhZ2UuVHlwZSlcbiAgICAgICAge1xuICAgICAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5Db21tYW5kOlxuICAgICAgICAgICAgICAgIHRoaXMuUGFyc2VDb21tYW5kKG1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIC8vIEludmFsaWQ6IGtpY2s/XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQYXJzZSBhbiBpbmNvbWluZyBDT01NQU5ELlxuICAgICAqIEBwYXJhbSBpbmRleCBcbiAgICAgKiBAcGFyYW0gY29tbWFuZCBcbiAgICAgKi9cbiAgICBwdWJsaWMgUGFyc2VDb21tYW5kKG1lc3NhZ2U6IElNZXNzYWdlKTogdm9pZFxuICAgIHtcbiAgICAgICAgdGhpcy5PbkNvbW1hbmQobWVzc2FnZS5QYXlsb2FkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0IG1hcC4gQWxzbyBkZWxldGVzIHByZXZpb3VzbHkgc2V0dGVkIGVsZW1lbnRzLlxuICAgICAqIEBwYXJhbSBzaXplIFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBTZXRTaXplKHNpemU6IENvb3JkKTogUHJvbWlzZTx2b2lkPlxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuU2VuZE1lc3NhZ2UoTWVzc2FnZVR5cGUuU2l6ZSwgRXhwb3J0YWJsZS5FeHBvcnQoc2l6ZSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCBhbiBlbGVtZW50IChhIGNlbGwgb3IgYW4gYWN0b3IpLlxuICAgICAqIEBwYXJhbSBlbGVtZW50IFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBTZXRFbGVtZW50KGVsZW1lbnQ6IEJhc2VFbGVtZW50KTogUHJvbWlzZTx2b2lkPlxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuU2VuZE1lc3NhZ2UoTWVzc2FnZVR5cGUuRWxlbWVudCwgRXhwb3J0YWJsZS5FeHBvcnQoZWxlbWVudCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgYWN0aXZlIHBsYXllciBhY3RvciBmb3IgdGhlIGNsaWVudCAodGhlIGFjdG9yIG5lZWRzIHRvIGJlIFxuICAgICAqIGFscmVhZHkgc2VudCB2aWEgU2V0RWxlbWVudCkuXG4gICAgICogQHBhcmFtIHBsYXllciBcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgU2V0UGxheWVyKHBsYXllcjogUGxheWVyQWN0b3IpOiBQcm9taXNlPHZvaWQ+XG4gICAge1xuICAgICAgICBpZih0aGlzLnBsYXllcilcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wbGF5ZXIgPSBwbGF5ZXI7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuU2VuZE1lc3NhZ2UoTWVzc2FnZVR5cGUuUGxheWVyLCBwbGF5ZXIuR2V0VGFnKCkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHByZXZpb3VzbHkgc2V0dGVkIHBsYXllciBhY3Rvci5cbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0UGxheWVyKCk6IFBsYXllckFjdG9yXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5wbGF5ZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogS2ljayB0aGUgY2xpZW50IG9mZi5cbiAgICAgKi9cbiAgICBwdWJsaWMgS2ljaygpOiB2b2lkXG4gICAge1xuICAgICAgICB0aGlzLlNlbmRNZXNzYWdlKE1lc3NhZ2VUeXBlLktpY2ssIG51bGwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVkIHdoZW4gdGhlIENvbm5lY3Rpb24gcmVjZWl2ZXMgYSBDT01NQU5EIGZyb20gdGhlIGNsaWVudC5cbiAgICAgKiBAcGFyYW0gY29tbWFuZFxuICAgICAqL1xuICAgIHB1YmxpYyBPbkNvbW1hbmQ6IChjb21tYW5kOiBJRXhwb3J0T2JqZWN0KSA9PiB2b2lkID0gSGVscGVyLk5vb3A7XG59IiwiaW1wb3J0IHsgSUNoYW5uZWwgfSBmcm9tIFwiLi9JQ2hhbm5lbFwiO1xuaW1wb3J0IHsgSGVscGVyIH0gZnJvbSBcIi4uL1V0aWwvSGVscGVyXCI7XG5cbmV4cG9ydCBjbGFzcyBGYWtlQ2hhbm5lbCBpbXBsZW1lbnRzIElDaGFubmVsXG57XG4gICAgcHJpdmF0ZSBvdGhlcjogRmFrZUNoYW5uZWw7XG4gICAgcHJpdmF0ZSBkZWxheTogbnVtYmVyO1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0IGEgbmV3IGZha2UgY2hhbm5lbCB3aXRoIHRoZSBnaXZlbiBkZWxheS5cbiAgICAgKiBAcGFyYW0gZGVsYXkgXG4gICAgICovXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKGRlbGF5OiBudW1iZXIgPSAwKVxuICAgIHtcbiAgICAgICAgdGhpcy5kZWxheSA9IGRlbGF5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgb3RoZXIgcGVlci5cbiAgICAgKiBAcGFyYW0gb3RoZXIgXG4gICAgICovXG4gICAgcHVibGljIFNldE90aGVyKG90aGVyOiBGYWtlQ2hhbm5lbClcbiAgICB7XG4gICAgICAgIHRoaXMub3RoZXIgPSBvdGhlcjtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICogU2VuZCBhIG1lc3NhZ2UgdG8gdGhlIG90aGVyIHBlZXIuXG4gICAgICogQHBhcmFtIG1lc3NhZ2UgXG4gICAgICovXG4gICAgcHVibGljIFNlbmRNZXNzYWdlKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQgXG4gICAge1xuICAgICAgICBpZih0aGlzLm90aGVyKVxuICAgICAgICB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMub3RoZXIuT25NZXNzYWdlKG1lc3NhZ2UpLCB0aGlzLmRlbGF5KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlY2VpdmUgYSBtZXNzYWdlIGZyb20gdGhlIG90aGVyIHBlZXIuXG4gICAgICovXG4gICAgcHVibGljIE9uTWVzc2FnZTogKG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZCA9IEhlbHBlci5Ob29wO1xufSIsImltcG9ydCB7IElDaGFubmVsIH0gZnJvbSBcIi4vSUNoYW5uZWxcIjtcbmltcG9ydCB7IE1lc3NhZ2VUeXBlIH0gZnJvbSBcIi4vTWVzc2FnZVR5cGVcIjtcbmltcG9ydCB7IElNZXNzYWdlIH0gZnJvbSBcIi4vSU1lc3NhZ2VcIjtcbmltcG9ydCB7IFRpbWVvdXRFdmVudCB9IGZyb20gXCIuLi9VdGlsL1RpbWVvdXRFdmVudFwiO1xuaW1wb3J0IHsgRXZlbnQgfSBmcm9tIFwiLi4vVXRpbC9FdmVudFwiO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcIi4uL1V0aWwvTG9nZ2VyXCI7XG5pbXBvcnQgeyBMb2dUeXBlIH0gZnJvbSBcIi4uL1V0aWwvTG9nVHlwZVwiO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTWVzc2FnZUhhbmRsZXJcbntcbiAgICBwcml2YXRlIHJlY2VpdmVkRXZlbnQgPSBuZXcgRXZlbnQ8bnVtYmVyPigpO1xuICAgIHByaXZhdGUgb3V0SW5kZXg6IG51bWJlciA9IDA7XG4gICAgcHJpdmF0ZSBpbkluZGV4OiBudW1iZXI7XG5cbiAgICBwcml2YXRlIGNoYW5uZWw6IElDaGFubmVsO1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0IGEgbmV3IGNvbm5lY3Rpb24gd2hpY2ggY29tbXVuaWNhdGVzIHdpdGggYSBjbGllbnQuXG4gICAgICogQHBhcmFtIGNoYW5uZWwgRGlyZWN0IGNoYW5uZWwgdG8gdGhlIGNsaWVudC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihjaGFubmVsOiBJQ2hhbm5lbClcbiAgICB7XG4gICAgICAgIHRoaXMuY2hhbm5lbCA9IGNoYW5uZWw7XG4gICAgICAgIHRoaXMuY2hhbm5lbC5Pbk1lc3NhZ2UgPSAobWVzc2FnZTogc3RyaW5nKSA9PiB0aGlzLlBhcnNlTWVzc2FnZShtZXNzYWdlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWNlaXZlIGEgbWVzc2FnZSB0aHJvdWdoIHRoZSBjaGFubmVsLlxuICAgICAqIEBwYXJhbSBpbnB1dCBcbiAgICAgKi9cbiAgICBwcml2YXRlIFBhcnNlTWVzc2FnZShpbnB1dDogc3RyaW5nKTogdm9pZFxuICAgIHtcbiAgICAgICAgbGV0IG1lc3NhZ2U6IElNZXNzYWdlO1xuXG4gICAgICAgIHRyeSBcbiAgICAgICAge1xuICAgICAgICAgICAgbWVzc2FnZSA9IEpTT04ucGFyc2UoaW5wdXQpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoKGUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaChtZXNzYWdlLlR5cGUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuRWxlbWVudDpcbiAgICAgICAgICAgICAgICAvLyBSZWNlaXZlIG9ubHkgc3RhdGVzIG5ld2VyIHRoYW4gdGhlIGN1cnJlbnQgb25lXG4gICAgICAgICAgICAgICAgaWYobWVzc2FnZS5JbmRleCA+IHRoaXMuaW5JbmRleCB8fCB0aGlzLmluSW5kZXggPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5JbmRleCA9IG1lc3NhZ2UuSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuT25NZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuU2VuZFJlY2VpdmVkKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5Db21tYW5kOlxuICAgICAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5QbGF5ZXI6XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLktpY2s6XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLlNpemU6XG4gICAgICAgICAgICAgICAgdGhpcy5Pbk1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5TZW5kUmVjZWl2ZWQobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLlJlY2VpdmVkOlxuICAgICAgICAgICAgICAgIHRoaXMuUGFyc2VSZWNlaXZlZChtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIExvZ2dlci5Mb2codGhpcywgTG9nVHlwZS5WZXJib3NlLCBcIk1lc3NhZ2UgcmVjZWl2ZWRcIiwgbWVzc2FnZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGFyc2UgaW5jb21pbmcgQUNLLlxuICAgICAqIEBwYXJhbSBtZXNzYWdlIFxuICAgICAqL1xuICAgIHByaXZhdGUgUGFyc2VSZWNlaXZlZChtZXNzYWdlOiBJTWVzc2FnZSlcbiAgICB7XG4gICAgICAgIHRoaXMucmVjZWl2ZWRFdmVudC5DYWxsKG1lc3NhZ2UuUGF5bG9hZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VuZCBBQ0suXG4gICAgICogQHBhcmFtIG1lc3NhZ2UgXG4gICAgICovXG4gICAgcHJpdmF0ZSBTZW5kUmVjZWl2ZWQobWVzc2FnZTogSU1lc3NhZ2UpXG4gICAge1xuICAgICAgICB0aGlzLlNlbmRNZXNzYWdlKE1lc3NhZ2VUeXBlLlJlY2VpdmVkLCBtZXNzYWdlLkluZGV4KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFNlbmQgYSBtZXNzYWdlIHRocm91Z2ggdGhlIGNoYW5uZWwuXG4gICAgKiBAcGFyYW0gdHlwZSBUeXBlIG9mIHRoZSBtZXNzYWdlLlxuICAgICogQHBhcmFtIHBheWxvYWRcbiAgICAqL1xuICAgcHJvdGVjdGVkIGFzeW5jIFNlbmRNZXNzYWdlKHR5cGU6IE1lc3NhZ2VUeXBlLCBwYXlsb2FkOiBhbnkpOiBQcm9taXNlPHZvaWQ+XG4gICB7XG4gICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IFxuICAgICAgIHtcbiAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBtZXNzYWdlXG4gICAgICAgICAgIGNvbnN0IG1lc3NhZ2U6IElNZXNzYWdlID0ge1xuICAgICAgICAgICAgICAgVHlwZTogdHlwZSxcbiAgICAgICAgICAgICAgIEluZGV4OiB0aGlzLm91dEluZGV4KyssXG4gICAgICAgICAgICAgICBQYXlsb2FkOiBwYXlsb2FkXG4gICAgICAgICAgIH07XG5cbiAgICAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IFJFQ0VJVkVEIGxpc3RlbmVyIGlmIHRoaXMgd2FzIG5vdFxuICAgICAgICAgICAvLyBhIGFja25vd2xlZGdlIG1lc3NhZ2VcbiAgICAgICAgICAgaWYgKG1lc3NhZ2UuVHlwZSAhPSBNZXNzYWdlVHlwZS5SZWNlaXZlZCkgXG4gICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb25zdCBsaXN0ZW5lciA9IHRoaXMucmVjZWl2ZWRFdmVudC5BZGQoaW5kZXggPT4gXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA9PT0gbWVzc2FnZS5JbmRleCkgXG4gICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlY2VpdmVkRXZlbnQuUmVtb3ZlKGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChpbmRleCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoKTtcbiAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgfVxuICAgICAgICAgICBlbHNlXG4gICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIC8vIFJlc29sdmUgaW1tZWRpYXRlbHkgaWYgUkVDRUlWRURcbiAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgfVxuXG4gICAgICAgICAgIC8vIFNlbmQgbWVzc2FnZVxuICAgICAgICAgICB0aGlzLmNoYW5uZWwuU2VuZE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkobWVzc2FnZSkpO1xuXG4gICAgICAgICAgIExvZ2dlci5Mb2codGhpcywgTG9nVHlwZS5WZXJib3NlLCBcIk1lc3NhZ2Ugc2VudFwiLCBtZXNzYWdlKTtcbiAgICAgICB9KTtcbiAgIH1cblxuICAgcHJvdGVjdGVkIGFic3RyYWN0IE9uTWVzc2FnZShtZXNzYWdlOiBJTWVzc2FnZSk6IHZvaWQ7XG59IiwiZXhwb3J0IGVudW0gTWVzc2FnZVR5cGVcbntcbiAgICAvLyBPVVRcbiAgICBTaXplLFxuICAgIEVsZW1lbnQsXG4gICAgUGxheWVyLFxuICAgIEtpY2ssXG5cbiAgICAvLyBJTlxuICAgIENvbW1hbmQsXG5cbiAgICAvLyBJTiAmIE9VVFxuICAgIFJlY2VpdmVkXG59IiwiaW1wb3J0ICogYXMgd2VicnRjIGZyb20gXCJ3ZWJydGMtYWRhcHRlclwiXG5pbXBvcnQgeyBJQ2hhbm5lbCB9IGZyb20gXCIuL0lDaGFubmVsXCI7XG5pbXBvcnQgeyBIZWxwZXIgfSBmcm9tIFwiLi4vVXRpbC9IZWxwZXJcIjtcblxuZXhwb3J0IGNsYXNzIFBlZXJDaGFubmVsIGltcGxlbWVudHMgSUNoYW5uZWxcbntcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNvbmZpZyA9IHtcbiAgICAgICAgXCJpY2VTZXJ2ZXJzXCI6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcInVybHNcIjogW1wic3R1bjpzdHVuLmwuZ29vZ2xlLmNvbToxOTMwMlwiXVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfTtcblxuICAgIHByaXZhdGUgcGVlckNvbm5lY3Rpb247XG4gICAgcHJpdmF0ZSBkYXRhQ2hhbm5lbDtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBvZmZlci4gUmV0dXJuIHRoZSBvZmZlciBuZWdvdGlhdGlvbiBzdHJpbmcuXG4gICAgICovXG4gICAgcHVibGljIE9mZmVyKCk6IFByb21pc2U8c3RyaW5nPlxuICAgIHtcbiAgICAgICAgaWYodGhpcy5wZWVyQ29ubmVjdGlvbilcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8c3RyaW5nPigocmVzb2x2ZSwgcmVqZWN0KSA9PiBcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5wZWVyQ29ubmVjdGlvbiA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbih0aGlzLmNvbmZpZyk7XG4gICAgICAgICAgICB0aGlzLmRhdGFDaGFubmVsID0gdGhpcy5wZWVyQ29ubmVjdGlvbi5jcmVhdGVEYXRhQ2hhbm5lbChcImRhdGFcIik7XG5cbiAgICAgICAgICAgIHRoaXMucGVlckNvbm5lY3Rpb24ub25pY2VjYW5kaWRhdGUgPSBlID0+IFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmKGUuY2FuZGlkYXRlID09IG51bGwpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvZmZlciA9IHRoaXMucGVlckNvbm5lY3Rpb24ubG9jYWxEZXNjcmlwdGlvbjtcblxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKEpTT04uc3RyaW5naWZ5KG9mZmVyKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMucGVlckNvbm5lY3Rpb24uY3JlYXRlT2ZmZXIoKS50aGVuKFxuICAgICAgICAgICAgICAgIGRlc2MgPT4gdGhpcy5wZWVyQ29ubmVjdGlvbi5zZXRMb2NhbERlc2NyaXB0aW9uKGRlc2MpLFxuICAgICAgICAgICAgICAgIGVycm9yID0+IHJlamVjdChlcnJvcilcbiAgICAgICAgICAgICk7XG4gICAgXG4gICAgICAgICAgICB0aGlzLmRhdGFDaGFubmVsLm9ubWVzc2FnZSA9IGV2ZW50ID0+IHRoaXMuUGFyc2VNZXNzYWdlKGV2ZW50KTtcbiAgICAgICAgICAgIHRoaXMuZGF0YUNoYW5uZWwub25vcGVuID0gKCkgPT4gdGhpcy5Pbk9wZW4oKTtcbiAgICAgICAgICAgIHRoaXMuZGF0YUNoYW5uZWwub25jbG9zZSA9ICgpID0+IHRoaXMuT25DbG9zZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYW4gYW5zd2VyIGZvciB0aGUgZ2l2ZW4gb2ZmZXIuIFJldHVybiB0aGUgZmluaXNoIG5lZ290aWF0aW9uIHN0cmluZy5cbiAgICAgKiBAcGFyYW0gb2ZmZXIgXG4gICAgICovXG4gICAgcHVibGljIEFuc3dlcihvZmZlcjogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IFxuICAgIHtcbiAgICAgICAgaWYodGhpcy5wZWVyQ29ubmVjdGlvbilcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8c3RyaW5nPigocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnBlZXJDb25uZWN0aW9uID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKHRoaXMuY29uZmlnKTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMucGVlckNvbm5lY3Rpb24ub25pY2VjYW5kaWRhdGUgPSBlID0+IFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmKGUuY2FuZGlkYXRlID09IG51bGwpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhbnN3ZXIgPSB0aGlzLnBlZXJDb25uZWN0aW9uLmxvY2FsRGVzY3JpcHRpb247XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShKU09OLnN0cmluZ2lmeShhbnN3ZXIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgdGhpcy5wZWVyQ29ubmVjdGlvbi5vbmRhdGFjaGFubmVsID0gZXZlbnQgPT5cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFDaGFubmVsID0gZXZlbnQuY2hhbm5lbDtcblxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YUNoYW5uZWwub25tZXNzYWdlID0gZXZlbnQgPT4gdGhpcy5QYXJzZU1lc3NhZ2UoZXZlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YUNoYW5uZWwub25vcGVuID0gKCkgPT4gdGhpcy5Pbk9wZW4oKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFDaGFubmVsLm9uY2xvc2UgPSAoKSA9PiB0aGlzLk9uQ2xvc2UoKTtcbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICB0cnkgXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5wZWVyQ29ubmVjdGlvbi5zZXRSZW1vdGVEZXNjcmlwdGlvbihcbiAgICAgICAgICAgICAgICAgICAgbmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbihKU09OLnBhcnNlKG9mZmVyKSkpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wZWVyQ29ubmVjdGlvbi5jcmVhdGVBbnN3ZXIoKS50aGVuKFxuICAgICAgICAgICAgICAgICAgICBkZXNjID0+IHRoaXMucGVlckNvbm5lY3Rpb24uc2V0TG9jYWxEZXNjcmlwdGlvbihkZXNjKSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IgPT4gcmVqZWN0KGVycm9yKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaChlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluaXNoIG5lZ290aWF0aW9uLlxuICAgICAqIEBwYXJhbSBhbnN3ZXIgXG4gICAgICovXG4gICAgcHVibGljIEZpbmlzaChhbnN3ZXI6IHN0cmluZyk6IHZvaWRcbiAgICB7XG4gICAgICAgIGlmKHRoaXMuSXNPZmZlcm9yKCkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMucGVlckNvbm5lY3Rpb24uc2V0UmVtb3RlRGVzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgbmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbihKU09OLnBhcnNlKGFuc3dlcikpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBmaW5pc2ggbmVnb3RpYXRpb24hXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGFyc2UgYW4gaW5jb21pbmcgbWVzc2FnZS5cbiAgICAgKiBAcGFyYW0gZXZlbnQgXG4gICAgICovXG4gICAgcHVibGljIFBhcnNlTWVzc2FnZShldmVudClcbiAgICB7XG4gICAgICAgIGlmKGV2ZW50ICYmIGV2ZW50LmRhdGEpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuT25NZXNzYWdlKGV2ZW50LmRhdGEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VuZCBhIG1lc3NhZ2UgdGhyb3VnaCB0aGUgY2hhbm5lbC5cbiAgICAgKiBAcGFyYW0gbWVzc2FnZSBcbiAgICAgKi9cbiAgICBwdWJsaWMgU2VuZE1lc3NhZ2UobWVzc2FnZTogc3RyaW5nKTogdm9pZFxuICAgIHtcbiAgICAgICAgaWYodGhpcy5Jc09wZW4oKSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5kYXRhQ2hhbm5lbC5zZW5kKG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSXMgdGhpcyBQZWVyQ29ubmVjdGlvbiBjcmVhdGVkIHRoZSBvZmZlcj9cbiAgICAgKi9cbiAgICBwdWJsaWMgSXNPZmZlcm9yKCk6IGJvb2xlYW5cbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLnBlZXJDb25uZWN0aW9uICYmIHRoaXMucGVlckNvbm5lY3Rpb24ubG9jYWxEZXNjcmlwdGlvbiAmJlxuICAgICAgICAgICAgdGhpcy5wZWVyQ29ubmVjdGlvbi5sb2NhbERlc2NyaXB0aW9uLnR5cGUgPT0gXCJvZmZlclwiO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHRoZSBjaGFubmVsIGlzIG9wZW4uXG4gICAgICovXG4gICAgcHVibGljIElzT3BlbigpOiBib29sZWFuXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXRhQ2hhbm5lbCAmJiB0aGlzLmRhdGFDaGFubmVsLnJlYWR5U3RhdGUgPT0gXCJvcGVuXCIgJiYgXG4gICAgICAgICAgICB0aGlzLnBlZXJDb25uZWN0aW9uICYmIHRoaXMucGVlckNvbm5lY3Rpb24uc2lnbmFsaW5nU3RhdGUgPT0gXCJzdGFibGVcIjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiBjaGFubmVsIGlzIG9wZW5lZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgT25PcGVuOiAoKSA9PiB2b2lkID0gSGVscGVyLk5vb3A7XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiBjaGFubmVsIGlzIGNsb3NlZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgT25DbG9zZTogKCkgPT4gdm9pZCA9IEhlbHBlci5Ob29wO1xuXG4gICAgLyoqXG4gICAgICogUmVjZWl2ZSBhIG1lc3NhZ2UgZnJvbSB0aGUgb3RoZXIgcGVlci5cbiAgICAgKi9cbiAgICBwdWJsaWMgT25NZXNzYWdlOiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkID0gSGVscGVyLk5vb3A7XG59IiwiaW1wb3J0IHsgTWFwIH0gZnJvbSBcIi4uL01hcFwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vRWxlbWVudC9CYXNlRWxlbWVudFwiO1xuaW1wb3J0IHsgUGxheWVyQWN0b3IgfSBmcm9tIFwiLi4vRWxlbWVudC9BY3Rvci9QbGF5ZXJBY3RvclwiO1xuaW1wb3J0IHsgQ29ubmVjdGlvbiB9IGZyb20gXCIuL0Nvbm5lY3Rpb25cIjtcbmltcG9ydCB7IEV4cG9ydGFibGUgfSBmcm9tIFwiLi4vRXhwb3J0YWJsZVwiO1xuaW1wb3J0IHsgSUV4cG9ydE9iamVjdCB9IGZyb20gXCIuLi9JRXhwb3J0T2JqZWN0XCI7XG5pbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuLi9Db29yZFwiO1xuXG5leHBvcnQgY2xhc3MgU2VydmVyXG57XG4gICAgcHJpdmF0ZSByZWFkb25seSBtYXA6IE1hcDtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNvbm5zOiBDb25uZWN0aW9uW10gPSBbXTtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdCBhIG5ldyBzZXJ2ZXIgd2l0aCB0aGUgZ2l2ZW4gbWFwLiBUaGUgc2VydmVyIGdvbm5hXG4gICAgICogdXBkYXRlIGVhY2ggY29ubmVjdGlvbnMgKGNsaWVudHMpIHdpdGggdGhlIG1hcCBhbmQgc3luYyBldmVyeVxuICAgICAqIG1vdmUgb2YgdGhlIGNsaWVudHMgYmV0d2VlbiB0aGVtLlxuICAgICAqIEBwYXJhbSBtYXAgXG4gICAgICovXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKG1hcDogTWFwKVxuICAgIHtcbiAgICAgICAgdGhpcy5tYXAgPSBtYXA7XG5cbiAgICAgICAgLy8gVXBkYXRlIGVsZW1lbnRzIGZvciBjb25uZWN0aW9ucyBleGNlcHQgdGhlaXIgb3duIHBsYXllclxuICAgICAgICB0aGlzLm1hcC5PblVwZGF0ZS5BZGQoZWxlbWVudCA9PiB0aGlzLmNvbm5zXG4gICAgICAgICAgICAuZmlsdGVyKGNvbm4gPT4gZWxlbWVudC5HZXRUYWcoKSAhPSBjb25uLkdldFBsYXllcigpLkdldFRhZygpKVxuICAgICAgICAgICAgLmZvckVhY2goY29ubiA9PiBjb25uLlNldEVsZW1lbnQoZWxlbWVudCkpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlZCB3aGVuIHRoZSBzZXJ2ZXIgcmVjZWl2ZXMgYSBuZXcgbWVzc2FnZSBmcm9tIGEgY2xpZW50L2Nvbm5lY3Rpb24uXG4gICAgICogQHBhcmFtIGNvbm5cbiAgICAgKiBAcGFyYW0gY29tbWFuZFxuICAgICAqL1xuICAgIHByaXZhdGUgT25Db21tYW5kKGNvbm46IENvbm5lY3Rpb24sIGNvbW1hbmQ6IElFeHBvcnRPYmplY3QpXG4gICAge1xuICAgICAgICBjb25zdCBhcmdzID0gRXhwb3J0YWJsZS5JbXBvcnQoY29tbWFuZCk7XG5cbiAgICAgICAgaWYoIWFyZ3MubGVuZ3RoKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLktpY2soY29ubik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwbGF5ZXIgPSBjb25uLkdldFBsYXllcigpO1xuXG4gICAgICAgIC8vIEV4ZWN1dGUgY29tbWFuZCBvbiB0aGUgcGxheWVyXG4gICAgICAgIHBsYXllclthcmdzWzBdXS5iaW5kKHBsYXllcikoLi4uYXJncy5zbGljZSgxKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogS2ljayBjbGllbnQgb3V0IG9mIHRoZSBzZXJ2ZXIuXG4gICAgICogQHBhcmFtIGNvbm4gXG4gICAgICovXG4gICAgcHJpdmF0ZSBLaWNrKGNvbm46IENvbm5lY3Rpb24pXG4gICAge1xuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuY29ubnMuaW5kZXhPZihjb25uKTtcblxuICAgICAgICBpZihpbmRleCA+PSAwKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmNvbm5zLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB0aGlzLm1hcC5HZXRBY3RvcnMoKS5SZW1vdmUoY29ubi5HZXRQbGF5ZXIoKSk7XG4gICAgICAgICAgICBjb25uLktpY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIG5ldyBjb25uZWN0aW9uL2NsaWVudCB0byB0aGUgc2VydmVyLiBUaGlzIHJlcHJlc2VudHNcbiAgICAgKiB0aGUgY2xpZW50IG9uIHRoZSBzZXJ2ZXIgc2lkZSAtIGl0IG9ubHkgY29tbXVuaWNhdGVzXG4gICAgICogd2l0aCBhIENsaWVudCBvYmplY3QgdGhyb3VnaCBhbiBJQ2hhbm5lbCBpbXBsZW1lbnRhdGlvbi5cbiAgICAgKiBAcGFyYW0gY29ubiBcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgQWRkKGNvbm46IENvbm5lY3Rpb24pXG4gICAge1xuICAgICAgICAvLyBDcmVhdGUgcGxheWVyIGFuZCBhZGQgaXQgdG8gdGhlIG1hcFxuICAgICAgICBjb25zdCBwbGF5ZXIgPSBuZXcgUGxheWVyQWN0b3IobmV3IENvb3JkKDAsIDApLCB0aGlzLm1hcCk7XG5cbiAgICAgICAgdGhpcy5tYXAuR2V0QWN0b3JzKCkuU2V0KHBsYXllcik7XG5cbiAgICAgICAgLy8gU2V0IHNpemVcbiAgICAgICAgYXdhaXQgY29ubi5TZXRTaXplKHRoaXMubWFwLkdldFNpemUoKSk7XG5cbiAgICAgICAgLy8gU2V0IGFjdG9yc1xuICAgICAgICBmb3IobGV0IGFjdG9yIG9mIHRoaXMubWFwLkdldEFjdG9ycygpLkxpc3QoKSlcbiAgICAgICAge1xuICAgICAgICAgICAgYXdhaXQgY29ubi5TZXRFbGVtZW50KGFjdG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCBjZWxsc1xuICAgICAgICBmb3IobGV0IGNlbGwgb2YgdGhpcy5tYXAuR2V0Q2VsbHMoKS5MaXN0KCkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGF3YWl0IGNvbm4uU2V0RWxlbWVudChjZWxsKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gU3Vic2NyaWJlIHRvIHRoZSBPbkNvbW1hbmQgY2FsbGJhY2tcbiAgICAgICAgY29ubi5PbkNvbW1hbmQgPSBjb21tYW5kID0+IHRoaXMuT25Db21tYW5kKGNvbm4sIGNvbW1hbmQpO1xuICAgICAgICBcbiAgICAgICAgLy8gU2V0IHBsYXllclxuICAgICAgICBhd2FpdCBjb25uLlNldFBsYXllcihwbGF5ZXIpO1xuXG4gICAgICAgIC8vIEFkZCBjbGllbnQgdG8gdGhlIGludGVybmFsIGNsaWVudCBsaXN0XG4gICAgICAgIHRoaXMuY29ubnMucHVzaChjb25uKTtcbiAgICB9XG59IiwiaW1wb3J0IHsgTWFwIH0gZnJvbSBcIi4vTWFwXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL0VsZW1lbnQvQmFzZUVsZW1lbnRcIjtcbmltcG9ydCB7IEV2ZW50IH0gZnJvbSBcIi4vVXRpbC9FdmVudFwiO1xuXG5leHBvcnQgY2xhc3MgUmVuZGVyZXJcbntcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRwaTogbnVtYmVyID0gMzA7XG5cbiAgICBwcml2YXRlIHJlYWRvbmx5IG1hcDogTWFwO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcbiAgICBcbiAgICBwcml2YXRlIHRleHR1cmVzOiB7IFtpZDogc3RyaW5nXTogSFRNTEltYWdlRWxlbWVudCB9ID0ge307XG4gICAgcHJpdmF0ZSBzdG9wO1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0IGEgbmV3IGdhbWUgb2JqZWN0LlxuICAgICAqL1xuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihtYXA6IE1hcCwgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudClcbiAgICB7XG4gICAgICAgIHRoaXMubWFwID0gbWFwO1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gPENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRD5jYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExvYWQgdGV4dHVyZXMgZm9yIGEgbG9hZGVkIG1hcC5cbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgTG9hZCgpOiBQcm9taXNlPHZvaWQ+XG4gICAge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4gXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gdGhpcy5tYXAuR2V0RWxlbWVudHMoKTtcbiAgICAgICAgICAgIGxldCBpID0gMDtcbiAgICBcbiAgICAgICAgICAgIGVsZW1lbnRzLkZvckVhY2goZWxlbWVudCA9PlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmKCFlbGVtZW50KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IGlkID0gZWxlbWVudC5HZXRUZXh0dXJlKCk7XG5cbiAgICAgICAgICAgICAgICBpZih0aGlzLnRleHR1cmVzW2lkXSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgdGV4dHVyZSA9IG5ldyBJbWFnZSgpO1xuICAgIFxuICAgICAgICAgICAgICAgIHRleHR1cmUub25lcnJvciA9ICgpID0+IHJlamVjdCgpO1xuICAgICAgICAgICAgICAgIHRleHR1cmUub25sb2FkID0gKCkgPT4gXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRleHR1cmVzW2lkXSA9IHRleHR1cmU7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmKCsraSA9PSBlbGVtZW50cy5HZXRMZW5ndGgoKSkgXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0ZXh0dXJlLnNyYyA9IGlkO1xuXG4gICAgICAgICAgICAgICAgdGhpcy50ZXh0dXJlc1tpZF0gPSBudWxsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBEcmF3IHRoZSBnaXZlbiBlbGVtZW50IG9udG8gdGhlIGNhbnZhcy5cbiAgICAgKiBAcGFyYW0gZWxlbWVudFxuICAgICAqL1xuICAgIHByaXZhdGUgRHJhdyhlbGVtZW50OiBCYXNlRWxlbWVudClcbiAgICB7XG4gICAgICAgIGlmKCFlbGVtZW50KVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGNvb3JkID0gZWxlbWVudC5HZXRQb3MoKTtcbiAgICAgICAgY29uc3Qgc2l6ZSA9IGVsZW1lbnQuR2V0U2l6ZSgpO1xuICAgICAgICBjb25zdCB0ZXh0dXJlID0gdGhpcy50ZXh0dXJlc1tlbGVtZW50LkdldFRleHR1cmUoKV07XG4gICAgXG4gICAgICAgIGNvbnN0IHggPSBjb29yZC5YO1xuICAgICAgICBjb25zdCB5ID0gY29vcmQuWTtcbiAgICAgICAgY29uc3QgdyA9IHNpemUuWDtcbiAgICAgICAgY29uc3QgaCA9IHNpemUuWTtcbiAgICBcbiAgICAgICAgdGhpcy5jb250ZXh0LmRyYXdJbWFnZShcbiAgICAgICAgICAgIHRleHR1cmUsIFxuICAgICAgICAgICAgeCAqIHRoaXMuZHBpLCBcbiAgICAgICAgICAgIHkgKiB0aGlzLmRwaSwgXG4gICAgICAgICAgICB3ICogdGhpcy5kcGksIFxuICAgICAgICAgICAgaCAqIHRoaXMuZHBpKTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICogVXBkYXRlIHRoZSBjYW52YXMuXG4gICAgICovXG4gICAgcHJpdmF0ZSBVcGRhdGUoKVxuICAgIHtcbiAgICAgICAgY29uc3Qgc2l6ZSA9IHRoaXMubWFwLkdldFNpemUoKTtcbiAgICBcbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLmRwaSAqIHNpemUuWDtcbiAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy5kcGkgKiBzaXplLlk7XG4gICAgICAgIHRoaXMuY2FudmFzLnN0eWxlLndpZHRoID0gdGhpcy5kcGkgKiBzaXplLlggKyBcInB4XCI7XG4gICAgICAgIHRoaXMuY2FudmFzLnN0eWxlLmhlaWdodCA9IHRoaXMuZHBpICogc2l6ZS5ZICsgXCJweFwiO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5tYXAuR2V0Q2VsbHMoKS5Gb3JFYWNoKGUgPT4gdGhpcy5EcmF3KGUpKTtcbiAgICAgICAgdGhpcy5tYXAuR2V0QWN0b3JzKCkuRm9yRWFjaChlID0+IHRoaXMuRHJhdyhlKSk7XG4gICAgXG4gICAgICAgIGlmKCF0aGlzLnN0b3ApXG4gICAgICAgIHtcbiAgICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gdGhpcy5VcGRhdGUoKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLk9uVXBkYXRlLkNhbGwobnVsbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RhcnQgcmVuZGVyaW5nLlxuICAgICAqL1xuICAgIHB1YmxpYyBTdGFydCgpXG4gICAge1xuICAgICAgICB0aGlzLnN0b3AgPSBmYWxzZTtcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB0aGlzLlVwZGF0ZSgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdG9wIHJlbmRlcmluZy5cbiAgICAgKi9cbiAgICBwdWJsaWMgU3RvcCgpXG4gICAge1xuICAgICAgICB0aGlzLnN0b3AgPSB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIHJlZHJhdy5cbiAgICAgKi9cbiAgICBwdWJsaWMgT25VcGRhdGU6IEV2ZW50PHZvaWQ+ID0gbmV3IEV2ZW50KCk7XG59IiwiZXhwb3J0IGNsYXNzIEV2ZW50PFQ+XG57XG4gICAgcHJvdGVjdGVkIGxpc3RlbmVyczogeyBbaWQ6IG51bWJlcl06ICh2YWx1ZTogVCkgPT4gdm9pZCB9ID0ge307XG4gICAgcHJpdmF0ZSBjb3VudCA9IDA7XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBsaXN0ZW5lci5cbiAgICAgKiBAcGFyYW0gY2FsbGJhY2sgXG4gICAgICovXG4gICAgcHVibGljIEFkZChjYWxsYmFjazogKHZhbHVlOiBUKSA9PiB2b2lkKTogbnVtYmVyXG4gICAge1xuICAgICAgICB0aGlzLmxpc3RlbmVyc1srK3RoaXMuY291bnRdID0gY2FsbGJhY2s7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5jb3VudDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBsaXN0ZW5lci5cbiAgICAgKiBAcGFyYW0gaWQgXG4gICAgICovXG4gICAgcHVibGljIFJlbW92ZShpZDogbnVtYmVyKTogdm9pZFxuICAgIHtcbiAgICAgICAgZGVsZXRlIHRoaXMubGlzdGVuZXJzW2lkXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsIGxpc3RlbmVycyB3aXRoIHRoZSBnaXZlbiB2YWx1ZS5cbiAgICAgKiBAcGFyYW0gdmFsdWUgXG4gICAgICovXG4gICAgcHVibGljIENhbGwodmFsdWU6IFQpOiB2b2lkXG4gICAge1xuICAgICAgICAoPGFueT5PYmplY3QpLnZhbHVlcyh0aGlzLmxpc3RlbmVycykuZm9yRWFjaChjYWxsYmFjayA9PiBjYWxsYmFjayh2YWx1ZSkpO1xuICAgIH1cbn0iLCJkZWNsYXJlIHZhciBuYXZpZ2F0b3I6IHsgY2xpcGJvYXJkOiBhbnkgfSAmIE5hdmlnYXRvcjtcblxuZXhwb3J0IGNsYXNzIEhlbHBlclxue1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbiBhc3luYyByZXF1ZXN0LlxuICAgICAqIEBwYXJhbSB1cmwgXG4gICAgICogQHBhcmFtIGRhdGEgXG4gICAgICogQHBhcmFtIG1ldGhvZCBcbiAgICAgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBhc3luYyBBamF4KHVybDogc3RyaW5nLCBkYXRhOiBzdHJpbmcsIG1ldGhvZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+XG4gICAge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8c3RyaW5nPihyZXNvbHZlID0+IFxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgICAgICByZXF1ZXN0Lm9wZW4obWV0aG9kLCB1cmwsIHRydWUpO1xuXG4gICAgICAgICAgICByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmKHJlcXVlc3QucmVhZHlTdGF0ZSAhPSA0KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0LnN0YXR1cyA9PSAyMDApIFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmKGRhdGEgIT0gbnVsbCAmJiBkYXRhLmxlbmd0aCA+IDApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcbiAgICAgICAgICAgICAgICByZXF1ZXN0LnNlbmQoZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5zZW5kKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBvc3QgcmVxdWVzdCB3aXRoIEpTT04gZGF0YS5cbiAgICAgKiBAcGFyYW0gdXJsIFxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBQb3N0KHVybDogc3RyaW5nLCBkYXRhOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz5cbiAgICB7XG4gICAgICAgIHJldHVybiBhd2FpdCBIZWxwZXIuQWpheCh1cmwsIGRhdGEsIFwiUE9TVFwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgcmVxdWVzdCB0byB0aGUgZ2l2ZW4gVVJMLlxuICAgICAqIEBwYXJhbSB1cmwgXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBHZXQodXJsOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz5cbiAgICB7XG4gICAgICAgIHJldHVybiBhd2FpdCBIZWxwZXIuQWpheCh1cmwsIG51bGwsIFwiR0VUXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIG1pbiAoaW5jbHVkZWQpIGFuZCBtYXggKGluY2x1ZGVkKS5cbiAgICAgKiBAcGFyYW0gbWluIFxuICAgICAqIEBwYXJhbSBtYXggXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBSYW5kb20obWluOiBudW1iZXIsIG1heDogbnVtYmVyKTogbnVtYmVyXG4gICAge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpICsgbWluKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb3B5IHByb3BlcnRpZXMgZnJvbSBvbmUgb2JqZWN0IHRvIGFub3RoZXIuXG4gICAgICogQHBhcmFtIHRvIFxuICAgICAqIEBwYXJhbSBmcm9tIFxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgRXh0cmFjdCh0bzogT2JqZWN0LCBmcm9tOiBPYmplY3QpIFxuICAgIHtcbiAgICAgICAgZm9yIChsZXQga2V5IGluIGZyb20pIFxuICAgICAgICB7XG4gICAgICAgICAgICBpZihmcm9tLmhhc093blByb3BlcnR5KGtleSkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdG9ba2V5XSA9IGZyb21ba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBCaW5kIHByb3BlcnRpZXMgZnJvbSBvbmUgb2JqZWN0IHRvIGFub3RoZXIuXG4gICAgICogQHBhcmFtIHRvIFxuICAgICAqIEBwYXJhbSBmcm9tIFxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgQmluZCh0bzogT2JqZWN0LCBmcm9tOiBPYmplY3QsIHByb3BlcnRpZXM6IHN0cmluZ1tdKSBcbiAgICB7XG4gICAgICAgIGZvciAobGV0IGtleSBpbiBwcm9wZXJ0aWVzKSBcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgcCA9IHByb3BlcnRpZXNba2V5XTtcblxuICAgICAgICAgICAgaWYoZnJvbVtwXSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRvW3BdID0gZnJvbVtwXS5iaW5kKGZyb20pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVW5pcXVlIElEIGdlbmVyYXRhaW9uXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBVbmlxdWUoKTogc3RyaW5nIFxuICAgIHtcbiAgICAgICAgbGV0IGRhdGUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBcInh4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eFwiLnJlcGxhY2UoL1t4eV0vZywgYyA9PlxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCByID0gKGRhdGUgKyBNYXRoLnJhbmRvbSgpICogMTYpICUgMTYgfCAwO1xuXG4gICAgICAgICAgICBkYXRlID0gTWF0aC5mbG9vcihkYXRlIC8gMTYpO1xuXG4gICAgICAgICAgICByZXR1cm4gKGMgPT09IFwieFwiID8gciA6IChyICYgMHg3IHwgMHg4KSkudG9TdHJpbmcoMTYpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0aGUgc3RyaW5nIGlzIGEgdW5pcXVlIElEIGdlbmVyYXRlZCBieSB0aGUgVW5pcXVlKCkgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHRleHQgXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBJc1VuaXF1ZSh0ZXh0OiBzdHJpbmcpOiBib29sZWFuXG4gICAge1xuICAgICAgICBjb25zdCByZSA9IFJlZ0V4cChcbiAgICAgICAgICAgIFwiXlswLTlhLWZBLUZdezh9LVwiICsgXG4gICAgICAgICAgICBcIlswLTlhLWZBLUZdezR9LVwiICsgXG4gICAgICAgICAgICBcIjRbMC05YS1mQS1GXXszfS1cIiArIFxuICAgICAgICAgICAgXCJbMC05YS1mQS1GXXs0fS1cIiArIFxuICAgICAgICAgICAgXCJbMC05YS1mQS1GXXsxMn1cIilcblxuICAgICAgICByZXR1cm4gcmUudGVzdCh0ZXh0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIb29rIGludG8gYW4gb2JqZWN0IGFuZCBpbnRlcmNlcHQgYWxsIGZ1bmN0aW9uIGNhbGxzLlxuICAgICAqIEBwYXJhbSBvYmplY3QgXG4gICAgICogQHBhcmFtIGhvb2sgRnVuY3Rpb24gdG8gcnVuIGJlZm9yZSBlYWNoIGNhbGwuXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBIb29rKG9iamVjdDogYW55LCBob29rOiAodGFyZ2V0LCBwcm9wLCBhcmdzKSA9PiB2b2lkKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJveHkob2JqZWN0LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGdldDogKHRhcmdldCwgcHJvcCwgcmVjZWl2ZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXRbcHJvcF0gIT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5nZXQodGFyZ2V0LCBwcm9wLCByZWNlaXZlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvb2sodGFyZ2V0LCBwcm9wLCBhcmdzKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtwcm9wXS5iaW5kKHRhcmdldCkoLi4uYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb3B5IHRvIGNsaXBib2FyZC5cbiAgICAgKiBAcGFyYW0gdGV4dCBcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGFzeW5jIENsaXBib2FyZENvcHkodGV4dDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiBcbiAgICB7XG4gICAgICAgIGNvbnN0IGZhbGxiYWNrID0gYXN5bmMgKHRleHQpID0+IFxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4ocmVzb2x2ZSA9PiBcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2YXIgZmllbGQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGV4dGFyZWFcIik7XG4gICAgXG4gICAgICAgICAgICAgICAgZmllbGQudmFsdWUgPSB0ZXh0O1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZmllbGQpO1xuICAgIFxuICAgICAgICAgICAgICAgIGZpZWxkLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgZmllbGQuc2VsZWN0KCk7XG4gICAgXG4gICAgICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRvY3VtZW50LmV4ZWNDb21tYW5kKFwiY29weVwiKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGZpZWxkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFuYXZpZ2F0b3IuY2xpcGJvYXJkKSBcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIGZhbGxiYWNrKHRleHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHRleHQpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2goZSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIGZhbGxiYWNrKHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2FpdCBzb21lIHRpbWUuXG4gICAgICogQHBhcmFtIGRlbGF5IFxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgYXN5bmMgV2FpdChkZWxheTogbnVtYmVyKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4gXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZSgpLCBkZWxheSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEEgbm9vcCBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIE5vb3AoKVxuICAgIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbn0iLCJleHBvcnQgY2xhc3MgS2V5Ym9hcmRcbntcbiAgICBwdWJsaWMgc3RhdGljIEtleXM6IHsgW2tleTogc3RyaW5nXTogYm9vbGVhbiB9ID0ge307XG4gICAgcHJpdmF0ZSBzdGF0aWMgSW5pdGVkID0gZmFsc2U7XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlZCB3aGVuIGEga2V5IGlzIHByZXNzZWQuXG4gICAgICogQHBhcmFtIGV2ZW50IFxuICAgICAqIEBwYXJhbSBzdGF0ZSBcbiAgICAgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBPbktleShldmVudCwgc3RhdGU6IGJvb2xlYW4pOiB2b2lkXG4gICAge1xuICAgICAgICBLZXlib2FyZC5LZXlzW2V2ZW50LmtleS50b1VwcGVyQ2FzZSgpXSA9IHN0YXRlO1xuICAgICAgICBLZXlib2FyZC5LZXlzW2V2ZW50LmtleS50b0xvd2VyQ2FzZSgpXSA9IHN0YXRlO1xuICAgICAgICBLZXlib2FyZC5LZXlzW2V2ZW50LmtleUNvZGVdID0gc3RhdGU7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEluaXQga2V5Ym9hcmQgbGlzdGVuZXJzLlxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgSW5pdCgpOiB2b2lkXG4gICAge1xuICAgICAgICBpZihLZXlib2FyZC5Jbml0ZWQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIEtleWJvYXJkLkluaXRlZCA9IHRydWU7XG5cbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGUgPT4gS2V5Ym9hcmQuT25LZXkoZSwgdHJ1ZSksIGZhbHNlKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBlID0+IEtleWJvYXJkLk9uS2V5KGUsIGZhbHNlKSwgZmFsc2UpO1xuICAgIH1cbn0iLCJleHBvcnQgZW51bSBMb2dUeXBlXG57XG4gICAgU2lsZW50ID0gMCxcbiAgICBXYXJuID0gMSxcbiAgICBJbmZvID0gMixcbiAgICBWZXJib3NlID0gM1xufSIsImltcG9ydCB7IExvZ1R5cGUgfSBmcm9tIFwiLi9Mb2dUeXBlXCI7XG5cbmV4cG9ydCBjbGFzcyBMb2dnZXJcbntcbiAgICBwdWJsaWMgc3RhdGljIFR5cGU6IExvZ1R5cGUgPSBMb2dUeXBlLlNpbGVudDtcblxuICAgIC8qKlxuICAgICAqIExvZyBhIG1lc3NhZ2UuXG4gICAgICogQHBhcmFtIHNlbGZcbiAgICAgKiBAcGFyYW0gYXJncyBcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIExvZyhzZWxmOiBPYmplY3QsIHR5cGU6IExvZ1R5cGUsIC4uLmFyZ3M6IGFueVtdKVxuICAgIHtcbiAgICAgICAgaWYodGhpcy5UeXBlID49IHR5cGUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAoJHt0eXBlfSkgWyR7c2VsZi5jb25zdHJ1Y3Rvci5uYW1lfV0gYCwgLi4uYXJncyk7XG4gICAgICAgIH1cbiAgICB9XG59Il19
