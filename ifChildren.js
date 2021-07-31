"use strict";
exports.__esModule = true;
exports.ifChildren = void 0;
var childrenBuilder_1 = require("./childrenBuilder");
var util_1 = require("./util");
/**
 * 子元素集片段是动态生成的，watchAfter后直接新入
 * @param fun
 */
function ifChildren(fun) {
    return function (parent, me) {
        var currentObject;
        var virtualChild;
        var currentLifeModel;
        var life = util_1.onceLife({
            init: function () {
                if (currentObject) {
                    util_1.orInit(currentObject);
                }
            },
            destroy: function () {
                w.disable();
                if (currentObject) {
                    util_1.orDestroy(currentObject);
                }
                currentLifeModel.destroy();
            }
        });
        var w = util_1.mve.WatchExp(function () {
            if (currentLifeModel) {
                currentLifeModel.destroy();
            }
            currentLifeModel = util_1.mve.newLifeModel();
        }, function () {
            return fun(currentLifeModel.me);
        }, function (children) {
            if (virtualChild) {
                parent.remove(0);
                virtualChild = null;
            }
            if (currentObject) {
                if (life.isInit) {
                    util_1.orDestroy(currentObject);
                }
                currentObject = null;
            }
            if (children) {
                //初始化
                virtualChild = parent.newChildAtLast();
                currentObject = childrenBuilder_1.baseChildrenBuilder(currentLifeModel.me, children, virtualChild);
                if (life.isInit) {
                    util_1.orInit(currentObject);
                }
            }
        });
        return life.out;
    };
}
exports.ifChildren = ifChildren;
