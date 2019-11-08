<script>
import { GetTagModel } from "./utility";

const reg = /#(\w+)/;


function GetRealValue(ctx, valueExp){
    const _this = ctx.parent;
    const matches = reg.exec(valueExp);
    if(matches){
        const matchName = matches[1];
        _this.addDynamicProp(matchName);
        return { realValue: _this.dynamicProps[matchName], matchName: matchName };
    }
    return { realValue: valueExp, matchName: null };
}

function DealComDef(ctx, com){
    const _this = ctx.parent;

    let children = [];
    if(com.children){
        for (let i = 0; i < com.children.length; i++) {
            const child = com.children[i];
            children.push(DealComDef(ctx, child));
        }
    }

    const domProps = {
        _designProps: { id: com.id, ...(com.designProps || {}) },
        _bindProps: com.bindProps || {},
        _bindAttrs: com.bindAttrs || {},
    };

    const props = {};
    for (const key in domProps._bindProps) {
        const valueExp = domProps._bindProps[key];
        const { realValue } = GetRealValue(ctx, valueExp);
        props[key] = realValue;
    }

    const handlers = {};
    for (const key in domProps._bindAttrs) {
        const valueExp = domProps._bindAttrs[key];
        const { realValue, matchName } = GetRealValue(ctx, valueExp);
        if(key == "v-model" && matchName){
            const { prop = "value", event = "input" } = GetTagModel(com.tag);
            props[prop] = realValue;
            handlers[event] = e => {
                _this.dynamicProps[matchName] = e;
            }
        }
        else{
            attrs[key] = realValue;
        }
    }

    return {
        key: com.id,
        tag: com.tag,
        domProps: domProps,
        props: props,
        on: handlers,
        children: children
    }
}

// 预处理模板
function PreDealTemplate(ctx, components){
    if(!components) return;

    const arr = [];

    for (let i = 0; i < components.length; i++) {
        const com = components[i];
        arr.push(DealComDef(ctx, com));
    }

    return arr;
}

function CreateCom(h, parent){
    let children = [];
    
    if(parent.children){
        for (let i = 0; i < parent.children.length; i++) {
            const child = parent.children[i];
            children.push(CreateCom(h, child));
        }
    }

    // https://cn.vuejs.org/v2/guide/render-function.html#深入数据对象
    return h(parent.tag, {
        "class": parent.class,
        style: parent.style,
        attrs: parent.attrs,
        props: parent.props,
        domProps: parent.domProps,
        on: parent.on,
        nativeOn: parent.nativeOn,
        directives: parent.directives,
        scopedSlots: parent.scopedSlots,
        slot: parent.slot,
        key: parent.key,
        ref: parent.ref,
        refInFor: parent.refInFor
    }, children)
}

export default {
    functional: true,
    props: {
        template: {
            type: Array,
            required: true
        }
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
            vNodes.push(CreateCom(h, comDef));
        }

        if(defaultSlot){
            vNodes.push(...defaultSlot);
        }

        return h("div", vNodes);
    }
}
</script>
