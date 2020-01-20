// 获取组件的导出模板
export function GetComExportTpl(ctx){
    const tag = GetComTag(ctx);

    // 处理designProps
    const expDesignProps = {};
    let id = undefined;
    if(ctx.designProps){
      for (let i = 0; i < ctx.designProps.length; i++) {
          const designProp = ctx.designProps[i];
          if(designProp.name){
              const designPropVal = designProp.get();
              if(designProp.name == "id"){
                  id = designPropVal;
                  continue;
              }
              if(!designPropVal && !designProp.default) continue;
              if(designPropVal == designProp.default) continue;
              expDesignProps[designProp.name] = designPropVal;
          }
      }
    }

    // 处理bindProps
    let expBindProps = {};
    let expBindAttrs = {};
    if(ctx.bindProps){
      for (let i = 0; i < ctx.bindProps.length; i++) {
          const bindProp = ctx.bindProps[i];
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

    return rtn;
}

// 判断点是否在控件的边界内
export function IsPointInComBoundary(ctx, { x, y }){
    if(!ctx) return false;
    let { left: l, top: t, right: r, bottom: b } = ctx.$el.getBoundingClientRect();
    return l <= x && x <= r &&
            t <= y && y <= b;
}

// 初始化组件的DesignProps
export function InitComDesignProps(ctx, emitTplChanged){
    if(!ctx) return;
    if(ctx.hasInitDesignProps) return;

    const designProps = ctx.$options.designProps;
    if(!designProps) return;

    let arr = [];

    // 处理_designProps
    for (let i = 0; i < designProps.length; i++) {
        const prop = designProps[i];
        if(!prop.get){
            prop.get = new Function(`return this.$data.${prop.name}`);
        }
        if(!prop.set){
            prop.set = new Function("val", `this.$data.${prop.name}=val`);
        }
        const newProp = Object.assign({}, prop, { 
            get: () => prop.get.call(ctx),
            set: (val, i) => { prop.set.call(ctx, val, i); if(!i) emitTplChanged(); },
            init: prop.init ? val => prop.init.call(ctx, val) : null
        });
        Object.defineProperty(newProp, 'model', {
            get: () => newProp.get(),
            set: val => newProp.set(val)
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
      ctx.designProps = arr;
      delete ctx.$el._designProps;

      ctx.hasInitDesignProps = true;
}

function arrPush(arr, prop){
    let i = 0;
    for (; i < arr.length; i++) {
        const item = arr[i];
        if(prop.title <= item.title){
            break;
        }
    }
    arr.splice(i, 0, prop);
}

  // 初始化组件的BindProps
export function InitComBindProps(ctx, emitTplChanged){
    if(!ctx) return;
    if(ctx.hasInitBindProps) return;

    const addProp = (name, value, type, extra)=>{
        if(!Array.isArray(type)){
            type = [ type ];
        }
    
        let obj = {
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
                        obj.value = (val == "true");
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
            emitTplChanged();
        };
        return Object.assign(obj, extra);
    }

    let arr = [];
    // 处理_bindProps
    const props = ctx.$options.props;
    if(props){
        for (const key in props) {
            const prop = props[key];
            const name = key;
            const type = prop.type || String;
            const defValue = typeof prop.default == "function" ? prop.default.call(ctx) : prop.default;
            const value = ctx.$el._bindProps ? (ctx.$el._bindProps[key] || defValue) : defValue;
            arrPush(arr, addProp(name, value, type, { default: defValue, isProp: true }));
        }
        delete ctx.$el._bindProps;
    }

    // 处理_bindAttrs
    const attrs = ctx.$el._bindAttrs;
    if(attrs){
        for (const key in attrs) {
            const value = attrs[key];
            arrPush(arr, addProp(key, value, String));
        }
        delete ctx.$el._bindAttrs;
    }

    // 添加setProp功能
    arr.addProp = (name, value) => {
        arrPush(arr, addProp(name, value, String));
        emitTplChanged();
    }

    ctx.bindProps = arr;
    
    ctx.hasInitBindProps = true;
}

export function GetComTag(com) {
    return com.$options._componentTag;
}