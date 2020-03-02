<script>
import { GetTagModel, DeepCopy, Foreach, ObjectGetValue, 
ArrayAddChild, ObjectSetValue, RegReplace } from "./utility";

function ConvertEventBodyScript(body){
    if(!body) return body;
    return body.replace(/\blog\(/, "console.log(");
}

function H2(p, item, prefix, itemPath, indexOrKey){
    // 处理props
    if(p.props){
        const realProps = {};
        Foreach(p.props, (propVal, key)=>{
            if(typeof propVal == 'string' && propVal.startsWith(prefix)){
                const subVal = propVal.substring(prefix.length);
                if(subVal == ''){
                }
                else if(subVal == '[key]' || subVal == '[index]'){
                    realProps[key] = indexOrKey;
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
                    else if(subVal == '[key]' || subVal == '[index]'){
                        realAttrs[key] = indexOrKey;
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
                        realAttrs[key] = item;
                    }
                    else{
                        realAttrs[key] = ObjectGetValue(item, subVal);
                    }
                }
            }
        });
        Object.assign(p.attrs, realAttrs);
    }
}

function H1(ctx, com, h){
    const { _this, designMode } = ctx;

    const scopedSlots = {};
    if(!designMode){
        // 处理作用域插槽
        
        if(!ctx.renderFromScopedSlot && com.attrs){
            // 如果不是从作用域插槽里渲染，则跳过
            for (const key in com.attrs) {
                if(key.startsWith('v-slot:')){
                    return [];
                }
            }
        }

        Foreach(com.children, child=>{
            Foreach(child.attrs, (val, key)=>{
                if(key.startsWith('v-slot:')){
                    const slotName = key.substr(7);
                    const pattern = `${val.trim()}.([\\w_.[\\]&$]+)`;
                    const reg1 = new RegExp(pattern, "g");
                    const reg2 = new RegExp(`{{\\s*${pattern}\\s*}}`, "g");

                    scopedSlots[slotName] = scopedProps => {
                        return CreateCom(Object.assign({}, ctx, {
                            getRealValue: valueExp => {
                                const { realValue, success } = 
                                    RegReplace([reg2, reg1], valueExp, (_, field)=>{
                                        return ObjectGetValue(scopedProps, field)
                                    })

                                return success ? { matchName: valueExp, realValue: realValue } : 
                                    ctx.getRealValue(valueExp);
                            },
                            setValue: (name, value)=>{
                                const match = reg1.exec(name);
                                if(match){
                                    const field = match[1];
                                    ObjectSetValue(scopedProps, field, value);
                                }
                                else{
                                    ctx.setValue(name, value);
                                }
                            },
                            renderFromScopedSlot: true // 从作用域插槽里渲染
                        }), child, h);
                    }
                }
            })
        })

    }

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
            const { realValue } = ctx.getRealValue(valueExp);
            props[key] = realValue;
        }
    }

    const attrs = {};
    const handlers = {};
    let ref = null;
    let slot = null;
    if(com.attrs){
        for (const key in com.attrs) {
            const valueExp = com.attrs[key];
            const { realValue, matchName } = ctx.getRealValue(valueExp);
            if(key.startsWith("v-model")){
                if(valueExp && matchName){
                    const modifiers = key.substring(7);
                    const numberMode = modifiers.indexOf('.number') != -1;
                    const trimMode = modifiers.indexOf('.trim') != -1;
                    const lazyMode = modifiers.indexOf('.lazy') != -1;

                    let { prop = "value", event = "input" } = GetTagModel(com.tag);
                    if(lazyMode){ event = "change"; }
                    props[prop] = realValue;
                    handlers[event] = e => {
                        let val = e;
                        if(numberMode){
                            val = parseFloat(e);
                            if(isNaN(val)) val = e;
                        }
                        if(trimMode){
                            val = e.trim();
                        }
                        ctx.setValue(matchName, val);
                    }
                }
            }
            else if(key == 'content'){
                if(realValue){
                    children.push(realValue);
                }
            }
            else if(key == 'ref'){
                ref = realValue;
            }
            else if(key == 'v-slot'){
                slot = realValue;
            }
            else if(key.startsWith('v-slot')){
                
            }
            else{
                attrs[key] = realValue;
            }
        }
    }

    if(com.events){
        for (const key in com.events) {
            const eventStr = com.events[key];
            const m = /([\w._$&]+)\((.*)\)/.exec(eventStr);
            const fntName = m[1];
            const params = m[2].split(',').map(x=>x.trim()).filter(x=>x);
            handlers[key] = ()=>{
                ObjectGetValue(_this, fntName).apply(_this, params.map(x=> {
                    if(/^[\d.]+$/.test(x)) return Number.parseFloat(x);
                    let m = /^(['"])(.+)(\1)$/.exec(x);
                    if(m) return m[2];
                    return ctx.getRealValue(x).realValue;
                }))
            }
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
        scopedSlots: scopedSlots,
        slot: slot,
        ref: ref,
        refInFor: com.refInFor
    };

    if(!designMode && com.tag == 'v-template'){
        // 特殊处理
        Foreach(children, child=>{
            child.data.slot = slot;
        });
        return children;
    }

    return h(com.tag, dataObj, children);
}

function CreateCom(ctx, com, h){
    if(typeof com == "string") return com;

    if(!ctx.designMode && com.attrs){
        const vIf = com.attrs['v-if'];
        if(vIf){
            const { realValue: conditon } = ctx.getRealValue(vIf);
            if(!conditon){
                return [];
            }
        }

        const vForSyntax= com.attrs['v-for'];
        if(vForSyntax){
            // v-for = "$ in #items"
            // v-for-key="id"
            let vFor = null;
            let forKey = com.attrs['v-for-key'] || 'id';
            let forPrefix = null;
            if(vForSyntax.indexOf(' in ') == -1){
                vFor = vForSyntax;
                forPrefix = com.attrs['v-for-prefix'] || '$';
            }
            else{
                [ forPrefix, vFor ] = vForSyntax.split(' in ');
            }
            forPrefix = forPrefix.trim()+'.';
            const { realValue: forItems } = ctx.getRealValue(vFor);
            if(forItems){
                const copyArr = [];
                if(forItems instanceof Array){
                    // 数组形式
                    for (let i = 0; i < forItems.length; i++) {
                        const forItem = forItems[i];
                        const forItemPath = `${vFor}[${i}]`;
                        const copy = DeepCopy(com, c => H2(c, forItem, forPrefix, forItemPath, i));
                        copy.id = forKey ? ObjectGetValue(forItem, forKey) : `${copy.id}${i}`;
                        delete copy.attrs['v-for'];
                        delete copy.attrs['v-for-prefix'];
                        delete copy.attrs['v-for-key'];
                        copyArr.push(H1(ctx, copy, h));
                    }
                }
                else{
                    // 对象形式
                    for (const key in forItems) {
                        const forItem = forItems[key];
                        const forItemPath = `${vFor}.${key}`;
                        const copy = DeepCopy(com, c => H2(c, forItem, forPrefix, forItemPath, key));
                        copy.id = forKey ? ObjectGetValue(forItem, forKey) : `${copy.id}${key}`;
                        delete copy.attrs['v-for'];
                        delete copy.attrs['v-for-prefix'];
                        delete copy.attrs['v-for-key'];
                        copyArr.push(H1(ctx, copy, h));
                    }
                }
                return copyArr;
            }
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
        designMode: Boolean
    },
    render: function(h, ctx){
        const template = ctx.props.template;
        const defaultSlot = ctx.children;
        if(!template || !template.length) 
            return h("div", defaultSlot);

        console.log('tpl render');

        const dt1 = new Date();

        const _this = ctx.parent;
        const pattern = "(#[\\w_.[\\]]+)(?:\\s*=\\s*(.+))?";
        const reg1 = new RegExp(pattern, "g");
        const reg2 = new RegExp(`{{\\s*${pattern}\\s*}}`, "g");
        const newCtx = {
            designMode: ctx.props.designMode,
            getRealValue: valueExp=>{
                let lastMatchName = null;
                const { realValue, singleMatch } = 
                    RegReplace([reg2,reg1], valueExp, (_, matchName, defVal)=>{
                        lastMatchName = matchName
                        if(defVal){
                            try { defVal = JSON.parse(defVal) } catch {}
                        }
                        _this.addDynamicProp(matchName, defVal)
                        return _this.getDynamicProp(matchName)
                    })
                    
                return { realValue: realValue, matchName: singleMatch ? lastMatchName: null }
            },
            setValue: (name, value) => _this.setDynamicProp(name, value),
            _this: _this
        };

        const vNodes = [];
        Foreach(template, tpl=>{
            ArrayAddChild(vNodes, CreateCom(newCtx, tpl, h));
        });

        if(defaultSlot){
            vNodes.push(...defaultSlot);
        }

        const dt2 = new Date();
        console.log('总共--------------：', dt2 - dt1);

        return h("div", vNodes);
    }
}
</script>
