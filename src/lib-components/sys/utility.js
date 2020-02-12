import Vue from 'vue'

function ToKerbabCase(str){
    // https://gist.github.com/thevangelist/8ff91bac947018c9f3bfaad6487fa149
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();
}

const registerComs = {};
setTimeout(() => {
    for (const key in Vue.options.components) {
        const com = Vue.options.components[key];
        if(!com.options || !com.options.model) continue;
        registerComs[ToKerbabCase(key)] = {
            model: com.options.model
        };
    }
}, 100);


// 获取tag对应的model
export function GetTagModel(tag){
    const com = registerComs[tag];
    if(!com) return {};
    return com.model || {};
}


// 对数进行取整
export function QuZheng(val){
    return Math.round(val/10)*10;
}

// 获取样式值
export function GetStyleValue(val){
    if(!val || val == "0" || val == "0px") return null;
    if(/^[\d\.]+$/.test(val)) return val+"px"; // 默认px
    return val;
}

// 获取padding样式
export function GetStylePadding(val){
    if(!val || val == "0" || val == "0px") return null;
    if(typeof val == "number")
        return val + 'px';
    return val.replace(/\d+(?!px)/g, "$&px");
}

// 定时器助手
export class TimerHeper {
    constructor(){
        this.timerId = 0;
    }

    ExecAfter(msec, fnt) {
        if(this.timerId) clearTimeout(this.timerId);
        this.timerId = setTimeout(()=>{
            fnt();
            this.timerId = 0;
        }, msec);
    }
}

// 从数组里移除某个元素
export function ArrayRemove(arr, item){
    let index = arr.indexOf(item);
    if(index != -1){
        arr.splice(index, 1);
    }
}

function BreakException() {
}

class TreeHelper {
    constructor(childrenField = "children", parentField = "parent"){
        this.parentField = parentField;
        this.childrenField = childrenField;
    }

    LoopCore(tree, parent) {
        if(!tree) return;
        for (let i = 0; i < tree.length; i++) {
          const node = tree[i];
          if(this.skipNode == node) continue;
          if(this.reverse){
            this.LoopCore(node[this.childrenField], node);
            if(this.iterate(node, parent) === false){
                throw new BreakException();
            }
          }
          else{
            let rtn = this.iterate(node, parent);
            if(rtn === false){
                throw new BreakException();
            }
            else if(rtn === true){
            }
            else{
                this.LoopCore(node[this.childrenField], node);
            }
          }
        }
    }

    Loop(tree, iterate, reverse, skipNode) {
        if(!tree || !tree.length) return;
        try {
            this.reverse = reverse;
            this.iterate = iterate;
            this.skipNode = skipNode;
            this.LoopCore(tree, null);
        } catch (error) {
            if(error instanceof BreakException){
                //console.log("结束树循环");
            }
            else{
                throw error;
            }
        }
    }
}
// 遍历树
export function TreeLoop(tree, iterate, reverse, childrenField){
    new TreeHelper(childrenField).Loop(tree, iterate, reverse);
}

// 遍历树(跳过某个节点)
export function TreeLoopSkip(tree, skipNode, iterate, reverse, childrenField){
    new TreeHelper(childrenField).Loop(tree, iterate, reverse, skipNode);
}

// 从树上查找单个元素
export function TreeFindSingle(tree, where, reverse){
    let rtn = null
    TreeLoop(tree, node=>{
        if(where(node)){
            rtn = node;
            return false;
        }
    }, reverse)
    return rtn;
}

// 从树上查找集合元素
export function TreeFindCollect(tree, where) {
    let rtn = [];
    TreeLoop(tree, node=>{
        if(where(node)){
            rtn.push(node);
        }
    })
    return rtn;
}

// 从树上删除某个元素
export function TreeDelItem(tree, delItem){
    let parent = delItem.parent;
    let children = parent ? parent.children : tree;
    let index = children.indexOf(delItem);
    if(index != -1){
        children.splice(index, 1);
    }
}

// 添加新元素到树上的某个节点
export function TreeInserItem(tree, parent, child, beforeChild){
    let arr = parent ? parent.children : tree;
    if(beforeChild){
        let index = arr.indexOf(beforeChild);
        if(index != -1){
            arr.splice(index, 0, child);
        }
    }
    else{
        arr.push(child);
    }
}

// 添加新元素到树上的某个节点
export function TreeMoveItem(tree, parent, child, beforeChild){
    if(child == beforeChild) return;
    TreeDelItem(tree, child);
    TreeInserItem(tree, parent, child, beforeChild);
}