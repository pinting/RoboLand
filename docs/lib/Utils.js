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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93d3cvbGliL1V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQTtJQVFZLE1BQU0sQ0FBTyxJQUFJLENBQUMsR0FBVyxFQUFFLElBQVksRUFBRSxNQUFjOztZQUUvRCxNQUFNLENBQUMsSUFBSSxPQUFPLENBQVMsT0FBTztnQkFFOUIsSUFBSSxPQUFPLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztnQkFFbkMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUVoQyxPQUFPLENBQUMsa0JBQWtCLEdBQUc7b0JBRXpCLEVBQUUsQ0FBQSxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQzNCLENBQUM7d0JBQ0csTUFBTSxDQUFDO29CQUNYLENBQUM7b0JBRUQsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FDMUIsQ0FBQzt3QkFDRyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUNsQyxDQUFDO29CQUNELElBQUksQ0FDSixDQUFDO3dCQUNHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDbEIsQ0FBQztnQkFDTCxDQUFDLENBQUM7Z0JBRUYsRUFBRSxDQUFBLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUNuQyxDQUFDO29CQUNHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztvQkFDN0QsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkIsQ0FBQztnQkFDRCxJQUFJLENBQ0osQ0FBQztvQkFDRyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ25CLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7S0FBQTtJQUtNLE1BQU0sQ0FBTyxJQUFJLENBQUMsR0FBVyxFQUFFLElBQVk7O1lBRTlDLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMvQyxDQUFDO0tBQUE7SUFNTSxNQUFNLENBQU8sR0FBRyxDQUFDLEdBQVc7O1lBRS9CLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM5QyxDQUFDO0tBQUE7SUFPTSxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQVcsRUFBRSxHQUFXO1FBRXpDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQU9NLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBVSxFQUFFLElBQVk7UUFFMUMsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLENBQ3JCLENBQUM7WUFDRyxFQUFFLENBQUEsQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQzFCLENBQUM7Z0JBQ0csRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN4QixDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7SUFLTSxNQUFNLENBQUMsSUFBSTtRQUVkLE1BQU0sQ0FBQztJQUNYLENBQUM7Q0FDSjtBQS9GRCxzQkErRkMiLCJmaWxlIjoid3d3L2xpYi9VdGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjbGFzcyBVdGlsc1xyXG57XHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBhbiBhc3luYyByZXF1ZXN0LlxyXG4gICAgICogQHBhcmFtIHVybCBcclxuICAgICAqIEBwYXJhbSBkYXRhIFxyXG4gICAgICogQHBhcmFtIG1ldGhvZCBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgQWpheCh1cmw6IHN0cmluZywgZGF0YTogc3RyaW5nLCBtZXRob2Q6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPlxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KHJlc29sdmUgPT4gXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG5cclxuICAgICAgICAgICAgcmVxdWVzdC5vcGVuKG1ldGhvZCwgdXJsLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4gXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmKHJlcXVlc3QucmVhZHlTdGF0ZSAhPSA0KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVxdWVzdC5zdGF0dXMgPT0gMjAwKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlcXVlc3QucmVzcG9uc2VUZXh0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmKGRhdGEgIT0gbnVsbCAmJiBkYXRhLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0LnNlbmQoZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0LnNlbmQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUG9zdCByZXF1ZXN0IHdpdGggSlNPTiBkYXRhLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGFzeW5jIFBvc3QodXJsOiBzdHJpbmcsIGRhdGE6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPlxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBhd2FpdCBVdGlscy5BamF4KHVybCwgZGF0YSwgXCJQT1NUXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHJlcXVlc3QgdG8gdGhlIGdpdmVuIFVSTC5cclxuICAgICAqIEBwYXJhbSB1cmwgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgYXN5bmMgR2V0KHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IFV0aWxzLkFqYXgodXJsLCBudWxsLCBcIkdFVFwiKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIG1pbiAoaW5jbHVkZWQpIGFuZCBtYXggKGluY2x1ZGVkKS5cclxuICAgICAqIEBwYXJhbSBtaW4gXHJcbiAgICAgKiBAcGFyYW0gbWF4IFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIFJhbmRvbShtaW46IG51bWJlciwgbWF4OiBudW1iZXIpOiBudW1iZXJcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpICsgbWluKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvcHkgcHJvcGVydGllcyBmcm9tIG9uZSBvYmplY3QgdG8gYW5vdGhlci5cclxuICAgICAqIEBwYXJhbSB0byBcclxuICAgICAqIEBwYXJhbSBmcm9tIFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIEV4dHJhY3QodG86IE9iamVjdCwgZnJvbTogT2JqZWN0KSBcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gZnJvbSkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZih0by5oYXNPd25Qcm9wZXJ0eShrZXkpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0b1trZXldID0gZnJvbVtrZXldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQSBub29wIGZ1bmN0aW9uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIE5vb3AoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxufSJdfQ==
