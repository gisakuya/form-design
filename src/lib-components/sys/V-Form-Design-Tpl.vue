<script>
import { GetTagModel, DeepCopy, Foreach, ObjectGetValue } from "./utility";

const reg = /#([\w.\[\]]+)(?:\s*=\s*(.+))?/;


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

function DealVIf(ctx, coms){
    const h = (p, arr) => {
        const vIf = p.attrs['v-if'];
        delete p.attrs['v-if'];
        if(vIf){
            const { realValue: conditon } = GetRealValue(ctx, vIf);
            if(!conditon){
                const index = arr.indexOf(p);
                arr.splice(index, 1);
                return;
            }
        }
        
        Foreach(p.children, c=>{
            h(c, p.children);
        })
    };

    for (let i = 0; i < coms.length; i++) {
        const com = coms[i];
        h(coms[i], coms);
    }
}

function DealVFor(ctx, coms){
    const h2 = (p, item, prefix, itemPath) => {
        Foreach(p.children, c=>{
            h2(c, item, prefix, itemPath);
        });

        // 处理props
        if(p.props){
            const realProps = {};
            Foreach(p.props, (propVal, key)=>{
                if(typeof propVal == 'string' && propVal.startsWith(prefix)){
                    realProps[key] = ObjectGetValue(item, propVal.substring(prefix.length));
                }
            });
            Object.assign(p.props, realProps);
        }
        
        // 处理attrs
        if(p.attrs){
            const realAttrs = {};
            Foreach(p.attrs, (attrVal, key)=>{
                if(typeof attrVal == 'string' && attrVal.startsWith(prefix)){
                    if(key == 'v-model'){
                        realAttrs[key] = `${itemPath}.${attrVal.substring(prefix.length)}`
                    }
                    else{
                        realAttrs[key] = ObjectGetValue(item, attrVal.substring(prefix.length));
                    }
                }
            });
            Object.assign(p.attrs, realAttrs);
        }
    };

    const h = (p, arr) => {
        Foreach(p.children, c=>{
            h(c, p.children);
        })

        const { realValue: items } = GetRealValue(ctx, p.attrs['v-for']);
        const vFor = p.attrs['v-for'];
        const itemKey = p.attrs['v-for-key'];
        const itemPrefix = p.attrs['v-for-prefix'] || '$';
        delete p.attrs['v-for'];
        delete p.attrs['v-for-key'];
        delete p.attrs['v-for-prefix'];
        if(!items || !items.length) return;

        const copyArr = items.map((item,i)=>{
            const copy = DeepCopy(p);
            delete copy.attrs['v-for'];
            delete copy.attrs['v-for-key'];
            delete copy.attrs['v-for-prefix'];
            copy.id = itemKey ? ObjectGetValue(item, itemKey) : (copy.id + i);
            h2(copy, item, itemPrefix, `${vFor}[${i}]`);
            return copy;
        });

        const index = arr.indexOf(p);
        arr.splice(index, 1, ...copyArr);
    };

    for (let i = 0; i < coms.length; i++) {
        const com = coms[i];
        h(coms[i], coms);
    }
}

function DealComDef(ctx, com){
    if(typeof com == "string") return com;

    const _this = ctx.parent;
    const { designMode } = ctx.props;

    const children = (com.children||[]).map(x=>DealComDef(ctx, x));

    const domProps = designMode ? { tpl: com } : {};
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
        if(key == "v-model"){
            if(valueExp && matchName){
                const { prop = "value", event = "input" } = GetTagModel(com.tag);
                props[prop] = realValue || '';
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

    const style = Object.assign({}, com.style, designMode ? com.designStyle : null);

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

function CreateCom(h, parent){
    if(typeof parent == "string") return parent;

    const children = (parent.children||[]).map(x=>CreateCom(h, x));

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

    return h(parent.tag, dataObj, children);
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

        const { props: { designMode } } = ctx;

        const copy = designMode ? template : DeepCopy(template);

        if(!designMode){
            DealVIf(ctx, copy);
            DealVFor(ctx, copy);
        }

        const dealComs = copy.map(x=> DealComDef(ctx, x));
        const vNodes = dealComs.map(x=> CreateCom(h, x));

        if(defaultSlot){
            vNodes.push(...defaultSlot);
        }

        return h("div", vNodes);
    }
}
</script>
