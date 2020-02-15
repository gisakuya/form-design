<script>
import { GetTagModel, DeepCopy, Foreach } from "./utility";

const reg = /#([\w.]+)(?:\s*=\s*(.+))?/;


function GetRealValue(ctx, valueExp){
    const _this = ctx.parent;
    const matches = reg.exec(valueExp);
    if(matches){
        const matchName = matches[1];
        let defVal = matches[2];
        if(defVal){
            try { defVal = JSON.parse(defVal) } catch {}
        }
        _this.addDynamicProp(matchName, defVal);
        return { realValue: _this.getDynamicProp(matchName), matchName: matchName };
    }
    return { realValue: valueExp, matchName: null };
}

function DealComDef(ctx, com){
    if(typeof com == "string") return com;

    const _this = ctx.parent;

    let children = [];
    if(com.children){
        for (let i = 0; i < com.children.length; i++) {
            const child = com.children[i];
            children.push(DealComDef(ctx, child));
        }
    }

    const domProps = ctx.props.designMode ? { tpl: com } : {};
    for (const key in com.domProps) {
        const value = com.domProps[key];
        domProps[key] = value;
    }

    const props = {};
    for (const key in com.props) {
        const valueExp = com.props[key];
        const { realValue } = GetRealValue(ctx, valueExp);
        props[key] = realValue;
    }

    const attrs = {};
    const handlers = {};
    for (const key in com.attrs) {
        const valueExp = com.attrs[key];
        const { realValue, matchName } = GetRealValue(ctx, valueExp);
        if(key == "v-model" && valueExp && matchName){
            const { prop = "value", event = "input" } = GetTagModel(com.tag);
            props[prop] = realValue;
            handlers[event] = e => {
                _this.setDynamicProp(matchName, e);
            }
        }
        else{
            attrs[key] = realValue;
        }
    }

    const style = Object.assign({}, com.style, ctx.props.designMode ? com.designStyle : null);

    return {
        key: com.id,
        tag: com.tag,
        class: com.class,
        style: style,
        domProps: domProps,
        props: props,
        attrs: attrs,
        on: handlers,
        children: children,
        slot: com.slot
    }
}

function PreDealTemplate(ctx, components){
    if(!components) return;

    const arr = [];

    for (let i = 0; i < components.length; i++) {
        const com = components[i];
        arr.push(DealComDef(ctx, com));
    }

    return arr;
}

function CreateCom(h, parent, ctx){
    if(typeof parent == "string") return parent;

    let children = [];
    
    if(parent.children){
        for (let i = 0; i < parent.children.length; i++) {
            const child = parent.children[i];
            children.push(...CreateCom(h, child, ctx));
        }
    }

    const dataObj = {
        class: parent.class,
        style: parent.style,
        attrs: parent.attrs,
        props: parent.props,
        domProps: parent.domProps,
        on: parent.on,
        nativeOn: parent.nativeOn,
        directives: parent.directives,
        slot: parent.slot,
        key: parent.key,
        ref: parent.ref,
        refInFor: parent.refInFor
    };

    if(!ctx.props.designMode){
        if('v-for' in dataObj.attrs && dataObj.attrs['v-for']){
            const arr = [];
            const itemKey = dataObj.attrs['v-for-key'];
            const items = dataObj.attrs['v-for'];
            Foreach(items, (item,i)=>{
                // 处理props
                const realProps = {};
                Foreach(dataObj.props, (propVal, key)=>{
                    if(typeof propVal == 'string' && propVal.startsWith('$')){
                        realProps[key] = item[propVal.substring(1)]; 
                    }
                });
                const copy = DeepCopy(dataObj);
                copy.key = itemKey ? item[itemKey] : (copy.key + i);
                Object.assign(copy.props, realProps);
                // 处理attrs
                const realAttrs = {};
                Foreach(copy.attrs, (attrVal, key)=>{
                    if(typeof attrVal == 'string' && attrVal.startsWith('$')){
                        realAttrs[key] = item[attrVal.substring(1)];
                    }
                });
                Object.assign(copy.attrs, realAttrs);
                // 处理content
                copy.content = copy.attrs['content'];
                // 删除处理过的attr
                delete copy.attrs['v-for'];
                delete copy.attrs['v-for-key'];
                delete copy.attrs['content'];
                delete copy.attrs['v-model'];
                arr.push(copy);
            });
            return arr.map(x=> {
                const newchildren = x.content ? [ ...children, x.content ] : children;
                return h(parent.tag, x, newchildren)
            });
        }
    }

    if('v-if' in dataObj.attrs){
        const conditon = dataObj.attrs['v-if'];
        if(!conditon){
            return [];
        }
        delete dataObj.attrs['v-if'];
    }

    if('v-model' in dataObj.attrs){
        delete dataObj.attrs['v-model'];
    }

    if('content' in dataObj.attrs){
        const content = dataObj.attrs['content'];
        children = [ content ];
        delete dataObj.attrs['content'];
    }

    return [h(parent.tag, dataObj, children)];
}

export default {
    functional: true,
    props: {
        template: {
            type: Array,
            required: true
        },
        designMode: false
    },
    render: function(h, ctx){
        const template = ctx.props.template;
        const defaultSlot = ctx.children;
        if(!template || !template.length) 
            return h("div", defaultSlot);

        console.log('tpl render');

        const comDefs = PreDealTemplate(ctx, template);

        let vNodes = [];

        for (let i = 0; i < comDefs.length; i++) {
            const comDef = comDefs[i];
            vNodes.push(...CreateCom(h, comDef, ctx));
        }

        if(defaultSlot){
            vNodes.push(...defaultSlot);
        }

        return h("div", vNodes);
    }
}
</script>
