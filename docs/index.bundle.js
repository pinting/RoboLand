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
const gameCanvas = document.getElementById("game-canvas");
const offerInput = document.getElementById("offer-input");
const answerInput = document.getElementById("answer-input");
const offerButton = document.getElementById("offer-button");
const answerButton = document.getElementById("answer-button");
const finishButton = document.getElementById("finish-button");
const channel = new PeerChannel_1.PeerChannel();
const map = new Map_1.Map();
let server;
const ClickOffer = () => __awaiter(this, void 0, void 0, function* () {
    offerInput.value = yield channel.Offer();
});
const ClickAnswer = () => __awaiter(this, void 0, void 0, function* () {
    const offer = offerInput.value;
    if (offer && offer.length > 10) {
        answerInput.value = yield channel.Answer(offer);
    }
});
const ClickFinish = () => {
    const answer = answerInput.value;
    if (answer && answer.length > 10) {
        channel.Finish(answer);
    }
};
const CreateClient = () => __awaiter(this, void 0, void 0, function* () {
    if (!channel.IsOfferor()) {
        return new Client_1.Client(channel, map);
    }
    const serverMap = new Map_1.Map();
    yield serverMap.Load("res/map.json");
    server = new Server_1.Server(serverMap);
    const localA = new FakeChannel_1.FakeChannel();
    const localB = new FakeChannel_1.FakeChannel();
    localA.SetOther(localB);
    localB.SetOther(localA);
    server.Add(new Connection_1.Connection(channel));
    server.Add(new Connection_1.Connection(localA));
    return new Client_1.Client(localB, map);
});
const OnUpdate = (player, { up, left, down, right }) => {
    if (!channel.IsOpen()) {
        return;
    }
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
offerButton.onclick = () => ClickOffer();
answerButton.onclick = () => ClickAnswer();
finishButton.onclick = () => ClickFinish();
channel.OnOpen = () => Start();

},{"./lib/Coord":2,"./lib/Map":13,"./lib/Net/Client":14,"./lib/Net/Connection":15,"./lib/Net/FakeChannel":16,"./lib/Net/PeerChannel":19,"./lib/Net/Server":20,"./lib/Renderer":21,"./lib/Util/Keyboard":24}],2:[function(require,module,exports){
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
        this.OnOpen = Helper_1.Helper.Noop;
        this.OnClose = Helper_1.Helper.Noop;
        this.OnMessage = Helper_1.Helper.Noop;
    }
    Offer() {
        if (this.peerConnection) {
            return Promise.reject();
        }
        return new Promise((resolve, reject) => {
            this.peerConnection = new RTCPeerConnection(null);
            this.dataChannel = this.peerConnection.createDataChannel("data");
            this.peerConnection.onicecandidate = e => {
                if (e.candidate == null) {
                    const offer = this.peerConnection.localDescription;
                    resolve(Helper_1.Helper.Base64Encode(JSON.stringify(offer)));
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
            this.peerConnection = new RTCPeerConnection(null);
            this.peerConnection.onicecandidate = e => {
                if (e.candidate == null) {
                    const answer = this.peerConnection.localDescription;
                    resolve(Helper_1.Helper.Base64Encode(JSON.stringify(answer)));
                }
            };
            this.peerConnection.ondatachannel = event => {
                this.dataChannel = event.channel;
                this.dataChannel.onmessage = event => this.ParseMessage(event);
                this.dataChannel.onopen = () => this.OnOpen();
                this.dataChannel.onclose = () => this.OnClose();
            };
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(Helper_1.Helper.Base64Decode(offer))));
            this.peerConnection.createAnswer().then(desc => this.peerConnection.setLocalDescription(desc), error => reject(error));
        });
    }
    Finish(answer) {
        if (this.IsOfferor()) {
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(Helper_1.Helper.Base64Decode(answer))));
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
    static Base64Encode(input) {
        return btoa(input);
    }
    static Base64Decode(input) {
        return atob(input);
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
    static IsUnique(unique) {
        const re = RegExp("^[0-9a-fA-F]{8}-" +
            "[0-9a-fA-F]{4}-" +
            "4[0-9a-fA-F]{3}-" +
            "[0-9a-fA-F]{4}-" +
            "[0-9a-fA-F]{12}");
        return re.test(unique);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd3d3L2luZGV4LnRzIiwic3JjL3d3dy9saWIvQ29vcmQudHMiLCJzcmMvd3d3L2xpYi9FbGVtZW50L0FjdG9yL0Jhc2VBY3Rvci50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvQWN0b3IvUGxheWVyQWN0b3IudHMiLCJzcmMvd3d3L2xpYi9FbGVtZW50L0Jhc2VFbGVtZW50LnRzIiwic3JjL3d3dy9saWIvRWxlbWVudC9DZWxsL0Jhc2VDZWxsLnRzIiwic3JjL3d3dy9saWIvRWxlbWVudC9DZWxsL0dyb3VuZENlbGwudHMiLCJzcmMvd3d3L2xpYi9FbGVtZW50L0NlbGwvU3RvbmVDZWxsLnRzIiwic3JjL3d3dy9saWIvRWxlbWVudC9DZWxsL1dhdGVyQ2VsbC50cyIsInNyYy93d3cvbGliL0VsZW1lbnQvTW92ZVR5cGUudHMiLCJzcmMvd3d3L2xpYi9FbGVtZW50TGlzdC50cyIsInNyYy93d3cvbGliL0V4cG9ydGFibGUudHMiLCJzcmMvd3d3L2xpYi9NYXAudHMiLCJzcmMvd3d3L2xpYi9OZXQvQ2xpZW50LnRzIiwic3JjL3d3dy9saWIvTmV0L0Nvbm5lY3Rpb24udHMiLCJzcmMvd3d3L2xpYi9OZXQvRmFrZUNoYW5uZWwudHMiLCJzcmMvd3d3L2xpYi9OZXQvTWVzc2FnZUhhbmRsZXIudHMiLCJzcmMvd3d3L2xpYi9OZXQvTWVzc2FnZVR5cGUudHMiLCJzcmMvd3d3L2xpYi9OZXQvUGVlckNoYW5uZWwudHMiLCJzcmMvd3d3L2xpYi9OZXQvU2VydmVyLnRzIiwic3JjL3d3dy9saWIvUmVuZGVyZXIudHMiLCJzcmMvd3d3L2xpYi9VdGlsL0V2ZW50LnRzIiwic3JjL3d3dy9saWIvVXRpbC9IZWxwZXIudHMiLCJzcmMvd3d3L2xpYi9VdGlsL0tleWJvYXJkLnRzIiwic3JjL3d3dy9saWIvVXRpbC9Mb2dUeXBlLnRzIiwic3JjL3d3dy9saWIvVXRpbC9Mb2dnZXIudHMiXSwibmFt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RCxDQUFDO0lBTU0sR0FBRyxDQUFDLEtBQVk7UUFFbkIsT0FBTyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUtNLEtBQUs7UUFFUixPQUFPLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFLTSxLQUFLO1FBRVIsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFLTSxJQUFJO1FBRVAsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFNTSxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUM7UUFFZCxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUUsQ0FBQztJQU9NLE1BQU0sQ0FBQyxJQUFXLEVBQUUsRUFBUztRQUVoQyxJQUFHLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsRUFDM0U7WUFDSSxPQUFPLElBQUks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VyxDQUFBO0FBQ2YsQ0FBQyxFQU5XLE9BQU8sR0FBUCxlQUFPLEtBQVAsZUFBTyxRQU1sQjs7Ozs7QUNORCx1Q0FBb0M7QUFFcEM7SUFTVyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQVksRUFBRSxJQUFhLEVBQUUsR0FBRyxJQUFXO1FBRXpELElBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLEVBQ3BCO1lBQ0ksT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7U0FDakU7SUFDTCxDQUFDOztBQWJhLFdBQUksR0FBWSxpQkFBTyxDQUFDLE1BQU0sQ0FBQztBQUZqRCx3QkFnQkMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQgeyBNYXAgfSBmcm9tIFwiLi9saWIvTWFwXCI7XG5pbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuL2xpYi9Db29yZFwiO1xuaW1wb3J0IHsgUGxheWVyQWN0b3IgfSBmcm9tICcuL2xpYi9FbGVtZW50L0FjdG9yL1BsYXllckFjdG9yJztcbmltcG9ydCB7IFNlcnZlciB9IGZyb20gJy4vbGliL05ldC9TZXJ2ZXInO1xuaW1wb3J0IHsgUmVuZGVyZXIgfSBmcm9tIFwiLi9saWIvUmVuZGVyZXJcIjtcbmltcG9ydCB7IEtleWJvYXJkIH0gZnJvbSBcIi4vbGliL1V0aWwvS2V5Ym9hcmRcIjtcbmltcG9ydCB7IENvbm5lY3Rpb24gfSBmcm9tIFwiLi9saWIvTmV0L0Nvbm5lY3Rpb25cIjtcbmltcG9ydCB7IEZha2VDaGFubmVsIH0gZnJvbSBcIi4vbGliL05ldC9GYWtlQ2hhbm5lbFwiO1xuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcIi4vbGliL05ldC9DbGllbnRcIjtcbmltcG9ydCB7IFBlZXJDaGFubmVsIH0gZnJvbSBcIi4vbGliL05ldC9QZWVyQ2hhbm5lbFwiO1xuXG4vLyBIVE1MIGVsZW1lbnRzXG5jb25zdCBnYW1lQ2FudmFzID0gPEhUTUxDYW52YXNFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZS1jYW52YXNcIik7XG5jb25zdCBvZmZlcklucHV0ID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvZmZlci1pbnB1dFwiKTtcbmNvbnN0IGFuc3dlcklucHV0ID0gPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhbnN3ZXItaW5wdXRcIik7XG5jb25zdCBvZmZlckJ1dHRvbiA9IDxIVE1MQnV0dG9uRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm9mZmVyLWJ1dHRvblwiKTtcbmNvbnN0IGFuc3dlckJ1dHRvbiA9IDxIVE1MQnV0dG9uRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFuc3dlci1idXR0b25cIik7XG5jb25zdCBmaW5pc2hCdXR0b24gPSA8SFRNTEJ1dHRvbkVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaW5pc2gtYnV0dG9uXCIpO1xuXG4vLyBHYW1lIG9iamVjdHNcbmNvbnN0IGNoYW5uZWwgPSBuZXcgUGVlckNoYW5uZWwoKTtcbmNvbnN0IG1hcDogTWFwID0gbmV3IE1hcCgpO1xuXG5sZXQgc2VydmVyOiBTZXJ2ZXI7XG5cbi8qKlxuICogQ3JlYXRlIGFuIG9mZmVyLlxuICovXG5jb25zdCBDbGlja09mZmVyID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT5cbntcbiAgICBvZmZlcklucHV0LnZhbHVlID0gYXdhaXQgY2hhbm5lbC5PZmZlcigpO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgYW4gYW5zd2VyIGZyb20gdGhlIHBhc3RlZCBvZmZlci5cbiAqL1xuY29uc3QgQ2xpY2tBbnN3ZXIgPSBhc3luYyAoKTogUHJvbWlzZTx2b2lkPiA9PiBcbntcbiAgICBjb25zdCBvZmZlciA9IG9mZmVySW5wdXQudmFsdWU7XG5cbiAgICBpZihvZmZlciAmJiBvZmZlci5sZW5ndGggPiAxMClcbiAgICB7XG4gICAgICAgIGFuc3dlcklucHV0LnZhbHVlID0gYXdhaXQgY2hhbm5lbC5BbnN3ZXIob2ZmZXIpO1xuICAgIH1cbn07XG5cbi8qKlxuICogRmluaXNoIG5lZ290aWF0aW9uIHdpdGggdGhlIHBhc3RlZCBhbnN3ZXIuXG4gKi9cbmNvbnN0IENsaWNrRmluaXNoID0gKCk6IHZvaWQgPT5cbntcbiAgICBjb25zdCBhbnN3ZXIgPSBhbnN3ZXJJbnB1dC52YWx1ZTtcblxuICAgIGlmKGFuc3dlciAmJiBhbnN3ZXIubGVuZ3RoID4gMTApXG4gICAge1xuICAgICAgICBjaGFubmVsLkZpbmlzaChhbnN3ZXIpO1xuICAgIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlIGNsaWVudCAoYW5kIHNlcnZlcikuXG4gKi9cbmNvbnN0IENyZWF0ZUNsaWVudCA9IGFzeW5jICgpOiBQcm9taXNlPENsaWVudD4gPT5cbntcbiAgICBpZighY2hhbm5lbC5Jc09mZmVyb3IoKSlcbiAgICB7XG4gICAgICAgIHJldHVybiBuZXcgQ2xpZW50KGNoYW5uZWwsIG1hcCk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHNlcnZlciBtYXAsIGxvYWQgaXQsIGNyZWF0ZSBzZXJ2ZXJcbiAgICBjb25zdCBzZXJ2ZXJNYXA6IE1hcCA9IG5ldyBNYXAoKTtcblxuICAgIGF3YWl0IHNlcnZlck1hcC5Mb2FkKFwicmVzL21hcC5qc29uXCIpO1xuXG4gICAgc2VydmVyID0gbmV3IFNlcnZlcihzZXJ2ZXJNYXApO1xuXG4gICAgLy8gQ3JlYXRlIGEgZmFrZSBjaGFubmVsXG4gICAgY29uc3QgbG9jYWxBID0gbmV3IEZha2VDaGFubmVsKCk7XG4gICAgY29uc3QgbG9jYWxCID0gbmV3IEZha2VDaGFubmVsKCk7XG5cbiAgICBsb2NhbEEuU2V0T3RoZXIobG9jYWxCKTtcbiAgICBsb2NhbEIuU2V0T3RoZXIobG9jYWxBKTtcblxuICAgIC8vIEFkZCBjb25uZWN0aW9uIHRvIHRoZSBzZXJ2ZXJcbiAgICBzZXJ2ZXIuQWRkKG5ldyBDb25uZWN0aW9uKGNoYW5uZWwpKTtcbiAgICBzZXJ2ZXIuQWRkKG5ldyBDb25uZWN0aW9uKGxvY2FsQSkpO1xuXG4gICAgLy8gQ29ubmVjdCBjbGllbnQgdG8gdGhlIHNlcnZlclxuICAgIHJldHVybiBuZXcgQ2xpZW50KGxvY2FsQiwgbWFwKTtcbn1cblxuLyoqXG4gKiBHYW1lIGN5Y2xlXG4gKiBAcGFyYW0gcGxheWVyIFxuICogQHBhcmFtIHVwXG4gKiBAcGFyYW0gbGVmdFxuICogQHBhcmFtIGRvd25cbiAqIEBwYXJhbSByaWdodFxuICovXG5jb25zdCBPblVwZGF0ZSA9IChwbGF5ZXI6IFBsYXllckFjdG9yLCB7IHVwLCBsZWZ0LCBkb3duLCByaWdodCB9KSA9Plxue1xuICAgIGlmKCFjaGFubmVsLklzT3BlbigpKVxuICAgIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRpcmVjdGlvbiA9IG5ldyBDb29yZChcbiAgICAgICAgS2V5Ym9hcmQuS2V5c1tsZWZ0XSA/IC0wLjA1IDogS2V5Ym9hcmQuS2V5c1tyaWdodF0gPyAwLjA1IDogMCwgXG4gICAgICAgIEtleWJvYXJkLktleXNbdXBdID8gLTAuMDUgOiBLZXlib2FyZC5LZXlzW2Rvd25dID8gMC4wNSA6IDBcbiAgICApO1xuXG4gICAgaWYocGxheWVyICYmIGRpcmVjdGlvbi5HZXREaXN0YW5jZShuZXcgQ29vcmQpID4gMClcbiAgICB7XG4gICAgICAgIHBsYXllci5Nb3ZlKGRpcmVjdGlvbik7XG4gICAgfVxufTtcblxuLyoqXG4gKiBTdGFydCBnYW1lLlxuICovXG5jb25zdCBTdGFydCA9IGFzeW5jICgpID0+XG57XG4gICAgS2V5Ym9hcmQuSW5pdCgpO1xuXG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgQ3JlYXRlQ2xpZW50KCk7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBuZXcgUmVuZGVyZXIobWFwLCBnYW1lQ2FudmFzKTtcblxuICAgIGNsaWVudC5PblBsYXllciA9IGFzeW5jIHBsYXllciA9PlxuICAgIHtcbiAgICAgICAgYXdhaXQgcmVuZGVyZXIuTG9hZCgpO1xuICAgICAgICBcbiAgICAgICAgY29uc3Qga2V5cyA9IFxuICAgICAgICB7XG4gICAgICAgICAgICB1cDogXCJBUlJPV1VQXCIsIFxuICAgICAgICAgICAgbGVmdDogXCJBUlJPV0xFRlRcIiwgXG4gICAgICAgICAgICBkb3duOiBcIkFSUk9XRE9XTlwiLCBcbiAgICAgICAgICAgIHJpZ2h0OiBcIkFSUk9XUklHSFRcIlxuICAgICAgICB9O1xuXG4gICAgICAgIHJlbmRlcmVyLk9uVXBkYXRlLkFkZCgoKSA9PiBPblVwZGF0ZShwbGF5ZXIsIGtleXMpKTtcbiAgICAgICAgcmVuZGVyZXIuU3RhcnQoKTtcbiAgICB9O1xufTtcblxuLy8gV2lyZSB1cCBsaXN0ZW5lcnNcbm9mZmVyQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiBDbGlja09mZmVyKCk7XG5hbnN3ZXJCdXR0b24ub25jbGljayA9ICgpID0+IENsaWNrQW5zd2VyKCk7XG5maW5pc2hCdXR0b24ub25jbGljayA9ICgpID0+IENsaWNrRmluaXNoKCk7XG5jaGFubmVsLk9uT3BlbiA9ICgpID0+IFN0YXJ0KCk7IiwiaW1wb3J0IHsgRXhwb3J0YWJsZSB9IGZyb20gXCIuL0V4cG9ydGFibGVcIjtcblxuZXhwb3J0IGNsYXNzIENvb3JkIGV4dGVuZHMgRXhwb3J0YWJsZVxue1xuICAgIHB1YmxpYyBYOiBudW1iZXI7XG4gICAgcHVibGljIFk6IG51bWJlcjtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdCBhIG5ldyBjb29yZC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIgPSAwLCB5OiBudW1iZXIgPSAwKVxuICAgIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLlggPSB4O1xuICAgICAgICB0aGlzLlkgPSB5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgZGlzdGFuY2UgZnJvbSB0aGUgb3RoZXIgY29vcmQuXG4gICAgICogQHBhcmFtIG90aGVyIFxuICAgICAqL1xuICAgIHB1YmxpYyBHZXREaXN0YW5jZShvdGhlcjogQ29vcmQpOiBudW1iZXJcbiAgICB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3codGhpcy5YIC0gb3RoZXIuWCwgMikgKyBNYXRoLnBvdyh0aGlzLlkgLSBvdGhlci5ZLCAyKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGNvb3JkIGlzIHRoZSBzYW1lIGFzIGFuIG90aGVyLlxuICAgICAqIEBwYXJhbSBvdGhlciBcbiAgICAgKi9cbiAgICBwdWJsaWMgSXMob3RoZXI6IENvb3JkKTogYm9vbGVhblxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuWCA9PSBvdGhlci5YICYmIHRoaXMuWSA9PSBvdGhlci5ZO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGNvb3JkIHRvIHRoaXMgb25lLlxuICAgICAqIEBwYXJhbSBvdGhlciBcbiAgICAgKi9cbiAgICBwdWJsaWMgQWRkKG90aGVyOiBDb29yZCk6IENvb3JkXG4gICAge1xuICAgICAgICByZXR1cm4gbmV3IENvb3JkKHRoaXMuWCArIG90aGVyLlgsIHRoaXMuWSArIG90aGVyLlkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsb25lIHRoZSBjb29yZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgQ2xvbmUoKTogQ29vcmRcbiAgICB7XG4gICAgICAgIHJldHVybiBuZXcgQ29vcmQodGhpcy5YLCB0aGlzLlkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZsb29yIHRoZSBjb29yZGluYXRlcy5cbiAgICAgKi9cbiAgICBwdWJsaWMgRmxvb3IoKTogQ29vcmRcbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLkYobiA9PiBNYXRoLmZsb29yKG4pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDZWlsIHRoZSBjb29yZGluYXRlcy5cbiAgICAgKi9cbiAgICBwdWJsaWMgQ2VpbCgpOiBDb29yZFxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuRihuID0+IE1hdGguY2VpbChuKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUm91bmQgdXAgdGhlIGNvb3JkaW5hdGVzLlxuICAgICAqIEBwYXJhbSBkIERlY2ltYWwgcGxhY2VzIHRvIHJvdW5kIHVwLlxuICAgICAqL1xuICAgIHB1YmxpYyBSb3VuZChkID0gMCk6IENvb3JkXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5GKG4gPT4gTWF0aC5yb3VuZChuICogTWF0aC5wb3coMTAsIGQpKSAvIE1hdGgucG93KDEwLCBkKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGNvb3JkaW5hdGUgaXMgaW5zaWRlIHRoZSBpbnRlcnNlY3Rpb24gb2YgdHdvIHBvaW50cy5cbiAgICAgKiBAcGFyYW0gZnJvbSBcbiAgICAgKiBAcGFyYW0gdG8gXG4gICAgICovXG4gICAgcHVibGljIEluc2lkZShmcm9tOiBDb29yZCwgdG86IENvb3JkKTogYm9vbGVhblxuICAgIHtcbiAgICAgICAgaWYoZnJvbS5YIDw9IHRoaXMuWCAmJiBmcm9tLlkgPD0gdGhpcy5ZICYmIHRvLlggPj0gdGhpcy5YICYmIHRvLlkgPj0gdGhpcy5ZKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0d28gb2JqZWN0cyBhbGwgY29sbGlkZS5cbiAgICAgKiBAcGFyYW0gYSBBIGZyb20gcG9pbnRcbiAgICAgKiBAcGFyYW0gYXMgQSB0byBwb2ludFxuICAgICAqIEBwYXJhbSBiIEIgZnJvbSBwb2ludFxuICAgICAqIEBwYXJhbSBicyBCIHRvIHBvaW50XG4gICAgICovXG4gICAgc3RhdGljIENvbGxpZGUoYTogQ29vcmQsIGFzOiBDb29yZCwgYjogQ29vcmQsIGJzOiBDb29yZCk6IGJvb2xlYW5cbiAgICB7XG4gICAgICAgIHJldHVybiBhcy5YID4gYi5YICYmIGEuWCA8IGJzLlggJiYgYXMuWSA+IGIuWSAmJiBhLlkgPCBicy5ZO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGUgYSBmdW5jdGlvbiBvbiB0aGUgY29vcmRpbmF0ZXMuXG4gICAgICogQHBhcmFtIGYgRnVuY3Rpb24gdG8gZXhlY3V0ZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgRihmOiAobjogbnVtYmVyKSA9PiBudW1iZXIpOiBDb29yZFxuICAgIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb29yZChmKHRoaXMuWCksIGYodGhpcy5ZKSk7XG4gICAgfVxufSIsImltcG9ydCB7IENvb3JkIH0gZnJvbSBcIi4uLy4uL0Nvb3JkXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9CYXNlRWxlbWVudFwiO1xuaW1wb3J0IHsgSUV4cG9ydE9iamVjdCB9IGZyb20gXCIuLi8uLi9JRXhwb3J0T2JqZWN0XCI7XG5pbXBvcnQgeyBNb3ZlVHlwZSB9IGZyb20gXCIuLi9Nb3ZlVHlwZVwiO1xuaW1wb3J0IHsgTWFwIH0gZnJvbSBcIi4uLy4uL01hcFwiO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQmFzZUFjdG9yIGV4dGVuZHMgQmFzZUVsZW1lbnRcbntcbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3QgYSBuZXcgQmFzZUFjdG9yLiBBYnN0cmFjdCFcbiAgICAgKiBAcGFyYW0gcG9zaXRpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgY29uc3RydWN0b3IocG9zaXRpb246IENvb3JkID0gbnVsbCwgbWFwOiBNYXAgPSBudWxsKVxuICAgIHtcbiAgICAgICAgc3VwZXIocG9zaXRpb24sIG1hcCk7XG4gICAgICAgIHRoaXMuU2V0UG9zKHRoaXMucG9zaXRpb24pO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHBvc2l0aW9uIG9mIHRoZSBhY3Rvci5cbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0UG9zKCk6IENvb3JkXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3NpdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHBvc2l0aW9uIG9mIHRoZSBhY3Rvci5cbiAgICAgKiBAcGFyYW0gcG9zaXRpb24gXG4gICAgICovXG4gICAgcHJvdGVjdGVkIFNldFBvcyhuZXh0UG9zOiBDb29yZCA9IG51bGwsIHByZXZQb3M6IENvb3JkID0gbnVsbCk6IGJvb2xlYW5cbiAgICB7XG4gICAgICAgIGNvbnN0IGNlbGxzID0gdGhpcy5tYXAuR2V0Q2VsbHMoKTtcblxuICAgICAgICAvLyBHZXQgdGhlIGN1cnJlbnRseSBjb3ZlcmVkIGNlbGxzIGFuZCB0aGUgbmV4dCBvbmVzXG4gICAgICAgIGNvbnN0IHByZXYgPSBwcmV2UG9zIFxuICAgICAgICAgICAgPyBjZWxscy5HZXRCZXR3ZWVuKHByZXZQb3MsIHByZXZQb3MuQWRkKHRoaXMuR2V0U2l6ZSgpKSlcbiAgICAgICAgICAgIDogW107XG4gICAgICAgIFxuICAgICAgICBjb25zdCBuZXh0ID0gbmV4dFBvc1xuICAgICAgICAgICAgPyBjZWxscy5HZXRCZXR3ZWVuKG5leHRQb3MsIG5leHRQb3MuQWRkKHRoaXMuR2V0U2l6ZSgpKSlcbiAgICAgICAgICAgIDogW107XG5cbiAgICAgICAgLy8gSWYgcHJldlBvcy9uZXh0UG9zIHdhcyBnaXZlbiwgYnV0IG5vIGNlbGxzIGZvdW5kLCByZXR1cm5cbiAgICAgICAgaWYoKHByZXZQb3MgJiYgIXByZXYubGVuZ3RoKSB8fCAobmV4dFBvcyAmJiAhbmV4dC5sZW5ndGgpKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1vdmUgaW50ZXJzZWN0aW9uIFxuICAgICAgICBjb25zdCBwcmV2RmlsdGVyZWQgPSBwcmV2LmZpbHRlcihjID0+ICFuZXh0LmluY2x1ZGVzKGMpKTtcbiAgICAgICAgY29uc3QgbmV4dEZpbHRlcmVkID0gbmV4dC5maWx0ZXIoYyA9PiAhcHJldi5pbmNsdWRlcyhjKSk7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgb25lIG9mIHRoZSBjZWxscyBibG9ja3MgdGhlIG1vdmVtZW50LlxuICAgICAgICAvLyBJZiB5ZXMsIHJldmVydCBhbGwgbW92ZW1lbnQgYW5kIHJldHVybi5cbiAgICAgICAgaWYobmV4dEZpbHRlcmVkLnNvbWUoY2VsbCA9PiAhdGhpcy5IYW5kbGVNb3ZlKGNlbGwuTW92ZUhlcmUodGhpcykpKSlcbiAgICAgICAge1xuICAgICAgICAgICAgbmV4dEZpbHRlcmVkLmZvckVhY2goYyA9PiBjLk1vdmVBd2F5KHRoaXMpKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGl0IHdhcyBzdWNjZXNzZnVsLCBtb3ZlIGF3YXkgZnJvbSB0aGUgb2xkIGNlbGxzXG4gICAgICAgIHByZXZGaWx0ZXJlZC5mb3JFYWNoKGMgPT4gYy5Nb3ZlQXdheSh0aGlzKSk7XG5cbiAgICAgICAgLy8gVXBkYXRlIHBvc2l0aW9uXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXh0UG9zO1xuXG4gICAgICAgIC8vIFVwZGF0ZSBtYXBcbiAgICAgICAgdGhpcy5tYXAuT25VcGRhdGUuQ2FsbCh0aGlzKTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEaXNwb3NlIHRoZSBjZWxsLlxuICAgICAqL1xuICAgIHB1YmxpYyBEaXNwb3NlKCk6IHZvaWRcbiAgICB7XG4gICAgICAgIGlmKHRoaXMuZGlzcG9zZWQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgc3VwZXIuRGlzcG9zZSgpO1xuICAgICAgICB0aGlzLlNldFBvcygpO1xuXG4gICAgICAgIGlmKHRoaXMgaW5zdGFuY2VvZiBCYXNlQWN0b3IpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMubWFwLkdldEFjdG9ycygpLlJlbW92ZSh0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBhYnN0cmFjdCBIYW5kbGVNb3ZlKHR5cGU6IE1vdmVUeXBlKTogYm9vbGVhbjtcbiAgICBwdWJsaWMgYWJzdHJhY3QgR2V0U2l6ZSgpOiBDb29yZDtcbiAgICBwdWJsaWMgYWJzdHJhY3QgR2V0VGV4dHVyZSgpOiBzdHJpbmc7XG59IiwiaW1wb3J0IHsgQmFzZUFjdG9yIH0gZnJvbSBcIi4vQmFzZUFjdG9yXCI7XG5pbXBvcnQgeyBNb3ZlVHlwZSB9IGZyb20gXCIuLi9Nb3ZlVHlwZVwiO1xuaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi4vLi4vQ29vcmRcIjtcblxuZXhwb3J0IGNsYXNzIFBsYXllckFjdG9yIGV4dGVuZHMgQmFzZUFjdG9yXG57XG4gICAgcHJvdGVjdGVkIGhlYWx0aDogbnVtYmVyID0gMS4wO1xuICAgIHByb3RlY3RlZCBkYW1hZ2U6IG51bWJlciA9IDEuMDtcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdGV4dHVyZSBvZiB0aGUgYWN0b3IuXG4gICAgICovXG4gICAgcHVibGljIEdldFRleHR1cmUoKTogc3RyaW5nXG4gICAge1xuICAgICAgICByZXR1cm4gXCJyZXMvcGxheWVyLnBuZ1wiO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgc2l6ZSBvZiB0aGUgYWN0b3IuXG4gICAgICovXG4gICAgcHVibGljIEdldFNpemUoKTogQ29vcmRcbiAgICB7XG4gICAgICAgIHJldHVybiBuZXcgQ29vcmQoMC44LCAwLjgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1vdmUgYWN0b3IgaW4gYSBkaXJlY3Rpb24uXG4gICAgICogQHBhcmFtIGRpcmVjdGlvblxuICAgICAqL1xuICAgIHB1YmxpYyBNb3ZlKGRpcmVjdGlvbjogQ29vcmQpOiBib29sZWFuXG4gICAge1xuICAgICAgICBpZihkaXJlY3Rpb24uR2V0RGlzdGFuY2UobmV3IENvb3JkKDAsIDApKSA9PSAwKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIERvZXMgbm90IGFsbG93IDAgZGlzdGFuY2UgbW92ZW1lbnRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKE1hdGguYWJzKE1hdGguYWJzKGRpcmVjdGlvbi5YKSAtIE1hdGguYWJzKGRpcmVjdGlvbi5ZKSkgPT0gMClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBPbmx5IGFsbG93IGxlZnQsIHJpZ2h0LCB0b3AgYW5kIGJvdHRvbSBtb3ZlbWVudFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBHZXQgc2l6ZXNcbiAgICAgICAgY29uc3Qgc2l6ZSA9IHRoaXMuR2V0U2l6ZSgpO1xuICAgICAgICBjb25zdCBtYXBTaXplID0gdGhpcy5tYXAuR2V0U2l6ZSgpO1xuXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgbmV4dCBwb3NpdGlvblxuICAgICAgICBjb25zdCBwcmV2UG9zID0gdGhpcy5HZXRQb3MoKS5Sb3VuZCgzKTtcbiAgICAgICAgY29uc3QgbmV4dFBvcyA9IHByZXZQb3MuQWRkKGRpcmVjdGlvbikuUm91bmQoMyk7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgaXQgZ29lcyBvdXQgb2YgdGhlIG1hcFxuICAgICAgICBpZighbmV4dFBvcy5JbnNpZGUobmV3IENvb3JkKDAsIDApLCBtYXBTaXplKSB8fCBcbiAgICAgICAgICAgICFuZXh0UG9zLkFkZChzaXplKS5JbnNpZGUobmV3IENvb3JkKDAsIDApLCBtYXBTaXplKSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuU2V0UG9zKG5leHRQb3MsIHByZXZQb3MpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhhbmRsZSBtb3ZlbWVudCB0eXBlcy5cbiAgICAgKiBAcGFyYW0gdHlwZSBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgSGFuZGxlTW92ZSh0eXBlOiBNb3ZlVHlwZSk6IGJvb2xlYW5cbiAgICB7XG4gICAgICAgIHN3aXRjaCh0eXBlKVxuICAgICAgICB7XG4gICAgICAgICAgICBjYXNlIE1vdmVUeXBlLkJsb2NrZWQ6IC8vIERvIG5vdGhpbmdcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBjYXNlIE1vdmVUeXBlLktpbGxlZDogLy8gS2lsbCBpdFxuICAgICAgICAgICAgICAgIHRoaXMuS2lsbCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGNhc2UgTW92ZVR5cGUuU3VjY2Vzc2VkOiAvLyBNb3ZlIGF3YXlcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEF0dGFjayBhbiBvdGhlciBhY3RvciBpZiBpdCBpcyBvbmUgY2VsbCBhd2F5LlxuICAgICAqIEBwYXJhbSBhY3RvciBcbiAgICAgKi9cbiAgICBwdWJsaWMgQXR0YWNrKGFjdG9yOiBQbGF5ZXJBY3Rvcik6IGJvb2xlYW5cbiAgICB7XG4gICAgICAgIGlmKHRoaXMucG9zaXRpb24uR2V0RGlzdGFuY2UoYWN0b3IuR2V0UG9zKCkpID4gMSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgYWN0b3IuRGFtYWdlKHRoaXMuZGFtYWdlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEbyBkYW1hZ2UgdG8gdGhpcyBhY3Rvci5cbiAgICAgKiBAcGFyYW0gZGFtYWdlIEFtb3VudCBvZiB0aGUgZGFtYWdlLlxuICAgICAqL1xuICAgIHB1YmxpYyBEYW1hZ2UoZGFtYWdlOiBudW1iZXIpOiB2b2lkXG4gICAge1xuICAgICAgICB0aGlzLmhlYWx0aCAtPSBkYW1hZ2U7XG5cbiAgICAgICAgaWYodGhpcy5oZWFsdGggPD0gMClcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5LaWxsKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm1hcC5PblVwZGF0ZS5DYWxsKHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEtpbGwgdGhlIGFjdG9yLlxuICAgICAqL1xuICAgIHByaXZhdGUgS2lsbCgpOiB2b2lkXG4gICAge1xuICAgICAgICB0aGlzLmhlYWx0aCA9IDA7XG4gICAgICAgIFxuICAgICAgICAvLyBEaXNwb3NlXG4gICAgICAgIHRoaXMuRGlzcG9zZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHRoZSBhY3RvciBpcyBhbGl2ZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgSXNBbGl2ZSgpOiBib29sZWFuXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5oZWFsdGggPiAwO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuLi9Db29yZFwiO1xuaW1wb3J0IHsgSGVscGVyIH0gZnJvbSBcIi4uL1V0aWwvSGVscGVyXCI7XG5pbXBvcnQgeyBNYXAgfSBmcm9tIFwiLi4vTWFwXCI7XG5pbXBvcnQgeyBFeHBvcnRhYmxlIH0gZnJvbSBcIi4uL0V4cG9ydGFibGVcIjtcbmltcG9ydCB7IElFeHBvcnRPYmplY3QgfSBmcm9tIFwiLi4vSUV4cG9ydE9iamVjdFwiO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQmFzZUVsZW1lbnQgZXh0ZW5kcyBFeHBvcnRhYmxlXG57XG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IG1hcDogTWFwO1xuXG4gICAgcHJvdGVjdGVkIGRpc3Bvc2VkOiBib29sZWFuO1xuICAgIHByb3RlY3RlZCBwb3NpdGlvbjogQ29vcmQ7XG4gICAgcHJvdGVjdGVkIHRhZzogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3Igb2YgdGhlIEJhc2VFbGVtZW50LiBBYnN0cmFjdCFcbiAgICAgKiBAcGFyYW0gcG9zaXRpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgY29uc3RydWN0b3IocG9zaXRpb246IENvb3JkID0gbnVsbCwgbWFwOiBNYXAgPSBudWxsKVxuICAgIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb24gfHwgbmV3IENvb3JkO1xuICAgICAgICB0aGlzLm1hcCA9IG1hcCB8fCBNYXAuR2V0SW5zdGFuY2UoKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZGlzcG9zZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50YWcgPSBIZWxwZXIuVW5pcXVlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB0YWcgb2YgdGhlIGVsZW1lbnQuXG4gICAgICovXG4gICAgcHVibGljIEdldFRhZygpOiBzdHJpbmdcbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLnRhZztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPdmVycmlkZSBpbXBvcnQgYWxsIHRvIGhhbmRsZSByZW1vdmFsIGZyb20gdGhlIG1hcC5cbiAgICAgKiBAcGFyYW0gaW5wdXRcbiAgICAgKi9cbiAgICBwdWJsaWMgSW1wb3J0QWxsKGlucHV0OiBJRXhwb3J0T2JqZWN0W10pOiB2b2lkXG4gICAge1xuICAgICAgICBzdXBlci5JbXBvcnRBbGwoaW5wdXQpO1xuXG4gICAgICAgIGlmKHRoaXMuZGlzcG9zZWQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIC8vIEluIEJhc2VFbGVtZW50IHRoaXMgbWFrZXMgbm8gc2Vuc2UsXG4gICAgICAgICAgICAvLyBidXQgaW4gaXRzIGNoaWxkcyB0aGUgZWxlbWVudCBuZWVkc1xuICAgICAgICAgICAgLy8gdG8gYmUgcmVtb3ZlZCBmcm9tIHRoZSBtYXBcbiAgICAgICAgICAgIHRoaXMuRGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGVsZW1lbnQgaXMgZGlzcG9zZWQuXG4gICAgICovXG4gICAgcHVibGljIElzRGlzcG9zZWQoKTogYm9vbGVhblxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzcG9zZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGlzcG9zZSB0aGUgZWxlbWVudC5cbiAgICAgKi9cbiAgICBwdWJsaWMgRGlzcG9zZSgpOiB2b2lkXG4gICAge1xuICAgICAgICB0aGlzLmRpc3Bvc2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgXG4gICAgcHVibGljIGFic3RyYWN0IEdldFNpemUoKTogQ29vcmQ7XG4gICAgcHVibGljIGFic3RyYWN0IEdldFRleHR1cmUoKTogc3RyaW5nO1xuICAgIHB1YmxpYyBhYnN0cmFjdCBHZXRQb3MoKTogQ29vcmQ7XG59IiwiaW1wb3J0IHsgQmFzZUFjdG9yIH0gZnJvbSBcIi4uL0FjdG9yL0Jhc2VBY3RvclwiO1xuaW1wb3J0IHsgTW92ZVR5cGUgfSBmcm9tIFwiLi4vTW92ZVR5cGVcIjtcbmltcG9ydCB7IENvb3JkIH0gZnJvbSBcIi4uLy4uL0Nvb3JkXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9CYXNlRWxlbWVudFwiO1xuaW1wb3J0IHsgTWFwIH0gZnJvbSBcIi4uLy4uL01hcFwiO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQmFzZUNlbGwgZXh0ZW5kcyBCYXNlRWxlbWVudFxue1xuICAgIHByb3RlY3RlZCBhY3RvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3QgYSBCYXNlQ2VsbC4gQWJzdHJhY3QhXG4gICAgICogQHBhcmFtIHBvc2l0aW9uXG4gICAgICovXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHBvc2l0aW9uOiBDb29yZCA9IG51bGwsIG1hcDogTWFwID0gbnVsbClcbiAgICB7XG4gICAgICAgIHN1cGVyKHBvc2l0aW9uLCBtYXApO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHBvc2l0aW9uIG9mIHRoZSBjZWxsLlxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRQb3MoKTogQ29vcmQgXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3NpdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbnRlciBpbnRvIHRoZSBjZWxsIHdpdGggYW4gYWN0b3IuXG4gICAgICogQHBhcmFtIGFjdG9yIFxuICAgICAqL1xuICAgIHB1YmxpYyBNb3ZlSGVyZShhY3RvcjogQmFzZUFjdG9yKTogTW92ZVR5cGUgXG4gICAge1xuICAgICAgICBjb25zdCB0YWcgPSBhY3Rvci5HZXRUYWcoKTtcblxuICAgICAgICBpZighdGhpcy5hY3RvcnMuaW5jbHVkZXModGFnKSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5hY3RvcnMucHVzaCh0YWcpO1xuICAgICAgICAgICAgdGhpcy5tYXAuT25VcGRhdGUuQ2FsbCh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBNb3ZlVHlwZS5TdWNjZXNzZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTGVhdmUgY2VsbCB0aGUgY2VsbCB3aXRoIGFuIGFjdG9yLlxuICAgICAqIEBwYXJhbSBhY3RvciBcbiAgICAgKi9cbiAgICBwdWJsaWMgTW92ZUF3YXkoYWN0b3I6IEJhc2VBY3Rvcik6IHZvaWQgXG4gICAge1xuICAgICAgICBjb25zdCB0YWcgPSBhY3Rvci5HZXRUYWcoKTtcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmFjdG9ycy5pbmRleE9mKHRhZyk7XG5cbiAgICAgICAgaWYoaW5kZXggPj0gMCkgXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuYWN0b3JzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB0aGlzLm1hcC5PblVwZGF0ZS5DYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGlzcG9zZSB0aGUgY2VsbC5cbiAgICAgKi9cbiAgICBwdWJsaWMgRGlzcG9zZSgpOiB2b2lkXG4gICAge1xuICAgICAgICBpZih0aGlzLmRpc3Bvc2VkKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzdXBlci5EaXNwb3NlKCk7XG5cbiAgICAgICAgaWYodGhpcyBpbnN0YW5jZW9mIEJhc2VDZWxsKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLm1hcC5HZXRDZWxscygpLlJlbW92ZSh0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBwdWJsaWMgYWJzdHJhY3QgR2V0U2l6ZSgpOiBDb29yZDtcbiAgICBwdWJsaWMgYWJzdHJhY3QgR2V0VGV4dHVyZSgpOiBzdHJpbmc7XG59IiwiaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi4vLi4vQ29vcmRcIjtcbmltcG9ydCB7IEJhc2VDZWxsIH0gZnJvbSBcIi4vQmFzZUNlbGxcIjtcblxuZXhwb3J0IGNsYXNzIEdyb3VuZENlbGwgZXh0ZW5kcyBCYXNlQ2VsbFxue1xuICAgIC8qKlxuICAgICAqIEdldCB0aGUgc2l6ZSBvZiB0aGUgY2VsbC5cbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0U2l6ZSgpOiBDb29yZFxuICAgIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb29yZCgxLjAsIDEuMCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB0ZXh0dXJlIG9mIHRoZSBjZWxsLlxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRUZXh0dXJlKCk6IHN0cmluZ1xuICAgIHtcbiAgICAgICAgcmV0dXJuIFwicmVzL2dyb3VuZC5wbmdcIjtcbiAgICB9XG59IiwiaW1wb3J0IHsgQmFzZUFjdG9yIH0gZnJvbSBcIi4uL0FjdG9yL0Jhc2VBY3RvclwiO1xuaW1wb3J0IHsgTW92ZVR5cGUgfSBmcm9tIFwiLi4vTW92ZVR5cGVcIjtcbmltcG9ydCB7IENvb3JkIH0gZnJvbSBcIi4uLy4uL0Nvb3JkXCI7XG5pbXBvcnQgeyBCYXNlQ2VsbCB9IGZyb20gXCIuL0Jhc2VDZWxsXCI7XG5cbmV4cG9ydCBjbGFzcyBTdG9uZUNlbGwgZXh0ZW5kcyBCYXNlQ2VsbFxue1xuICAgIC8qKlxuICAgICAqIEdldCB0aGUgc2l6ZSBvZiB0aGUgY2VsbC5cbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0U2l6ZSgpOiBDb29yZFxuICAgIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb29yZCgxLjAsIDEuMCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB0ZXh0dXJlIG9mIHRoZSBjZWxsLlxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRUZXh0dXJlKCk6IHN0cmluZ1xuICAgIHtcbiAgICAgICAgcmV0dXJuIFwicmVzL3N0b25lLnBuZ1wiO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVudGVyIGEgY2VsbCB3aXRoIGEgYWN0b3IgYW5kIGJsb2NrIGl0LlxuICAgICAqIEBwYXJhbSBhY3RvciBcbiAgICAgKi9cbiAgICBwdWJsaWMgTW92ZUhlcmUoYWN0b3I6IEJhc2VBY3Rvcik6IE1vdmVUeXBlIFxuICAgIHtcbiAgICAgICAgcmV0dXJuIE1vdmVUeXBlLkJsb2NrZWQ7XG4gICAgfVxufSIsImltcG9ydCB7IEdyb3VuZENlbGwgfSBmcm9tIFwiLi9Hcm91bmRDZWxsXCJcbmltcG9ydCB7IEJhc2VBY3RvciB9IGZyb20gXCIuLi9BY3Rvci9CYXNlQWN0b3JcIjtcbmltcG9ydCB7IE1vdmVUeXBlIH0gZnJvbSBcIi4uL01vdmVUeXBlXCI7XG5pbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuLi8uLi9Db29yZFwiO1xuaW1wb3J0IHsgQmFzZUNlbGwgfSBmcm9tIFwiLi9CYXNlQ2VsbFwiO1xuXG5leHBvcnQgY2xhc3MgV2F0ZXJDZWxsIGV4dGVuZHMgQmFzZUNlbGxcbntcbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHNpemUgb2YgdGhlIGNlbGwuXG4gICAgICovXG4gICAgcHVibGljIEdldFNpemUoKTogQ29vcmRcbiAgICB7XG4gICAgICAgIHJldHVybiBuZXcgQ29vcmQoMi4wLCAxLjApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdGV4dHVyZSBvZiB0aGUgY2VsbC5cbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0VGV4dHVyZSgpOiBzdHJpbmdcbiAgICB7XG4gICAgICAgIHJldHVybiBcInJlcy93YXRlci5wbmdcIjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbnRlciBhIGNlbGwgd2l0aCBhIGFjdG9yIGFuZCBraWxsIGl0LlxuICAgICAqIEBwYXJhbSBhY3RvciBcbiAgICAgKi9cbiAgICBwdWJsaWMgTW92ZUhlcmUoYWN0b3I6IEJhc2VBY3Rvcik6IE1vdmVUeXBlIFxuICAgIHtcbiAgICAgICAgcmV0dXJuIE1vdmVUeXBlLktpbGxlZDtcbiAgICB9XG59IiwiZXhwb3J0IGVudW0gTW92ZVR5cGVcbntcbiAgICBTdWNjZXNzZWQsXG4gICAgQmxvY2tlZCxcbiAgICBLaWxsZWRcbn0iLCJpbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuL0Nvb3JkXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL0VsZW1lbnQvQmFzZUVsZW1lbnRcIjtcbmltcG9ydCB7IElSZWFkT25seUVsZW1lbnRMaXN0IH0gZnJvbSBcIi4vSVJlYWRPbmx5RWxlbWVudExpc3RcIjtcbmltcG9ydCB7IEhlbHBlciB9IGZyb20gXCIuL1V0aWwvSGVscGVyXCI7XG5pbXBvcnQgeyBFdmVudCB9IGZyb20gXCIuL1V0aWwvRXZlbnRcIjtcblxuZXhwb3J0IGNsYXNzIEVsZW1lbnRMaXN0PEVsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudD4gaW1wbGVtZW50cyBJUmVhZE9ubHlFbGVtZW50TGlzdDxFbGVtZW50Plxue1xuICAgIHByaXZhdGUgZWxlbWVudHM6IEVsZW1lbnRbXTtcbiAgICBwcml2YXRlIG9uVXBkYXRlOiBFdmVudDxFbGVtZW50PjtcblxuICAgIC8qKlxuICAgICAqIENvbnRzdHJ1Y3QgYSBuZXcgRWxlbWVudExpc3Qgd2hpY2ggd3JhcHMgYW4gZWxlbWVudCBhcnJheVxuICAgICAqIGFuZCBhZGRzIHNvbWUgYXdlc29tZSBmdW5jdGlvbnMuXG4gICAgICogQHBhcmFtIGVsZW1lbnRzIEFycmF5IHRvIHdyYXAuXG4gICAgICogQHBhcmFtIG9uVXBkYXRlIENhbGxlZCB3aGVuIHRoZXJlIGlzIGFuIHVwZGF0ZSAocmVtb3ZlLCBzZXQpLlxuICAgICAqL1xuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihlbGVtZW50czogRWxlbWVudFtdLCBvblVwZGF0ZTogRXZlbnQ8RWxlbWVudD4pXG4gICAge1xuICAgICAgICB0aGlzLmVsZW1lbnRzID0gZWxlbWVudHM7XG4gICAgICAgIHRoaXMub25VcGRhdGUgPSBvblVwZGF0ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGxlbmd0aCBvZiB0aGUgaW50ZXJuYWwgYXJyYXkuXG4gICAgICovXG4gICAgcHVibGljIEdldExlbmd0aCgpOiBudW1iZXJcbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRzLmxlbmd0aDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHbyBvdmVyIHRoZSBlbGVtZW50cyBvZiB0aGUgYXJyYXkuXG4gICAgICogQHBhcmFtIGNhbGxiYWNrIFxuICAgICAqL1xuICAgIHB1YmxpYyBGb3JFYWNoKGNhbGxiYWNrOiAoRWxlbWVudCkgPT4gYm9vbGVhbiB8IHZvaWQpXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50cy5zb21lKDxhbnk+Y2FsbGJhY2spO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBlbGVtZW50IGJ5IHRhZy5cbiAgICAgKiBAcGFyYW0gdGFnIFxuICAgICAqL1xuICAgIHB1YmxpYyBUYWcodGFnOiBzdHJpbmcpOiBFbGVtZW50XG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50cy5maW5kKGUgPT4gZSAmJiBlLkdldFRhZygpID09IHRhZyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGEgZWxlbWVudChzKSBieSBjb29yZC5cbiAgICAgKiBAcGFyYW0gY29vcmQgXG4gICAgICovIFxuICAgIHB1YmxpYyBHZXQoY29vcmQ6IENvb3JkKTogRWxlbWVudFtdXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50cy5maWx0ZXIoZSA9PiBlICYmIGUuR2V0UG9zKCkuSXMoPENvb3JkPmNvb3JkKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBuZWFyZXN0IGNlbGwgdG8gdGhlIGdpdmVuIGNvb3JkLlxuICAgICAqIEBwYXJhbSBjb29yZCBcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0TmVhcihjb29yZDogQ29vcmQpOiBFbGVtZW50XG4gICAge1xuICAgICAgICBsZXQgcmVzdWx0OiBFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgbGV0IG1pbiA9IEluZmluaXR5O1xuXG4gICAgICAgIHRoaXMuZWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IFxuICAgICAgICB7XG4gICAgICAgICAgICBpZighZWxlbWVudClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHNpemUgPSBlbGVtZW50LkdldFNpemUoKTtcbiAgICAgICAgICAgIGNvbnN0IGNlbnRlciA9IGVsZW1lbnQuR2V0UG9zKCkuQWRkKHNpemUuRihuID0+IG4gLyAyKSk7XG4gICAgICAgICAgICBjb25zdCBkaXN0YW5jZSA9IGNlbnRlci5HZXREaXN0YW5jZShjb29yZCk7XG5cbiAgICAgICAgICAgIGlmKGRpc3RhbmNlIDwgbWluKSBcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtaW4gPSBkaXN0YW5jZTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBlbGVtZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBjZWxscyBiZXR3ZWVuIHR3byBjb29yZGluYXRlcy5cbiAgICAgKiBAcGFyYW0gZnJvbVxuICAgICAqIEBwYXJhbSB0byBcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0QmV0d2Vlbihmcm9tOiBDb29yZCwgdG86IENvb3JkKTogRWxlbWVudFtdXG4gICAge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBbXTtcblxuICAgICAgICBmcm9tID0gZnJvbS5GbG9vcigpO1xuICAgICAgICB0byA9IHRvLkNlaWwoKTtcblxuICAgICAgICB0aGlzLmVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiBcbiAgICAgICAge1xuICAgICAgICAgICAgaWYoIWVsZW1lbnQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjZWxsRnJvbSA9IGVsZW1lbnQuR2V0UG9zKCk7XG4gICAgICAgICAgICBjb25zdCBjZWxsVG8gPSBlbGVtZW50LkdldFBvcygpLkFkZChlbGVtZW50LkdldFNpemUoKSk7XG5cbiAgICAgICAgICAgIGlmKENvb3JkLkNvbGxpZGUoZnJvbSwgdG8sIGNlbGxGcm9tLCBjZWxsVG8pKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIG5ldyBlbGVtZW50IG9yIG92ZXJ3cml0ZSBhbiBleGlzdGluZyBvbmUgKGJ5IHRhZykuXG4gICAgICogQHBhcmFtIGVsZW1lbnQgXG4gICAgICovXG4gICAgcHVibGljIFNldChlbGVtZW50OiBFbGVtZW50KTogdm9pZFxuICAgIHtcbiAgICAgICAgY29uc3Qgb2xkID0gdGhpcy5UYWcoZWxlbWVudC5HZXRUYWcoKSk7XG5cbiAgICAgICAgaWYob2xkKVxuICAgICAgICB7XG4gICAgICAgICAgICBIZWxwZXIuRXh0cmFjdChvbGQsIGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vblVwZGF0ZS5DYWxsKGVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhbiBlbGVtZW50IGZyb20gdGhlIG1hcCAoYSBjZWxsIG9yIGFuIGFjdG9yKS5cbiAgICAgKiBAcGFyYW0gZWxlbWVudCBcbiAgICAgKi9cbiAgICBwdWJsaWMgUmVtb3ZlKGVsZW1lbnQ6IEVsZW1lbnQpOiBib29sZWFuXG4gICAge1xuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZWxlbWVudHMuaW5kZXhPZihlbGVtZW50KTtcblxuICAgICAgICBpZihpbmRleCA+PSAwKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnRzLnNwbGljZShpbmRleCwgMSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuRGlzcG9zZSgpO1xuICAgICAgICAgICAgdGhpcy5vblVwZGF0ZS5DYWxsKGVsZW1lbnQpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGludGVybmFsIGFycmF5LlxuICAgICAqL1xuICAgIHB1YmxpYyBMaXN0KCk6IEVsZW1lbnRbXVxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudHM7XG4gICAgfVxufSIsImltcG9ydCB7IElFeHBvcnRPYmplY3QgfSBmcm9tIFwiLi9JRXhwb3J0T2JqZWN0XCI7XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBFeHBvcnRhYmxlXG57XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGFuIGluc3RhbmNlIG9mIGEgY2xhc3MgYnkgbmFtZS5cbiAgICAgKiBAcGFyYW0gY2xhc3NOYW1lIFxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgRnJvbU5hbWU8VCBleHRlbmRzIEV4cG9ydGFibGU+KG5hbWU6IHN0cmluZywgLi4uYXJnczogYW55W10pOiBUXG4gICAge1xuICAgICAgICBjb25zdCBmaW5kID0gKG5hbWUpOiBhbnkgPT5cbiAgICAgICAge1xuICAgICAgICAgICAgc3dpdGNoKG5hbWUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkNvb3JkXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXF1aXJlKFwiLi9Db29yZFwiKS5Db29yZDtcbiAgICAgICAgICAgICAgICBjYXNlIFwiR3JvdW5kQ2VsbFwiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWlyZShcIi4vRWxlbWVudC9DZWxsL0dyb3VuZENlbGxcIikuR3JvdW5kQ2VsbDtcbiAgICAgICAgICAgICAgICBjYXNlIFwiU3RvbmVDZWxsXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXF1aXJlKFwiLi9FbGVtZW50L0NlbGwvU3RvbmVDZWxsXCIpLlN0b25lQ2VsbDtcbiAgICAgICAgICAgICAgICBjYXNlIFwiV2F0ZXJDZWxsXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXF1aXJlKFwiLi9FbGVtZW50L0NlbGwvV2F0ZXJDZWxsXCIpLldhdGVyQ2VsbDtcbiAgICAgICAgICAgICAgICBjYXNlIFwiUGxheWVyQWN0b3JcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVpcmUoXCIuL0VsZW1lbnQvQWN0b3IvUGxheWVyQWN0b3JcIikuUGxheWVyQWN0b3I7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgY2xhc3NPYmogPSBmaW5kKG5hbWUpO1xuXG4gICAgICAgIHJldHVybiBjbGFzc09iaiAmJiBuZXcgY2xhc3NPYmooLi4uYXJncyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXhwb3J0IGEgcHJvcGVydHkuXG4gICAgICogQHBhcmFtIG5hbWVcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgRXhwb3J0UHJvcGVydHkobmFtZTogc3RyaW5nKTogSUV4cG9ydE9iamVjdFxuICAgIHtcbiAgICAgICAgcmV0dXJuIEV4cG9ydGFibGUuRXhwb3J0KHRoaXNbbmFtZV0sIG5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4cG9ydCBhbGwgcHJvcGVydGllcy5cbiAgICAgKi9cbiAgICBwdWJsaWMgRXhwb3J0QWxsKCk6IElFeHBvcnRPYmplY3RbXVxuICAgIHtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBJRXhwb3J0T2JqZWN0W10gPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBwcm9wZXJ0eSBpbiB0aGlzKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBleHBvcnRlZCA9IHRoaXMuRXhwb3J0UHJvcGVydHkocHJvcGVydHkpO1xuXG4gICAgICAgICAgICBpZihleHBvcnRlZClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChleHBvcnRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4cG9ydCBhIHdob2xlIG9iamVjdCAtIGluY2x1ZGluZyBpdHNlbGYuXG4gICAgICogQHBhcmFtIG9iamVjdCBcbiAgICAgKiBAcGFyYW0gbmFtZSBcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIEV4cG9ydChvYmplY3Q6IGFueSwgbmFtZTogc3RyaW5nID0gbnVsbCk6IElFeHBvcnRPYmplY3RcbiAgICB7XG4gICAgICAgIC8vIEV4cG9ydCBlYWNoIGVsZW1lbnQgb2YgYW4gYXJyYXlcbiAgICAgICAgaWYob2JqZWN0IGluc3RhbmNlb2YgQXJyYXkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgTmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgICBDbGFzczogb2JqZWN0LmNvbnN0cnVjdG9yLm5hbWUsXG4gICAgICAgICAgICAgICAgUGF5bG9hZDogb2JqZWN0Lm1hcCgoZSwgaSkgPT4gRXhwb3J0YWJsZS5FeHBvcnQoZSwgaS50b1N0cmluZygpKSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFeHBvcnQgZXhwb3J0YWJsZVxuICAgICAgICBpZihvYmplY3QgaW5zdGFuY2VvZiBFeHBvcnRhYmxlKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIE5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgQ2xhc3M6IG9iamVjdC5jb25zdHJ1Y3Rvci5uYW1lLFxuICAgICAgICAgICAgICAgIFBheWxvYWQ6IG9iamVjdC5FeHBvcnRBbGwoKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEV4cG9ydCBuYXRpdmUgdHlwZXMgKHN0cmluZywgbnVtYmVyIG9yIGJvb2xlYW4pXG4gICAgICAgIGlmKFtcInN0cmluZ1wiLCBcIm51bWJlclwiLCBcImJvb2xlYW5cIl0uaW5jbHVkZXModHlwZW9mIG9iamVjdCkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgTmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgICBDbGFzczogdHlwZW9mIG9iamVjdCxcbiAgICAgICAgICAgICAgICBQYXlsb2FkOiBvYmplY3RcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbXBvcnQgYSBwcm9wZXJ0eS5cbiAgICAgKiBAcGFyYW0gaW5wdXQgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIEltcG9ydFByb3BlcnR5KGlucHV0OiBJRXhwb3J0T2JqZWN0KTogYW55XG4gICAge1xuICAgICAgICByZXR1cm4gRXhwb3J0YWJsZS5JbXBvcnQoaW5wdXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEltcG9ydCBhbGwgcHJvcGVydGllcy5cbiAgICAgKiBAcGFyYW0gaW5wdXQgXG4gICAgICovXG4gICAgcHVibGljIEltcG9ydEFsbChpbnB1dDogSUV4cG9ydE9iamVjdFtdKTogdm9pZFxuICAgIHtcbiAgICAgICAgaW5wdXQgaW5zdGFuY2VvZiBBcnJheSAmJiBpbnB1dC5mb3JFYWNoKGVsZW1lbnQgPT5cbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgaW1wb3J0ZWQgPSB0aGlzLkltcG9ydFByb3BlcnR5KGVsZW1lbnQpO1xuXG4gICAgICAgICAgICBpZihpbXBvcnRlZClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzW2VsZW1lbnQuTmFtZV0gPSBpbXBvcnRlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgd2hvbGUgb2JqZWN0LlxuICAgICAqIEBwYXJhbSBpbnB1dCBcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIEltcG9ydChpbnB1dDogSUV4cG9ydE9iamVjdCk6IGFueVxuICAgIHtcbiAgICAgICAgLy8gSW1wb3J0IGFycmF5XG4gICAgICAgIGlmKGlucHV0LkNsYXNzID09IFwiQXJyYXlcIilcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0LlBheWxvYWQubWFwKGUgPT4gRXhwb3J0YWJsZS5JbXBvcnQoZSkpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBJbXBvcnQgbmF0aXZlIHR5cGVzXG4gICAgICAgIGlmKFtcInN0cmluZ1wiLCBcIm51bWJlclwiLCBcImJvb2xlYW5cIl0uaW5jbHVkZXMoaW5wdXQuQ2xhc3MpKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQuUGF5bG9hZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEltcG9ydCBFeHBvcnRhYmxlIHR5cGVzXG4gICAgICAgIGNvbnN0IGluc3RhbmNlID0gRXhwb3J0YWJsZS5Gcm9tTmFtZShpbnB1dC5DbGFzcywgLi4uKGlucHV0LkFyZ3MgfHwgW10pKTtcblxuICAgICAgICBpbnN0YW5jZSAmJiBpbnN0YW5jZS5JbXBvcnRBbGwoaW5wdXQuUGF5bG9hZCk7XG5cbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuL0Nvb3JkXCI7XG5pbXBvcnQgeyBCYXNlQWN0b3IgfSBmcm9tIFwiLi9FbGVtZW50L0FjdG9yL0Jhc2VBY3RvclwiO1xuaW1wb3J0IHsgSGVscGVyIH0gZnJvbSBcIi4vVXRpbC9IZWxwZXJcIjtcbmltcG9ydCB7IEJhc2VDZWxsIH0gZnJvbSBcIi4vRWxlbWVudC9DZWxsL0Jhc2VDZWxsXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL0VsZW1lbnQvQmFzZUVsZW1lbnRcIjtcbmltcG9ydCB7IElSYXdNYXAgfSBmcm9tIFwiLi9JUmF3TWFwXCI7XG5pbXBvcnQgeyBFbGVtZW50TGlzdCB9IGZyb20gXCIuL0VsZW1lbnRMaXN0XCI7XG5pbXBvcnQgeyBJUmVhZE9ubHlFbGVtZW50TGlzdCB9IGZyb20gXCIuL0lSZWFkT25seUVsZW1lbnRMaXN0XCI7XG5pbXBvcnQgeyBFeHBvcnRhYmxlIH0gZnJvbSBcIi4vRXhwb3J0YWJsZVwiO1xuaW1wb3J0IHsgRXZlbnQgfSBmcm9tIFwiLi9VdGlsL0V2ZW50XCI7XG5cbmV4cG9ydCBjbGFzcyBNYXBcbntcbiAgICBwcml2YXRlIGNlbGxzOiBBcnJheTxCYXNlQ2VsbD4gPSBbXTtcbiAgICBwcml2YXRlIGFjdG9yczogQXJyYXk8QmFzZUFjdG9yPiA9IFtdO1xuICAgIHByaXZhdGUgc2l6ZTogQ29vcmQgPSBuZXcgQ29vcmQoKTtcblxuICAgIC8qKlxuICAgICAqIFNpbmdsZXRvbiBpbnN0YW5jZSBvZiB0aGUgY2xhc3MuXG4gICAgICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6IE1hcDtcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgc2luZ2xldG9uIGluc3RhbmNlLlxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgR2V0SW5zdGFuY2UoKTogTWFwXG4gICAge1xuICAgICAgICBpZihNYXAuaW5zdGFuY2UgPT0gdW5kZWZpbmVkKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gTWFwLmluc3RhbmNlID0gbmV3IE1hcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIE1hcC5pbnN0YW5jZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHNpemUgb2YgdGhlIG1hcC5cbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0U2l6ZSgpOiBDb29yZFxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0IGEgbWFwIHdpdGggbnVsbCBjZWxscy5cbiAgICAgKiBAcGFyYW0gc2l6ZVxuICAgICAqL1xuICAgIHB1YmxpYyBJbml0KHNpemU6IENvb3JkKTogdm9pZFxuICAgIHtcbiAgICAgICAgdGhpcy5zaXplID0gc2l6ZS5DbG9uZSgpO1xuICAgICAgICB0aGlzLmNlbGxzID0gW107XG4gICAgICAgIHRoaXMuYWN0b3JzID0gW107XG5cbiAgICAgICAgdGhpcy5jZWxscy5mb3JFYWNoKGNlbGwgPT4gdGhpcy5PblVwZGF0ZS5DYWxsKGNlbGwpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkIGEgbWFwIGZyb20gYW4gZXh0ZXJuYWwgZmlsZS5cbiAgICAgKiBAcGFyYW0gdXJsIFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBMb2FkKHVybDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPlxuICAgIHtcbiAgICAgICAgbGV0IHJhdzogSVJhd01hcDtcblxuICAgICAgICB0cnkgXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJhdyA9IEpTT04ucGFyc2UoYXdhaXQgSGVscGVyLkdldCh1cmwpKSB8fCB7fTtcblxuICAgICAgICAgICAgaWYoIXJhdy5TaXplwqB8fCAhcmF3LkNlbGxzIHx8ICFyYXcuQWN0b3JzKSBcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2goZSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zaXplID0gbmV3IENvb3JkKHJhdy5TaXplLlgsIHJhdy5TaXplLlkpO1xuICAgICAgICB0aGlzLmNlbGxzID0gW107XG4gICAgICAgIHRoaXMuYWN0b3JzID0gW107XG5cbiAgICAgICAgLy8gUGFyc2VyXG4gICAgICAgIGNvbnN0IHBhcnNlID0gPEVsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudD4oZGF0YSwgb3V0KSA9PlxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZGF0YS5DbGFzcztcbiAgICAgICAgICAgIGNvbnN0IGNvb3JkID0gbmV3IENvb3JkKGRhdGEuWCwgZGF0YS5ZKTtcbiAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBFeHBvcnRhYmxlLkZyb21OYW1lPEVsZW1lbnQ+KG5hbWUsIGNvb3JkLCB0aGlzKTtcblxuICAgICAgICAgICAgb3V0LnB1c2goY2VsbCk7XG5cbiAgICAgICAgICAgIHRoaXMuT25VcGRhdGUuQ2FsbChjZWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBhcnNlIGNlbGxzIGFuZCBhY3RvcnNcbiAgICAgICAgcmF3LkNlbGxzLmZvckVhY2goZGF0YSA9PiBwYXJzZTxCYXNlQ2VsbD4oZGF0YSwgdGhpcy5jZWxscykpO1xuICAgICAgICByYXcuQWN0b3JzLmZvckVhY2goZGF0YSA9PiBwYXJzZTxCYXNlQWN0b3I+KGRhdGEsIHRoaXMuYWN0b3JzKSk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGFsbCBlbGVtZW50cyBvZiB0aGUgbWFwLlxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRFbGVtZW50cygpOiBJUmVhZE9ubHlFbGVtZW50TGlzdDxCYXNlRWxlbWVudD5cbiAgICB7XG4gICAgICAgIGNvbnN0IGFsbCA9ICg8QmFzZUVsZW1lbnRbXT50aGlzLmNlbGxzKS5jb25jYXQoPEJhc2VFbGVtZW50W10+dGhpcy5hY3RvcnMpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIG5ldyBFbGVtZW50TGlzdDxCYXNlRWxlbWVudD4oYWxsLCB0aGlzLk9uVXBkYXRlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGNlbGxzIG9mIHRoZSBtYXAuXG4gICAgICovXG4gICAgcHVibGljIEdldENlbGxzKCk6IEVsZW1lbnRMaXN0PEJhc2VDZWxsPlxuICAgIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFbGVtZW50TGlzdCh0aGlzLmNlbGxzLCA8RXZlbnQ8QmFzZUNlbGw+PnRoaXMuT25VcGRhdGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgYWN0b3JzIG9mIHRoZSBtYXAuXG4gICAgICovXG4gICAgcHVibGljIEdldEFjdG9ycygpOiBFbGVtZW50TGlzdDxCYXNlQWN0b3I+XG4gICAge1xuICAgICAgICByZXR1cm4gbmV3IEVsZW1lbnRMaXN0KHRoaXMuYWN0b3JzLCA8RXZlbnQ8QmFzZUFjdG9yPj50aGlzLk9uVXBkYXRlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiB0aGUgbWFwIHdhcyB1cGRhdGVkLlxuICAgICAqL1xuICAgIHB1YmxpYyBPblVwZGF0ZTogRXZlbnQ8QmFzZUVsZW1lbnQ+ID0gbmV3IEV2ZW50PEJhc2VFbGVtZW50PigpO1xufSIsImltcG9ydCB7IElDaGFubmVsIH0gZnJvbSBcIi4vSUNoYW5uZWxcIjtcbmltcG9ydCB7IE1lc3NhZ2VUeXBlIH0gZnJvbSBcIi4vTWVzc2FnZVR5cGVcIjtcbmltcG9ydCB7IE1hcCB9IGZyb20gXCIuLi9NYXBcIjtcbmltcG9ydCB7IEV4cG9ydGFibGUgfSBmcm9tIFwiLi4vRXhwb3J0YWJsZVwiO1xuaW1wb3J0IHsgQmFzZUNlbGwgfSBmcm9tIFwiLi4vRWxlbWVudC9DZWxsL0Jhc2VDZWxsXCI7XG5pbXBvcnQgeyBCYXNlQWN0b3IgfSBmcm9tIFwiLi4vRWxlbWVudC9BY3Rvci9CYXNlQWN0b3JcIjtcbmltcG9ydCB7IFBsYXllckFjdG9yIH0gZnJvbSBcIi4uL0VsZW1lbnQvQWN0b3IvUGxheWVyQWN0b3JcIjtcbmltcG9ydCB7IEhlbHBlciB9IGZyb20gXCIuLi9VdGlsL0hlbHBlclwiO1xuaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi4vQ29vcmRcIjtcbmltcG9ydCB7IElFeHBvcnRPYmplY3QgfSBmcm9tIFwiLi4vSUV4cG9ydE9iamVjdFwiO1xuaW1wb3J0IHsgSU1lc3NhZ2UgfSBmcm9tIFwiLi9JTWVzc2FnZVwiO1xuaW1wb3J0IHsgTWVzc2FnZUhhbmRsZXIgfSBmcm9tIFwiLi9NZXNzYWdlSGFuZGxlclwiO1xuXG5leHBvcnQgY2xhc3MgQ2xpZW50IGV4dGVuZHMgTWVzc2FnZUhhbmRsZXJcbntcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1hcDogTWFwO1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0IGEgbmV3IGNsaWVudCB3aGljaCBjb21tdW5pY2F0ZXMgd2l0aCBhIGNvbm5lY3Rpb24uXG4gICAgICogQHBhcmFtIGNoYW5uZWwgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY2hhbm5lbDogSUNoYW5uZWwsIG1hcDogTWFwKVxuICAgIHtcbiAgICAgICAgc3VwZXIoY2hhbm5lbCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLm1hcCA9IG1hcDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWNlaXZlIGEgbWVzc2FnZSB0aHJvdWdoIHRoZSBjaGFubmVsLlxuICAgICAqIEBwYXJhbSBtZXNzYWdlIFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBPbk1lc3NhZ2UobWVzc2FnZTogSU1lc3NhZ2UpOiB2b2lkXG4gICAge1xuICAgICAgICBzd2l0Y2gobWVzc2FnZS5UeXBlKVxuICAgICAgICB7XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLkVsZW1lbnQ6XG4gICAgICAgICAgICAgICAgdGhpcy5TZXRFbGVtZW50KG1lc3NhZ2UuUGF5bG9hZClcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuUGxheWVyOlxuICAgICAgICAgICAgICAgIHRoaXMuU2V0UGxheWVyKG1lc3NhZ2UuUGF5bG9hZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLlNpemU6XG4gICAgICAgICAgICAgICAgdGhpcy5TZXRTaXplKG1lc3NhZ2UuUGF5bG9hZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLktpY2s6XG4gICAgICAgICAgICAgICAgdGhpcy5LaWNrKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIC8vIEludmFsaWRcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCBhbiBlbGVtZW50LlxuICAgICAqIEBwYXJhbSBlbGVtZW50IFxuICAgICAqL1xuICAgIHByaXZhdGUgU2V0RWxlbWVudChleHBvcnRhYmxlOiBJRXhwb3J0T2JqZWN0KVxuICAgIHtcbiAgICAgICAgLy8gU2V0IHRoZSBhcmdzIG9mIHRoZSBjb25zdHJ1Y3RvciBvZiBCYXNlRWxlbWVudCBcbiAgICAgICAgZXhwb3J0YWJsZS5BcmdzID0gW251bGwsIHRoaXMubWFwXTtcblxuICAgICAgICBjb25zdCBlbGVtZW50ID0gRXhwb3J0YWJsZS5JbXBvcnQoZXhwb3J0YWJsZSk7XG5cbiAgICAgICAgaWYoZWxlbWVudCBpbnN0YW5jZW9mIEJhc2VDZWxsKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLm1hcC5HZXRDZWxscygpLlNldChlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKGVsZW1lbnQgaW5zdGFuY2VvZiBCYXNlQWN0b3IpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMubWFwLkdldEFjdG9ycygpLlNldChlbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgcGxheWVyIGJ5IHRhZy5cbiAgICAgKiBAcGFyYW0gdGFnIFxuICAgICAqL1xuICAgIHByaXZhdGUgU2V0UGxheWVyKHRhZzogc3RyaW5nKVxuICAgIHtcbiAgICAgICAgY29uc3QgcGxheWVyID0gdGhpcy5tYXAuR2V0QWN0b3JzKCkuVGFnKHRhZyk7XG5cbiAgICAgICAgdGhpcy5PblBsYXllcihIZWxwZXIuSG9vayhwbGF5ZXIsICh0YXJnZXQsIHByb3AsIGFyZ3MpID0+IFxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBleHBvcnRhYmxlID0gRXhwb3J0YWJsZS5FeHBvcnQoW3Byb3BdLmNvbmNhdChhcmdzKSk7XG5cbiAgICAgICAgICAgIHRoaXMuU2VuZE1lc3NhZ2UoTWVzc2FnZVR5cGUuQ29tbWFuZCwgZXhwb3J0YWJsZSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHNpemUgb2YgdGhlIG1hcC5cbiAgICAgKiBAcGFyYW0gc2l6ZSBcbiAgICAgKi9cbiAgICBwcml2YXRlIFNldFNpemUoZXhwb3J0YWJsZTogSUV4cG9ydE9iamVjdClcbiAgICB7XG4gICAgICAgIHRoaXMubWFwLkluaXQoRXhwb3J0YWJsZS5JbXBvcnQoZXhwb3J0YWJsZSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEtpY2sgdGhpcyBjbGllbnQgb2YgdGhlIHNlcnZlci5cbiAgICAgKi9cbiAgICBwcml2YXRlIEtpY2soKVxuICAgIHtcbiAgICAgICAgdGhpcy5tYXAuSW5pdChuZXcgQ29vcmQoMCwgMCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVkIHdoZW4gdGhlIHBsYXllciBpcyBzZXQuXG4gICAgICovXG4gICAgcHVibGljIE9uUGxheWVyOiAocGxheWVyOiBQbGF5ZXJBY3RvcikgPT4gdm9pZCA9IEhlbHBlci5Ob29wO1xufSIsImltcG9ydCB7IEhlbHBlciB9IGZyb20gXCIuLi9VdGlsL0hlbHBlclwiO1xuaW1wb3J0IHsgSUNoYW5uZWwgfSBmcm9tIFwiLi9JQ2hhbm5lbFwiO1xuaW1wb3J0IHsgUGxheWVyQWN0b3IgfSBmcm9tIFwiLi4vRWxlbWVudC9BY3Rvci9QbGF5ZXJBY3RvclwiO1xuaW1wb3J0IHsgRXhwb3J0YWJsZSB9IGZyb20gXCIuLi9FeHBvcnRhYmxlXCI7XG5pbXBvcnQgeyBNZXNzYWdlVHlwZSB9IGZyb20gXCIuL01lc3NhZ2VUeXBlXCI7XG5pbXBvcnQgeyBDb29yZCB9IGZyb20gXCIuLi9Db29yZFwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vRWxlbWVudC9CYXNlRWxlbWVudFwiO1xuaW1wb3J0IHsgSUV4cG9ydE9iamVjdCB9IGZyb20gXCIuLi9JRXhwb3J0T2JqZWN0XCI7XG5pbXBvcnQgeyBJTWVzc2FnZSB9IGZyb20gXCIuL0lNZXNzYWdlXCI7XG5pbXBvcnQgeyBNZXNzYWdlSGFuZGxlciB9IGZyb20gXCIuL01lc3NhZ2VIYW5kbGVyXCI7XG5cbmV4cG9ydCBjbGFzcyBDb25uZWN0aW9uIGV4dGVuZHMgTWVzc2FnZUhhbmRsZXJcbntcbiAgICBwcml2YXRlIHBsYXllcjogUGxheWVyQWN0b3I7XG4gICAgXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0IGEgbmV3IGNvbm5lY3Rpb24gd2hpY2ggY29tbXVuaWNhdGVzIHdpdGggYSBjbGllbnQuXG4gICAgICogQHBhcmFtIGNoYW5uZWwgRGlyZWN0IGNoYW5uZWwgdG8gdGhlIGNsaWVudC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihjaGFubmVsOiBJQ2hhbm5lbClcbiAgICB7XG4gICAgICAgIHN1cGVyKGNoYW5uZWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlY2VpdmUgYSBtZXNzYWdlIHRocm91Z2ggdGhlIGNoYW5uZWwgYW5kIHBhcnNlIGl0LlxuICAgICAqIEBwYXJhbSBtZXNzYWdlIFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBPbk1lc3NhZ2UobWVzc2FnZTogSU1lc3NhZ2UpOiB2b2lkXG4gICAge1xuICAgICAgICBzd2l0Y2gobWVzc2FnZS5UeXBlKVxuICAgICAgICB7XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLkNvbW1hbmQ6XG4gICAgICAgICAgICAgICAgdGhpcy5QYXJzZUNvbW1hbmQobWVzc2FnZSlcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgLy8gSW52YWxpZDoga2ljaz9cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBhcnNlIGFuIGluY29taW5nIENPTU1BTkQuXG4gICAgICogQHBhcmFtIGluZGV4IFxuICAgICAqIEBwYXJhbSBjb21tYW5kIFxuICAgICAqL1xuICAgIHB1YmxpYyBQYXJzZUNvbW1hbmQobWVzc2FnZTogSU1lc3NhZ2UpOiB2b2lkXG4gICAge1xuICAgICAgICB0aGlzLk9uQ29tbWFuZChtZXNzYWdlLlBheWxvYWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluaXQgbWFwLiBBbHNvIGRlbGV0ZXMgcHJldmlvdXNseSBzZXR0ZWQgZWxlbWVudHMuXG4gICAgICogQHBhcmFtIHNpemUgXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIFNldFNpemUoc2l6ZTogQ29vcmQpOiBQcm9taXNlPHZvaWQ+XG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5TZW5kTWVzc2FnZShNZXNzYWdlVHlwZS5TaXplLCBFeHBvcnRhYmxlLkV4cG9ydChzaXplKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IGFuIGVsZW1lbnQgKGEgY2VsbCBvciBhbiBhY3RvcikuXG4gICAgICogQHBhcmFtIGVsZW1lbnQgXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIFNldEVsZW1lbnQoZWxlbWVudDogQmFzZUVsZW1lbnQpOiBQcm9taXNlPHZvaWQ+XG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5TZW5kTWVzc2FnZShNZXNzYWdlVHlwZS5FbGVtZW50LCBFeHBvcnRhYmxlLkV4cG9ydChlbGVtZW50KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBhY3RpdmUgcGxheWVyIGFjdG9yIGZvciB0aGUgY2xpZW50ICh0aGUgYWN0b3IgbmVlZHMgdG8gYmUgXG4gICAgICogYWxyZWFkeSBzZW50IHZpYSBTZXRFbGVtZW50KS5cbiAgICAgKiBAcGFyYW0gcGxheWVyIFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBTZXRQbGF5ZXIocGxheWVyOiBQbGF5ZXJBY3Rvcik6IFByb21pc2U8dm9pZD5cbiAgICB7XG4gICAgICAgIGlmKHRoaXMucGxheWVyKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBsYXllciA9IHBsYXllcjtcblxuICAgICAgICByZXR1cm4gdGhpcy5TZW5kTWVzc2FnZShNZXNzYWdlVHlwZS5QbGF5ZXIsIHBsYXllci5HZXRUYWcoKSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgcHJldmlvdXNseSBzZXR0ZWQgcGxheWVyIGFjdG9yLlxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRQbGF5ZXIoKTogUGxheWVyQWN0b3JcbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLnBsYXllcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBLaWNrIHRoZSBjbGllbnQgb2ZmLlxuICAgICAqL1xuICAgIHB1YmxpYyBLaWNrKCk6IHZvaWRcbiAgICB7XG4gICAgICAgIHRoaXMuU2VuZE1lc3NhZ2UoTWVzc2FnZVR5cGUuS2ljaywgbnVsbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZWQgd2hlbiB0aGUgQ29ubmVjdGlvbiByZWNlaXZlcyBhIENPTU1BTkQgZnJvbSB0aGUgY2xpZW50LlxuICAgICAqIEBwYXJhbSBjb21tYW5kXG4gICAgICovXG4gICAgcHVibGljIE9uQ29tbWFuZDogKGNvbW1hbmQ6IElFeHBvcnRPYmplY3QpID0+IHZvaWQgPSBIZWxwZXIuTm9vcDtcbn0iLCJpbXBvcnQgeyBJQ2hhbm5lbCB9IGZyb20gXCIuL0lDaGFubmVsXCI7XG5pbXBvcnQgeyBIZWxwZXIgfSBmcm9tIFwiLi4vVXRpbC9IZWxwZXJcIjtcblxuZXhwb3J0IGNsYXNzIEZha2VDaGFubmVsIGltcGxlbWVudHMgSUNoYW5uZWxcbntcbiAgICBwcml2YXRlIG90aGVyOiBGYWtlQ2hhbm5lbDtcbiAgICBwcml2YXRlIGRlbGF5OiBudW1iZXI7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3QgYSBuZXcgZmFrZSBjaGFubmVsIHdpdGggdGhlIGdpdmVuIGRlbGF5LlxuICAgICAqIEBwYXJhbSBkZWxheSBcbiAgICAgKi9cbiAgICBwdWJsaWMgY29uc3RydWN0b3IoZGVsYXk6IG51bWJlciA9IDApXG4gICAge1xuICAgICAgICB0aGlzLmRlbGF5ID0gZGVsYXk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBvdGhlciBwZWVyLlxuICAgICAqIEBwYXJhbSBvdGhlciBcbiAgICAgKi9cbiAgICBwdWJsaWMgU2V0T3RoZXIob3RoZXI6IEZha2VDaGFubmVsKVxuICAgIHtcbiAgICAgICAgdGhpcy5vdGhlciA9IG90aGVyO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBTZW5kIGEgbWVzc2FnZSB0byB0aGUgb3RoZXIgcGVlci5cbiAgICAgKiBAcGFyYW0gbWVzc2FnZSBcbiAgICAgKi9cbiAgICBwdWJsaWMgU2VuZE1lc3NhZ2UobWVzc2FnZTogc3RyaW5nKTogdm9pZCBcbiAgICB7XG4gICAgICAgIGlmKHRoaXMub3RoZXIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5vdGhlci5Pbk1lc3NhZ2UobWVzc2FnZSksIHRoaXMuZGVsYXkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVjZWl2ZSBhIG1lc3NhZ2UgZnJvbSB0aGUgb3RoZXIgcGVlci5cbiAgICAgKi9cbiAgICBwdWJsaWMgT25NZXNzYWdlOiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkID0gSGVscGVyLk5vb3A7XG59IiwiaW1wb3J0IHsgSUNoYW5uZWwgfSBmcm9tIFwiLi9JQ2hhbm5lbFwiO1xuaW1wb3J0IHsgTWVzc2FnZVR5cGUgfSBmcm9tIFwiLi9NZXNzYWdlVHlwZVwiO1xuaW1wb3J0IHsgSU1lc3NhZ2UgfSBmcm9tIFwiLi9JTWVzc2FnZVwiO1xuaW1wb3J0IHsgVGltZW91dEV2ZW50IH0gZnJvbSBcIi4uL1V0aWwvVGltZW91dEV2ZW50XCI7XG5pbXBvcnQgeyBFdmVudCB9IGZyb20gXCIuLi9VdGlsL0V2ZW50XCI7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiLi4vVXRpbC9Mb2dnZXJcIjtcbmltcG9ydCB7IExvZ1R5cGUgfSBmcm9tIFwiLi4vVXRpbC9Mb2dUeXBlXCI7XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBNZXNzYWdlSGFuZGxlclxue1xuICAgIHByaXZhdGUgcmVjZWl2ZWRFdmVudCA9IG5ldyBFdmVudDxudW1iZXI+KCk7XG4gICAgcHJpdmF0ZSBvdXRJbmRleDogbnVtYmVyID0gMDtcbiAgICBwcml2YXRlIGluSW5kZXg6IG51bWJlcjtcblxuICAgIHByaXZhdGUgY2hhbm5lbDogSUNoYW5uZWw7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3QgYSBuZXcgY29ubmVjdGlvbiB3aGljaCBjb21tdW5pY2F0ZXMgd2l0aCBhIGNsaWVudC5cbiAgICAgKiBAcGFyYW0gY2hhbm5lbCBEaXJlY3QgY2hhbm5lbCB0byB0aGUgY2xpZW50LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNoYW5uZWw6IElDaGFubmVsKVxuICAgIHtcbiAgICAgICAgdGhpcy5jaGFubmVsID0gY2hhbm5lbDtcbiAgICAgICAgdGhpcy5jaGFubmVsLk9uTWVzc2FnZSA9IChtZXNzYWdlOiBzdHJpbmcpID0+IHRoaXMuUGFyc2VNZXNzYWdlKG1lc3NhZ2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlY2VpdmUgYSBtZXNzYWdlIHRocm91Z2ggdGhlIGNoYW5uZWwuXG4gICAgICogQHBhcmFtIGlucHV0IFxuICAgICAqL1xuICAgIHByaXZhdGUgUGFyc2VNZXNzYWdlKGlucHV0OiBzdHJpbmcpOiB2b2lkXG4gICAge1xuICAgICAgICBsZXQgbWVzc2FnZTogSU1lc3NhZ2U7XG5cbiAgICAgICAgdHJ5IFxuICAgICAgICB7XG4gICAgICAgICAgICBtZXNzYWdlID0gSlNPTi5wYXJzZShpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2goZSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoKG1lc3NhZ2UuVHlwZSlcbiAgICAgICAge1xuICAgICAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5FbGVtZW50OlxuICAgICAgICAgICAgICAgIC8vIFJlY2VpdmUgb25seSBzdGF0ZXMgbmV3ZXIgdGhhbiB0aGUgY3VycmVudCBvbmVcbiAgICAgICAgICAgICAgICBpZihtZXNzYWdlLkluZGV4ID4gdGhpcy5pbkluZGV4IHx8IHRoaXMuaW5JbmRleCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbkluZGV4ID0gbWVzc2FnZS5JbmRleDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5Pbk1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5TZW5kUmVjZWl2ZWQobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLkNvbW1hbmQ6XG4gICAgICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLlBsYXllcjpcbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuS2ljazpcbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuU2l6ZTpcbiAgICAgICAgICAgICAgICB0aGlzLk9uTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB0aGlzLlNlbmRSZWNlaXZlZChtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuUmVjZWl2ZWQ6XG4gICAgICAgICAgICAgICAgdGhpcy5QYXJzZVJlY2VpdmVkKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgTG9nZ2VyLkxvZyh0aGlzLCBMb2dUeXBlLlZlcmJvc2UsIFwiTWVzc2FnZSByZWNlaXZlZFwiLCBtZXNzYWdlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQYXJzZSBpbmNvbWluZyBBQ0suXG4gICAgICogQHBhcmFtIG1lc3NhZ2UgXG4gICAgICovXG4gICAgcHJpdmF0ZSBQYXJzZVJlY2VpdmVkKG1lc3NhZ2U6IElNZXNzYWdlKVxuICAgIHtcbiAgICAgICAgdGhpcy5yZWNlaXZlZEV2ZW50LkNhbGwobWVzc2FnZS5QYXlsb2FkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIEFDSy5cbiAgICAgKiBAcGFyYW0gbWVzc2FnZSBcbiAgICAgKi9cbiAgICBwcml2YXRlIFNlbmRSZWNlaXZlZChtZXNzYWdlOiBJTWVzc2FnZSlcbiAgICB7XG4gICAgICAgIHRoaXMuU2VuZE1lc3NhZ2UoTWVzc2FnZVR5cGUuUmVjZWl2ZWQsIG1lc3NhZ2UuSW5kZXgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogU2VuZCBhIG1lc3NhZ2UgdGhyb3VnaCB0aGUgY2hhbm5lbC5cbiAgICAqIEBwYXJhbSB0eXBlIFR5cGUgb2YgdGhlIG1lc3NhZ2UuXG4gICAgKiBAcGFyYW0gcGF5bG9hZFxuICAgICovXG4gICBwcm90ZWN0ZWQgYXN5bmMgU2VuZE1lc3NhZ2UodHlwZTogTWVzc2FnZVR5cGUsIHBheWxvYWQ6IGFueSk6IFByb21pc2U8dm9pZD5cbiAgIHtcbiAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4gXG4gICAgICAge1xuICAgICAgICAgICAvLyBDcmVhdGUgdGhlIG1lc3NhZ2VcbiAgICAgICAgICAgY29uc3QgbWVzc2FnZTogSU1lc3NhZ2UgPSB7XG4gICAgICAgICAgICAgICBUeXBlOiB0eXBlLFxuICAgICAgICAgICAgICAgSW5kZXg6IHRoaXMub3V0SW5kZXgrKyxcbiAgICAgICAgICAgICAgIFBheWxvYWQ6IHBheWxvYWRcbiAgICAgICAgICAgfTtcblxuICAgICAgICAgICAvLyBDcmVhdGUgYSBuZXcgUkVDRUlWRUQgbGlzdGVuZXIgaWYgdGhpcyB3YXMgbm90XG4gICAgICAgICAgIC8vIGEgYWNrbm93bGVkZ2UgbWVzc2FnZVxuICAgICAgICAgICBpZiAobWVzc2FnZS5UeXBlICE9IE1lc3NhZ2VUeXBlLlJlY2VpdmVkKSBcbiAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpc3RlbmVyID0gdGhpcy5yZWNlaXZlZEV2ZW50LkFkZChpbmRleCA9PiBcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ID09PSBtZXNzYWdlLkluZGV4KSBcbiAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVjZWl2ZWRFdmVudC5SZW1vdmUobGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGluZGV4ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCgpO1xuICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICB9XG4gICAgICAgICAgIGVsc2VcbiAgICAgICAgICAge1xuICAgICAgICAgICAgICAgLy8gUmVzb2x2ZSBpbW1lZGlhdGVseSBpZiBSRUNFSVZFRFxuICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICB9XG5cbiAgICAgICAgICAgLy8gU2VuZCBtZXNzYWdlXG4gICAgICAgICAgIHRoaXMuY2hhbm5lbC5TZW5kTWVzc2FnZShKU09OLnN0cmluZ2lmeShtZXNzYWdlKSk7XG5cbiAgICAgICAgICAgTG9nZ2VyLkxvZyh0aGlzLCBMb2dUeXBlLlZlcmJvc2UsIFwiTWVzc2FnZSBzZW50XCIsIG1lc3NhZ2UpO1xuICAgICAgIH0pO1xuICAgfVxuXG4gICBwcm90ZWN0ZWQgYWJzdHJhY3QgT25NZXNzYWdlKG1lc3NhZ2U6IElNZXNzYWdlKTogdm9pZDtcbn0iLCJleHBvcnQgZW51bSBNZXNzYWdlVHlwZVxue1xuICAgIC8vIE9VVFxuICAgIFNpemUsXG4gICAgRWxlbWVudCxcbiAgICBQbGF5ZXIsXG4gICAgS2ljayxcblxuICAgIC8vIElOXG4gICAgQ29tbWFuZCxcblxuICAgIC8vIElOICYgT1VUXG4gICAgUmVjZWl2ZWRcbn0iLCJpbXBvcnQgeyBJQ2hhbm5lbCB9IGZyb20gXCIuL0lDaGFubmVsXCI7XG5pbXBvcnQgeyBIZWxwZXIgfSBmcm9tIFwiLi4vVXRpbC9IZWxwZXJcIjtcbmltcG9ydCB7IEV2ZW50IH0gZnJvbSBcIi4uL1V0aWwvRXZlbnRcIjtcblxuZXhwb3J0IGNsYXNzIFBlZXJDaGFubmVsIGltcGxlbWVudHMgSUNoYW5uZWxcbntcbiAgICBwcml2YXRlIHBlZXJDb25uZWN0aW9uO1xuICAgIHByaXZhdGUgZGF0YUNoYW5uZWw7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgb2ZmZXIuIFJldHVybiB0aGUgb2ZmZXIgbmVnb3RpYXRpb24gc3RyaW5nLlxuICAgICAqL1xuICAgIHB1YmxpYyBPZmZlcigpOiBQcm9taXNlPHN0cmluZz5cbiAgICB7XG4gICAgICAgIGlmKHRoaXMucGVlckNvbm5lY3Rpb24pXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4gXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMucGVlckNvbm5lY3Rpb24gPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24obnVsbCk7XG4gICAgICAgICAgICB0aGlzLmRhdGFDaGFubmVsID0gdGhpcy5wZWVyQ29ubmVjdGlvbi5jcmVhdGVEYXRhQ2hhbm5lbChcImRhdGFcIik7XG5cbiAgICAgICAgICAgIHRoaXMucGVlckNvbm5lY3Rpb24ub25pY2VjYW5kaWRhdGUgPSBlID0+IFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmKGUuY2FuZGlkYXRlID09IG51bGwpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvZmZlciA9IHRoaXMucGVlckNvbm5lY3Rpb24ubG9jYWxEZXNjcmlwdGlvbjtcblxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKEhlbHBlci5CYXNlNjRFbmNvZGUoSlNPTi5zdHJpbmdpZnkob2ZmZXIpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMucGVlckNvbm5lY3Rpb24uY3JlYXRlT2ZmZXIoKS50aGVuKFxuICAgICAgICAgICAgICAgIGRlc2MgPT4gdGhpcy5wZWVyQ29ubmVjdGlvbi5zZXRMb2NhbERlc2NyaXB0aW9uKGRlc2MpLFxuICAgICAgICAgICAgICAgIGVycm9yID0+IHJlamVjdChlcnJvcilcbiAgICAgICAgICAgICk7XG4gICAgXG4gICAgICAgICAgICB0aGlzLmRhdGFDaGFubmVsLm9ubWVzc2FnZSA9IGV2ZW50ID0+IHRoaXMuUGFyc2VNZXNzYWdlKGV2ZW50KTtcbiAgICAgICAgICAgIHRoaXMuZGF0YUNoYW5uZWwub25vcGVuID0gKCkgPT4gdGhpcy5Pbk9wZW4oKTtcbiAgICAgICAgICAgIHRoaXMuZGF0YUNoYW5uZWwub25jbG9zZSA9ICgpID0+IHRoaXMuT25DbG9zZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYW4gYW5zd2VyIGZvciB0aGUgZ2l2ZW4gb2ZmZXIuIFJldHVybiB0aGUgZmluaXNoIG5lZ290aWF0aW9uIHN0cmluZy5cbiAgICAgKiBAcGFyYW0gb2ZmZXIgXG4gICAgICovXG4gICAgcHVibGljIEFuc3dlcihvZmZlcjogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IFxuICAgIHtcbiAgICAgICAgaWYodGhpcy5wZWVyQ29ubmVjdGlvbilcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8c3RyaW5nPigocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnBlZXJDb25uZWN0aW9uID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKG51bGwpO1xuICAgIFxuICAgICAgICAgICAgdGhpcy5wZWVyQ29ubmVjdGlvbi5vbmljZWNhbmRpZGF0ZSA9IGUgPT4gXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYoZS5jYW5kaWRhdGUgPT0gbnVsbClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFuc3dlciA9IHRoaXMucGVlckNvbm5lY3Rpb24ubG9jYWxEZXNjcmlwdGlvbjtcblxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKEhlbHBlci5CYXNlNjRFbmNvZGUoSlNPTi5zdHJpbmdpZnkoYW5zd2VyKSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgXG4gICAgICAgICAgICB0aGlzLnBlZXJDb25uZWN0aW9uLm9uZGF0YWNoYW5uZWwgPSBldmVudCA9PlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YUNoYW5uZWwgPSBldmVudC5jaGFubmVsO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhQ2hhbm5lbC5vbm1lc3NhZ2UgPSBldmVudCA9PiB0aGlzLlBhcnNlTWVzc2FnZShldmVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhQ2hhbm5lbC5vbm9wZW4gPSAoKSA9PiB0aGlzLk9uT3BlbigpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YUNoYW5uZWwub25jbG9zZSA9ICgpID0+IHRoaXMuT25DbG9zZSgpO1xuICAgICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgICAgIHRoaXMucGVlckNvbm5lY3Rpb24uc2V0UmVtb3RlRGVzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgbmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbihKU09OLnBhcnNlKEhlbHBlci5CYXNlNjREZWNvZGUob2ZmZXIpKSkpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnBlZXJDb25uZWN0aW9uLmNyZWF0ZUFuc3dlcigpLnRoZW4oXG4gICAgICAgICAgICAgICAgZGVzYyA9PiB0aGlzLnBlZXJDb25uZWN0aW9uLnNldExvY2FsRGVzY3JpcHRpb24oZGVzYyksXG4gICAgICAgICAgICAgICAgZXJyb3IgPT4gcmVqZWN0KGVycm9yKSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmlzaCBuZWdvdGlhdGlvbi5cbiAgICAgKiBAcGFyYW0gYW5zd2VyIFxuICAgICAqL1xuICAgIHB1YmxpYyBGaW5pc2goYW5zd2VyOiBzdHJpbmcpOiB2b2lkXG4gICAge1xuICAgICAgICBpZih0aGlzLklzT2ZmZXJvcigpKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnBlZXJDb25uZWN0aW9uLnNldFJlbW90ZURlc2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgIG5ldyBSVENTZXNzaW9uRGVzY3JpcHRpb24oSlNPTi5wYXJzZShIZWxwZXIuQmFzZTY0RGVjb2RlKGFuc3dlcikpKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gZmluaXNoIG5lZ290aWF0aW9uIVwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBhcnNlIGFuIGluY29taW5nIG1lc3NhZ2UuXG4gICAgICogQHBhcmFtIGV2ZW50IFxuICAgICAqL1xuICAgIHB1YmxpYyBQYXJzZU1lc3NhZ2UoZXZlbnQpXG4gICAge1xuICAgICAgICBpZihldmVudCAmJiBldmVudC5kYXRhKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLk9uTWVzc2FnZShldmVudC5kYXRhKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmQgYSBtZXNzYWdlIHRocm91Z2ggdGhlIGNoYW5uZWwuXG4gICAgICogQHBhcmFtIG1lc3NhZ2UgXG4gICAgICovXG4gICAgcHVibGljIFNlbmRNZXNzYWdlKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWRcbiAgICB7XG4gICAgICAgIGlmKHRoaXMuSXNPcGVuKCkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YUNoYW5uZWwuc2VuZChtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElzIHRoaXMgUGVlckNvbm5lY3Rpb24gY3JlYXRlZCB0aGUgb2ZmZXI/XG4gICAgICovXG4gICAgcHVibGljIElzT2ZmZXJvcigpOiBib29sZWFuXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5wZWVyQ29ubmVjdGlvbiAmJiB0aGlzLnBlZXJDb25uZWN0aW9uLmxvY2FsRGVzY3JpcHRpb24gJiZcbiAgICAgICAgICAgIHRoaXMucGVlckNvbm5lY3Rpb24ubG9jYWxEZXNjcmlwdGlvbi50eXBlID09IFwib2ZmZXJcIjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0aGUgY2hhbm5lbCBpcyBvcGVuLlxuICAgICAqL1xuICAgIHB1YmxpYyBJc09wZW4oKTogYm9vbGVhblxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YUNoYW5uZWwgJiYgdGhpcy5kYXRhQ2hhbm5lbC5yZWFkeVN0YXRlID09IFwib3BlblwiICYmIFxuICAgICAgICAgICAgdGhpcy5wZWVyQ29ubmVjdGlvbiAmJiB0aGlzLnBlZXJDb25uZWN0aW9uLnNpZ25hbGluZ1N0YXRlID09IFwic3RhYmxlXCI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gY2hhbm5lbCBpcyBvcGVuZWQuXG4gICAgICovXG4gICAgcHVibGljIE9uT3BlbjogKCkgPT4gdm9pZCA9IEhlbHBlci5Ob29wO1xuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gY2hhbm5lbCBpcyBjbG9zZWQuXG4gICAgICovXG4gICAgcHVibGljIE9uQ2xvc2U6ICgpID0+IHZvaWQgPSBIZWxwZXIuTm9vcDtcblxuICAgIC8qKlxuICAgICAqIFJlY2VpdmUgYSBtZXNzYWdlIGZyb20gdGhlIG90aGVyIHBlZXIuXG4gICAgICovXG4gICAgcHVibGljIE9uTWVzc2FnZTogKG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZCA9IEhlbHBlci5Ob29wO1xufSIsImltcG9ydCB7IE1hcCB9IGZyb20gXCIuLi9NYXBcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL0VsZW1lbnQvQmFzZUVsZW1lbnRcIjtcbmltcG9ydCB7IFBsYXllckFjdG9yIH0gZnJvbSBcIi4uL0VsZW1lbnQvQWN0b3IvUGxheWVyQWN0b3JcIjtcbmltcG9ydCB7IENvbm5lY3Rpb24gfSBmcm9tIFwiLi9Db25uZWN0aW9uXCI7XG5pbXBvcnQgeyBFeHBvcnRhYmxlIH0gZnJvbSBcIi4uL0V4cG9ydGFibGVcIjtcbmltcG9ydCB7IElFeHBvcnRPYmplY3QgfSBmcm9tIFwiLi4vSUV4cG9ydE9iamVjdFwiO1xuaW1wb3J0IHsgQ29vcmQgfSBmcm9tIFwiLi4vQ29vcmRcIjtcblxuZXhwb3J0IGNsYXNzIFNlcnZlclxue1xuICAgIHByaXZhdGUgcmVhZG9ubHkgbWFwOiBNYXA7XG4gICAgcHJpdmF0ZSByZWFkb25seSBjb25uczogQ29ubmVjdGlvbltdID0gW107XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3QgYSBuZXcgc2VydmVyIHdpdGggdGhlIGdpdmVuIG1hcC4gVGhlIHNlcnZlciBnb25uYVxuICAgICAqIHVwZGF0ZSBlYWNoIGNvbm5lY3Rpb25zIChjbGllbnRzKSB3aXRoIHRoZSBtYXAgYW5kIHN5bmMgZXZlcnlcbiAgICAgKiBtb3ZlIG9mIHRoZSBjbGllbnRzIGJldHdlZW4gdGhlbS5cbiAgICAgKiBAcGFyYW0gbWFwIFxuICAgICAqL1xuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihtYXA6IE1hcClcbiAgICB7XG4gICAgICAgIHRoaXMubWFwID0gbWFwO1xuXG4gICAgICAgIC8vIFVwZGF0ZSBlbGVtZW50cyBmb3IgY29ubmVjdGlvbnMgZXhjZXB0IHRoZWlyIG93biBwbGF5ZXJcbiAgICAgICAgdGhpcy5tYXAuT25VcGRhdGUuQWRkKGVsZW1lbnQgPT4gdGhpcy5jb25uc1xuICAgICAgICAgICAgLmZpbHRlcihjb25uID0+IGVsZW1lbnQuR2V0VGFnKCkgIT0gY29ubi5HZXRQbGF5ZXIoKS5HZXRUYWcoKSlcbiAgICAgICAgICAgIC5mb3JFYWNoKGNvbm4gPT4gY29ubi5TZXRFbGVtZW50KGVsZW1lbnQpKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZWQgd2hlbiB0aGUgc2VydmVyIHJlY2VpdmVzIGEgbmV3IG1lc3NhZ2UgZnJvbSBhIGNsaWVudC9jb25uZWN0aW9uLlxuICAgICAqIEBwYXJhbSBjb25uXG4gICAgICogQHBhcmFtIGNvbW1hbmRcbiAgICAgKi9cbiAgICBwcml2YXRlIE9uQ29tbWFuZChjb25uOiBDb25uZWN0aW9uLCBjb21tYW5kOiBJRXhwb3J0T2JqZWN0KVxuICAgIHtcbiAgICAgICAgY29uc3QgYXJncyA9IEV4cG9ydGFibGUuSW1wb3J0KGNvbW1hbmQpO1xuXG4gICAgICAgIGlmKCFhcmdzLmxlbmd0aClcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5LaWNrKGNvbm4pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGxheWVyID0gY29ubi5HZXRQbGF5ZXIoKTtcblxuICAgICAgICAvLyBFeGVjdXRlIGNvbW1hbmQgb24gdGhlIHBsYXllclxuICAgICAgICBwbGF5ZXJbYXJnc1swXV0uYmluZChwbGF5ZXIpKC4uLmFyZ3Muc2xpY2UoMSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEtpY2sgY2xpZW50IG91dCBvZiB0aGUgc2VydmVyLlxuICAgICAqIEBwYXJhbSBjb25uIFxuICAgICAqL1xuICAgIHByaXZhdGUgS2ljayhjb25uOiBDb25uZWN0aW9uKVxuICAgIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmNvbm5zLmluZGV4T2YoY29ubik7XG5cbiAgICAgICAgaWYoaW5kZXggPj0gMClcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5jb25ucy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgdGhpcy5tYXAuR2V0QWN0b3JzKCkuUmVtb3ZlKGNvbm4uR2V0UGxheWVyKCkpO1xuICAgICAgICAgICAgY29ubi5LaWNrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBuZXcgY29ubmVjdGlvbi9jbGllbnQgdG8gdGhlIHNlcnZlci4gVGhpcyByZXByZXNlbnRzXG4gICAgICogdGhlIGNsaWVudCBvbiB0aGUgc2VydmVyIHNpZGUgLSBpdCBvbmx5IGNvbW11bmljYXRlc1xuICAgICAqIHdpdGggYSBDbGllbnQgb2JqZWN0IHRocm91Z2ggYW4gSUNoYW5uZWwgaW1wbGVtZW50YXRpb24uXG4gICAgICogQHBhcmFtIGNvbm4gXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIEFkZChjb25uOiBDb25uZWN0aW9uKVxuICAgIHtcbiAgICAgICAgLy8gQ3JlYXRlIHBsYXllciBhbmQgYWRkIGl0IHRvIHRoZSBtYXBcbiAgICAgICAgY29uc3QgcGxheWVyID0gbmV3IFBsYXllckFjdG9yKG5ldyBDb29yZCgwLCAwKSwgdGhpcy5tYXApO1xuXG4gICAgICAgIHRoaXMubWFwLkdldEFjdG9ycygpLlNldChwbGF5ZXIpO1xuXG4gICAgICAgIC8vIFNldCBzaXplXG4gICAgICAgIGF3YWl0IGNvbm4uU2V0U2l6ZSh0aGlzLm1hcC5HZXRTaXplKCkpO1xuXG4gICAgICAgIC8vIFNldCBhY3RvcnNcbiAgICAgICAgZm9yKGxldCBhY3RvciBvZiB0aGlzLm1hcC5HZXRBY3RvcnMoKS5MaXN0KCkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGF3YWl0IGNvbm4uU2V0RWxlbWVudChhY3Rvcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXQgY2VsbHNcbiAgICAgICAgZm9yKGxldCBjZWxsIG9mIHRoaXMubWFwLkdldENlbGxzKCkuTGlzdCgpKVxuICAgICAgICB7XG4gICAgICAgICAgICBhd2FpdCBjb25uLlNldEVsZW1lbnQoY2VsbCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIFN1YnNjcmliZSB0byB0aGUgT25Db21tYW5kIGNhbGxiYWNrXG4gICAgICAgIGNvbm4uT25Db21tYW5kID0gY29tbWFuZCA9PiB0aGlzLk9uQ29tbWFuZChjb25uLCBjb21tYW5kKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFNldCBwbGF5ZXJcbiAgICAgICAgYXdhaXQgY29ubi5TZXRQbGF5ZXIocGxheWVyKTtcblxuICAgICAgICAvLyBBZGQgY2xpZW50IHRvIHRoZSBpbnRlcm5hbCBjbGllbnQgbGlzdFxuICAgICAgICB0aGlzLmNvbm5zLnB1c2goY29ubik7XG4gICAgfVxufSIsImltcG9ydCB7IE1hcCB9IGZyb20gXCIuL01hcFwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9FbGVtZW50L0Jhc2VFbGVtZW50XCI7XG5pbXBvcnQgeyBFdmVudCB9IGZyb20gXCIuL1V0aWwvRXZlbnRcIjtcblxuZXhwb3J0IGNsYXNzIFJlbmRlcmVyXG57XG4gICAgcHJpdmF0ZSByZWFkb25seSBkcGk6IG51bWJlciA9IDMwO1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBtYXA6IE1hcDtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG4gICAgcHJpdmF0ZSByZWFkb25seSBjb250ZXh0OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XG4gICAgXG4gICAgcHJpdmF0ZSB0ZXh0dXJlczogeyBbaWQ6IHN0cmluZ106IEhUTUxJbWFnZUVsZW1lbnQgfSA9IHt9O1xuICAgIHByaXZhdGUgc3RvcDtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdCBhIG5ldyBnYW1lIG9iamVjdC5cbiAgICAgKi9cbiAgICBwdWJsaWMgY29uc3RydWN0b3IobWFwOiBNYXAsIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpXG4gICAge1xuICAgICAgICB0aGlzLm1hcCA9IG1hcDtcbiAgICAgICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IDxDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ+Y2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkIHRleHR1cmVzIGZvciBhIGxvYWRlZCBtYXAuXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIExvYWQoKTogUHJvbWlzZTx2b2lkPlxuICAgIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IFxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50cyA9IHRoaXMubWFwLkdldEVsZW1lbnRzKCk7XG4gICAgICAgICAgICBsZXQgaSA9IDA7XG4gICAgXG4gICAgICAgICAgICBlbGVtZW50cy5Gb3JFYWNoKGVsZW1lbnQgPT5cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZighZWxlbWVudClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBpZCA9IGVsZW1lbnQuR2V0VGV4dHVyZSgpO1xuXG4gICAgICAgICAgICAgICAgaWYodGhpcy50ZXh0dXJlc1tpZF0gIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IHRleHR1cmUgPSBuZXcgSW1hZ2UoKTtcbiAgICBcbiAgICAgICAgICAgICAgICB0ZXh0dXJlLm9uZXJyb3IgPSAoKSA9PiByZWplY3QoKTtcbiAgICAgICAgICAgICAgICB0ZXh0dXJlLm9ubG9hZCA9ICgpID0+IFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50ZXh0dXJlc1tpZF0gPSB0ZXh0dXJlO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZigrK2kgPT0gZWxlbWVudHMuR2V0TGVuZ3RoKCkpIFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdGV4dHVyZS5zcmMgPSBpZDtcblxuICAgICAgICAgICAgICAgIHRoaXMudGV4dHVyZXNbaWRdID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICogRHJhdyB0aGUgZ2l2ZW4gZWxlbWVudCBvbnRvIHRoZSBjYW52YXMuXG4gICAgICogQHBhcmFtIGVsZW1lbnRcbiAgICAgKi9cbiAgICBwcml2YXRlIERyYXcoZWxlbWVudDogQmFzZUVsZW1lbnQpXG4gICAge1xuICAgICAgICBpZighZWxlbWVudClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBjb29yZCA9IGVsZW1lbnQuR2V0UG9zKCk7XG4gICAgICAgIGNvbnN0IHNpemUgPSBlbGVtZW50LkdldFNpemUoKTtcbiAgICAgICAgY29uc3QgdGV4dHVyZSA9IHRoaXMudGV4dHVyZXNbZWxlbWVudC5HZXRUZXh0dXJlKCldO1xuICAgIFxuICAgICAgICBjb25zdCB4ID0gY29vcmQuWDtcbiAgICAgICAgY29uc3QgeSA9IGNvb3JkLlk7XG4gICAgICAgIGNvbnN0IHcgPSBzaXplLlg7XG4gICAgICAgIGNvbnN0IGggPSBzaXplLlk7XG4gICAgXG4gICAgICAgIHRoaXMuY29udGV4dC5kcmF3SW1hZ2UoXG4gICAgICAgICAgICB0ZXh0dXJlLCBcbiAgICAgICAgICAgIHggKiB0aGlzLmRwaSwgXG4gICAgICAgICAgICB5ICogdGhpcy5kcGksIFxuICAgICAgICAgICAgdyAqIHRoaXMuZHBpLCBcbiAgICAgICAgICAgIGggKiB0aGlzLmRwaSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSB0aGUgY2FudmFzLlxuICAgICAqL1xuICAgIHByaXZhdGUgVXBkYXRlKClcbiAgICB7XG4gICAgICAgIGNvbnN0IHNpemUgPSB0aGlzLm1hcC5HZXRTaXplKCk7XG4gICAgXG4gICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5kcGkgKiBzaXplLlg7XG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuZHBpICogc2l6ZS5ZO1xuICAgICAgICB0aGlzLmNhbnZhcy5zdHlsZS53aWR0aCA9IHRoaXMuZHBpICogc2l6ZS5YICsgXCJweFwiO1xuICAgICAgICB0aGlzLmNhbnZhcy5zdHlsZS5oZWlnaHQgPSB0aGlzLmRwaSAqIHNpemUuWSArIFwicHhcIjtcbiAgICAgICAgXG4gICAgICAgIHRoaXMubWFwLkdldENlbGxzKCkuRm9yRWFjaChlID0+IHRoaXMuRHJhdyhlKSk7XG4gICAgICAgIHRoaXMubWFwLkdldEFjdG9ycygpLkZvckVhY2goZSA9PiB0aGlzLkRyYXcoZSkpO1xuICAgIFxuICAgICAgICBpZighdGhpcy5zdG9wKVxuICAgICAgICB7XG4gICAgICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHRoaXMuVXBkYXRlKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5PblVwZGF0ZS5DYWxsKG51bGwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IHJlbmRlcmluZy5cbiAgICAgKi9cbiAgICBwdWJsaWMgU3RhcnQoKVxuICAgIHtcbiAgICAgICAgdGhpcy5zdG9wID0gZmFsc2U7XG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gdGhpcy5VcGRhdGUoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RvcCByZW5kZXJpbmcuXG4gICAgICovXG4gICAgcHVibGljIFN0b3AoKVxuICAgIHtcbiAgICAgICAgdGhpcy5zdG9wID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiByZWRyYXcuXG4gICAgICovXG4gICAgcHVibGljIE9uVXBkYXRlOiBFdmVudDx2b2lkPiA9IG5ldyBFdmVudCgpO1xufSIsImV4cG9ydCBjbGFzcyBFdmVudDxUPlxue1xuICAgIHByb3RlY3RlZCBsaXN0ZW5lcnM6IHsgW2lkOiBudW1iZXJdOiAodmFsdWU6IFQpID0+IHZvaWQgfSA9IHt9O1xuICAgIHByaXZhdGUgY291bnQgPSAwO1xuXG4gICAgLyoqXG4gICAgICogQWRkIGEgbGlzdGVuZXIuXG4gICAgICogQHBhcmFtIGNhbGxiYWNrIFxuICAgICAqL1xuICAgIHB1YmxpYyBBZGQoY2FsbGJhY2s6ICh2YWx1ZTogVCkgPT4gdm9pZCk6IG51bWJlclxuICAgIHtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnNbKyt0aGlzLmNvdW50XSA9IGNhbGxiYWNrO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMuY291bnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgbGlzdGVuZXIuXG4gICAgICogQHBhcmFtIGlkIFxuICAgICAqL1xuICAgIHB1YmxpYyBSZW1vdmUoaWQ6IG51bWJlcik6IHZvaWRcbiAgICB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmxpc3RlbmVyc1tpZF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbCBsaXN0ZW5lcnMgd2l0aCB0aGUgZ2l2ZW4gdmFsdWUuXG4gICAgICogQHBhcmFtIHZhbHVlIFxuICAgICAqL1xuICAgIHB1YmxpYyBDYWxsKHZhbHVlOiBUKTogdm9pZFxuICAgIHtcbiAgICAgICAgKDxhbnk+T2JqZWN0KS52YWx1ZXModGhpcy5saXN0ZW5lcnMpLmZvckVhY2goY2FsbGJhY2sgPT4gY2FsbGJhY2sodmFsdWUpKTtcbiAgICB9XG59IiwiZXhwb3J0IGNsYXNzIEhlbHBlclxue1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbiBhc3luYyByZXF1ZXN0LlxuICAgICAqIEBwYXJhbSB1cmwgXG4gICAgICogQHBhcmFtIGRhdGEgXG4gICAgICogQHBhcmFtIG1ldGhvZCBcbiAgICAgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBhc3luYyBBamF4KHVybDogc3RyaW5nLCBkYXRhOiBzdHJpbmcsIG1ldGhvZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+XG4gICAge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8c3RyaW5nPihyZXNvbHZlID0+IFxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgICAgICByZXF1ZXN0Lm9wZW4obWV0aG9kLCB1cmwsIHRydWUpO1xuXG4gICAgICAgICAgICByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmKHJlcXVlc3QucmVhZHlTdGF0ZSAhPSA0KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0LnN0YXR1cyA9PSAyMDApIFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmKGRhdGEgIT0gbnVsbCAmJiBkYXRhLmxlbmd0aCA+IDApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcbiAgICAgICAgICAgICAgICByZXF1ZXN0LnNlbmQoZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5zZW5kKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBvc3QgcmVxdWVzdCB3aXRoIEpTT04gZGF0YS5cbiAgICAgKiBAcGFyYW0gdXJsIFxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBQb3N0KHVybDogc3RyaW5nLCBkYXRhOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz5cbiAgICB7XG4gICAgICAgIHJldHVybiBhd2FpdCBIZWxwZXIuQWpheCh1cmwsIGRhdGEsIFwiUE9TVFwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgcmVxdWVzdCB0byB0aGUgZ2l2ZW4gVVJMLlxuICAgICAqIEBwYXJhbSB1cmwgXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBHZXQodXJsOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz5cbiAgICB7XG4gICAgICAgIHJldHVybiBhd2FpdCBIZWxwZXIuQWpheCh1cmwsIG51bGwsIFwiR0VUXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuY29kZSBhIHN0cmluZyBpbnRvIGJhc2U2NC5cbiAgICAgKiBAcGFyYW0gaW5wdXQgXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBCYXNlNjRFbmNvZGUoaW5wdXQ6IHN0cmluZyk6IHN0cmluZ1xuICAgIHtcbiAgICAgICAgcmV0dXJuIGJ0b2EoaW5wdXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlY29kZSBhIHN0cmluZyBmcm9tIGJhc2U2NC5cbiAgICAgKiBAcGFyYW0gaW5wdXQgXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBCYXNlNjREZWNvZGUoaW5wdXQ6IHN0cmluZyk6IHN0cmluZ1xuICAgIHtcbiAgICAgICAgcmV0dXJuIGF0b2IoaW5wdXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIG1pbiAoaW5jbHVkZWQpIGFuZCBtYXggKGluY2x1ZGVkKS5cbiAgICAgKiBAcGFyYW0gbWluIFxuICAgICAqIEBwYXJhbSBtYXggXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBSYW5kb20obWluOiBudW1iZXIsIG1heDogbnVtYmVyKTogbnVtYmVyXG4gICAge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpICsgbWluKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb3B5IHByb3BlcnRpZXMgZnJvbSBvbmUgb2JqZWN0IHRvIGFub3RoZXIuXG4gICAgICogQHBhcmFtIHRvIFxuICAgICAqIEBwYXJhbSBmcm9tIFxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgRXh0cmFjdCh0bzogT2JqZWN0LCBmcm9tOiBPYmplY3QpIFxuICAgIHtcbiAgICAgICAgZm9yIChsZXQga2V5IGluIGZyb20pIFxuICAgICAgICB7XG4gICAgICAgICAgICBpZihmcm9tLmhhc093blByb3BlcnR5KGtleSkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdG9ba2V5XSA9IGZyb21ba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBCaW5kIHByb3BlcnRpZXMgZnJvbSBvbmUgb2JqZWN0IHRvIGFub3RoZXIuXG4gICAgICogQHBhcmFtIHRvIFxuICAgICAqIEBwYXJhbSBmcm9tIFxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgQmluZCh0bzogT2JqZWN0LCBmcm9tOiBPYmplY3QsIHByb3BlcnRpZXM6IHN0cmluZ1tdKSBcbiAgICB7XG4gICAgICAgIGZvciAobGV0IGtleSBpbiBwcm9wZXJ0aWVzKSBcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgcCA9IHByb3BlcnRpZXNba2V5XTtcblxuICAgICAgICAgICAgaWYoZnJvbVtwXSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRvW3BdID0gZnJvbVtwXS5iaW5kKGZyb20pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVW5pcXVlIElEIGdlbmVyYXRhaW9uXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBVbmlxdWUoKTogc3RyaW5nIFxuICAgIHtcbiAgICAgICAgbGV0IGRhdGUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBcInh4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eFwiLnJlcGxhY2UoL1t4eV0vZywgYyA9PlxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCByID0gKGRhdGUgKyBNYXRoLnJhbmRvbSgpICogMTYpICUgMTYgfCAwO1xuXG4gICAgICAgICAgICBkYXRlID0gTWF0aC5mbG9vcihkYXRlIC8gMTYpO1xuXG4gICAgICAgICAgICByZXR1cm4gKGMgPT09IFwieFwiID8gciA6IChyICYgMHg3IHwgMHg4KSkudG9TdHJpbmcoMTYpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0aGUgc3RyaW5nIGlzIGEgdW5pcXVlIElEIGdlbmVyYXRlZCBieSB0aGUgVW5pcXVlKCkgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHVuaXF1ZSBcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIElzVW5pcXVlKHVuaXF1ZTogc3RyaW5nKTogYm9vbGVhblxuICAgIHtcbiAgICAgICAgY29uc3QgcmUgPSBSZWdFeHAoXG4gICAgICAgICAgICBcIl5bMC05YS1mQS1GXXs4fS1cIiArIFxuICAgICAgICAgICAgXCJbMC05YS1mQS1GXXs0fS1cIiArIFxuICAgICAgICAgICAgXCI0WzAtOWEtZkEtRl17M30tXCIgKyBcbiAgICAgICAgICAgIFwiWzAtOWEtZkEtRl17NH0tXCIgKyBcbiAgICAgICAgICAgIFwiWzAtOWEtZkEtRl17MTJ9XCIpXG5cbiAgICAgICAgcmV0dXJuIHJlLnRlc3QodW5pcXVlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIb29rIGludG8gYW4gb2JqZWN0IGFuZCBpbnRlcmNlcHQgYWxsIGZ1bmN0aW9uIGNhbGxzLlxuICAgICAqIEBwYXJhbSBvYmplY3QgXG4gICAgICogQHBhcmFtIGhvb2sgRnVuY3Rpb24gdG8gcnVuIGJlZm9yZSBlYWNoIGNhbGwuXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBIb29rKG9iamVjdDogYW55LCBob29rOiAodGFyZ2V0LCBwcm9wLCBhcmdzKSA9PiB2b2lkKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm94eShvYmplY3QsIFxuICAgICAgICB7XG4gICAgICAgICAgICBnZXQ6ICh0YXJnZXQsIHByb3AsIHJlY2VpdmVyKSA9PlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmKHR5cGVvZiB0YXJnZXRbcHJvcF0gIT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3QuZ2V0KHRhcmdldCwgcHJvcCwgcmVjZWl2ZXIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiAoLi4uYXJncykgPT5cbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGhvb2sodGFyZ2V0LCBwcm9wLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0YXJnZXRbcHJvcF0uYmluZCh0YXJnZXQpKC4uLmFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBub29wIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgTm9vcCgpXG4gICAge1xuICAgICAgICByZXR1cm47XG4gICAgfVxufSIsImV4cG9ydCBjbGFzcyBLZXlib2FyZFxue1xuICAgIHB1YmxpYyBzdGF0aWMgS2V5czogeyBba2V5OiBzdHJpbmddOiBib29sZWFuIH0gPSB7fTtcbiAgICBwcml2YXRlIHN0YXRpYyBJbml0ZWQgPSBmYWxzZTtcblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVkIHdoZW4gYSBrZXkgaXMgcHJlc3NlZC5cbiAgICAgKiBAcGFyYW0gZXZlbnQgXG4gICAgICogQHBhcmFtIHN0YXRlIFxuICAgICAqL1xuICAgIHByaXZhdGUgc3RhdGljIE9uS2V5KGV2ZW50LCBzdGF0ZTogYm9vbGVhbik6IHZvaWRcbiAgICB7XG4gICAgICAgIEtleWJvYXJkLktleXNbZXZlbnQua2V5LnRvVXBwZXJDYXNlKCldID0gc3RhdGU7XG4gICAgICAgIEtleWJvYXJkLktleXNbZXZlbnQua2V5LnRvTG93ZXJDYXNlKCldID0gc3RhdGU7XG4gICAgICAgIEtleWJvYXJkLktleXNbZXZlbnQua2V5Q29kZV0gPSBzdGF0ZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogSW5pdCBrZXlib2FyZCBsaXN0ZW5lcnMuXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBJbml0KCk6IHZvaWRcbiAgICB7XG4gICAgICAgIGlmKEtleWJvYXJkLkluaXRlZClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgS2V5Ym9hcmQuSW5pdGVkID0gdHJ1ZTtcblxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZSA9PiBLZXlib2FyZC5PbktleShlLCB0cnVlKSwgZmFsc2UpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIGUgPT4gS2V5Ym9hcmQuT25LZXkoZSwgZmFsc2UpLCBmYWxzZSk7XG4gICAgfVxufSIsImV4cG9ydCBlbnVtIExvZ1R5cGVcbntcbiAgICBTaWxlbnQgPSAwLFxuICAgIFdhcm4gPSAxLFxuICAgIEluZm8gPSAyLFxuICAgIFZlcmJvc2UgPSAzXG59IiwiaW1wb3J0IHsgTG9nVHlwZSB9IGZyb20gXCIuL0xvZ1R5cGVcIjtcblxuZXhwb3J0IGNsYXNzIExvZ2dlclxue1xuICAgIHB1YmxpYyBzdGF0aWMgVHlwZTogTG9nVHlwZSA9IExvZ1R5cGUuU2lsZW50O1xuXG4gICAgLyoqXG4gICAgICogTG9nIGEgbWVzc2FnZS5cbiAgICAgKiBAcGFyYW0gc2VsZlxuICAgICAqIEBwYXJhbSBhcmdzIFxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgTG9nKHNlbGY6IE9iamVjdCwgdHlwZTogTG9nVHlwZSwgLi4uYXJnczogYW55W10pXG4gICAge1xuICAgICAgICBpZih0aGlzLlR5cGUgPj0gdHlwZSlcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCgke3R5cGV9KSBbJHtzZWxmLmNvbnN0cnVjdG9yLm5hbWV9XSBgLCAuLi5hcmdzKTtcbiAgICAgICAgfVxuICAgIH1cbn0iXX0=
