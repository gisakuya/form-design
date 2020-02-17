<script>
import { GetTagModel, DeepCopy, Foreach, ObjectGetValue, ArrayAddChild } from "./utility";

const reg = /#([\w.\[\]]+)(?:\s*=\s*(.+))?/;

const logReg = /(?<!\.)log\(/;

function ConvertBodyScript(body){
    if(!body) return body;
    return body.replace(logReg, "console.log(");
}

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

function H2(p, item, prefix, itemPath){
    // 处理props
    if(p.props){
        const realProps = {};
        Foreach(p.props, (propVal, key)=>{
            if(typeof propVal == 'string' && propVal.startsWith(prefix)){
                const subVal = propVal.substring(prefix.length);
                if(subVal == ''){
                }
                else if(subVal == prefix){
                    realProps[key] = item;
                }
                else{
                    realProps[key] = ObjectGetValue(item, subVal);
                }
            }
        });
        Object.assign(p.props, realProps);
    }
    
    // 处理attrs
    if(p.attrs){
        const realAttrs = {};
        Foreach(p.attrs, (attrVal, key)=>{
            if(typeof attrVal == 'string' && attrVal.startsWith(prefix)){
                const subVal = attrVal.substring(prefix.length);
                if(key == 'v-model'){
                    if(subVal == ''){
                    }
                    else if(subVal == prefix){
                        realAttrs[key] = `${itemPath}`;
                    }
                    else{
                        realAttrs[key] = `${itemPath}.${subVal}`;
                    }
                }
                else{
                    if(subVal == ''){
                    }
                    else if(subVal == prefix){
                        realProps[key] = item;
                    }
                    else{
                        realProps[key] = ObjectGetValue(item, subVal);
                    }
                }
            }
        });
        Object.assign(p.attrs, realAttrs);
    }
}

function H1(ctx, com, h){
    const { parent: _this, props: { designMode } } = ctx;

    const children = [];
    Foreach(com.children, child=>{
        ArrayAddChild(children, CreateCom(ctx, child, h));
    });

    const domProps = designMode ? { tpl: com } : {};
    if(com.domProps){
        for (const key in com.domProps) {
            const value = com.domProps[key];
            domProps[key] = value;
        }
    }

    const props = {};
    if(com.props){
        for (const key in com.props) {
            const valueExp = com.props[key];
            const { realValue } = GetRealValue(ctx, valueExp);
            props[key] = realValue;
        }
    }

    const attrs = {};
    const handlers = {};
    if(com.attrs){
        for (const key in com.attrs) {
            const valueExp = com.attrs[key];
            const { realValue, matchName } = GetRealValue(ctx, valueExp);
            if(key == "v-model"){
                if(valueExp && matchName){
                    const { prop = "value", event = "input" } = GetTagModel(com.tag);
                    props[prop] = realValue;
                    handlers[event] = e => {
                        _this.setDynamicProp(matchName, e);
                    }
                }
            }
            else if(key == 'content'){
                if(realValue){
                    children.push(realValue);
                }
            }
            else{
                attrs[key] = realValue;
            }
        }
    }

    if(com.events){
        for (const key in com.events) {
            const body = ConvertBodyScript(com.events[key]);
            handlers[key] = ()=>{
                new Function(body).call(_this);
            };
        }
    }

    const style = Object.assign({}, com.style, designMode ? com.designStyle : null);

    const dataObj = {
        key: com.id,
        class: com.class,
        style: style,
        domProps: domProps,
        props: props,
        attrs: attrs,
        on: handlers,
        slot: com.slot,
        ref: com.ref,
        refInFor: com.refInFor
    };

    return h(com.tag, dataObj, children);
}

function CreateCom(ctx, com, h){
    if(typeof com == "string") return com;

    const { parent: _this, props: { designMode } } = ctx;

    if(!designMode && com.attrs){
        const vIf = com.attrs['v-if'];
        if(vIf){
            const { realValue: conditon } = GetRealValue(ctx, vIf);
            if(!conditon){
                return [];
            }
        }

        const vFor = com.attrs['v-for'];
        const { realValue: forItems } = GetRealValue(ctx, vFor);
        if(forItems){
            const forPrefix = com.attrs['v-for-prefix'] || '$';
            const forKey = com.attrs['v-for-key'];
            
            const copyArr = [];
            for (let i = 0; i < forItems.length; i++) {
                const forItem = forItems[i];
                const forItemPath = `${vFor}[${i}]`;
                const copy = DeepCopy(com, c => H2(c, forItem, forPrefix, forItemPath));
                copy.id = forKey ? ObjectGetValue(forItem, forKey) : `${copy.id}${i}`;
                copyArr.push(H1(ctx, copy, h));
                delete copy.attrs['v-for'];
                delete copy.attrs['v-for-prefix'];
                delete copy.attrs['v-for-key'];
            }
            return copyArr;
        }
    }

    return H1(ctx, com, h);
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

        // const dt1 = new Date();

        const vNodes = [];
        Foreach(template, tpl=>{
            ArrayAddChild(vNodes, CreateCom(ctx, tpl, h));
        });

        if(defaultSlot){
            vNodes.push(...defaultSlot);
        }

        // const dt2 = new Date();
        // console.log('总共--------------：', dt2 - dt1);

        return h("div", vNodes);
    }
}
</script>
