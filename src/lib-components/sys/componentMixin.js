export default {
    inject: [
        'onComponentCreated',
        'onComponentDeleted',
        'emitTplChanged'
    ],
    data: function(){
        return {
            id: null,
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            draggingBegin: null,
            draggingHandler: null,
            draggingEnd: null,
            mouseHoverShape: null,
            active: false,
            showBorder: false,

            designProps: [],
            bindProps: []
        }
    },
    methods: {
        delSelf: function(){
            this.$emit("Destory");
            this.onComponentDeleted(this);
        },

        // 初始化设计属性
        initDesignPropsCore: function(arr, ctx){
            if(!ctx) return;
            const designProps = ctx.$options.designProps;
            if(!designProps) return;
            for (let i = 0; i < designProps.length; i++) {
                const prop = designProps[i];
                if(!prop.get){
                    prop.get = new Function(`return this.$data.${prop.name}`);
                }
                if(!prop.set){
                    prop.set = new Function("val", `this.$data.${prop.name}=val`);
                }
                const newProp = Object.assign({}, prop, { 
                    ctx: ctx, 
                    get: () => prop.get.call(ctx),
                    set: (val, i) => { prop.set.call(ctx, val, i); if(!i) this.emitTplChanged(); },
                    init: prop.init ? val => prop.init.call(ctx, val) : null
                });
                arr.push(newProp);

                // 初始化值
                if(prop.name){
                    const propVal = ctx.$el._designProps[prop.name] || prop.default;
                    if(newProp.init){
                        newProp.init(propVal);
                    }
                    else if(newProp.set){
                        newProp.set(propVal, true);
                    }
                }
            }
            delete ctx.$el._designProps;
        },
        initDesignProps: function(){
            let arr = [];
            this.initDesignPropsCore(arr, this);
            this.initDesignPropsCore(arr, this.$children[0])
            this.designProps = arr;
        },

        // 初始化绑定属性
        initBindPropsCore: function(arr, ctx){
            if(!ctx) return;

            const addProp = (ctx, name, value, type, extra)=>{
                if(!Array.isArray(type)){
                    type = [ type ];
                }
    
                let obj = {
                    ctx: ctx,
                    title: name,
                    name: name,
                    value: value
                };
                obj.get = () => obj.value;
                obj.set = (val) => {
                    if(typeof val != "string"){
                        obj.value = val;
                    }
                    else if(type.includes(String)){
                        obj.value = val;
                    }
                    else{
                        let deal = false;
                        for (let i = 0; i < type.length; i++) {
                            const expectType = type[i];
                            if(expectType == Number){
                                obj.value = Number(val);
                                deal = true;
                            }
                            else if(expectType == Boolean){
                                obj.value = Boolean(val);
                                deal = true;
                            }
                            else if(expectType == Array){
                                obj.value = JSON.parse("[" + val + "]");
                                deal = true;
                            }
                            else if(expectType == Object){
                                obj.value = JSON.parse(val);
                                deal = true;
                            }
                            if(deal) break;
                        }
                        if(!deal) throw '无法处理';
                    }
                };
                return Object.assign(obj, extra);
            }

            const arrPush = prop => {
                let i = 0;
                for (; i < arr.length; i++) {
                    const item = arr[i];
                    if(prop.title <= item.title){
                        break;
                    }
                }
                arr.splice(i, 0, prop);
            }

            // 处理_bindProps
            const props = ctx.$options.props;
            if(props){
                for (const key in props) {
                    const prop = props[key];
                    const name = key;
                    const type = prop.type || String;
                    const defValue = typeof prop.default == "function" ? prop.default.call(ctx) : prop.default;
                    const value = ctx.$el._bindProps[key] || defValue;
                    arrPush(addProp(ctx, name, value, type, { default: defValue, isProp: true }));
                }
                delete ctx.$el._bindProps;
            }

            // 处理_bindAttrs
            const attrs = ctx.$el._bindAttrs;
            for (const key in attrs) {
                const value = attrs[key];
                arr.push(addProp(ctx, key, value, String));
            }
            delete ctx.$el._bindAttrs;

            // 添加setProp功能
            arr.setProp = (name, value) => {
                for (let i = 0; i < arr.length; i++) {
                    const prop = arr[i];
                    if(prop.name == name){
                        prop.set(value);
                        this.emitTplChanged();
                        return;
                    }
                }
                arrPush(addProp(ctx, name, value, String));
                this.emitTplChanged();
            }
        },
        initBindProps: function(){
            let arr = [];
            this.initBindPropsCore(arr, this.$children[0]);
            this.bindProps = arr;
        },

        // 是否在边界内
        isPointInBoundary({ x, y }){
            const l = this.$el.offsetLeft;
            const t = this.$el.offsetTop;
            const w = this.$el.offsetWidth;
            const h = this.$el.offsetHeight;

            return l <= x && x <= l + w &&
                    t <= y && y <= t + h;
        }
    },

    computed: {
        isShowBorder: function(){
            return this.active || this.showBorder;
        },
        exportTpl: function(){

            const helper = (ctx, children) => {
                const tag = ctx.$options._componentTag;

                // 处理designProps
                const expDesignProps = {};
                let id = undefined;
                for (let i = 0; i < this.designProps.length; i++) {
                    const designProp = this.designProps[i];
                    if(designProp.ctx == ctx && designProp.name){
                        const val = designProp.get();
                        if(designProp.name == "id"){
                            id = val;
                        }
                        else if(val != designProp.default){
                            expDesignProps[designProp.name] = val;
                        }
                    }
                }

                // 处理bindProps
                let expBindProps = {};
                let expBindAttrs = {};
                for (let i = 0; i < this.bindProps.length; i++) {
                    const bindProp = this.bindProps[i];
                    if(bindProp.ctx == ctx){
                        if(!bindProp.value && !bindProp.default) continue;
                        if(bindProp.value == bindProp.default) continue;
                        if(bindProp.isProp){
                            expBindProps[bindProp.name] = bindProp.value;
                        }
                        else{
                            expBindAttrs[bindProp.name] = bindProp.value;
                        }
                    }
                }

                let rtn = {
                    tag: tag,
                    id: id
                }

                if(Object.keys(expDesignProps).length){
                    rtn.designProps = expDesignProps;
                }

                if(Object.keys(expBindProps).length){
                    rtn.bindProps = expBindProps;
                }

                if(Object.keys(expBindAttrs).length){
                    rtn.bindAttrs = expBindAttrs;
                }

                if(children){
                    rtn.children = children;
                }

                return rtn;
            }

            const children = this.$children;
            if(children && children.length){
                let tmp = [];
                for (let i = 0; i < children.length; i++) {
                    tmp.push(helper(children[i]));
                }
                return helper(this, tmp);
            }

            return helper(this);
        }
    },

    mounted: function() {
        this.initDesignProps();
        this.initBindProps();
        this.onComponentCreated(this);

        if(this.layoutFinished){
            setTimeout(() => {
                this.layoutFinished();
            }, 100)
        }
    },
    beforeDestroy: function(){
        this.onComponentDeleted(this);
    }
}