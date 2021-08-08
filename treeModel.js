"use strict";
exports.__esModule = true;
exports.rnModelList = exports.rwNodeOf = exports.listModelChilren = exports.superModelList = exports.ModelLife = exports.VirtualListParam = void 0;
var modelChildren_1 = require("./modelChildren");
var util_1 = require("./util");
var virtualTreeChildren_1 = require("./virtualTreeChildren");
var VirtualListParam = /** @class */ (function () {
    function VirtualListParam(list, up) {
        this.list = list;
        this.up = up;
    }
    VirtualListParam.prototype.remove = function (e) {
        var after = this.up.after(e);
        var before = this.up.before(e);
        if (after) {
            this.up.before(after, before);
        }
        if (before) {
            this.up.after(before, after);
        }
        this.list.remove(this.up.index(e));
        //更新计数
        var tmp = after;
        if (tmp) {
            while (tmp) {
                this.up.index(tmp, this.up.index(tmp) - 1);
                tmp = this.up.after(tmp);
            }
        }
    };
    VirtualListParam.prototype.append = function (e, isMove) {
        if (isMove) {
            //还在树节点上
            this.list.move(this.up.index(e), this.list.size() - 1);
            //begin对应之前e后面一位，end取列表宽度
            var begin = this.up.index(e), end = this.list.size();
            for (var i = begin; i < end; i++) {
                this.up.index(this.list.get(i), i);
            }
        }
        else {
            var size = this.list.size();
            var last = this.list.get(size - 1);
            if (last) {
                this.up.after(last, e);
                this.up.before(e, last);
            }
            this.list.insert(size, e);
            //更新位置
            this.up.index(e, size);
        }
    };
    VirtualListParam.prototype.insertBefore = function (e, old, isMove) {
        if (isMove) {
            //还在节点上
            if (this.up.index(e) < this.up.index(old)) {
                //前移到后
                this.list.move(this.up.index(e), this.up.index(old) - 1);
                //begin取之前e后面一位，end取old的坐标。old不变，old前为e要更新
                var begin = this.up.index(e), end = this.up.index(old);
                for (var i = begin; i < end; i++) {
                    this.up.index(this.list.get(i), i);
                }
            }
            else {
                //后移到前
                this.list.move(this.up.index(e), this.up.index(old));
                //begin取old前一位，即e，要更新。end取e原来后面一位，e原来前面一们变成e.index要更新
                var begin = this.up.index(old) - 1, end = this.up.index(e) + 1;
                for (var i = begin; i < end; i++) {
                    this.up.index(this.list.get(i), i);
                }
            }
        }
        else {
            var before = this.up.before(old);
            if (before) {
                this.up.after(before, e);
                this.up.before(e, before);
            }
            this.up.after(e, old);
            this.up.before(old, e);
            this.list.insert(this.up.index(old), e);
            //更新位置
            this.up.index(e, this.up.index(old));
            while (old) {
                this.up.index(old, this.up.index(old) + 1);
                old = this.up.after(old);
            }
        }
    };
    return VirtualListParam;
}());
exports.VirtualListParam = VirtualListParam;
function childBuilder(out, child, parent) {
    if (util_1.isArray(child)) {
        var i = 0;
        while (i < child.length) {
            childBuilder(out, child[i], parent);
            i++;
        }
    }
    else if (isModelItemFun(child)) {
        out.push(child(parent.newChildAtLast()));
    }
    else if (child instanceof ModelLife) {
        out.push(child.destroy);
    }
    else {
        parent.push(child);
    }
}
var ModelLife = /** @class */ (function () {
    function ModelLife(destroy) {
        this.destroy = destroy;
    }
    return ModelLife;
}());
exports.ModelLife = ModelLife;
function isModelItemFun(v) {
    return typeof (v) == 'function';
}
function baseChildrenBuilder(children, parent) {
    var out = [];
    childBuilder(out, children, parent);
    return function () {
        out.forEach(function (v) { return v(); });
    };
}
/**
 * 自定义类似于重复的子节点。需要将其添加到生命周期。
 * @param root
 */
function superModelList(root, vp) {
    var list = util_1.mve.arrayModelOf([]);
    var destroy = baseChildrenBuilder(root, virtualTreeChildren_1.VirtualChild.newRootChild(new VirtualListParam(list, vp)));
    return {
        model: list,
        destroy: destroy
    };
}
exports.superModelList = superModelList;
var ModelChildView = /** @class */ (function () {
    function ModelChildView(value, index, destroy) {
        this.value = value;
        this.index = index;
        this.destroy = destroy;
    }
    return ModelChildView;
}());
function superListModelChildren(views, model, fun) {
    return function (parent) {
        var theView = {
            insert: function (index, row) {
                var vindex = util_1.mve.valueOf(index);
                var value = fun(row, vindex);
                var vm = parent.newChildAt(index);
                var vx = baseChildrenBuilder(value, vm);
                var view = new ModelChildView(value, vindex, vx);
                views.insert(index, view);
                modelChildren_1.initUpdateIndex(views, index);
            },
            remove: function (index) {
                var view = views.get(index);
                if (view) {
                    views.remove(index);
                    parent.remove(index);
                    modelChildren_1.removeUpdateIndex(views, index);
                    view.destroy();
                }
            },
            move: function (oldIndex, newIndex) {
                views.move(oldIndex, newIndex);
                parent.move(oldIndex, newIndex);
                modelChildren_1.moveUpdateIndex(views, oldIndex, newIndex);
            }
        };
        model.addView(theView);
        return function () {
            model.removeView(theView);
        };
    };
}
/**
 * 类似于modelChildren
 * 但是如果单纯的树，叶子节点交换，并不能观察到是交换
 * @param model
 * @param fun
 */
function listModelChilren(model, fun) {
    return superListModelChildren(new util_1.SimpleArray(), model, fun);
}
exports.listModelChilren = listModelChilren;
function rwNodeOf(v) {
    return new RWNode(v);
}
exports.rwNodeOf = rwNodeOf;
var RWNode = /** @class */ (function () {
    function RWNode(data) {
        this.data = data;
        this.index = util_1.mve.valueOf(null);
        this.before = util_1.mve.valueOf(null);
        this.after = util_1.mve.valueOf(null);
    }
    return RWNode;
}());
var RMList = {
    index: function (v, i) {
        if (arguments.length == 1) {
            return v.index();
        }
        else {
            v.index(i);
        }
    },
    before: function (v, b) {
        if (arguments.length == 1) {
            return v.before();
        }
        else {
            v.before(b);
        }
    },
    after: function (v, b) {
        if (arguments.length == 1) {
            return v.after();
        }
        else {
            v.after(b);
        }
    }
};
function rnModelList(root) {
    return superModelList(root, RMList);
}
exports.rnModelList = rnModelList;