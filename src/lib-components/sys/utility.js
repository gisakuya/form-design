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
    if(/^[\d.]+$/.test(val)) return val+"px"; // 默认px
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

    LoopMapCore(tree, arr){
        if(!tree) return;
        for (let i = 0; i < tree.length; i++) {
          const node = tree[i];
          const newNode = this.iterate(node);
          if(!newNode) continue;
          const children = node[this.childrenField];
          if(children && children.length){
            this.LoopMapCore(children, (newNode.children = []));
          }
          arr.push(newNode);
        }
    }

    LoopMap(tree, iterate){
        this.iterate = iterate;
        const arr = [];
        this.LoopMapCore(tree, arr);
        return arr;
    }

    LoopCore(tree, parent) {
        if(!tree) return;
        for (let i = 0; i < tree.length; i++) {
          const node = tree[i];
          if(this.skipNode == node) continue;
          if(this.reverse){
            this.LoopCore(node[this.childrenField], node);
            let rtn = this.iterate(node, parent);
            if(node.$del){
                tree.splice(i, 1);
                i--;
                continue;
            }
            if(rtn === false){
                throw new BreakException();
            }
          }
          else{
            let rtn = this.iterate(node, parent);
            if(node.$del){
                tree.splice(i, 1);
                i--;
                continue;
            }
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

// 遍历树并映射
export function TreeLoopMap(tree, iterate, childrenField){
    return new TreeHelper(childrenField).LoopMap(tree, iterate);
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
    let arr = null;
    TreeLoop(tree, (item, p)=>{
        if(item == delItem){
            arr = p == null ? tree : p.children;
            return false;
        }
    })
    let index = arr.indexOf(delItem);
    if(index != -1){
        arr.splice(index, 1);
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

// 复制树里某个节点
export function TreeCopyItem(tree, node){
    let arr = null;
    TreeLoop(tree, (item, p)=>{
        if(item == node){
            arr = p == null ? tree : p.children;
            return false;
        }
    })
    const copy = DeepCopy(node);
    let index = arr.indexOf(node);
    arr.splice(index+1, 0, copy)
    return copy;
}

// 按字母顺序添加到数据
export function LetterbaseArrPush(arr, prop){
    let i = 0;
    for (; i < arr.length; i++) {
        const item = arr[i];
        if(prop.title <= item.title){
            break;
        }
    }
    arr.splice(i, 0, prop);
}

// 深度拷贝对象
export function DeepCopy(obj, iter){
    if(!obj) return obj;
    if(obj instanceof Array){
        return obj.map(x=>DeepCopyCore(x, iter));
    }
    return DeepCopyCore(obj, iter);
}
function DeepCopyCore(obj, iter){
    const objType = typeof obj;
    if(obj == null || obj == undefined || 
       objType == 'string' || objType == 'number' || objType == 'boolean') return obj;
    const copy = {};
    for (const key in obj) {
        const prop = obj[key];
        const propType = typeof prop;
        if(propType  == 'object'){
            if(prop instanceof Array){
                copy[key] = prop.map(x=> DeepCopyCore(x, iter));
            }
            else{
                copy[key] = DeepCopyCore(prop, iter);
            }
        }
        else if(propType == 'function'){
            // 跳过函数的复制
        }
        else{
            copy[key] = prop;
        }
    }
    if(iter) iter(copy);
    return copy;
}

// Foreach
export function Foreach(arr, iter){
    if(typeof arr == 'object'){
        if(arr instanceof Array){
            ForeachArray(arr, iter);
        }
        else{
            ForeachObj(arr, iter);
        }
    }
}
function ForeachArray(arr, iter){
    if(arr && arr.length){
        for (let i = 0; i < arr.length; i++) {
            const item = arr[i];
            iter(item, i, arr);
        }
    }
}
function ForeachObj(arr, iter){
    if(arr){
        for (const key in arr) {
            const item = arr[key];
            iter(item, key, arr);
        }
    }
}

// 类型转换
export function TypeParse(types, val){
    if(typeof val != "string"){
        // 值不是字符串，就不需要处理，直接返回
        return val;
    }

    if(types.includes(String)){
        // 类型里包含了字符串，直接返回
        return val;
    }

    // 特殊语法
    if(val && val.startsWith('#')){
        return val;
    }

    // 值无效
    if(!val) return val;

    for (let i = 0; i < types.length; i++) {
        const expectType = types[i]; // 期待类型
        if(expectType == Number){
            return Number(val);
        }
        else if(expectType == Boolean){
            return (val == "true");
        }
        else if(expectType == Array){
            return JSON.parse("[" + val + "]");
        }
        else if(expectType == Object){
            return JSON.parse(val);
        }
    }

    throw '无法处理';
}

// 将值转换为可视化的字符串
export function ValToString(val){
    if(val == null || val == undefined || val == '') return '';
    const valType = typeof val;
    if(valType == 'string') return val;
    if(valType == 'number' || valType == 'boolean') return String(val);
    if(valType == 'object'){
        if(val instanceof Array){
             return val.join(',');
        }
        else{
            return JSON.stringify(val);
        }
    }
    throw '无法处理';
}

// 添加子元素
export function ObjectAddChild(obj, child, childrenField = 'children'){
    if(!obj[childrenField]) obj[childrenField] = [];
    obj[childrenField].push(child);
}

// 添加子元素
export function ArrayAddChild(arr, child){
    if(child instanceof Array){
        arr.push(...child);
    }
    else{
        arr.push(child);
    }
}

// 设置对象增的属性值
// 支持a.b.c 或者 a.b[0].c的用法
export function ObjectSetValue(obj, prop, val, setMethod = (o,p,v)=> o[p] = v){
    let parent = obj;
    const names = prop.split('.');
    const reg = /(\w+)(?:\[(\d+)\])?/;
    for (let i = 0; i < names.length; i++) {
        const tmp = reg.exec(names[i]);
        const name = tmp[1];
        const index = tmp[2] ? parseInt(tmp[2]) : null;
        if(i == names.length - 1){
            if(index == null){
              setMethod(parent, name, val);
            }
            else{
              setMethod(parent, name, []);
              setMethod(parent[name], index, val);
            }
        }else{
            if(!parent[name]){
                setMethod(parent, name, index == null ? {} : []);
            }
            parent = index == null ? parent[name] : parent[name][index];
        }
    }
}

// 获取对象的属性值
// 支持a.b.c 或者 a.b[0].c的用法
export function ObjectGetValue(obj, prop){
    let parent = obj;
    const names = prop.split('.');
    const reg = /(\w+)(?:\[(\d+)\])?/;
    for (let i = 0; i < names.length; i++) {
        const tmp = reg.exec(names[i]);
        const name = tmp[1];
        const index = tmp[2] ? parseInt(tmp[2]) : null;
        const val = parent[name];
        if(i == names.length - 1){
            return index == null ? val : val[index];
        }else{
            if(!val){
                return null;
            }
            parent = index == null ? val : val[index];
            if(!parent) return null;
        }
    }
}

// 键值是否存在
export function IsKeyExists(obj, key){
    let parent = obj;
    const names = key.split('.');
    const reg = /(\w+)(?:\[(\d+)\])?/;
    for (let i = 0; i < names.length; i++) {
        const tmp = reg.exec(names[i]);
        const name = tmp[1];
        const index = tmp[2] ? parseInt(tmp[2]) : null;
        if(i == names.length - 1){
            return typeof parent == 'object' ? (name in parent) : false;
        }else{
            if(!parent[name]){
                return false;
            }
            parent = index == null ? parent[name] : parent[name][index];
        }
    }
}

// 将字符串形式的样式转换为对象形式
export function StyleStrToObj(style){
    const arr = style.split(';').map(x=>x.trim()).filter(x=>x);
    const obj = {};
    arr.forEach(x=>{
        const [ key, val ] = x.split(':').map(x=>x.trim());
        if(key && val){
            obj[key] = val;
        }
    });
    return obj;
}

// 将对象形式的样式转换为字符串形式
export function StyleObjToStr(style){
    if(!style) return '';
    let obj = '';
    for (const key in style) {
        const value = style[key];
        obj += `${key}:${value};`;
    }
    return obj;
}