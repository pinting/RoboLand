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
        yield Helper_1.Helper.ClipboardCopy(url);
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
    if (!(yield Helper_1.Helper.ClipboardCopy(url))) {
        return;
    }
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
                return false;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd3d3L2luZGV4LnRzIiwic3JjL3d3dy9saWIvQ29vcmQudHMiLCJzcmMvd3d3L2xpYi9FbGVtZW50L0FjdG9yL0Jhc2VBY3Rvci50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvQWN0b3IvUGxheWVyQWN0b3IudHMiLCJzcmMvd3d3L2xpYi9FbGVtZW50L0Jhc2VFbGVtZW50LnRzIiwic3JjL3d3dy9saWIvRWxlbWVudC9DZWxsL0Jhc2VDZWxsLnRzIiwic3JjL3d3dy9saWIvRWxlbWVudC9DZWxsL0dyb3VuZENlbGwudHMiLCJzcmMvd3d3L2xpYi9FbGVtZW50L0NlbGwvU3RvbmVDZWxsLnRzIiwic3JjL3d3dy9saWIvRWxlbWVudC9DZWxsL1dhdGVyQ2VsbC50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvTW92ZVR5cGUudHMiLCJzcmMvd3d3L2xpYi9FbGVtZW50TGlzdC50cyIsInNyYy93d3cvbGliL0V4cG9ydGFibGUudHMiLCJzcmMvd3d3L2xpYi9NYXAudHMiLCJzcmMvd3d3L2xpYi9OZXQvQ2xpZW50LnRzIiwic3JjL3d3dy9saWIvTmV0L0Nvbm5lY3Rpb24udHMiLCJzcmMvd3d3L2xpYi9OZXQvRmFrZUNoYW5uZWwudHMiLCJzcmMvd3d3L2xpYi9OZXQvTWVzc2FnZUhhbmRsZXIudHMiLCJzcmMvd3d3L2xpYi9OZXQvTWVzc2FnZVR5cGUudHMiLCJzcmMvd3d3L2xpYi9OZXQvUGVlckNoYW5uZWwudHMiLCJzcmMvd3d3L2xpYi9OZXQvU2VydmVyLnRzIiwic3JjL3d3dy9saWIvUmVuZGVyZXIudHMiLCJzcmMvd3d3L2xpYi9VdGlsL0V2ZW50LnRzIiwic3JjL3d3dy9saWIvVXRpbC9IZWxwZXIudHMiLCJzcmMvd3d3L2xpYi9VdGlsL0tleWJvYXJkLnRzIiwic3JjL3d3dy9saWIvVXRpbC9Mb2dUeXBlLnRzIiwic3JjL3d3dy9saWIvVXRpbC9Mb2dnZXIudHMiXSwibmFt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RyxJQUFJLENBQUM7UUFFdkIsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMzRSxDQUFDOztBQTdCYSxhQUFJLEdBQStCLEVBQUUsQ0FBQztBQUNyQyxlQUFNLEdBQUcsS0FBSyxDQUFDO0FBSGxDLDRCQWdDQzs7Ozs7QUNoQ0QsSUFBWSxPQU1YO0FBTkQsV0FBWSxPQUFPO0lBRWYseUNBQVUsQ0FBQTtJQUNWLHFDQUFRLENBQUE7SUFDUixxQ0FBUSxDQUFBO0lBQ1IsMkNBQVcsQ0FBQTtBQUNmLENBQUMsRUFOVyxPQUFPLEdBQVAsZUFBTyxLQUFQLGVBQU8sUUFNbEI7Ozs7O0FDTkQsdUNBQW9DO0FBRXBDO0lBU1csTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFZLEVBQUUsSUFBYSxFQUFFLEdBQUcsSUFBVztRQUV6RCxJQUFHLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxFQUNwQjtZQUNJLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO1NBQ2pFO0lBQ0wsQ0FBQzs7QUFiYSxXQUFJLEdBQVksaUJBQU8sQ0FBQyxNQUFNLENBQUM7QUFGakQsd0JBZ0JDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IHsgTWFwIH0gZnJvbSBcIi4vbGliL01hcFwiO1xuaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi9saWIvQ29vcmRcIjtcbmltcG9ydCB7IFBsYXllckFjdG9yIH0gZnJvbSAnLi9saWIvRWxlbWVudC9BY3Rvci9QbGF5ZXJBY3Rvcic7XG5pbXBvcnQgeyBTZXJ2ZXIgfSBmcm9tICcuL2xpYi9OZXQvU2VydmVyJztcbmltcG9ydCB7IFJlbmRlcmVyIH0gZnJvbSBcIi4vbGliL1JlbmRlcmVyXCI7XG5pbXBvcnQgeyBLZXlib2FyZCB9IGZyb20gXCIuL2xpYi9VdGlsL0tleWJvYXJkXCI7XG5pbXBvcnQgeyBDb25uZWN0aW9uIH0gZnJvbSBcIi4vbGliL05ldC9Db25uZWN0aW9uXCI7XG5pbXBvcnQgeyBGYWtlQ2hhbm5lbCB9IGZyb20gXCIuL2xpYi9OZXQvRmFrZUNoYW5uZWxcIjtcbmltcG9ydCB7IENsaWVudCB9IGZyb20gXCIuL2xpYi9OZXQvQ2xpZW50XCI7XG5pbXBvcnQgeyBQZWVyQ2hhbm5lbCB9IGZyb20gXCIuL2xpYi9OZXQvUGVlckNoYW5uZWxcIjtcbmltcG9ydCB7IEhlbHBlciB9IGZyb20gXCIuL2xpYi9VdGlsL0hlbHBlclwiO1xuXG4vLyBIVE1MIGVsZW1lbnRzXG5jb25zdCBnYW1lQ2FudmFzID0gPEhUTUxDYW52YXNFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZS1jYW52YXNcIik7XG5jb25zdCBhZGRCdXR0b24gPSA8SFRNTEJ1dHRvbkVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZGQtYnV0dG9uXCIpO1xuY29uc3QgbWVzc2FnZURpdiA9IDxIVE1MRGl2RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1lc3NhZ2UtZGl2XCIpO1xuXG4vLyBXaXJlIHVwIGxpc3RlbmVyc1xuYWRkQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiBDbGlja0FkZCgpO1xuXG4vLyBUYWIgSURcbmNvbnN0IHRhYklkID0gSGVscGVyLlVuaXF1ZSgpO1xuXG4vLyBHYW1lIG9iamVjdHNcbmNvbnN0IG1hcDogTWFwID0gbmV3IE1hcCgpO1xuXG4vLyBGb3IgY2xpZW50IG9yIHNlcnZlclxubGV0IGNsaWVudENoYW5uZWw6IFBlZXJDaGFubmVsID0gbnVsbDtcbmxldCBzZXJ2ZXI6IFNlcnZlciA9IG51bGw7XG5cbi8qKlxuICogVHlwZSBvZiB0aGUgaGFzaCBmb3JtYXQuXG4gKi9cbmVudW0gSGFzaFR5cGVcbntcbiAgICBPZmZlcixcbiAgICBBbnN3ZXJcbn1cblxuLyoqXG4gKiBTdHJ1Y3R1cmUgb2YgdGhlIGhhc2ggc3RyaW5nLlxuICovXG5pbnRlcmZhY2UgSGFzaEZvcm1hdFxue1xuICAgIFRhYjogc3RyaW5nO1xuICAgIFR5cGU6IEhhc2hUeXBlLFxuICAgIFBheWxvYWQ6IHN0cmluZztcbn1cblxuLyoqXG4gKiBNYWluIGZ1bmN0aW9uLlxuICovXG5jb25zdCBNYWluID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT5cbntcbiAgICBjb25zdCBoYXNoID0gUmVhZEhhc2goKTtcblxuICAgIC8vIElmIGl0IGlzIGFuIG9mZmVyLCBjcmVhdGUgYW4gYW5zd2VyIGFuZCB3YWl0IGZvciBhbiBvcGVuIGNoYW5uZWwuXG4gICAgaWYoaGFzaC5UeXBlID09IEhhc2hUeXBlLk9mZmVyKVxuICAgIHtcbiAgICAgICAgY2xpZW50Q2hhbm5lbCA9IG5ldyBQZWVyQ2hhbm5lbCgpO1xuICAgICAgICBjbGllbnRDaGFubmVsLk9uT3BlbiA9ICgpID0+IFN0YXJ0KCk7XG5cbiAgICAgICAgY29uc3QgYW5zd2VyID0gYXdhaXQgY2xpZW50Q2hhbm5lbC5BbnN3ZXIoaGFzaC5QYXlsb2FkKTtcbiAgICAgICAgY29uc3QgdXJsID0gQ29uc3RydWN0VXJsKHtcbiAgICAgICAgICAgIFRhYjogaGFzaC5UYWIsXG4gICAgICAgICAgICBUeXBlOiBIYXNoVHlwZS5BbnN3ZXIsXG4gICAgICAgICAgICBQYXlsb2FkOiBhbnN3ZXJcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYXdhaXQgSGVscGVyLkNsaXBib2FyZENvcHkodXJsKTtcblxuICAgICAgICBTZXRNZXNzYWdlKFwiQW5zd2VyIGNvcGllZCB0byBjbGlwYm9hcmQhXCIpO1xuICAgIH1cblxuICAgIC8vIElmIGl0IGlzIGFuIGFuc3dlciwgZ2l2ZSBpdCB0byB0aGUgc2VydmVyIHRhYiB1c2luZyB0aGUgbG9jYWwgc3RvcmFnZVxuICAgIGVsc2UgaWYoaGFzaC5UeXBlID09IEhhc2hUeXBlLkFuc3dlcilcbiAgICB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGhhc2guVGFiLCBoYXNoLlBheWxvYWQpO1xuICAgICAgICBTZXRNZXNzYWdlKFwiWW91IGNhbiBjbG9zZSB0aGlzIHRhYiFcIik7XG4gICAgfVxuXG4gICAgLy8gSWYgbm8gaGFzaCBpcyBwcmVzZW50LCBzdGFydCB0aGUgZ2FtZVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAgIFN0YXJ0KCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBTZXQgYSBtZXNzYWdlIG9uIHRoZSBzY3JlZW4uXG4gKiBAcGFyYW0gbWVzc2FnZSBcbiAqL1xuY29uc3QgU2V0TWVzc2FnZSA9IChtZXNzYWdlOiBzdHJpbmcpOiB2b2lkID0+XG57XG4gICAgbWVzc2FnZURpdi5pbm5lclRleHQgPSBtZXNzYWdlO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdCBhIG5ldyBVUkwgZnJvbSBIYXNoRm9ybWF0LlxuICogQHBhcmFtIGhhc2hGb3JtYXQgXG4gKi9cbmNvbnN0IENvbnN0cnVjdFVybCA9IChoYXNoRm9ybWF0OiBIYXNoRm9ybWF0KTogc3RyaW5nID0+XG57XG4gICAgcmV0dXJuIGxvY2F0aW9uLm9yaWdpbiArIGxvY2F0aW9uLnBhdGhuYW1lICsgXCIjXCIgKyBcbiAgICAgICAgZW5jb2RlVVJJKGJ0b2EoSlNPTi5zdHJpbmdpZnkoaGFzaEZvcm1hdCkpKTtcbn07XG5cbi8qKlxuICogUmVhZCB0aGUgbG9jYXRpb24gaGFzaC5cbiAqL1xuY29uc3QgUmVhZEhhc2ggPSAoKTogSGFzaEZvcm1hdCA9Plxue1xuICAgIHRyeSBcbiAgICB7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKGF0b2IoZGVjb2RlVVJJKGxvY2F0aW9uLmhhc2guc3Vic3RyKDEpKSkpO1xuICAgIH1cbiAgICBjYXRjaChlKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFRhYjogbnVsbCxcbiAgICAgICAgICAgIFR5cGU6IG51bGwsXG4gICAgICAgICAgICBQYXlsb2FkOiBudWxsXG4gICAgICAgIH07XG4gICAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgYW4gb2ZmZXIuXG4gKi9cbmNvbnN0IENsaWNrQWRkID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT5cbntcbiAgICBpZighc2VydmVyKVxuICAgIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNoYW5uZWwgPSBuZXcgUGVlckNoYW5uZWwoKTtcbiAgICBjb25zdCBvZmZlciA9IGF3YWl0IGNoYW5uZWwuT2ZmZXIoKTtcbiAgICBjb25zdCB1cmwgPSBDb25zdHJ1Y3RVcmwoe1xuICAgICAgICBUYWI6IHRhYklkLFxuICAgICAgICBUeXBlOiBIYXNoVHlwZS5PZmZlcixcbiAgICAgICAgUGF5bG9hZDogb2ZmZXJcbiAgICB9KTtcbiAgICBcbiAgICBpZighYXdhaXQgSGVscGVyLkNsaXBib2FyZENvcHkodXJsKSlcbiAgICB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBTZXRNZXNzYWdlKFwiT2ZmZXIgY29waWVkIHRvIGNsaXBib2FyZCFcIik7XG5cbiAgICBjaGFubmVsLk9uT3BlbiA9ICgpID0+IFxuICAgIHtcbiAgICAgICAgU2V0TWVzc2FnZShcIkEgbmV3IHBsYXllciBqb2luZWQhXCIpO1xuICAgICAgICBzZXJ2ZXIuQWRkKG5ldyBDb25uZWN0aW9uKGNoYW5uZWwpKTtcbiAgICB9O1xuXG4gICAgd2hpbGUodHJ1ZSlcbiAgICB7XG4gICAgICAgIGNvbnN0IGFuc3dlciA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHRhYklkKTtcblxuICAgICAgICBpZihhbnN3ZXIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNoYW5uZWwuRmluaXNoKGFuc3dlcik7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh0YWJJZCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IEhlbHBlci5XYWl0KDEwMDApO1xuICAgIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlIGNsaWVudCAoYW5kIHNlcnZlcikuXG4gKi9cbmNvbnN0IENyZWF0ZUNsaWVudCA9IGFzeW5jICgpOiBQcm9taXNlPENsaWVudD4gPT5cbntcbiAgICBpZihjbGllbnRDaGFubmVsICYmICFjbGllbnRDaGFubmVsLklzT2ZmZXJvcigpKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnQoY2xpZW50Q2hhbm5lbCwgbWFwKTtcbiAgICB9XG5cbiAgICAvLyBTaG93IGFkZCBidXR0b25cbiAgICBhZGRCdXR0b24uc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcblxuICAgIC8vIENyZWF0ZSBzZXJ2ZXIgbWFwLCBsb2FkIGl0LCBjcmVhdGUgc2VydmVyXG4gICAgY29uc3Qgc2VydmVyTWFwOiBNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICBhd2FpdCBzZXJ2ZXJNYXAuTG9hZChcInJlcy9tYXAuanNvblwiKTtcblxuICAgIHNlcnZlciA9IG5ldyBTZXJ2ZXIoc2VydmVyTWFwKTtcblxuICAgIC8vIENyZWF0ZSBhIGZha2UgY2hhbm5lbFxuICAgIGNvbnN0IGxvY2FsQSA9IG5ldyBGYWtlQ2hhbm5lbCgpO1xuICAgIGNvbnN0IGxvY2FsQiA9IG5ldyBGYWtlQ2hhbm5lbCgpO1xuXG4gICAgbG9jYWxBLlNldE90aGVyKGxvY2FsQik7XG4gICAgbG9jYWxCLlNldE90aGVyKGxvY2FsQSk7XG5cbiAgICAvLyBBZGQgY29ubmVjdGlvbiB0byB0aGUgc2VydmVyXG4gICAgc2VydmVyLkFkZChuZXcgQ29ubmVjdGlvbihsb2NhbEEpKTtcblxuICAgIC8vIENvbm5lY3QgY2xpZW50IHRvIHRoZSBzZXJ2ZXJcbiAgICByZXR1cm4gbmV3IENsaWVudChsb2NhbEIsIG1hcCk7XG59XG5cbi8qKlxuICogR2FtZSBjeWNsZVxuICogQHBhcmFtIHBsYXllciBcbiAqIEBwYXJhbSB1cFxuICogQHBhcmFtIGxlZnRcbiAqIEBwYXJhbSBkb3duXG4gKiBAcGFyYW0gcmlnaHRcbiAqL1xuY29uc3QgT25VcGRhdGUgPSAocGxheWVyOiBQbGF5ZXJBY3RvciwgeyB1cCwgbGVmdCwgZG93biwgcmlnaHQgfSkgPT5cbntcbiAgICBjb25zdCBkaXJlY3Rpb24gPSBuZXcgQ29vcmQoXG4gICAgICAgIEtleWJvYXJkLktleXNbbGVmdF0gPyAtMC4wNSA6IEtleWJvYXJkLktleXNbcmlnaHRdID8gMC4wNSA6IDAsIFxuICAgICAgICBLZXlib2FyZC5LZXlzW3VwXSA/IC0wLjA1IDogS2V5Ym9hcmQuS2V5c1tkb3duXSA/IDAuMDUgOiAwXG4gICAgKTtcblxuICAgIGlmKHBsYXllciAmJiBkaXJlY3Rpb24uR2V0RGlzdGFuY2UobmV3IENvb3JkKSA+IDApXG4gICAge1xuICAgICAgICBwbGF5ZXIuTW92ZShkaXJlY3Rpb24pO1xuICAgIH1cbn07XG5cbi8qKlxuICogU3RhcnQgZ2FtZS5cbiAqL1xuY29uc3QgU3RhcnQgPSBhc3luYyAoKSA9Plxue1xuICAgIEtleWJvYXJkLkluaXQoKTtcblxuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IENyZWF0ZUNsaWVudCgpO1xuICAgIGNvbnN0IHJlbmRlcmVyID0gbmV3IFJlbmRlcmVyKG1hcCwgZ2FtZUNhbnZhcyk7XG5cbiAgICBjbGllbnQuT25QbGF5ZXIgPSBhc3luYyBwbGF5ZXIgPT5cbiAgICB7XG4gICAgICAgIGF3YWl0IHJlbmRlcmVyLkxvYWQoKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGtleXMgPSBcbiAgICAgICAge1xuICAgICAgICAgICAgdXA6IFwiQVJST1dVUFwiLCBcbiAgICAgICAgICAgIGxlZnQ6IFwiQVJST1dMRUZUXCIsIFxuICAgICAgICAgICAgZG93bjogXCJBUlJPV0RPV05cIiwgXG4gICAgICAgICAgICByaWdodDogXCJBUlJPV1JJR0hUXCJcbiAgICAgICAgfTtcblxuICAgICAgICByZW5kZXJlci5PblVwZGF0ZS5BZGQoKCkgPT4gT25VcGRhdGUocGxheWVyLCBrZXlzKSk7XG4gICAgICAgIHJlbmRlcmVyLlN0YXJ0KCk7XG4gICAgfTtcbn07XG5cbi8vIFN0YXJ0IHRoZSBtYWluIGZ1bmN0aW9uXG5NYWluKCk7IiwiaW1wb3J0IHsgRXhwb3J0YWJsZSB9IGZyb20gXCIuL0V4cG9ydGFibGVcIjtcblxuZXhwb3J0IGNsYXNzIENvb3JkIGV4dGVuZHMgRXhwb3J0YWJsZVxue1xuICAgIHB1YmxpYyBYOiBudW1iZXI7XG4gICAgcHVibGljIFk6IG51bWJlcjtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdCBhIG5ldyBjb29yZC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIgPSAwLCB5OiBudW1iZXIgPSAwKVxuICAgIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLlggPSB4O1xuICAgICAgICB0aGlzLlkgPSB5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgZGlzdGFuY2UgZnJvbSB0aGUgb3RoZXIgY29vcmQuXG4gICAgICogQHBhcmFtIG90aGVyIFxuICAgICAqL1xuICAgIHB1YmxpYyBHZXREaXN0YW5jZShvdGhlcjogQ29vcmQpOiBudW1iZXJcbiAgICB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3codGhpcy5YIC0gb3RoZXIuWCwgMikgKyBNYXRoLnBvdyh0aGlzLlkgLSBvdGhlci5ZLCAyKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGNvb3JkIGlzIHRoZSBzYW1lIGFzIGFuIG90aGVyLlxuICAgICAqIEBwYXJhbSBvdGhlciBcbiAgICAgKi9cbiAgICBwdWJsaWMgSXMob3RoZXI6IENvb3JkKTogYm9vbGVhblxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuWCA9PSBvdGhlci5YICYmIHRoaXMuWSA9PSBvdGhlci5ZO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGNvb3JkIHRvIHRoaXMgb25lLlxuICAgICAqIEBwYXJhbSBvdGhlciBcbiAgICAgKi9cbiAgICBwdWJsaWMgQWRkKG90aGVyOiBDb29yZCk6IENvb3JkXG4gICAge1xuICAgICAgICByZXR1cm4gbmV3IENvb3JkKHRoaXMuWCArIG90aGVyLlgsIHRoaXMuWSArIG90aGVyLlkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsb25lIHRoZSBjb29yZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgQ2xvbmUoKTogQ29vcmRcbiAgICB7XG4gICAgICAgIHJldHVybiBuZXcgQ29vcmQodGhpcy5YLCB0aGlzLlkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZsb29yIHRoZSBjb29yZGluYXRlcy5cbiAgICAgKi9cbiAgICBwdWJsaWMgRmxvb3IoKTogQ29vcmRcbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLkYobiA9PiBNYXRoLmZsb29yKG4pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDZWlsIHRoZSBjb29yZGluYXRlcy5cbiAgICAgKi9cbiAgICBwdWJsaWMgQ2VpbCgpOiBDb29yZFxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuRihuID0+IE1hdGguY2VpbChuKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUm91bmQgdXAgdGhlIGNvb3JkaW5hdGVzLlxuICAgICAqIEBwYXJhbSBkIERlY2ltYWwgcGxhY2VzIHRvIHJvdW5kIHVwLlxuICAgICAqL1xuICAgIHB1YmxpYyBSb3VuZChkID0gMCk6IENvb3JkXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5GKG4gPT4gTWF0aC5yb3VuZChuICogTWF0aC5wb3coMTAsIGQpKSAvIE1hdGgucG93KDEwLCBkKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGNvb3JkaW5hdGUgaXMgaW5zaWRlIHRoZSBpbnRlcnNlY3Rpb24gb2YgdHdvIHBvaW50cy5cbiAgICAgKiBAcGFyYW0gZnJvbSBcbiAgICAgKiBAcGFyYW0gdG8gXG4gICAgICovXG4gICAgcHVibGljIEluc2lkZShmcm9tOiBDb29yZCwgdG86IENvb3JkKTogYm9vbGVhblxuICAgIHtcbiAgICAgICAgaWYoZnJvbS5YIDw9IHRoaXMuWCAmJiBmcm9tLlkgPD0gdGhpcy5ZICYmIHRvLlggPj0gdGhpcy5YICYmIHRvLlkgPj0gdGhpcy5ZKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0d28gb2JqZWN0cyBhbGwgY29sbGlkZS5cbiAgICAgKiBAcGFyYW0gYSBBIGZyb20gcG9pbnRcbiAgICAgKiBAcGFyYW0gYXMgQSB0byBwb2ludFxuICAgICAqIEBwYXJhbSBiIEIgZnJvbSBwb2ludFxuICAgICAqIEBwYXJhbSBicyBCIHRvIHBvaW50XG4gICAgICovXG4gICAgc3RhdGljIENvbGxpZGUoYTogQ29vcmQsIGFzOiBDb29yZCwgYjogQ29vcmQsIGJzOiBDb29yZCk6IGJvb2xlYW5cbiAgICB7XG4gICAgICAgIHJldHVybiBhcy5YID4gYi5YICYmIGEuWCA8IGJzLlggJiYgYXMuWSA+IGIuWSAmJiBhLlkgPCBicy5ZO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGUgYSBmdW5jdGlvbiBvbiB0aGUgY29vcmRpbmF0ZXMuXG4gICAgICogQHBhcmFtIGYgRnVuY3Rpb24gdG8gZXhlY3V0ZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgRihmOiAobjogbnVtYmVyKSA9PiBudW1iZXIpOiBDb29yZFxuICAgIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb29yZChmKHRoaXMuWCksIGYodGhpcy5ZKSk7XG4gICAgfVxufSIsImltcG9ydCB7IENvb3JkIH0gZnJvbSBcIi4uLy4uL0Nvb3JkXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9CYXNlRWxlbWVudFwiO1xuaW1wb3J0IHsgSUV4cG9ydE9iamVjdCB9IGZyb20gXCIuLi8uLi9JRXhwb3J0T2JqZWN0XCI7XG5pbXBvcnQgeyBNb3ZlVHlwZSB9IGZyb20gXCIuLi9Nb3ZlVHlwZVwiO1xuaW1wb3J0IHsgTWFwIH0gZnJvbSBcIi4uLy4uL01hcFwiO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQmFzZUFjdG9yIGV4dGVuZHMgQmFzZUVsZW1lbnRcbntcbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3QgYSBuZXcgQmFzZUFjdG9yLiBBYnN0cmFjdCFcbiAgICAgKiBAcGFyYW0gcG9zaXRpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgY29uc3RydWN0b3IocG9zaXRpb246IENvb3JkID0gbnVsbCwgbWFwOiBNYXAgPSBudWxsKVxuICAgIHtcbiAgICAgICAgc3VwZXIocG9zaXRpb24sIG1hcCk7XG4gICAgICAgIHRoaXMuU2V0UG9zKHRoaXMucG9zaXRpb24pO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHBvc2l0aW9uIG9mIHRoZSBhY3Rvci5cbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0UG9zKCk6IENvb3JkXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3NpdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHBvc2l0aW9uIG9mIHRoZSBhY3Rvci5cbiAgICAgKiBAcGFyYW0gcG9zaXRpb24gXG4gICAgICovXG4gICAgcHJvdGVjdGVkIFNldFBvcyhuZXh0UG9zOiBDb29yZCA9IG51bGwsIHByZXZQb3M6IENvb3JkID0gbnVsbCk6IGJvb2xlYW5cbiAgICB7XG4gICAgICAgIGNvbnN0IGNlbGxzID0gdGhpcy5tYXAuR2V0Q2VsbHMoKTtcblxuICAgICAgICAvLyBHZXQgdGhlIGN1cnJlbnRseSBjb3ZlcmVkIGNlbGxzIGFuZCB0aGUgbmV4dCBvbmVzXG4gICAgICAgIGNvbnN0IHByZXYgPSBwcmV2UG9zIFxuICAgICAgICAgICAgPyBjZWxscy5HZXRCZXR3ZWVuKHByZXZQb3MsIHByZXZQb3MuQWRkKHRoaXMuR2V0U2l6ZSgpKSlcbiAgICAgICAgICAgIDogW107XG4gICAgICAgIFxuICAgICAgICBjb25zdCBuZXh0ID0gbmV4dFBvc1xuICAgICAgICAgICAgPyBjZWxscy5HZXRCZXR3ZWVuKG5leHRQb3MsIG5leHRQb3MuQWRkKHRoaXMuR2V0U2l6ZSgpKSlcbiAgICAgICAgICAgIDogW107XG5cbiAgICAgICAgLy8gSWYgcHJldlBvcy9uZXh0UG9zIHdhcyBnaXZlbiwgYnV0IG5vIGNlbGxzIGZvdW5kLCByZXR1cm5cbiAgICAgICAgaWYoKHByZXZQb3MgJiYgIXByZXYubGVuZ3RoKSB8fCAobmV4dFBvcyAmJiAhbmV4dC5sZW5ndGgpKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1vdmUgaW50ZXJzZWN0aW9uIFxuICAgICAgICBjb25zdCBwcmV2RmlsdGVyZWQgPSBwcmV2LmZpbHRlcihjID0+ICFuZXh0LmluY2x1ZGVzKGMpKTtcbiAgICAgICAgY29uc3QgbmV4dEZpbHRlcmVkID0gbmV4dC5maWx0ZXIoYyA9PiAhcHJldi5pbmNsdWRlcyhjKSk7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgb25lIG9mIHRoZSBjZWxscyBibG9ja3MgdGhlIG1vdmVtZW50LlxuICAgICAgICAvLyBJZiB5ZXMsIHJldmVydCBhbGwgbW92ZW1lbnQgYW5kIHJldHVybi5cbiAgICAgICAgaWYobmV4dEZpbHRlcmVkLnNvbWUoY2VsbCA9PiAhdGhpcy5IYW5kbGVNb3ZlKGNlbGwuTW92ZUhlcmUodGhpcykpKSlcbiAgICAgICAge1xuICAgICAgICAgICAgbmV4dEZpbHRlcmVkLmZvckVhY2goYyA9PiBjLk1vdmVBd2F5KHRoaXMpKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGl0IHdhcyBzdWNjZXNzZnVsLCBtb3ZlIGF3YXkgZnJvbSB0aGUgb2xkIGNlbGxzXG4gICAgICAgIHByZXZGaWx0ZXJlZC5mb3JFYWNoKGMgPT4gYy5Nb3ZlQXdheSh0aGlzKSk7XG5cbiAgICAgICAgLy8gVXBkYXRlIHBvc2l0aW9uXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXh0UG9zO1xuXG4gICAgICAgIC8vIFVwZGF0ZSBtYXBcbiAgICAgICAgdGhpcy5tYXAuT25VcGRhdGUuQ2FsbCh0aGlzKTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEaXNwb3NlIHRoZSBjZWxsLlxuICAgICAqL1xuICAgIHB1YmxpYyBEaXNwb3NlKCk6IHZvaWRcbiAgICB7XG4gICAgICAgIGlmKHRoaXMuZGlzcG9zZWQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgc3VwZXIuRGlzcG9zZSgpO1xuICAgICAgICB0aGlzLlNldFBvcygpO1xuXG4gICAgICAgIGlmKHRoaXMgaW5zdGFuY2VvZiBCYXNlQWN0b3IpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMubWFwLkdldEFjdG9ycygpLlJlbW92ZSh0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBhYnN0cmFjdCBIYW5kbGVNb3ZlKHR5cGU6IE1vdmVUeXBlKTogYm9vbGVhbjtcbiAgICBwdWJsaWMgYWJzdHJhY3QgR2V0U2l6ZSgpOiBDb29yZDtcbiAgICBwdWJsaWMgYWJzdHJhY3QgR2V0VGV4dHVyZSgpOiBzdHJpbmc7XG59IiwiaW1wb3J0IHsgQmFzZUFjdG9yIH0gZnJvbSBcIi4vQmFzZUFjdG9yXCI7XG5pbXBvcnQgeyBNb3ZlVHlwZSB9IGZyb20gXCIuLi9Nb3ZlVHlwZVwiO1xuaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi4vLi4vQ29vcmRcIjtcblxuZXhwb3J0IGNsYXNzIFBsYXllckFjdG9yIGV4dGVuZHMgQmFzZUFjdG9yXG57XG4gICAgcHJvdGVjdGVkIGhlYWx0aDogbnVtYmVyID0gMS4wO1xuICAgIHByb3RlY3RlZCBkYW1hZ2U6IG51bWJlciA9IDEuMDtcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdGV4dHVyZSBvZiB0aGUgYWN0b3IuXG4gICAgICovXG4gICAgcHVibGljIEdldFRleHR1cmUoKTogc3RyaW5nXG4gICAge1xuICAgICAgICByZXR1cm4gXCJyZXMvcGxheWVyLnBuZ1wiO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgc2l6ZSBvZiB0aGUgYWN0b3IuXG4gICAgICovXG4gICAgcHVibGljIEdldFNpemUoKTogQ29vcmRcbiAgICB7XG4gICAgICAgIHJldHVybiBuZXcgQ29vcmQoMC44LCAwLjgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1vdmUgYWN0b3IgaW4gYSBkaXJlY3Rpb24uXG4gICAgICogQHBhcmFtIGRpcmVjdGlvblxuICAgICAqL1xuICAgIHB1YmxpYyBNb3ZlKGRpcmVjdGlvbjogQ29vcmQpOiBib29sZWFuXG4gICAge1xuICAgICAgICBpZihkaXJlY3Rpb24uR2V0RGlzdGFuY2UobmV3IENvb3JkKDAsIDApKSA9PSAwKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIERvZXMgbm90IGFsbG93IDAgZGlzdGFuY2UgbW92ZW1lbnRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKE1hdGguYWJzKE1hdGguYWJzKGRpcmVjdGlvbi5YKSAtIE1hdGguYWJzKGRpcmVjdGlvbi5ZKSkgPT0gMClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBPbmx5IGFsbG93IGxlZnQsIHJpZ2h0LCB0b3AgYW5kIGJvdHRvbSBtb3ZlbWVudFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBHZXQgc2l6ZXNcbiAgICAgICAgY29uc3Qgc2l6ZSA9IHRoaXMuR2V0U2l6ZSgpO1xuICAgICAgICBjb25zdCBtYXBTaXplID0gdGhpcy5tYXAuR2V0U2l6ZSgpO1xuXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgbmV4dCBwb3NpdGlvblxuICAgICAgICBjb25zdCBwcmV2UG9zID0gdGhpcy5HZXRQb3MoKS5Sb3VuZCgzKTtcbiAgICAgICAgY29uc3QgbmV4dFBvcyA9IHByZXZQb3MuQWRkKGRpcmVjdGlvbikuUm91bmQoMyk7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgaXQgZ29lcyBvdXQgb2YgdGhlIG1hcFxuICAgICAgICBpZighbmV4dFBvcy5JbnNpZGUobmV3IENvb3JkKDAsIDApLCBtYXBTaXplKSB8fCBcbiAgICAgICAgICAgICFuZXh0UG9zLkFkZChzaXplKS5JbnNpZGUobmV3IENvb3JkKDAsIDApLCBtYXBTaXplKSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuU2V0UG9zKG5leHRQb3MsIHByZXZQb3MpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhhbmRsZSBtb3ZlbWVudCB0eXBlcy5cbiAgICAgKiBAcGFyYW0gdHlwZSBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgSGFuZGxlTW92ZSh0eXBlOiBNb3ZlVHlwZSk6IGJvb2xlYW5cbiAgICB7XG4gICAgICAgIHN3aXRjaCh0eXBlKVxuICAgICAgICB7XG4gICAgICAgICAgICBjYXNlIE1vdmVUeXBlLkJsb2NrZWQ6IC8vIERvIG5vdGhpbmdcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBjYXNlIE1vdmVUeXBlLktpbGxlZDogLy8gS2lsbCBpdFxuICAgICAgICAgICAgICAgIHRoaXMuS2lsbCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGNhc2UgTW92ZVR5cGUuU3VjY2Vzc2VkOiAvLyBNb3ZlIGF3YXlcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEF0dGFjayBhbiBvdGhlciBhY3RvciBpZiBpdCBpcyBvbmUgY2VsbCBhd2F5LlxuICAgICAqIEBwYXJhbSBhY3RvciBcbiAgICAgKi9cbiAgICBwdWJsaWMgQXR0YWNrKGFjdG9yOiBQbGF5ZXJBY3Rvcik6IGJvb2xlYW5cbiAgICB7XG4gICAgICAgIGlmKHRoaXMucG9zaXRpb24uR2V0RGlzdGFuY2UoYWN0b3IuR2V0UG9zKCkpID4gMSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgYWN0b3IuRGFtYWdlKHRoaXMuZGFtYWdlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEbyBkYW1hZ2UgdG8gdGhpcyBhY3Rvci5cbiAgICAgKiBAcGFyYW0gZGFtYWdlIEFtb3VudCBvZiB0aGUgZGFtYWdlLlxuICAgICAqL1xuICAgIHB1YmxpYyBEYW1hZ2UoZGFtYWdlOiBudW1iZXIpOiB2b2lkXG4gICAge1xuICAgICAgICB0aGlzLmhlYWx0aCAtPSBkYW1hZ2U7XG5cbiAgICAgICAgaWYodGhpcy5oZWFsdGggPD0gMClcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5LaWxsKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm1hcC5PblVwZGF0ZS5DYWxsKHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEtpbGwgdGhlIGFjdG9yLlxuICAgICAqL1xuICAgIHByaXZhdGUgS2lsbCgpOiB2b2lkXG4gICAge1xuICAgICAgICB0aGlzLmhlYWx0aCA9IDA7XG4gICAgICAgIFxuICAgICAgICAvLyBEaXNwb3NlXG4gICAgICAgIHRoaXMuRGlzcG9zZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHRoZSBhY3RvciBpcyBhbGl2ZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgSXNBbGl2ZSgpOiBib29sZWFuXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5oZWFsdGggPiAwO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuLi9Db29yZFwiO1xuaW1wb3J0IHsgSGVscGVyIH0gZnJvbSBcIi4uL1V0aWwvSGVscGVyXCI7XG5pbXBvcnQgeyBNYXAgfSBmcm9tIFwiLi4vTWFwXCI7XG5pbXBvcnQgeyBFeHBvcnRhYmxlIH0gZnJvbSBcIi4uL0V4cG9ydGFibGVcIjtcbmltcG9ydCB7IElFeHBvcnRPYmplY3QgfSBmcm9tIFwiLi4vSUV4cG9ydE9iamVjdFwiO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQmFzZUVsZW1lbnQgZXh0ZW5kcyBFeHBvcnRhYmxlXG57XG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IG1hcDogTWFwO1xuXG4gICAgcHJvdGVjdGVkIGRpc3Bvc2VkOiBib29sZWFuO1xuICAgIHByb3RlY3RlZCBwb3NpdGlvbjogQ29vcmQ7XG4gICAgcHJvdGVjdGVkIHRhZzogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3Igb2YgdGhlIEJhc2VFbGVtZW50LiBBYnN0cmFjdCFcbiAgICAgKiBAcGFyYW0gcG9zaXRpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgY29uc3RydWN0b3IocG9zaXRpb246IENvb3JkID0gbnVsbCwgbWFwOiBNYXAgPSBudWxsKVxuICAgIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb24gfHwgbmV3IENvb3JkO1xuICAgICAgICB0aGlzLm1hcCA9IG1hcCB8fCBNYXAuR2V0SW5zdGFuY2UoKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZGlzcG9zZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50YWcgPSBIZWxwZXIuVW5pcXVlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB0YWcgb2YgdGhlIGVsZW1lbnQuXG4gICAgICovXG4gICAgcHVibGljIEdldFRhZygpOiBzdHJpbmdcbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLnRhZztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPdmVycmlkZSBpbXBvcnQgYWxsIHRvIGhhbmRsZSByZW1vdmFsIGZyb20gdGhlIG1hcC5cbiAgICAgKiBAcGFyYW0gaW5wdXRcbiAgICAgKi9cbiAgICBwdWJsaWMgSW1wb3J0QWxsKGlucHV0OiBJRXhwb3J0T2JqZWN0W10pOiB2b2lkXG4gICAge1xuICAgICAgICBzdXBlci5JbXBvcnRBbGwoaW5wdXQpO1xuXG4gICAgICAgIGlmKHRoaXMuZGlzcG9zZWQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIC8vIEluIEJhc2VFbGVtZW50IHRoaXMgbWFrZXMgbm8gc2Vuc2UsXG4gICAgICAgICAgICAvLyBidXQgaW4gaXRzIGNoaWxkcyB0aGUgZWxlbWVudCBuZWVkc1xuICAgICAgICAgICAgLy8gdG8gYmUgcmVtb3ZlZCBmcm9tIHRoZSBtYXBcbiAgICAgICAgICAgIHRoaXMuRGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGVsZW1lbnQgaXMgZGlzcG9zZWQuXG4gICAgICovXG4gICAgcHVibGljIElzRGlzcG9zZWQoKTogYm9vbGVhblxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzcG9zZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGlzcG9zZSB0aGUgZWxlbWVudC5cbiAgICAgKi9cbiAgICBwdWJsaWMgRGlzcG9zZSgpOiB2b2lkXG4gICAge1xuICAgICAgICB0aGlzLmRpc3Bvc2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgXG4gICAgcHVibGljIGFic3RyYWN0IEdldFNpemUoKTogQ29vcmQ7XG4gICAgcHVibGljIGFic3RyYWN0IEdldFRleHR1cmUoKTogc3RyaW5nO1xuICAgIHB1YmxpYyBhYnN0cmFjdCBHZXRQb3MoKTogQ29vcmQ7XG59IiwiaW1wb3J0IHsgQmFzZUFjdG9yIH0gZnJvbSBcIi4uL0FjdG9yL0Jhc2VBY3RvclwiO1xuaW1wb3J0IHsgTW92ZVR5cGUgfSBmcm9tIFwiLi4vTW92ZVR5cGVcIjtcbmltcG9ydCB7IENvb3JkIH0gZnJvbSBcIi4uLy4uL0Nvb3JkXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9CYXNlRWxlbWVudFwiO1xuaW1wb3J0IHsgTWFwIH0gZnJvbSBcIi4uLy4uL01hcFwiO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQmFzZUNlbGwgZXh0ZW5kcyBCYXNlRWxlbWVudFxue1xuICAgIHByb3RlY3RlZCBhY3RvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3QgYSBCYXNlQ2VsbC4gQWJzdHJhY3QhXG4gICAgICogQHBhcmFtIHBvc2l0aW9uXG4gICAgICovXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHBvc2l0aW9uOiBDb29yZCA9IG51bGwsIG1hcDogTWFwID0gbnVsbClcbiAgICB7XG4gICAgICAgIHN1cGVyKHBvc2l0aW9uLCBtYXApO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHBvc2l0aW9uIG9mIHRoZSBjZWxsLlxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRQb3MoKTogQ29vcmQgXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3NpdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbnRlciBpbnRvIHRoZSBjZWxsIHdpdGggYW4gYWN0b3IuXG4gICAgICogQHBhcmFtIGFjdG9yIFxuICAgICAqL1xuICAgIHB1YmxpYyBNb3ZlSGVyZShhY3RvcjogQmFzZUFjdG9yKTogTW92ZVR5cGUgXG4gICAge1xuICAgICAgICBjb25zdCB0YWcgPSBhY3Rvci5HZXRUYWcoKTtcblxuICAgICAgICBpZighdGhpcy5hY3RvcnMuaW5jbHVkZXModGFnKSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5hY3RvcnMucHVzaCh0YWcpO1xuICAgICAgICAgICAgdGhpcy5tYXAuT25VcGRhdGUuQ2FsbCh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBNb3ZlVHlwZS5TdWNjZXNzZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTGVhdmUgY2VsbCB0aGUgY2VsbCB3aXRoIGFuIGFjdG9yLlxuICAgICAqIEBwYXJhbSBhY3RvciBcbiAgICAgKi9cbiAgICBwdWJsaWMgTW92ZUF3YXkoYWN0b3I6IEJhc2VBY3Rvcik6IHZvaWQgXG4gICAge1xuICAgICAgICBjb25zdCB0YWcgPSBhY3Rvci5HZXRUYWcoKTtcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmFjdG9ycy5pbmRleE9mKHRhZyk7XG5cbiAgICAgICAgaWYoaW5kZXggPj0gMCkgXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuYWN0b3JzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB0aGlzLm1hcC5PblVwZGF0ZS5DYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGlzcG9zZSB0aGUgY2VsbC5cbiAgICAgKi9cbiAgICBwdWJsaWMgRGlzcG9zZSgpOiB2b2lkXG4gICAge1xuICAgICAgICBpZih0aGlzLmRpc3Bvc2VkKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzdXBlci5EaXNwb3NlKCk7XG5cbiAgICAgICAgaWYodGhpcyBpbnN0YW5jZW9mIEJhc2VDZWxsKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLm1hcC5HZXRDZWxscygpLlJlbW92ZSh0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBwdWJsaWMgYWJzdHJhY3QgR2V0U2l6ZSgpOiBDb29yZDtcbiAgICBwdWJsaWMgYWJzdHJhY3QgR2V0VGV4dHVyZSgpOiBzdHJpbmc7XG59IiwiaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi4vLi4vQ29vcmRcIjtcbmltcG9ydCB7IEJhc2VDZWxsIH0gZnJvbSBcIi4vQmFzZUNlbGxcIjtcblxuZXhwb3J0IGNsYXNzIEdyb3VuZENlbGwgZXh0ZW5kcyBCYXNlQ2VsbFxue1xuICAgIC8qKlxuICAgICAqIEdldCB0aGUgc2l6ZSBvZiB0aGUgY2VsbC5cbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0U2l6ZSgpOiBDb29yZFxuICAgIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb29yZCgxLjAsIDEuMCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB0ZXh0dXJlIG9mIHRoZSBjZWxsLlxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRUZXh0dXJlKCk6IHN0cmluZ1xuICAgIHtcbiAgICAgICAgcmV0dXJuIFwicmVzL2dyb3VuZC5wbmdcIjtcbiAgICB9XG59IiwiaW1wb3J0IHsgQmFzZUFjdG9yIH0gZnJvbSBcIi4uL0FjdG9yL0Jhc2VBY3RvclwiO1xuaW1wb3J0IHsgTW92ZVR5cGUgfSBmcm9tIFwiLi4vTW92ZVR5cGVcIjtcbmltcG9ydCB7IENvb3JkIH0gZnJvbSBcIi4uLy4uL0Nvb3JkXCI7XG5pbXBvcnQgeyBCYXNlQ2VsbCB9IGZyb20gXCIuL0Jhc2VDZWxsXCI7XG5cbmV4cG9ydCBjbGFzcyBTdG9uZUNlbGwgZXh0ZW5kcyBCYXNlQ2VsbFxue1xuICAgIC8qKlxuICAgICAqIEdldCB0aGUgc2l6ZSBvZiB0aGUgY2VsbC5cbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0U2l6ZSgpOiBDb29yZFxuICAgIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb29yZCgxLjAsIDEuMCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB0ZXh0dXJlIG9mIHRoZSBjZWxsLlxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRUZXh0dXJlKCk6IHN0cmluZ1xuICAgIHtcbiAgICAgICAgcmV0dXJuIFwicmVzL3N0b25lLnBuZ1wiO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVudGVyIGEgY2VsbCB3aXRoIGEgYWN0b3IgYW5kIGJsb2NrIGl0LlxuICAgICAqIEBwYXJhbSBhY3RvciBcbiAgICAgKi9cbiAgICBwdWJsaWMgTW92ZUhlcmUoYWN0b3I6IEJhc2VBY3Rvcik6IE1vdmVUeXBlIFxuICAgIHtcbiAgICAgICAgcmV0dXJuIE1vdmVUeXBlLkJsb2NrZWQ7XG4gICAgfVxufSIsImltcG9ydCB7IEdyb3VuZENlbGwgfSBmcm9tIFwiLi9Hcm91bmRDZWxsXCJcbmltcG9ydCB7IEJhc2VBY3RvciB9IGZyb20gXCIuLi9BY3Rvci9CYXNlQWN0b3JcIjtcbmltcG9ydCB7IE1vdmVUeXBlIH0gZnJvbSBcIi4uL01vdmVUeXBlXCI7XG5pbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuLi8uLi9Db29yZFwiO1xuaW1wb3J0IHsgQmFzZUNlbGwgfSBmcm9tIFwiLi9CYXNlQ2VsbFwiO1xuXG5leHBvcnQgY2xhc3MgV2F0ZXJDZWxsIGV4dGVuZHMgQmFzZUNlbGxcbntcbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHNpemUgb2YgdGhlIGNlbGwuXG4gICAgICovXG4gICAgcHVibGljIEdldFNpemUoKTogQ29vcmRcbiAgICB7XG4gICAgICAgIHJldHVybiBuZXcgQ29vcmQoMi4wLCAxLjApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdGV4dHVyZSBvZiB0aGUgY2VsbC5cbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0VGV4dHVyZSgpOiBzdHJpbmdcbiAgICB7XG4gICAgICAgIHJldHVybiBcInJlcy93YXRlci5wbmdcIjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbnRlciBhIGNlbGwgd2l0aCBhIGFjdG9yIGFuZCBraWxsIGl0LlxuICAgICAqIEBwYXJhbSBhY3RvciBcbiAgICAgKi9cbiAgICBwdWJsaWMgTW92ZUhlcmUoYWN0b3I6IEJhc2VBY3Rvcik6IE1vdmVUeXBlIFxuICAgIHtcbiAgICAgICAgcmV0dXJuIE1vdmVUeXBlLktpbGxlZDtcbiAgICB9XG59IiwiZXhwb3J0IGVudW0gTW92ZVR5cGVcbntcbiAgICBTdWNjZXNzZWQsXG4gICAgQmxvY2tlZCxcbiAgICBLaWxsZWRcbn0iLCJpbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuL0Nvb3JkXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL0VsZW1lbnQvQmFzZUVsZW1lbnRcIjtcbmltcG9ydCB7IElSZWFkT25seUVsZW1lbnRMaXN0IH0gZnJvbSBcIi4vSVJlYWRPbmx5RWxlbWVudExpc3RcIjtcbmltcG9ydCB7IEhlbHBlciB9IGZyb20gXCIuL1V0aWwvSGVscGVyXCI7XG5pbXBvcnQgeyBFdmVudCB9IGZyb20gXCIuL1V0aWwvRXZlbnRcIjtcblxuZXhwb3J0IGNsYXNzIEVsZW1lbnRMaXN0PEVsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudD4gaW1wbGVtZW50cyBJUmVhZE9ubHlFbGVtZW50TGlzdDxFbGVtZW50Plxue1xuICAgIHByaXZhdGUgZWxlbWVudHM6IEVsZW1lbnRbXTtcbiAgICBwcml2YXRlIG9uVXBkYXRlOiBFdmVudDxFbGVtZW50PjtcblxuICAgIC8qKlxuICAgICAqIENvbnRzdHJ1Y3QgYSBuZXcgRWxlbWVudExpc3Qgd2hpY2ggd3JhcHMgYW4gZWxlbWVudCBhcnJheVxuICAgICAqIGFuZCBhZGRzIHNvbWUgYXdlc29tZSBmdW5jdGlvbnMuXG4gICAgICogQHBhcmFtIGVsZW1lbnRzIEFycmF5IHRvIHdyYXAuXG4gICAgICogQHBhcmFtIG9uVXBkYXRlIENhbGxlZCB3aGVuIHRoZXJlIGlzIGFuIHVwZGF0ZSAocmVtb3ZlLCBzZXQpLlxuICAgICAqL1xuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihlbGVtZW50czogRWxlbWVudFtdLCBvblVwZGF0ZTogRXZlbnQ8RWxlbWVudD4pXG4gICAge1xuICAgICAgICB0aGlzLmVsZW1lbnRzID0gZWxlbWVudHM7XG4gICAgICAgIHRoaXMub25VcGRhdGUgPSBvblVwZGF0ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGxlbmd0aCBvZiB0aGUgaW50ZXJuYWwgYXJyYXkuXG4gICAgICovXG4gICAgcHVibGljIEdldExlbmd0aCgpOiBudW1iZXJcbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRzLmxlbmd0aDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHbyBvdmVyIHRoZSBlbGVtZW50cyBvZiB0aGUgYXJyYXkuXG4gICAgICogQHBhcmFtIGNhbGxiYWNrIFxuICAgICAqL1xuICAgIHB1YmxpYyBGb3JFYWNoKGNhbGxiYWNrOiAoRWxlbWVudCkgPT4gYm9vbGVhbiB8IHZvaWQpXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50cy5zb21lKDxhbnk+Y2FsbGJhY2spO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBlbGVtZW50IGJ5IHRhZy5cbiAgICAgKiBAcGFyYW0gdGFnIFxuICAgICAqL1xuICAgIHB1YmxpYyBUYWcodGFnOiBzdHJpbmcpOiBFbGVtZW50XG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50cy5maW5kKGUgPT4gZSAmJiBlLkdldFRhZygpID09IHRhZyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGEgZWxlbWVudChzKSBieSBjb29yZC5cbiAgICAgKiBAcGFyYW0gY29vcmQgXG4gICAgICovIFxuICAgIHB1YmxpYyBHZXQoY29vcmQ6IENvb3JkKTogRWxlbWVudFtdXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50cy5maWx0ZXIoZSA9PiBlICYmIGUuR2V0UG9zKCkuSXMoPENvb3JkPmNvb3JkKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBuZWFyZXN0IGNlbGwgdG8gdGhlIGdpdmVuIGNvb3JkLlxuICAgICAqIEBwYXJhbSBjb29yZCBcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0TmVhcihjb29yZDogQ29vcmQpOiBFbGVtZW50XG4gICAge1xuICAgICAgICBsZXQgcmVzdWx0OiBFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgbGV0IG1pbiA9IEluZmluaXR5O1xuXG4gICAgICAgIHRoaXMuZWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IFxuICAgICAgICB7XG4gICAgICAgICAgICBpZighZWxlbWVudClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHNpemUgPSBlbGVtZW50LkdldFNpemUoKTtcbiAgICAgICAgICAgIGNvbnN0IGNlbnRlciA9IGVsZW1lbnQuR2V0UG9zKCkuQWRkKHNpemUuRihuID0+IG4gLyAyKSk7XG4gICAgICAgICAgICBjb25zdCBkaXN0YW5jZSA9IGNlbnRlci5HZXREaXN0YW5jZShjb29yZCk7XG5cbiAgICAgICAgICAgIGlmKGRpc3RhbmNlIDwgbWluKSBcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtaW4gPSBkaXN0YW5jZTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBlbGVtZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBjZWxscyBiZXR3ZWVuIHR3byBjb29yZGluYXRlcy5cbiAgICAgKiBAcGFyYW0gZnJvbVxuICAgICAqIEBwYXJhbSB0byBcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0QmV0d2Vlbihmcm9tOiBDb29yZCwgdG86IENvb3JkKTogRWxlbWVudFtdXG4gICAge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBbXTtcblxuICAgICAgICBmcm9tID0gZnJvbS5GbG9vcigpO1xuICAgICAgICB0byA9IHRvLkNlaWwoKTtcblxuICAgICAgICB0aGlzLmVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiBcbiAgICAgICAge1xuICAgICAgICAgICAgaWYoIWVsZW1lbnQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjZWxsRnJvbSA9IGVsZW1lbnQuR2V0UG9zKCk7XG4gICAgICAgICAgICBjb25zdCBjZWxsVG8gPSBlbGVtZW50LkdldFBvcygpLkFkZChlbGVtZW50LkdldFNpemUoKSk7XG5cbiAgICAgICAgICAgIGlmKENvb3JkLkNvbGxpZGUoZnJvbSwgdG8sIGNlbGxGcm9tLCBjZWxsVG8pKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIG5ldyBlbGVtZW50IG9yIG92ZXJ3cml0ZSBhbiBleGlzdGluZyBvbmUgKGJ5IHRhZykuXG4gICAgICogQHBhcmFtIGVsZW1lbnQgXG4gICAgICovXG4gICAgcHVibGljIFNldChlbGVtZW50OiBFbGVtZW50KTogdm9pZFxuICAgIHtcbiAgICAgICAgY29uc3Qgb2xkID0gdGhpcy5UYWcoZWxlbWVudC5HZXRUYWcoKSk7XG5cbiAgICAgICAgaWYob2xkKVxuICAgICAgICB7XG4gICAgICAgICAgICBIZWxwZXIuRXh0cmFjdChvbGQsIGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vblVwZGF0ZS5DYWxsKGVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhbiBlbGVtZW50IGZyb20gdGhlIG1hcCAoYSBjZWxsIG9yIGFuIGFjdG9yKS5cbiAgICAgKiBAcGFyYW0gZWxlbWVudCBcbiAgICAgKi9cbiAgICBwdWJsaWMgUmVtb3ZlKGVsZW1lbnQ6IEVsZW1lbnQpOiBib29sZWFuXG4gICAge1xuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZWxlbWVudHMuaW5kZXhPZihlbGVtZW50KTtcblxuICAgICAgICBpZihpbmRleCA+PSAwKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnRzLnNwbGljZShpbmRleCwgMSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuRGlzcG9zZSgpO1xuICAgICAgICAgICAgdGhpcy5vblVwZGF0ZS5DYWxsKGVsZW1lbnQpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGludGVybmFsIGFycmF5LlxuICAgICAqL1xuICAgIHB1YmxpYyBMaXN0KCk6IEVsZW1lbnRbXVxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudHM7XG4gICAgfVxufSIsImltcG9ydCB7IElFeHBvcnRPYmplY3QgfSBmcm9tIFwiLi9JRXhwb3J0T2JqZWN0XCI7XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBFeHBvcnRhYmxlXG57XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGFuIGluc3RhbmNlIG9mIGEgY2xhc3MgYnkgbmFtZS5cbiAgICAgKiBAcGFyYW0gY2xhc3NOYW1lIFxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgRnJvbU5hbWU8VCBleHRlbmRzIEV4cG9ydGFibGU+KG5hbWU6IHN0cmluZywgLi4uYXJnczogYW55W10pOiBUXG4gICAge1xuICAgICAgICBjb25zdCBmaW5kID0gKG5hbWUpOiBhbnkgPT5cbiAgICAgICAge1xuICAgICAgICAgICAgc3dpdGNoKG5hbWUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkNvb3JkXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXF1aXJlKFwiLi9Db29yZFwiKS5Db29yZDtcbiAgICAgICAgICAgICAgICBjYXNlIFwiR3JvdW5kQ2VsbFwiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWlyZShcIi4vRWxlbWVudC9DZWxsL0dyb3VuZENlbGxcIikuR3JvdW5kQ2VsbDtcbiAgICAgICAgICAgICAgICBjYXNlIFwiU3RvbmVDZWxsXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXF1aXJlKFwiLi9FbGVtZW50L0NlbGwvU3RvbmVDZWxsXCIpLlN0b25lQ2VsbDtcbiAgICAgICAgICAgICAgICBjYXNlIFwiV2F0ZXJDZWxsXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXF1aXJlKFwiLi9FbGVtZW50L0NlbGwvV2F0ZXJDZWxsXCIpLldhdGVyQ2VsbDtcbiAgICAgICAgICAgICAgICBjYXNlIFwiUGxheWVyQWN0b3JcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVpcmUoXCIuL0VsZW1lbnQvQWN0b3IvUGxheWVyQWN0b3JcIikuUGxheWVyQWN0b3I7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgY2xhc3NPYmogPSBmaW5kKG5hbWUpO1xuXG4gICAgICAgIHJldHVybiBjbGFzc09iaiAmJiBuZXcgY2xhc3NPYmooLi4uYXJncyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXhwb3J0IGEgcHJvcGVydHkuXG4gICAgICogQHBhcmFtIG5hbWVcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgRXhwb3J0UHJvcGVydHkobmFtZTogc3RyaW5nKTogSUV4cG9ydE9iamVjdFxuICAgIHtcbiAgICAgICAgcmV0dXJuIEV4cG9ydGFibGUuRXhwb3J0KHRoaXNbbmFtZV0sIG5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4cG9ydCBhbGwgcHJvcGVydGllcy5cbiAgICAgKi9cbiAgICBwdWJsaWMgRXhwb3J0QWxsKCk6IElFeHBvcnRPYmplY3RbXVxuICAgIHtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBJRXhwb3J0T2JqZWN0W10gPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBwcm9wZXJ0eSBpbiB0aGlzKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBleHBvcnRlZCA9IHRoaXMuRXhwb3J0UHJvcGVydHkocHJvcGVydHkpO1xuXG4gICAgICAgICAgICBpZihleHBvcnRlZClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChleHBvcnRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4cG9ydCBhIHdob2xlIG9iamVjdCAtIGluY2x1ZGluZyBpdHNlbGYuXG4gICAgICogQHBhcmFtIG9iamVjdCBcbiAgICAgKiBAcGFyYW0gbmFtZSBcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIEV4cG9ydChvYmplY3Q6IGFueSwgbmFtZTogc3RyaW5nID0gbnVsbCk6IElFeHBvcnRPYmplY3RcbiAgICB7XG4gICAgICAgIC8vIEV4cG9ydCBlYWNoIGVsZW1lbnQgb2YgYW4gYXJyYXlcbiAgICAgICAgaWYob2JqZWN0IGluc3RhbmNlb2YgQXJyYXkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgTmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgICBDbGFzczogb2JqZWN0LmNvbnN0cnVjdG9yLm5hbWUsXG4gICAgICAgICAgICAgICAgUGF5bG9hZDogb2JqZWN0Lm1hcCgoZSwgaSkgPT4gRXhwb3J0YWJsZS5FeHBvcnQoZSwgaS50b1N0cmluZygpKSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFeHBvcnQgZXhwb3J0YWJsZVxuICAgICAgICBpZihvYmplY3QgaW5zdGFuY2VvZiBFeHBvcnRhYmxlKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIE5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgQ2xhc3M6IG9iamVjdC5jb25zdHJ1Y3Rvci5uYW1lLFxuICAgICAgICAgICAgICAgIFBheWxvYWQ6IG9iamVjdC5FeHBvcnRBbGwoKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEV4cG9ydCBuYXRpdmUgdHlwZXMgKHN0cmluZywgbnVtYmVyIG9yIGJvb2xlYW4pXG4gICAgICAgIGlmKFtcInN0cmluZ1wiLCBcIm51bWJlclwiLCBcImJvb2xlYW5cIl0uaW5jbHVkZXModHlwZW9mIG9iamVjdCkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgTmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgICBDbGFzczogdHlwZW9mIG9iamVjdCxcbiAgICAgICAgICAgICAgICBQYXlsb2FkOiBvYmplY3RcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbXBvcnQgYSBwcm9wZXJ0eS5cbiAgICAgKiBAcGFyYW0gaW5wdXQgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIEltcG9ydFByb3BlcnR5KGlucHV0OiBJRXhwb3J0T2JqZWN0KTogYW55XG4gICAge1xuICAgICAgICByZXR1cm4gRXhwb3J0YWJsZS5JbXBvcnQoaW5wdXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEltcG9ydCBhbGwgcHJvcGVydGllcy5cbiAgICAgKiBAcGFyYW0gaW5wdXQgXG4gICAgICovXG4gICAgcHVibGljIEltcG9ydEFsbChpbnB1dDogSUV4cG9ydE9iamVjdFtdKTogdm9pZFxuICAgIHtcbiAgICAgICAgaW5wdXQgaW5zdGFuY2VvZiBBcnJheSAmJiBpbnB1dC5mb3JFYWNoKGVsZW1lbnQgPT5cbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgaW1wb3J0ZWQgPSB0aGlzLkltcG9ydFByb3BlcnR5KGVsZW1lbnQpO1xuXG4gICAgICAgICAgICBpZihpbXBvcnRlZClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzW2VsZW1lbnQuTmFtZV0gPSBpbXBvcnRlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgd2hvbGUgb2JqZWN0LlxuICAgICAqIEBwYXJhbSBpbnB1dCBcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIEltcG9ydChpbnB1dDogSUV4cG9ydE9iamVjdCk6IGFueVxuICAgIHtcbiAgICAgICAgLy8gSW1wb3J0IGFycmF5XG4gICAgICAgIGlmKGlucHV0LkNsYXNzID09IFwiQXJyYXlcIilcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0LlBheWxvYWQubWFwKGUgPT4gRXhwb3J0YWJsZS5JbXBvcnQoZSkpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBJbXBvcnQgbmF0aXZlIHR5cGVzXG4gICAgICAgIGlmKFtcInN0cmluZ1wiLCBcIm51bWJlclwiLCBcImJvb2xlYW5cIl0uaW5jbHVkZXMoaW5wdXQuQ2xhc3MpKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQuUGF5bG9hZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEltcG9ydCBFeHBvcnRhYmxlIHR5cGVzXG4gICAgICAgIGNvbnN0IGluc3RhbmNlID0gRXhwb3J0YWJsZS5Gcm9tTmFtZShpbnB1dC5DbGFzcywgLi4uKGlucHV0LkFyZ3MgfHwgW10pKTtcblxuICAgICAgICBpbnN0YW5jZSAmJiBpbnN0YW5jZS5JbXBvcnRBbGwoaW5wdXQuUGF5bG9hZCk7XG5cbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuL0Nvb3JkXCI7XG5pbXBvcnQgeyBCYXNlQWN0b3IgfSBmcm9tIFwiLi9FbGVtZW50L0FjdG9yL0Jhc2VBY3RvclwiO1xuaW1wb3J0IHsgSGVscGVyIH0gZnJvbSBcIi4vVXRpbC9IZWxwZXJcIjtcbmltcG9ydCB7IEJhc2VDZWxsIH0gZnJvbSBcIi4vRWxlbWVudC9DZWxsL0Jhc2VDZWxsXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL0VsZW1lbnQvQmFzZUVsZW1lbnRcIjtcbmltcG9ydCB7IElSYXdNYXAgfSBmcm9tIFwiLi9JUmF3TWFwXCI7XG5pbXBvcnQgeyBFbGVtZW50TGlzdCB9IGZyb20gXCIuL0VsZW1lbnRMaXN0XCI7XG5pbXBvcnQgeyBJUmVhZE9ubHlFbGVtZW50TGlzdCB9IGZyb20gXCIuL0lSZWFkT25seUVsZW1lbnRMaXN0XCI7XG5pbXBvcnQgeyBFeHBvcnRhYmxlIH0gZnJvbSBcIi4vRXhwb3J0YWJsZVwiO1xuaW1wb3J0IHsgRXZlbnQgfSBmcm9tIFwiLi9VdGlsL0V2ZW50XCI7XG5cbmV4cG9ydCBjbGFzcyBNYXBcbntcbiAgICBwcml2YXRlIGNlbGxzOiBBcnJheTxCYXNlQ2VsbD4gPSBbXTtcbiAgICBwcml2YXRlIGFjdG9yczogQXJyYXk8QmFzZUFjdG9yPiA9IFtdO1xuICAgIHByaXZhdGUgc2l6ZTogQ29vcmQgPSBuZXcgQ29vcmQoKTtcblxuICAgIC8qKlxuICAgICAqIFNpbmdsZXRvbiBpbnN0YW5jZSBvZiB0aGUgY2xhc3MuXG4gICAgICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6IE1hcDtcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgc2luZ2xldG9uIGluc3RhbmNlLlxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgR2V0SW5zdGFuY2UoKTogTWFwXG4gICAge1xuICAgICAgICBpZihNYXAuaW5zdGFuY2UgPT0gdW5kZWZpbmVkKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gTWFwLmluc3RhbmNlID0gbmV3IE1hcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIE1hcC5pbnN0YW5jZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHNpemUgb2YgdGhlIG1hcC5cbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0U2l6ZSgpOiBDb29yZFxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0IGEgbWFwIHdpdGggbnVsbCBjZWxscy5cbiAgICAgKiBAcGFyYW0gc2l6ZVxuICAgICAqL1xuICAgIHB1YmxpYyBJbml0KHNpemU6IENvb3JkKTogdm9pZFxuICAgIHtcbiAgICAgICAgdGhpcy5zaXplID0gc2l6ZS5DbG9uZSgpO1xuICAgICAgICB0aGlzLmNlbGxzID0gW107XG4gICAgICAgIHRoaXMuYWN0b3JzID0gW107XG5cbiAgICAgICAgdGhpcy5jZWxscy5mb3JFYWNoKGNlbGwgPT4gdGhpcy5PblVwZGF0ZS5DYWxsKGNlbGwpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkIGEgbWFwIGZyb20gYW4gZXh0ZXJuYWwgZmlsZS5cbiAgICAgKiBAcGFyYW0gdXJsIFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBMb2FkKHVybDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPlxuICAgIHtcbiAgICAgICAgbGV0IHJhdzogSVJhd01hcDtcblxuICAgICAgICB0cnkgXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJhdyA9IEpTT04ucGFyc2UoYXdhaXQgSGVscGVyLkdldCh1cmwpKSB8fCB7fTtcblxuICAgICAgICAgICAgaWYoIXJhdy5TaXplwqB8fCAhcmF3LkNlbGxzIHx8ICFyYXcuQWN0b3JzKSBcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2goZSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zaXplID0gbmV3IENvb3JkKHJhdy5TaXplLlgsIHJhdy5TaXplLlkpO1xuICAgICAgICB0aGlzLmNlbGxzID0gW107XG4gICAgICAgIHRoaXMuYWN0b3JzID0gW107XG5cbiAgICAgICAgLy8gUGFyc2VyXG4gICAgICAgIGNvbnN0IHBhcnNlID0gPEVsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudD4oZGF0YSwgb3V0KSA9PlxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZGF0YS5DbGFzcztcbiAgICAgICAgICAgIGNvbnN0IGNvb3JkID0gbmV3IENvb3JkKGRhdGEuWCwgZGF0YS5ZKTtcbiAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBFeHBvcnRhYmxlLkZyb21OYW1lPEVsZW1lbnQ+KG5hbWUsIGNvb3JkLCB0aGlzKTtcblxuICAgICAgICAgICAgb3V0LnB1c2goY2VsbCk7XG5cbiAgICAgICAgICAgIHRoaXMuT25VcGRhdGUuQ2FsbChjZWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBhcnNlIGNlbGxzIGFuZCBhY3RvcnNcbiAgICAgICAgcmF3LkNlbGxzLmZvckVhY2goZGF0YSA9PiBwYXJzZTxCYXNlQ2VsbD4oZGF0YSwgdGhpcy5jZWxscykpO1xuICAgICAgICByYXcuQWN0b3JzLmZvckVhY2goZGF0YSA9PiBwYXJzZTxCYXNlQWN0b3I+KGRhdGEsIHRoaXMuYWN0b3JzKSk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGFsbCBlbGVtZW50cyBvZiB0aGUgbWFwLlxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRFbGVtZW50cygpOiBJUmVhZE9ubHlFbGVtZW50TGlzdDxCYXNlRWxlbWVudD5cbiAgICB7XG4gICAgICAgIGNvbnN0IGFsbCA9ICg8QmFzZUVsZW1lbnRbXT50aGlzLmNlbGxzKS5jb25jYXQoPEJhc2VFbGVtZW50W10+dGhpcy5hY3RvcnMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIG5ldyBFbGVtZW50TGlzdDxCYXNlRWxlbWVudD4oYWxsLCB0aGlzLk9uVXBkYXRlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGNlbGxzIG9mIHRoZSBtYXAuXG4gICAgICovXG4gICAgcHVibGljIEdldENlbGxzKCk6IEVsZW1lbnRMaXN0PEJhc2VDZWxsPlxuICAgIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFbGVtZW50TGlzdCh0aGlzLmNlbGxzLCA8RXZlbnQ8QmFzZUNlbGw+PnRoaXMuT25VcGRhdGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgYWN0b3JzIG9mIHRoZSBtYXAuXG4gICAgICovXG4gICAgcHVibGljIEdldEFjdG9ycygpOiBFbGVtZW50TGlzdDxCYXNlQWN0b3I+XG4gICAge1xuICAgICAgICByZXR1cm4gbmV3IEVsZW1lbnRMaXN0KHRoaXMuYWN0b3JzLCA8RXZlbnQ8QmFzZUFjdG9yPj50aGlzLk9uVXBkYXRlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiB0aGUgbWFwIHdhcyB1cGRhdGVkLlxuICAgICAqL1xuICAgIHB1YmxpYyBPblVwZGF0ZTogRXZlbnQ8QmFzZUVsZW1lbnQ+ID0gbmV3IEV2ZW50PEJhc2VFbGVtZW50PigpO1xufSIsImltcG9ydCB7IElDaGFubmVsIH0gZnJvbSBcIi4vSUNoYW5uZWxcIjtcbmltcG9ydCB7IE1lc3NhZ2VUeXBlIH0gZnJvbSBcIi4vTWVzc2FnZVR5cGVcIjtcbmltcG9ydCB7IE1hcCB9IGZyb20gXCIuLi9NYXBcIjtcbmltcG9ydCB7IEV4cG9ydGFibGUgfSBmcm9tIFwiLi4vRXhwb3J0YWJsZVwiO1xuaW1wb3J0IHsgQmFzZUNlbGwgfSBmcm9tIFwiLi4vRWxlbWVudC9DZWxsL0Jhc2VDZWxsXCI7XG5pbXBvcnQgeyBCYXNlQWN0b3IgfSBmcm9tIFwiLi4vRWxlbWVudC9BY3Rvci9CYXNlQWN0b3JcIjtcbmltcG9ydCB7IFBsYXllckFjdG9yIH0gZnJvbSBcIi4uL0VsZW1lbnQvQWN0b3IvUGxheWVyQWN0b3JcIjtcbmltcG9ydCB7IEhlbHBlciB9IGZyb20gXCIuLi9VdGlsL0hlbHBlclwiO1xuaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi4vQ29vcmRcIjtcbmltcG9ydCB7IElFeHBvcnRPYmplY3QgfSBmcm9tIFwiLi4vSUV4cG9ydE9iamVjdFwiO1xuaW1wb3J0IHsgSU1lc3NhZ2UgfSBmcm9tIFwiLi9JTWVzc2FnZVwiO1xuaW1wb3J0IHsgTWVzc2FnZUhhbmRsZXIgfSBmcm9tIFwiLi9NZXNzYWdlSGFuZGxlclwiO1xuXG5leHBvcnQgY2xhc3MgQ2xpZW50IGV4dGVuZHMgTWVzc2FnZUhhbmRsZXJcbntcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1hcDogTWFwO1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0IGEgbmV3IGNsaWVudCB3aGljaCBjb21tdW5pY2F0ZXMgd2l0aCBhIGNvbm5lY3Rpb24uXG4gICAgICogQHBhcmFtIGNoYW5uZWwgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY2hhbm5lbDogSUNoYW5uZWwsIG1hcDogTWFwKVxuICAgIHtcbiAgICAgICAgc3VwZXIoY2hhbm5lbCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLm1hcCA9IG1hcDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWNlaXZlIGEgbWVzc2FnZSB0aHJvdWdoIHRoZSBjaGFubmVsLlxuICAgICAqIEBwYXJhbSBtZXNzYWdlIFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBPbk1lc3NhZ2UobWVzc2FnZTogSU1lc3NhZ2UpOiB2b2lkXG4gICAge1xuICAgICAgICBzd2l0Y2gobWVzc2FnZS5UeXBlKVxuICAgICAgICB7XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLkVsZW1lbnQ6XG4gICAgICAgICAgICAgICAgdGhpcy5TZXRFbGVtZW50KG1lc3NhZ2UuUGF5bG9hZClcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuUGxheWVyOlxuICAgICAgICAgICAgICAgIHRoaXMuU2V0UGxheWVyKG1lc3NhZ2UuUGF5bG9hZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLlNpemU6XG4gICAgICAgICAgICAgICAgdGhpcy5TZXRTaXplKG1lc3NhZ2UuUGF5bG9hZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLktpY2s6XG4gICAgICAgICAgICAgICAgdGhpcy5LaWNrKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIC8vIEludmFsaWRcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCBhbiBlbGVtZW50LlxuICAgICAqIEBwYXJhbSBlbGVtZW50IFxuICAgICAqL1xuICAgIHByaXZhdGUgU2V0RWxlbWVudChleHBvcnRhYmxlOiBJRXhwb3J0T2JqZWN0KVxuICAgIHtcbiAgICAgICAgLy8gU2V0IHRoZSBhcmdzIG9mIHRoZSBjb25zdHJ1Y3RvciBvZiBCYXNlRWxlbWVudCBcbiAgICAgICAgZXhwb3J0YWJsZS5BcmdzID0gW251bGwsIHRoaXMubWFwXTtcblxuICAgICAgICBjb25zdCBlbGVtZW50ID0gRXhwb3J0YWJsZS5JbXBvcnQoZXhwb3J0YWJsZSk7XG5cbiAgICAgICAgaWYoZWxlbWVudCBpbnN0YW5jZW9mIEJhc2VDZWxsKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLm1hcC5HZXRDZWxscygpLlNldChlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKGVsZW1lbnQgaW5zdGFuY2VvZiBCYXNlQWN0b3IpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMubWFwLkdldEFjdG9ycygpLlNldChlbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgcGxheWVyIGJ5IHRhZy5cbiAgICAgKiBAcGFyYW0gdGFnIFxuICAgICAqL1xuICAgIHByaXZhdGUgU2V0UGxheWVyKHRhZzogc3RyaW5nKVxuICAgIHtcbiAgICAgICAgY29uc3QgcGxheWVyID0gdGhpcy5tYXAuR2V0QWN0b3JzKCkuVGFnKHRhZyk7XG5cbiAgICAgICAgdGhpcy5PblBsYXllcihIZWxwZXIuSG9vayhwbGF5ZXIsICh0YXJnZXQsIHByb3AsIGFyZ3MpID0+IFxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBleHBvcnRhYmxlID0gRXhwb3J0YWJsZS5FeHBvcnQoW3Byb3BdLmNvbmNhdChhcmdzKSk7XG5cbiAgICAgICAgICAgIHRoaXMuU2VuZE1lc3NhZ2UoTWVzc2FnZVR5cGUuQ29tbWFuZCwgZXhwb3J0YWJsZSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHNpemUgb2YgdGhlIG1hcC5cbiAgICAgKiBAcGFyYW0gc2l6ZSBcbiAgICAgKi9cbiAgICBwcml2YXRlIFNldFNpemUoZXhwb3J0YWJsZTogSUV4cG9ydE9iamVjdClcbiAgICB7XG4gICAgICAgIHRoaXMubWFwLkluaXQoRXhwb3J0YWJsZS5JbXBvcnQoZXhwb3J0YWJsZSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEtpY2sgdGhpcyBjbGllbnQgb2YgdGhlIHNlcnZlci5cbiAgICAgKi9cbiAgICBwcml2YXRlIEtpY2soKVxuICAgIHtcbiAgICAgICAgdGhpcy5tYXAuSW5pdChuZXcgQ29vcmQoMCwgMCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVkIHdoZW4gdGhlIHBsYXllciBpcyBzZXQuXG4gICAgICovXG4gICAgcHVibGljIE9uUGxheWVyOiAocGxheWVyOiBQbGF5ZXJBY3RvcikgPT4gdm9pZCA9IEhlbHBlci5Ob29wO1xufSIsImltcG9ydCB7IEhlbHBlciB9IGZyb20gXCIuLi9VdGlsL0hlbHBlclwiO1xuaW1wb3J0IHsgSUNoYW5uZWwgfSBmcm9tIFwiLi9JQ2hhbm5lbFwiO1xuaW1wb3J0IHsgUGxheWVyQWN0b3IgfSBmcm9tIFwiLi4vRWxlbWVudC9BY3Rvci9QbGF5ZXJBY3RvclwiO1xuaW1wb3J0IHsgRXhwb3J0YWJsZSB9IGZyb20gXCIuLi9FeHBvcnRhYmxlXCI7XG5pbXBvcnQgeyBNZXNzYWdlVHlwZSB9IGZyb20gXCIuL01lc3NhZ2VUeXBlXCI7XG5pbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuLi9Db29yZFwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vRWxlbWVudC9CYXNlRWxlbWVudFwiO1xuaW1wb3J0IHsgSUV4cG9ydE9iamVjdCB9IGZyb20gXCIuLi9JRXhwb3J0T2JqZWN0XCI7XG5pbXBvcnQgeyBJTWVzc2FnZSB9IGZyb20gXCIuL0lNZXNzYWdlXCI7XG5pbXBvcnQgeyBNZXNzYWdlSGFuZGxlciB9IGZyb20gXCIuL01lc3NhZ2VIYW5kbGVyXCI7XG5cbmV4cG9ydCBjbGFzcyBDb25uZWN0aW9uIGV4dGVuZHMgTWVzc2FnZUhhbmRsZXJcbntcbiAgICBwcml2YXRlIHBsYXllcjogUGxheWVyQWN0b3I7XG4gICAgXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0IGEgbmV3IGNvbm5lY3Rpb24gd2hpY2ggY29tbXVuaWNhdGVzIHdpdGggYSBjbGllbnQuXG4gICAgICogQHBhcmFtIGNoYW5uZWwgRGlyZWN0IGNoYW5uZWwgdG8gdGhlIGNsaWVudC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihjaGFubmVsOiBJQ2hhbm5lbClcbiAgICB7XG4gICAgICAgIHN1cGVyKGNoYW5uZWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlY2VpdmUgYSBtZXNzYWdlIHRocm91Z2ggdGhlIGNoYW5uZWwgYW5kIHBhcnNlIGl0LlxuICAgICAqIEBwYXJhbSBtZXNzYWdlIFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBPbk1lc3NhZ2UobWVzc2FnZTogSU1lc3NhZ2UpOiB2b2lkXG4gICAge1xuICAgICAgICBzd2l0Y2gobWVzc2FnZS5UeXBlKVxuICAgICAgICB7XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLkNvbW1hbmQ6XG4gICAgICAgICAgICAgICAgdGhpcy5QYXJzZUNvbW1hbmQobWVzc2FnZSlcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgLy8gSW52YWxpZDoga2ljaz9cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBhcnNlIGFuIGluY29taW5nIENPTU1BTkQuXG4gICAgICogQHBhcmFtIGluZGV4IFxuICAgICAqIEBwYXJhbSBjb21tYW5kIFxuICAgICAqL1xuICAgIHB1YmxpYyBQYXJzZUNvbW1hbmQobWVzc2FnZTogSU1lc3NhZ2UpOiB2b2lkXG4gICAge1xuICAgICAgICB0aGlzLk9uQ29tbWFuZChtZXNzYWdlLlBheWxvYWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluaXQgbWFwLiBBbHNvIGRlbGV0ZXMgcHJldmlvdXNseSBzZXR0ZWQgZWxlbWVudHMuXG4gICAgICogQHBhcmFtIHNpemUgXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIFNldFNpemUoc2l6ZTogQ29vcmQpOiBQcm9taXNlPHZvaWQ+XG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5TZW5kTWVzc2FnZShNZXNzYWdlVHlwZS5TaXplLCBFeHBvcnRhYmxlLkV4cG9ydChzaXplKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IGFuIGVsZW1lbnQgKGEgY2VsbCBvciBhbiBhY3RvcikuXG4gICAgICogQHBhcmFtIGVsZW1lbnQgXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIFNldEVsZW1lbnQoZWxlbWVudDogQmFzZUVsZW1lbnQpOiBQcm9taXNlPHZvaWQ+XG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5TZW5kTWVzc2FnZShNZXNzYWdlVHlwZS5FbGVtZW50LCBFeHBvcnRhYmxlLkV4cG9ydChlbGVtZW50KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBhY3RpdmUgcGxheWVyIGFjdG9yIGZvciB0aGUgY2xpZW50ICh0aGUgYWN0b3IgbmVlZHMgdG8gYmUgXG4gICAgICogYWxyZWFkeSBzZW50IHZpYSBTZXRFbGVtZW50KS5cbiAgICAgKiBAcGFyYW0gcGxheWVyIFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBTZXRQbGF5ZXIocGxheWVyOiBQbGF5ZXJBY3Rvcik6IFByb21pc2U8dm9pZD5cbiAgICB7XG4gICAgICAgIGlmKHRoaXMucGxheWVyKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBsYXllciA9IHBsYXllcjtcblxuICAgICAgICByZXR1cm4gdGhpcy5TZW5kTWVzc2FnZShNZXNzYWdlVHlwZS5QbGF5ZXIsIHBsYXllci5HZXRUYWcoKSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgcHJldmlvdXNseSBzZXR0ZWQgcGxheWVyIGFjdG9yLlxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRQbGF5ZXIoKTogUGxheWVyQWN0b3JcbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLnBsYXllcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBLaWNrIHRoZSBjbGllbnQgb2ZmLlxuICAgICAqL1xuICAgIHB1YmxpYyBLaWNrKCk6IHZvaWRcbiAgICB7XG4gICAgICAgIHRoaXMuU2VuZE1lc3NhZ2UoTWVzc2FnZVR5cGUuS2ljaywgbnVsbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZWQgd2hlbiB0aGUgQ29ubmVjdGlvbiByZWNlaXZlcyBhIENPTU1BTkQgZnJvbSB0aGUgY2xpZW50LlxuICAgICAqIEBwYXJhbSBjb21tYW5kXG4gICAgICovXG4gICAgcHVibGljIE9uQ29tbWFuZDogKGNvbW1hbmQ6IElFeHBvcnRPYmplY3QpID0+IHZvaWQgPSBIZWxwZXIuTm9vcDtcbn0iLCJpbXBvcnQgeyBJQ2hhbm5lbCB9IGZyb20gXCIuL0lDaGFubmVsXCI7XG5pbXBvcnQgeyBIZWxwZXIgfSBmcm9tIFwiLi4vVXRpbC9IZWxwZXJcIjtcblxuZXhwb3J0IGNsYXNzIEZha2VDaGFubmVsIGltcGxlbWVudHMgSUNoYW5uZWxcbntcbiAgICBwcml2YXRlIG90aGVyOiBGYWtlQ2hhbm5lbDtcbiAgICBwcml2YXRlIGRlbGF5OiBudW1iZXI7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3QgYSBuZXcgZmFrZSBjaGFubmVsIHdpdGggdGhlIGdpdmVuIGRlbGF5LlxuICAgICAqIEBwYXJhbSBkZWxheSBcbiAgICAgKi9cbiAgICBwdWJsaWMgY29uc3RydWN0b3IoZGVsYXk6IG51bWJlciA9IDApXG4gICAge1xuICAgICAgICB0aGlzLmRlbGF5ID0gZGVsYXk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBvdGhlciBwZWVyLlxuICAgICAqIEBwYXJhbSBvdGhlciBcbiAgICAgKi9cbiAgICBwdWJsaWMgU2V0T3RoZXIob3RoZXI6IEZha2VDaGFubmVsKVxuICAgIHtcbiAgICAgICAgdGhpcy5vdGhlciA9IG90aGVyO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBTZW5kIGEgbWVzc2FnZSB0byB0aGUgb3RoZXIgcGVlci5cbiAgICAgKiBAcGFyYW0gbWVzc2FnZSBcbiAgICAgKi9cbiAgICBwdWJsaWMgU2VuZE1lc3NhZ2UobWVzc2FnZTogc3RyaW5nKTogdm9pZCBcbiAgICB7XG4gICAgICAgIGlmKHRoaXMub3RoZXIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5vdGhlci5Pbk1lc3NhZ2UobWVzc2FnZSksIHRoaXMuZGVsYXkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVjZWl2ZSBhIG1lc3NhZ2UgZnJvbSB0aGUgb3RoZXIgcGVlci5cbiAgICAgKi9cbiAgICBwdWJsaWMgT25NZXNzYWdlOiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkID0gSGVscGVyLk5vb3A7XG59IiwiaW1wb3J0IHsgSUNoYW5uZWwgfSBmcm9tIFwiLi9JQ2hhbm5lbFwiO1xuaW1wb3J0IHsgTWVzc2FnZVR5cGUgfSBmcm9tIFwiLi9NZXNzYWdlVHlwZVwiO1xuaW1wb3J0IHsgSU1lc3NhZ2UgfSBmcm9tIFwiLi9JTWVzc2FnZVwiO1xuaW1wb3J0IHsgVGltZW91dEV2ZW50IH0gZnJvbSBcIi4uL1V0aWwvVGltZW91dEV2ZW50XCI7XG5pbXBvcnQgeyBFdmVudCB9IGZyb20gXCIuLi9VdGlsL0V2ZW50XCI7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiLi4vVXRpbC9Mb2dnZXJcIjtcbmltcG9ydCB7IExvZ1R5cGUgfSBmcm9tIFwiLi4vVXRpbC9Mb2dUeXBlXCI7XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBNZXNzYWdlSGFuZGxlclxue1xuICAgIHByaXZhdGUgcmVjZWl2ZWRFdmVudCA9IG5ldyBFdmVudDxudW1iZXI+KCk7XG4gICAgcHJpdmF0ZSBvdXRJbmRleDogbnVtYmVyID0gMDtcbiAgICBwcml2YXRlIGluSW5kZXg6IG51bWJlcjtcblxuICAgIHByaXZhdGUgY2hhbm5lbDogSUNoYW5uZWw7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3QgYSBuZXcgY29ubmVjdGlvbiB3aGljaCBjb21tdW5pY2F0ZXMgd2l0aCBhIGNsaWVudC5cbiAgICAgKiBAcGFyYW0gY2hhbm5lbCBEaXJlY3QgY2hhbm5lbCB0byB0aGUgY2xpZW50LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNoYW5uZWw6IElDaGFubmVsKVxuICAgIHtcbiAgICAgICAgdGhpcy5jaGFubmVsID0gY2hhbm5lbDtcbiAgICAgICAgdGhpcy5jaGFubmVsLk9uTWVzc2FnZSA9IChtZXNzYWdlOiBzdHJpbmcpID0+IHRoaXMuUGFyc2VNZXNzYWdlKG1lc3NhZ2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlY2VpdmUgYSBtZXNzYWdlIHRocm91Z2ggdGhlIGNoYW5uZWwuXG4gICAgICogQHBhcmFtIGlucHV0IFxuICAgICAqL1xuICAgIHByaXZhdGUgUGFyc2VNZXNzYWdlKGlucHV0OiBzdHJpbmcpOiB2b2lkXG4gICAge1xuICAgICAgICBsZXQgbWVzc2FnZTogSU1lc3NhZ2U7XG5cbiAgICAgICAgdHJ5IFxuICAgICAgICB7XG4gICAgICAgICAgICBtZXNzYWdlID0gSlNPTi5wYXJzZShpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2goZSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoKG1lc3NhZ2UuVHlwZSlcbiAgICAgICAge1xuICAgICAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5FbGVtZW50OlxuICAgICAgICAgICAgICAgIC8vIFJlY2VpdmUgb25seSBzdGF0ZXMgbmV3ZXIgdGhhbiB0aGUgY3VycmVudCBvbmVcbiAgICAgICAgICAgICAgICBpZihtZXNzYWdlLkluZGV4ID4gdGhpcy5pbkluZGV4IHx8IHRoaXMuaW5JbmRleCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbkluZGV4ID0gbWVzc2FnZS5JbmRleDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5Pbk1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5TZW5kUmVjZWl2ZWQobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLkNvbW1hbmQ6XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLlBsYXllcjpcbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuS2ljazpcbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuU2l6ZTpcbiAgICAgICAgICAgICAgICB0aGlzLk9uTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB0aGlzLlNlbmRSZWNlaXZlZChtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuUmVjZWl2ZWQ6XG4gICAgICAgICAgICAgICAgdGhpcy5QYXJzZVJlY2VpdmVkKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgTG9nZ2VyLkxvZyh0aGlzLCBMb2dUeXBlLlZlcmJvc2UsIFwiTWVzc2FnZSByZWNlaXZlZFwiLCBtZXNzYWdlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQYXJzZSBpbmNvbWluZyBBQ0suXG4gICAgICogQHBhcmFtIG1lc3NhZ2UgXG4gICAgICovXG4gICAgcHJpdmF0ZSBQYXJzZVJlY2VpdmVkKG1lc3NhZ2U6IElNZXNzYWdlKVxuICAgIHtcbiAgICAgICAgdGhpcy5yZWNlaXZlZEV2ZW50LkNhbGwobWVzc2FnZS5QYXlsb2FkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIEFDSy5cbiAgICAgKiBAcGFyYW0gbWVzc2FnZSBcbiAgICAgKi9cbiAgICBwcml2YXRlIFNlbmRSZWNlaXZlZChtZXNzYWdlOiBJTWVzc2FnZSlcbiAgICB7XG4gICAgICAgIHRoaXMuU2VuZE1lc3NhZ2UoTWVzc2FnZVR5cGUuUmVjZWl2ZWQsIG1lc3NhZ2UuSW5kZXgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogU2VuZCBhIG1lc3NhZ2UgdGhyb3VnaCB0aGUgY2hhbm5lbC5cbiAgICAqIEBwYXJhbSB0eXBlIFR5cGUgb2YgdGhlIG1lc3NhZ2UuXG4gICAgKiBAcGFyYW0gcGF5bG9hZFxuICAgICovXG4gICBwcm90ZWN0ZWQgYXN5bmMgU2VuZE1lc3NhZ2UodHlwZTogTWVzc2FnZVR5cGUsIHBheWxvYWQ6IGFueSk6IFByb21pc2U8dm9pZD5cbiAgIHtcbiAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4gXG4gICAgICAge1xuICAgICAgICAgICAvLyBDcmVhdGUgdGhlIG1lc3NhZ2VcbiAgICAgICAgICAgY29uc3QgbWVzc2FnZTogSU1lc3NhZ2UgPSB7XG4gICAgICAgICAgICAgICBUeXBlOiB0eXBlLFxuICAgICAgICAgICAgICAgSW5kZXg6IHRoaXMub3V0SW5kZXgrKyxcbiAgICAgICAgICAgICAgIFBheWxvYWQ6IHBheWxvYWRcbiAgICAgICAgICAgfTtcblxuICAgICAgICAgICAvLyBDcmVhdGUgYSBuZXcgUkVDRUlWRUQgbGlzdGVuZXIgaWYgdGhpcyB3YXMgbm90XG4gICAgICAgICAgIC8vIGEgYWNrbm93bGVkZ2UgbWVzc2FnZVxuICAgICAgICAgICBpZiAobWVzc2FnZS5UeXBlICE9IE1lc3NhZ2VUeXBlLlJlY2VpdmVkKSBcbiAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpc3RlbmVyID0gdGhpcy5yZWNlaXZlZEV2ZW50LkFkZChpbmRleCA9PiBcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ID09PSBtZXNzYWdlLkluZGV4KSBcbiAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVjZWl2ZWRFdmVudC5SZW1vdmUobGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGluZGV4ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCgpO1xuICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICB9XG4gICAgICAgICAgIGVsc2VcbiAgICAgICAgICAge1xuICAgICAgICAgICAgICAgLy8gUmVzb2x2ZSBpbW1lZGlhdGVseSBpZiBSRUNFSVZFRFxuICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICB9XG5cbiAgICAgICAgICAgLy8gU2VuZCBtZXNzYWdlXG4gICAgICAgICAgIHRoaXMuY2hhbm5lbC5TZW5kTWVzc2FnZShKU09OLnN0cmluZ2lmeShtZXNzYWdlKSk7XG5cbiAgICAgICAgICAgTG9nZ2VyLkxvZyh0aGlzLCBMb2dUeXBlLlZlcmJvc2UsIFwiTWVzc2FnZSBzZW50XCIsIG1lc3NhZ2UpO1xuICAgICAgIH0pO1xuICAgfVxuXG4gICBwcm90ZWN0ZWQgYWJzdHJhY3QgT25NZXNzYWdlKG1lc3NhZ2U6IElNZXNzYWdlKTogdm9pZDtcbn0iLCJleHBvcnQgZW51bSBNZXNzYWdlVHlwZVxue1xuICAgIC8vIE9VVFxuICAgIFNpemUsXG4gICAgRWxlbWVudCxcbiAgICBQbGF5ZXIsXG4gICAgS2ljayxcblxuICAgIC8vIElOXG4gICAgQ29tbWFuZCxcblxuICAgIC8vIElOICYgT1VUXG4gICAgUmVjZWl2ZWRcbn0iLCJpbXBvcnQgKiBhcyB3ZWJydGMgZnJvbSBcIndlYnJ0Yy1hZGFwdGVyXCJcbmltcG9ydCB7IElDaGFubmVsIH0gZnJvbSBcIi4vSUNoYW5uZWxcIjtcbmltcG9ydCB7IEhlbHBlciB9IGZyb20gXCIuLi9VdGlsL0hlbHBlclwiO1xuXG5leHBvcnQgY2xhc3MgUGVlckNoYW5uZWwgaW1wbGVtZW50cyBJQ2hhbm5lbFxue1xuICAgIHByaXZhdGUgcmVhZG9ubHkgY29uZmlnID0ge1xuICAgICAgICBcImljZVNlcnZlcnNcIjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwidXJsc1wiOiBbXCJzdHVuOnN0dW4ubC5nb29nbGUuY29tOjE5MzAyXCJdXG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBwZWVyQ29ubmVjdGlvbjtcbiAgICBwcml2YXRlIGRhdGFDaGFubmVsO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IG9mZmVyLiBSZXR1cm4gdGhlIG9mZmVyIG5lZ290aWF0aW9uIHN0cmluZy5cbiAgICAgKi9cbiAgICBwdWJsaWMgT2ZmZXIoKTogUHJvbWlzZTxzdHJpbmc+XG4gICAge1xuICAgICAgICBpZih0aGlzLnBlZXJDb25uZWN0aW9uKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+IFxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnBlZXJDb25uZWN0aW9uID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKHRoaXMuY29uZmlnKTtcbiAgICAgICAgICAgIHRoaXMuZGF0YUNoYW5uZWwgPSB0aGlzLnBlZXJDb25uZWN0aW9uLmNyZWF0ZURhdGFDaGFubmVsKFwiZGF0YVwiKTtcblxuICAgICAgICAgICAgdGhpcy5wZWVyQ29ubmVjdGlvbi5vbmljZWNhbmRpZGF0ZSA9IGUgPT4gXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYoZS5jYW5kaWRhdGUgPT0gbnVsbClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9mZmVyID0gdGhpcy5wZWVyQ29ubmVjdGlvbi5sb2NhbERlc2NyaXB0aW9uO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoSlNPTi5zdHJpbmdpZnkob2ZmZXIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgIFxuICAgICAgICAgICAgdGhpcy5wZWVyQ29ubmVjdGlvbi5jcmVhdGVPZmZlcigpLnRoZW4oXG4gICAgICAgICAgICAgICAgZGVzYyA9PiB0aGlzLnBlZXJDb25uZWN0aW9uLnNldExvY2FsRGVzY3JpcHRpb24oZGVzYyksXG4gICAgICAgICAgICAgICAgZXJyb3IgPT4gcmVqZWN0KGVycm9yKVxuICAgICAgICAgICAgKTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMuZGF0YUNoYW5uZWwub25tZXNzYWdlID0gZXZlbnQgPT4gdGhpcy5QYXJzZU1lc3NhZ2UoZXZlbnQpO1xuICAgICAgICAgICAgdGhpcy5kYXRhQ2hhbm5lbC5vbm9wZW4gPSAoKSA9PiB0aGlzLk9uT3BlbigpO1xuICAgICAgICAgICAgdGhpcy5kYXRhQ2hhbm5lbC5vbmNsb3NlID0gKCkgPT4gdGhpcy5PbkNsb3NlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbiBhbnN3ZXIgZm9yIHRoZSBnaXZlbiBvZmZlci4gUmV0dXJuIHRoZSBmaW5pc2ggbmVnb3RpYXRpb24gc3RyaW5nLlxuICAgICAqIEBwYXJhbSBvZmZlciBcbiAgICAgKi9cbiAgICBwdWJsaWMgQW5zd2VyKG9mZmVyOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4gXG4gICAge1xuICAgICAgICBpZih0aGlzLnBlZXJDb25uZWN0aW9uKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMucGVlckNvbm5lY3Rpb24gPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24odGhpcy5jb25maWcpO1xuICAgIFxuICAgICAgICAgICAgdGhpcy5wZWVyQ29ubmVjdGlvbi5vbmljZWNhbmRpZGF0ZSA9IGUgPT4gXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYoZS5jYW5kaWRhdGUgPT0gbnVsbClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFuc3dlciA9IHRoaXMucGVlckNvbm5lY3Rpb24ubG9jYWxEZXNjcmlwdGlvbjtcblxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKEpTT04uc3RyaW5naWZ5KGFuc3dlcikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICB0aGlzLnBlZXJDb25uZWN0aW9uLm9uZGF0YWNoYW5uZWwgPSBldmVudCA9PlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YUNoYW5uZWwgPSBldmVudC5jaGFubmVsO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhQ2hhbm5lbC5vbm1lc3NhZ2UgPSBldmVudCA9PiB0aGlzLlBhcnNlTWVzc2FnZShldmVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhQ2hhbm5lbC5vbm9wZW4gPSAoKSA9PiB0aGlzLk9uT3BlbigpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YUNoYW5uZWwub25jbG9zZSA9ICgpID0+IHRoaXMuT25DbG9zZSgpO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHRyeSBcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBlZXJDb25uZWN0aW9uLnNldFJlbW90ZURlc2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgICAgICBuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKEpTT04ucGFyc2Uob2ZmZXIpKSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnBlZXJDb25uZWN0aW9uLmNyZWF0ZUFuc3dlcigpLnRoZW4oXG4gICAgICAgICAgICAgICAgICAgIGRlc2MgPT4gdGhpcy5wZWVyQ29ubmVjdGlvbi5zZXRMb2NhbERlc2NyaXB0aW9uKGRlc2MpLFxuICAgICAgICAgICAgICAgICAgICBlcnJvciA9PiByZWplY3QoZXJyb3IpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoKGUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5pc2ggbmVnb3RpYXRpb24uXG4gICAgICogQHBhcmFtIGFuc3dlciBcbiAgICAgKi9cbiAgICBwdWJsaWMgRmluaXNoKGFuc3dlcjogc3RyaW5nKTogdm9pZFxuICAgIHtcbiAgICAgICAgaWYodGhpcy5Jc09mZmVyb3IoKSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5wZWVyQ29ubmVjdGlvbi5zZXRSZW1vdGVEZXNjcmlwdGlvbihcbiAgICAgICAgICAgICAgICBuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKEpTT04ucGFyc2UoYW5zd2VyKSkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGZpbmlzaCBuZWdvdGlhdGlvbiFcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQYXJzZSBhbiBpbmNvbWluZyBtZXNzYWdlLlxuICAgICAqIEBwYXJhbSBldmVudCBcbiAgICAgKi9cbiAgICBwdWJsaWMgUGFyc2VNZXNzYWdlKGV2ZW50KVxuICAgIHtcbiAgICAgICAgaWYoZXZlbnQgJiYgZXZlbnQuZGF0YSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5Pbk1lc3NhZ2UoZXZlbnQuZGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGEgbWVzc2FnZSB0aHJvdWdoIHRoZSBjaGFubmVsLlxuICAgICAqIEBwYXJhbSBtZXNzYWdlIFxuICAgICAqL1xuICAgIHB1YmxpYyBTZW5kTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcpOiB2b2lkXG4gICAge1xuICAgICAgICBpZih0aGlzLklzT3BlbigpKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmRhdGFDaGFubmVsLnNlbmQobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJcyB0aGlzIFBlZXJDb25uZWN0aW9uIGNyZWF0ZWQgdGhlIG9mZmVyP1xuICAgICAqL1xuICAgIHB1YmxpYyBJc09mZmVyb3IoKTogYm9vbGVhblxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGVlckNvbm5lY3Rpb24gJiYgdGhpcy5wZWVyQ29ubmVjdGlvbi5sb2NhbERlc2NyaXB0aW9uICYmXG4gICAgICAgICAgICB0aGlzLnBlZXJDb25uZWN0aW9uLmxvY2FsRGVzY3JpcHRpb24udHlwZSA9PSBcIm9mZmVyXCI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGNoYW5uZWwgaXMgb3Blbi5cbiAgICAgKi9cbiAgICBwdWJsaWMgSXNPcGVuKCk6IGJvb2xlYW5cbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFDaGFubmVsICYmIHRoaXMuZGF0YUNoYW5uZWwucmVhZHlTdGF0ZSA9PSBcIm9wZW5cIiAmJiBcbiAgICAgICAgICAgIHRoaXMucGVlckNvbm5lY3Rpb24gJiYgdGhpcy5wZWVyQ29ubmVjdGlvbi5zaWduYWxpbmdTdGF0ZSA9PSBcInN0YWJsZVwiO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIGNoYW5uZWwgaXMgb3BlbmVkLlxuICAgICAqL1xuICAgIHB1YmxpYyBPbk9wZW46ICgpID0+IHZvaWQgPSBIZWxwZXIuTm9vcDtcblxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIGNoYW5uZWwgaXMgY2xvc2VkLlxuICAgICAqL1xuICAgIHB1YmxpYyBPbkNsb3NlOiAoKSA9PiB2b2lkID0gSGVscGVyLk5vb3A7XG5cbiAgICAvKipcbiAgICAgKiBSZWNlaXZlIGEgbWVzc2FnZSBmcm9tIHRoZSBvdGhlciBwZWVyLlxuICAgICAqL1xuICAgIHB1YmxpYyBPbk1lc3NhZ2U6IChtZXNzYWdlOiBzdHJpbmcpID0+IHZvaWQgPSBIZWxwZXIuTm9vcDtcbn0iLCJpbXBvcnQgeyBNYXAgfSBmcm9tIFwiLi4vTWFwXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9FbGVtZW50L0Jhc2VFbGVtZW50XCI7XG5pbXBvcnQgeyBQbGF5ZXJBY3RvciB9IGZyb20gXCIuLi9FbGVtZW50L0FjdG9yL1BsYXllckFjdG9yXCI7XG5pbXBvcnQgeyBDb25uZWN0aW9uIH0gZnJvbSBcIi4vQ29ubmVjdGlvblwiO1xuaW1wb3J0IHsgRXhwb3J0YWJsZSB9IGZyb20gXCIuLi9FeHBvcnRhYmxlXCI7XG5pbXBvcnQgeyBJRXhwb3J0T2JqZWN0IH0gZnJvbSBcIi4uL0lFeHBvcnRPYmplY3RcIjtcbmltcG9ydCB7IENvb3JkIH0gZnJvbSBcIi4uL0Nvb3JkXCI7XG5cbmV4cG9ydCBjbGFzcyBTZXJ2ZXJcbntcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1hcDogTWFwO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgY29ubnM6IENvbm5lY3Rpb25bXSA9IFtdO1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0IGEgbmV3IHNlcnZlciB3aXRoIHRoZSBnaXZlbiBtYXAuIFRoZSBzZXJ2ZXIgZ29ubmFcbiAgICAgKiB1cGRhdGUgZWFjaCBjb25uZWN0aW9ucyAoY2xpZW50cykgd2l0aCB0aGUgbWFwIGFuZCBzeW5jIGV2ZXJ5XG4gICAgICogbW92ZSBvZiB0aGUgY2xpZW50cyBiZXR3ZWVuIHRoZW0uXG4gICAgICogQHBhcmFtIG1hcCBcbiAgICAgKi9cbiAgICBwdWJsaWMgY29uc3RydWN0b3IobWFwOiBNYXApXG4gICAge1xuICAgICAgICB0aGlzLm1hcCA9IG1hcDtcblxuICAgICAgICAvLyBVcGRhdGUgZWxlbWVudHMgZm9yIGNvbm5lY3Rpb25zIGV4Y2VwdCB0aGVpciBvd24gcGxheWVyXG4gICAgICAgIHRoaXMubWFwLk9uVXBkYXRlLkFkZChlbGVtZW50ID0+IHRoaXMuY29ubnNcbiAgICAgICAgICAgIC5maWx0ZXIoY29ubiA9PiBlbGVtZW50LkdldFRhZygpICE9IGNvbm4uR2V0UGxheWVyKCkuR2V0VGFnKCkpXG4gICAgICAgICAgICAuZm9yRWFjaChjb25uID0+IGNvbm4uU2V0RWxlbWVudChlbGVtZW50KSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVkIHdoZW4gdGhlIHNlcnZlciByZWNlaXZlcyBhIG5ldyBtZXNzYWdlIGZyb20gYSBjbGllbnQvY29ubmVjdGlvbi5cbiAgICAgKiBAcGFyYW0gY29ublxuICAgICAqIEBwYXJhbSBjb21tYW5kXG4gICAgICovXG4gICAgcHJpdmF0ZSBPbkNvbW1hbmQoY29ubjogQ29ubmVjdGlvbiwgY29tbWFuZDogSUV4cG9ydE9iamVjdClcbiAgICB7XG4gICAgICAgIGNvbnN0IGFyZ3MgPSBFeHBvcnRhYmxlLkltcG9ydChjb21tYW5kKTtcblxuICAgICAgICBpZighYXJncy5sZW5ndGgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuS2ljayhjb25uKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBsYXllciA9IGNvbm4uR2V0UGxheWVyKCk7XG5cbiAgICAgICAgLy8gRXhlY3V0ZSBjb21tYW5kIG9uIHRoZSBwbGF5ZXJcbiAgICAgICAgcGxheWVyW2FyZ3NbMF1dLmJpbmQocGxheWVyKSguLi5hcmdzLnNsaWNlKDEpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBLaWNrIGNsaWVudCBvdXQgb2YgdGhlIHNlcnZlci5cbiAgICAgKiBAcGFyYW0gY29ubiBcbiAgICAgKi9cbiAgICBwcml2YXRlIEtpY2soY29ubjogQ29ubmVjdGlvbilcbiAgICB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5jb25ucy5pbmRleE9mKGNvbm4pO1xuXG4gICAgICAgIGlmKGluZGV4ID49IDApXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuY29ubnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIHRoaXMubWFwLkdldEFjdG9ycygpLlJlbW92ZShjb25uLkdldFBsYXllcigpKTtcbiAgICAgICAgICAgIGNvbm4uS2ljaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgbmV3IGNvbm5lY3Rpb24vY2xpZW50IHRvIHRoZSBzZXJ2ZXIuIFRoaXMgcmVwcmVzZW50c1xuICAgICAqIHRoZSBjbGllbnQgb24gdGhlIHNlcnZlciBzaWRlIC0gaXQgb25seSBjb21tdW5pY2F0ZXNcbiAgICAgKiB3aXRoIGEgQ2xpZW50IG9iamVjdCB0aHJvdWdoIGFuIElDaGFubmVsIGltcGxlbWVudGF0aW9uLlxuICAgICAqIEBwYXJhbSBjb25uIFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBBZGQoY29ubjogQ29ubmVjdGlvbilcbiAgICB7XG4gICAgICAgIC8vIENyZWF0ZSBwbGF5ZXIgYW5kIGFkZCBpdCB0byB0aGUgbWFwXG4gICAgICAgIGNvbnN0IHBsYXllciA9IG5ldyBQbGF5ZXJBY3RvcihuZXcgQ29vcmQoMCwgMCksIHRoaXMubWFwKTtcblxuICAgICAgICB0aGlzLm1hcC5HZXRBY3RvcnMoKS5TZXQocGxheWVyKTtcblxuICAgICAgICAvLyBTZXQgc2l6ZVxuICAgICAgICBhd2FpdCBjb25uLlNldFNpemUodGhpcy5tYXAuR2V0U2l6ZSgpKTtcblxuICAgICAgICAvLyBTZXQgYWN0b3JzXG4gICAgICAgIGZvcihsZXQgYWN0b3Igb2YgdGhpcy5tYXAuR2V0QWN0b3JzKCkuTGlzdCgpKVxuICAgICAgICB7XG4gICAgICAgICAgICBhd2FpdCBjb25uLlNldEVsZW1lbnQoYWN0b3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IGNlbGxzXG4gICAgICAgIGZvcihsZXQgY2VsbCBvZiB0aGlzLm1hcC5HZXRDZWxscygpLkxpc3QoKSlcbiAgICAgICAge1xuICAgICAgICAgICAgYXdhaXQgY29ubi5TZXRFbGVtZW50KGNlbGwpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBTdWJzY3JpYmUgdG8gdGhlIE9uQ29tbWFuZCBjYWxsYmFja1xuICAgICAgICBjb25uLk9uQ29tbWFuZCA9IGNvbW1hbmQgPT4gdGhpcy5PbkNvbW1hbmQoY29ubiwgY29tbWFuZCk7XG4gICAgICAgIFxuICAgICAgICAvLyBTZXQgcGxheWVyXG4gICAgICAgIGF3YWl0IGNvbm4uU2V0UGxheWVyKHBsYXllcik7XG5cbiAgICAgICAgLy8gQWRkIGNsaWVudCB0byB0aGUgaW50ZXJuYWwgY2xpZW50IGxpc3RcbiAgICAgICAgdGhpcy5jb25ucy5wdXNoKGNvbm4pO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBNYXAgfSBmcm9tIFwiLi9NYXBcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vRWxlbWVudC9CYXNlRWxlbWVudFwiO1xuaW1wb3J0IHsgRXZlbnQgfSBmcm9tIFwiLi9VdGlsL0V2ZW50XCI7XG5cbmV4cG9ydCBjbGFzcyBSZW5kZXJlclxue1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZHBpOiBudW1iZXIgPSAzMDtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgbWFwOiBNYXA7XG4gICAgcHJpdmF0ZSByZWFkb25seSBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50O1xuICAgIHByaXZhdGUgcmVhZG9ubHkgY29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xuICAgIFxuICAgIHByaXZhdGUgdGV4dHVyZXM6IHsgW2lkOiBzdHJpbmddOiBIVE1MSW1hZ2VFbGVtZW50IH0gPSB7fTtcbiAgICBwcml2YXRlIHN0b3A7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3QgYSBuZXcgZ2FtZSBvYmplY3QuXG4gICAgICovXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKG1hcDogTWFwLCBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KVxuICAgIHtcbiAgICAgICAgdGhpcy5tYXAgPSBtYXA7XG4gICAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSA8Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEPmNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9hZCB0ZXh0dXJlcyBmb3IgYSBsb2FkZWQgbWFwLlxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBMb2FkKCk6IFByb21pc2U8dm9pZD5cbiAgICB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiBcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudHMgPSB0aGlzLm1hcC5HZXRFbGVtZW50cygpO1xuICAgICAgICAgICAgbGV0IGkgPSAwO1xuICAgIFxuICAgICAgICAgICAgZWxlbWVudHMuRm9yRWFjaChlbGVtZW50ID0+XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYoIWVsZW1lbnQpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgY29uc3QgaWQgPSBlbGVtZW50LkdldFRleHR1cmUoKTtcblxuICAgICAgICAgICAgICAgIGlmKHRoaXMudGV4dHVyZXNbaWRdICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0dXJlID0gbmV3IEltYWdlKCk7XG4gICAgXG4gICAgICAgICAgICAgICAgdGV4dHVyZS5vbmVycm9yID0gKCkgPT4gcmVqZWN0KCk7XG4gICAgICAgICAgICAgICAgdGV4dHVyZS5vbmxvYWQgPSAoKSA9PiBcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGV4dHVyZXNbaWRdID0gdGV4dHVyZTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYoKytpID09IGVsZW1lbnRzLkdldExlbmd0aCgpKSBcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRleHR1cmUuc3JjID0gaWQ7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnRleHR1cmVzW2lkXSA9IG51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIERyYXcgdGhlIGdpdmVuIGVsZW1lbnQgb250byB0aGUgY2FudmFzLlxuICAgICAqIEBwYXJhbSBlbGVtZW50XG4gICAgICovXG4gICAgcHJpdmF0ZSBEcmF3KGVsZW1lbnQ6IEJhc2VFbGVtZW50KVxuICAgIHtcbiAgICAgICAgaWYoIWVsZW1lbnQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc3QgY29vcmQgPSBlbGVtZW50LkdldFBvcygpO1xuICAgICAgICBjb25zdCBzaXplID0gZWxlbWVudC5HZXRTaXplKCk7XG4gICAgICAgIGNvbnN0IHRleHR1cmUgPSB0aGlzLnRleHR1cmVzW2VsZW1lbnQuR2V0VGV4dHVyZSgpXTtcbiAgICBcbiAgICAgICAgY29uc3QgeCA9IGNvb3JkLlg7XG4gICAgICAgIGNvbnN0IHkgPSBjb29yZC5ZO1xuICAgICAgICBjb25zdCB3ID0gc2l6ZS5YO1xuICAgICAgICBjb25zdCBoID0gc2l6ZS5ZO1xuICAgIFxuICAgICAgICB0aGlzLmNvbnRleHQuZHJhd0ltYWdlKFxuICAgICAgICAgICAgdGV4dHVyZSwgXG4gICAgICAgICAgICB4ICogdGhpcy5kcGksIFxuICAgICAgICAgICAgeSAqIHRoaXMuZHBpLCBcbiAgICAgICAgICAgIHcgKiB0aGlzLmRwaSwgXG4gICAgICAgICAgICBoICogdGhpcy5kcGkpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBVcGRhdGUgdGhlIGNhbnZhcy5cbiAgICAgKi9cbiAgICBwcml2YXRlIFVwZGF0ZSgpXG4gICAge1xuICAgICAgICBjb25zdCBzaXplID0gdGhpcy5tYXAuR2V0U2l6ZSgpO1xuICAgIFxuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHRoaXMuZHBpICogc2l6ZS5YO1xuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLmRwaSAqIHNpemUuWTtcbiAgICAgICAgdGhpcy5jYW52YXMuc3R5bGUud2lkdGggPSB0aGlzLmRwaSAqIHNpemUuWCArIFwicHhcIjtcbiAgICAgICAgdGhpcy5jYW52YXMuc3R5bGUuaGVpZ2h0ID0gdGhpcy5kcGkgKiBzaXplLlkgKyBcInB4XCI7XG4gICAgICAgIFxuICAgICAgICB0aGlzLm1hcC5HZXRDZWxscygpLkZvckVhY2goZSA9PiB0aGlzLkRyYXcoZSkpO1xuICAgICAgICB0aGlzLm1hcC5HZXRBY3RvcnMoKS5Gb3JFYWNoKGUgPT4gdGhpcy5EcmF3KGUpKTtcbiAgICBcbiAgICAgICAgaWYoIXRoaXMuc3RvcClcbiAgICAgICAge1xuICAgICAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB0aGlzLlVwZGF0ZSgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuT25VcGRhdGUuQ2FsbChudWxsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdGFydCByZW5kZXJpbmcuXG4gICAgICovXG4gICAgcHVibGljIFN0YXJ0KClcbiAgICB7XG4gICAgICAgIHRoaXMuc3RvcCA9IGZhbHNlO1xuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHRoaXMuVXBkYXRlKCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0b3AgcmVuZGVyaW5nLlxuICAgICAqL1xuICAgIHB1YmxpYyBTdG9wKClcbiAgICB7XG4gICAgICAgIHRoaXMuc3RvcCA9IHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gcmVkcmF3LlxuICAgICAqL1xuICAgIHB1YmxpYyBPblVwZGF0ZTogRXZlbnQ8dm9pZD4gPSBuZXcgRXZlbnQoKTtcbn0iLCJleHBvcnQgY2xhc3MgRXZlbnQ8VD5cbntcbiAgICBwcm90ZWN0ZWQgbGlzdGVuZXJzOiB7IFtpZDogbnVtYmVyXTogKHZhbHVlOiBUKSA9PiB2b2lkIH0gPSB7fTtcbiAgICBwcml2YXRlIGNvdW50ID0gMDtcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGxpc3RlbmVyLlxuICAgICAqIEBwYXJhbSBjYWxsYmFjayBcbiAgICAgKi9cbiAgICBwdWJsaWMgQWRkKGNhbGxiYWNrOiAodmFsdWU6IFQpID0+IHZvaWQpOiBudW1iZXJcbiAgICB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzWysrdGhpcy5jb3VudF0gPSBjYWxsYmFjaztcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzLmNvdW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGxpc3RlbmVyLlxuICAgICAqIEBwYXJhbSBpZCBcbiAgICAgKi9cbiAgICBwdWJsaWMgUmVtb3ZlKGlkOiBudW1iZXIpOiB2b2lkXG4gICAge1xuICAgICAgICBkZWxldGUgdGhpcy5saXN0ZW5lcnNbaWRdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGwgbGlzdGVuZXJzIHdpdGggdGhlIGdpdmVuIHZhbHVlLlxuICAgICAqIEBwYXJhbSB2YWx1ZSBcbiAgICAgKi9cbiAgICBwdWJsaWMgQ2FsbCh2YWx1ZTogVCk6IHZvaWRcbiAgICB7XG4gICAgICAgICg8YW55Pk9iamVjdCkudmFsdWVzKHRoaXMubGlzdGVuZXJzKS5mb3JFYWNoKGNhbGxiYWNrID0+IGNhbGxiYWNrKHZhbHVlKSk7XG4gICAgfVxufSIsImRlY2xhcmUgdmFyIG5hdmlnYXRvcjogeyBjbGlwYm9hcmQ6IGFueSB9ICYgTmF2aWdhdG9yO1xuXG5leHBvcnQgY2xhc3MgSGVscGVyXG57XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGFuIGFzeW5jIHJlcXVlc3QuXG4gICAgICogQHBhcmFtIHVybCBcbiAgICAgKiBAcGFyYW0gZGF0YSBcbiAgICAgKiBAcGFyYW0gbWV0aG9kIFxuICAgICAqL1xuICAgIHByaXZhdGUgc3RhdGljIGFzeW5jIEFqYXgodXJsOiBzdHJpbmcsIGRhdGE6IHN0cmluZywgbWV0aG9kOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz5cbiAgICB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KHJlc29sdmUgPT4gXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxldCByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgICAgIHJlcXVlc3Qub3BlbihtZXRob2QsIHVybCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgIHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4gXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYocmVxdWVzdC5yZWFkeVN0YXRlICE9IDQpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHJlcXVlc3Quc3RhdHVzID09IDIwMCkgXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlcXVlc3QucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYoZGF0YSAhPSBudWxsICYmIGRhdGEubGVuZ3RoID4gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xuICAgICAgICAgICAgICAgIHJlcXVlc3Quc2VuZChkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXF1ZXN0LnNlbmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUG9zdCByZXF1ZXN0IHdpdGggSlNPTiBkYXRhLlxuICAgICAqIEBwYXJhbSB1cmwgXG4gICAgICogQHBhcmFtIGRhdGFcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGFzeW5jIFBvc3QodXJsOiBzdHJpbmcsIGRhdGE6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPlxuICAgIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IEhlbHBlci5BamF4KHVybCwgZGF0YSwgXCJQT1NUXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCByZXF1ZXN0IHRvIHRoZSBnaXZlbiBVUkwuXG4gICAgICogQHBhcmFtIHVybCBcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGFzeW5jIEdldCh1cmw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPlxuICAgIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IEhlbHBlci5BamF4KHVybCwgbnVsbCwgXCJHRVRcIik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gbWluIChpbmNsdWRlZCkgYW5kIG1heCAoaW5jbHVkZWQpLlxuICAgICAqIEBwYXJhbSBtaW4gXG4gICAgICogQHBhcmFtIG1heCBcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIFJhbmRvbShtaW46IG51bWJlciwgbWF4OiBudW1iZXIpOiBudW1iZXJcbiAgICB7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkgKyBtaW4pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvcHkgcHJvcGVydGllcyBmcm9tIG9uZSBvYmplY3QgdG8gYW5vdGhlci5cbiAgICAgKiBAcGFyYW0gdG8gXG4gICAgICogQHBhcmFtIGZyb20gXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBFeHRyYWN0KHRvOiBPYmplY3QsIGZyb206IE9iamVjdCkgXG4gICAge1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gZnJvbSkgXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmKGZyb20uaGFzT3duUHJvcGVydHkoa2V5KSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0b1trZXldID0gZnJvbVtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIEJpbmQgcHJvcGVydGllcyBmcm9tIG9uZSBvYmplY3QgdG8gYW5vdGhlci5cbiAgICAgKiBAcGFyYW0gdG8gXG4gICAgICogQHBhcmFtIGZyb20gXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBCaW5kKHRvOiBPYmplY3QsIGZyb206IE9iamVjdCwgcHJvcGVydGllczogc3RyaW5nW10pIFxuICAgIHtcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHByb3BlcnRpZXMpIFxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBwID0gcHJvcGVydGllc1trZXldO1xuXG4gICAgICAgICAgICBpZihmcm9tW3BdICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdG9bcF0gPSBmcm9tW3BdLmJpbmQoZnJvbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVbmlxdWUgSUQgZ2VuZXJhdGFpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIFVuaXF1ZSgpOiBzdHJpbmcgXG4gICAge1xuICAgICAgICBsZXQgZGF0ZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFwieHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4XCIucmVwbGFjZSgvW3h5XS9nLCBjID0+XG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IHIgPSAoZGF0ZSArIE1hdGgucmFuZG9tKCkgKiAxNikgJSAxNiB8IDA7XG5cbiAgICAgICAgICAgIGRhdGUgPSBNYXRoLmZsb29yKGRhdGUgLyAxNik7XG5cbiAgICAgICAgICAgIHJldHVybiAoYyA9PT0gXCJ4XCIgPyByIDogKHIgJiAweDcgfCAweDgpKS50b1N0cmluZygxNik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHRoZSBzdHJpbmcgaXMgYSB1bmlxdWUgSUQgZ2VuZXJhdGVkIGJ5IHRoZSBVbmlxdWUoKSBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0gdGV4dCBcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIElzVW5pcXVlKHRleHQ6IHN0cmluZyk6IGJvb2xlYW5cbiAgICB7XG4gICAgICAgIGNvbnN0IHJlID0gUmVnRXhwKFxuICAgICAgICAgICAgXCJeWzAtOWEtZkEtRl17OH0tXCIgKyBcbiAgICAgICAgICAgIFwiWzAtOWEtZkEtRl17NH0tXCIgKyBcbiAgICAgICAgICAgIFwiNFswLTlhLWZBLUZdezN9LVwiICsgXG4gICAgICAgICAgICBcIlswLTlhLWZBLUZdezR9LVwiICsgXG4gICAgICAgICAgICBcIlswLTlhLWZBLUZdezEyfVwiKVxuXG4gICAgICAgIHJldHVybiByZS50ZXN0KHRleHQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhvb2sgaW50byBhbiBvYmplY3QgYW5kIGludGVyY2VwdCBhbGwgZnVuY3Rpb24gY2FsbHMuXG4gICAgICogQHBhcmFtIG9iamVjdCBcbiAgICAgKiBAcGFyYW0gaG9vayBGdW5jdGlvbiB0byBydW4gYmVmb3JlIGVhY2ggY2FsbC5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIEhvb2sob2JqZWN0OiBhbnksIGhvb2s6ICh0YXJnZXQsIHByb3AsIGFyZ3MpID0+IHZvaWQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm94eShvYmplY3QsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZ2V0OiAodGFyZ2V0LCBwcm9wLCByZWNlaXZlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRhcmdldFtwcm9wXSAhPSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBSZWZsZWN0LmdldCh0YXJnZXQsIHByb3AsIHJlY2VpdmVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaG9vayh0YXJnZXQsIHByb3AsIGFyZ3MpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0W3Byb3BdLmJpbmQodGFyZ2V0KSguLi5hcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvcHkgdG8gY2xpcGJvYXJkLlxuICAgICAqIEBwYXJhbSB0ZXh0IFxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgYXN5bmMgQ2xpcGJvYXJkQ29weSh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IFxuICAgIHtcbiAgICAgICAgY29uc3QgZmFsbGJhY2sgPSBhc3luYyAodGV4dCkgPT4gXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPihyZXNvbHZlID0+IFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZhciBmaWVsZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZXh0YXJlYVwiKTtcbiAgICBcbiAgICAgICAgICAgICAgICBmaWVsZC52YWx1ZSA9IHRleHQ7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChmaWVsZCk7XG4gICAgXG4gICAgICAgICAgICAgICAgZmllbGQuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICBmaWVsZC5zZWxlY3QoKTtcbiAgICBcbiAgICAgICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZG9jdW1lbnQuZXhlY0NvbW1hbmQoXCJjb3B5XCIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZmllbGQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW5hdmlnYXRvci5jbGlwYm9hcmQpIFxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gZmFsbGJhY2sodGV4dClcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0ZXh0KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoKGUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdhaXQgc29tZSB0aW1lLlxuICAgICAqIEBwYXJhbSBkZWxheSBcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGFzeW5jIFdhaXQoZGVsYXk6IG51bWJlcilcbiAgICB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPihyZXNvbHZlID0+IFxuICAgICAgICB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUoKSwgZGVsYXkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBIG5vb3AgZnVuY3Rpb24uXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBOb29wKClcbiAgICB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG59IiwiZXhwb3J0IGNsYXNzIEtleWJvYXJkXG57XG4gICAgcHVibGljIHN0YXRpYyBLZXlzOiB7IFtrZXk6IHN0cmluZ106IGJvb2xlYW4gfSA9IHt9O1xuICAgIHByaXZhdGUgc3RhdGljIEluaXRlZCA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZWQgd2hlbiBhIGtleSBpcyBwcmVzc2VkLlxuICAgICAqIEBwYXJhbSBldmVudCBcbiAgICAgKiBAcGFyYW0gc3RhdGUgXG4gICAgICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgT25LZXkoZXZlbnQsIHN0YXRlOiBib29sZWFuKTogdm9pZFxuICAgIHtcbiAgICAgICAgS2V5Ym9hcmQuS2V5c1tldmVudC5rZXkudG9VcHBlckNhc2UoKV0gPSBzdGF0ZTtcbiAgICAgICAgS2V5Ym9hcmQuS2V5c1tldmVudC5rZXkudG9Mb3dlckNhc2UoKV0gPSBzdGF0ZTtcbiAgICAgICAgS2V5Ym9hcmQuS2V5c1tldmVudC5rZXlDb2RlXSA9IHN0YXRlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBJbml0IGtleWJvYXJkIGxpc3RlbmVycy5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIEluaXQoKTogdm9pZFxuICAgIHtcbiAgICAgICAgaWYoS2V5Ym9hcmQuSW5pdGVkKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBLZXlib2FyZC5Jbml0ZWQgPSB0cnVlO1xuXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBlID0+IEtleWJvYXJkLk9uS2V5KGUsIHRydWUpLCBmYWxzZSk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgZSA9PiBLZXlib2FyZC5PbktleShlLCBmYWxzZSksIGZhbHNlKTtcbiAgICB9XG59IiwiZXhwb3J0IGVudW0gTG9nVHlwZVxue1xuICAgIFNpbGVudCA9IDAsXG4gICAgV2FybiA9IDEsXG4gICAgSW5mbyA9IDIsXG4gICAgVmVyYm9zZSA9IDNcbn0iLCJpbXBvcnQgeyBMb2dUeXBlIH0gZnJvbSBcIi4vTG9nVHlwZVwiO1xuXG5leHBvcnQgY2xhc3MgTG9nZ2VyXG57XG4gICAgcHVibGljIHN0YXRpYyBUeXBlOiBMb2dUeXBlID0gTG9nVHlwZS5TaWxlbnQ7XG5cbiAgICAvKipcbiAgICAgKiBMb2cgYSBtZXNzYWdlLlxuICAgICAqIEBwYXJhbSBzZWxmXG4gICAgICogQHBhcmFtIGFyZ3MgXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBMb2coc2VsZjogT2JqZWN0LCB0eXBlOiBMb2dUeXBlLCAuLi5hcmdzOiBhbnlbXSlcbiAgICB7XG4gICAgICAgIGlmKHRoaXMuVHlwZSA+PSB0eXBlKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgKCR7dHlwZX0pIFske3NlbGYuY29uc3RydWN0b3IubmFtZX1dIGAsIC4uLmFyZ3MpO1xuICAgICAgICB9XG4gICAgfVxufSJdfQ==
