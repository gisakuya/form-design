import groupBy from "lodash/groupBy";

export default {
    inject: [
        'onComponentCreated', 
        'onComponentActived',
        'onComponentDeleted'
    ],
    data: function(){
        return {
            name: null,
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            draggingHanlder: null,
            showBorderInner: false,
            isActive: false,
            cache: {},
        }
    },
    methods: {
        getDesignProps: function(){
            if(this.cache.designProps) return this.cache.designProps;

            let props = [];
    
            const helper = ctx => {
                if(!ctx) return;
                if(!ctx.$options.designProps) return;
                for (let i = 0; i < ctx.$options.designProps.length; i++) {
                    const g = ctx.$options.designProps[i];
                    if(!g.props || !g.props.length) continue;
                    for (let j = 0; j < g.props.length; j++) {
                        const prop = g.props[j];
                        if(!prop.get){
                            prop.get = new Function(`return this.$data.${prop.name}`);
                        }
                        if(!prop.set){
                            prop.set = new Function("val", `this.$data.${prop.name}=val`);
                        }
                        props.push(Object.assign({}, prop, { ctx: ctx, group: g.title }));
                    }
                }
            };
    
            helper(this);
            helper(this.$children[0]);

            this.cache.designProps = props;

            return props;
        },

        getDesignPropsByGroup: function(){
            if(this.cache.designPropsGroup) return this.cache.designPropsGroup;

            let arr = [];

            const designProps = this.getDesignProps();
            const g = groupBy(designProps, 'group');
            for (const key in g) {
                if (g.hasOwnProperty(key)) {
                    const props = g[key];
                    arr.push({ title: key, props: props });
                }
            }

            this.cache.designPropsGroup = arr;

            return arr;
        },
    
        initDesignProps: function(){
           const designProps = this.getDesignProps();
           for (let i = 0; i < designProps.length; i++) {
                const prop = designProps[i];
                if(!prop.name) continue;
                const ctx = prop.ctx;
                const val = ctx.$attrs[prop.name] || prop.default;
                if(prop.init){
                    prop.init.call(ctx, val);
                }
                else if(prop.set){
                    prop.set.call(ctx, val, true);
                }
           }
        },

        mouseEnter: function(){
            this.showBorderInner = true;
        },
        mouseLeave: function(){
            this.showBorderInner = false 
        },

        delSelf: function(){
            this.onComponentDeleted(this);
            this.$emit("Destory");
            this.$el.parentNode.removeChild(this.$el);
            this.$destroy();
        },
    },

    computed: {
        isShowBorder: function(){
            return this.showBorderInner || this.isActive;
        },
        exportTpl: function(){
            let tpl = (ctx, childTpl) => {
                if(!ctx) return ;
                let tag = ctx.$options._componentTag;
                let sb = `<${tag}`;

                const designProps = this.getDesignProps();
                for (let i = 0; i < designProps.length; i++) {
                    const prop = designProps[i];
                    if(ctx != prop.ctx) continue;
                    const name = prop.name;
                    if(!name) continue;
                    const val = prop.get.call(ctx);
                    if(val == prop.default) continue;
                    sb += ` ${name}="${val}"`; 
                }

                sb += `>${(childTpl||"")}</${tag}>`;
                return sb;
            };

            let childTpl = tpl(this.$children[0]);
            let thisTpl = tpl(this, childTpl);

            return thisTpl;
        }
    },

    watch: {
        isActive: function(val){
            this.onComponentActived(this, val);
        }
    },

    mounted: function() {
        this.$parent.$el.addEventListener("mousemove", this.docMouseMove);
        this.$parent.$el.addEventListener("mouseup", this.docMouseUp);

        this.onComponentCreated(this);
    },
}