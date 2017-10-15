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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93d3cvbGliL0VsZW1lbnQvQ2VsbC9XYXRlckNlbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2Q0FBeUM7QUFFekMsMENBQXVDO0FBQ3ZDLHlDQUFzQztBQUV0QyxlQUF1QixTQUFRLHVCQUFVO0lBSzlCLE9BQU87UUFFVixNQUFNLENBQUMsbUJBQVEsQ0FBQyxLQUFLLENBQUM7SUFDMUIsQ0FBQztJQUtNLFVBQVU7UUFFYixNQUFNLENBQUMsZUFBZSxDQUFDO0lBQzNCLENBQUM7SUFNTSxRQUFRLENBQUMsS0FBYTtRQUV6QixNQUFNLENBQUMsbUJBQVEsQ0FBQyxNQUFNLENBQUM7SUFDM0IsQ0FBQztDQUNKO0FBMUJELDhCQTBCQyIsImZpbGUiOiJ3d3cvbGliL0VsZW1lbnQvQ2VsbC9XYXRlckNlbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBHcm91bmRDZWxsIH0gZnJvbSBcIi4vR3JvdW5kQ2VsbFwiXHJcbmltcG9ydCB7IElSb2JvdCB9IGZyb20gXCIuLi9Sb2JvdC9JUm9ib3RcIjtcclxuaW1wb3J0IHsgTW92ZVR5cGUgfSBmcm9tIFwiLi4vTW92ZVR5cGVcIjtcclxuaW1wb3J0IHsgQ2VsbFR5cGUgfSBmcm9tIFwiLi9DZWxsVHlwZVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFdhdGVyQ2VsbCBleHRlbmRzIEdyb3VuZENlbGxcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIHR5cGUgb2YgdGhlIGNlbGwuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBHZXRUeXBlKCk6IENlbGxUeXBlXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIENlbGxUeXBlLldhdGVyO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSB0ZXh0dXJlIG9mIHRoZSBjZWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgR2V0VGV4dHVyZSgpOiBzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gXCJyZXMvd2F0ZXIucG5nXCI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbnRlciBhIGNlbGwgd2l0aCBhIHJvYm90IGFuZCBraWxsIGl0LlxyXG4gICAgICogQHBhcmFtIHJvYm90IFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgTW92ZUhlcmUocm9ib3Q6IElSb2JvdCk6IE1vdmVUeXBlIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBNb3ZlVHlwZS5LaWxsZWQ7XHJcbiAgICB9XHJcbn0iXX0=
