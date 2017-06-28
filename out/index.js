"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const path = require("path");
function main(port = 8080) {
    const app = express();
    app.use(express.static(path.join(__dirname, "www")));
    app.listen(port, function () {
        console.log(`RoboLand listening on port ${port}}!`);
    });
}
exports.main = main;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFtQztBQUNuQyw2QkFBNEI7QUFFNUIsY0FBcUIsT0FBZSxJQUFJO0lBRXBDLE1BQU0sR0FBRyxHQUFHLE9BQU8sRUFBRSxDQUFDO0lBRXRCLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFckQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUU7UUFFYixPQUFPLENBQUMsR0FBRyxDQUFDLDhCQUE4QixJQUFJLElBQUksQ0FBQyxDQUFDO0lBQ3hELENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQVZELG9CQVVDIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZXhwcmVzcyBmcm9tIFwiZXhwcmVzc1wiO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYWluKHBvcnQ6IG51bWJlciA9IDgwODApXHJcbntcclxuICAgIGNvbnN0IGFwcCA9IGV4cHJlc3MoKTtcclxuXHJcbiAgICBhcHAudXNlKGV4cHJlc3Muc3RhdGljKHBhdGguam9pbihfX2Rpcm5hbWUsIFwid3d3XCIpKSk7XHJcblxyXG4gICAgYXBwLmxpc3Rlbihwb3J0LCBmdW5jdGlvbiAoKSBcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgUm9ib0xhbmQgbGlzdGVuaW5nIG9uIHBvcnQgJHtwb3J0fX0hYCk7XHJcbiAgICB9KTtcclxufSJdfQ==
