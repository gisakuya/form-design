<template>
    <div class="form-design"
        @dragover="allowDrop" 
        @drop="drop" 
        @mousedown="mouseDown"
        @mousemove="mouseMove"
        @mouseup="mouseUp"
        @keyup.46.exact="delCom"
        @keyup.ctrl.exact="copyCom"
        tabindex="0">

        <p>绑定属性：<input :value="JSON.stringify(dynamicProps)" 
            @change="formDataChanged($event.target.value)" 
            style="width:100%"/>
        </p>
        <v-focus-rect ref="vfocus"></v-focus-rect>
        <v-contextmenu ref="vctxmenu"></v-contextmenu>
        <v-toolborder ref="vtoolborder" @copy="copyCom" @del="delCom"></v-toolborder>
        <v-form-design-tpl :template="tpl.components" :designMode="true"></v-form-design-tpl>
    </div>
</template>

<script>
import { 
  TreeLoop, TreeLoopMap, TreeDelItem, TreeCopyItem, LetterbaseArrPush, AddChild,
  StyleStrToObj, StyleObjToStr,
  TypeParse, ValToString,
  ObjectSetValue,ObjectGetValue,IsKeyExists
} from "./utility";
import {} from "./componentUtility";

let mouse = {};
let firstRender = true;

export default {
  model: {
    prop: 'tpl',
    event: 'tplChanged'
  },
  provide: function(){
    return {
    }
  },
  data() {
    return {
      cur: {},
      dynamicProps: {}
    }
  },
  props: {
      tpl: {
        type: Object,
        default:function(){
          return  { components: [] }
        }
      }
  },
  computed: {
  },
  methods: {
      // 所有控件
      allComs: function(iter, reverse = false){
        const coms = this.$children.filter((_,i)=>i>2);
        TreeLoop(coms, iter, reverse, "$children");
      },

      // 遍历组件树
      loopComsTree: function(iter, reverse = false){
        TreeLoop(this.tpl.components, tpl=>{
          if(tpl.getCom){
            return iter(tpl.getCom());
          }
        }, reverse);
      },

      // 返回组件树
      comsTree: function(){
        return TreeLoopMap(this.tpl.components, tpl=>{
            if(tpl.getCom){
              const com = tpl.getCom();
              return {
                id: com._id,
                label: com._tag,
                active: () => {
                  this.activeComBorder(null, com);
                  this.activeCom();
                  window.event.stopPropagation();
                },
                delete: () => {
                  this.delCom(com);
                  window.event.stopPropagation();
                },
                copy: () => {
                  this.copyCom(com);
                  window.event.stopPropagation();
                }
              };
            }
        });
      },

      // 复制控件
      copyCom: function(com){
        const copy = TreeCopyItem(this.tpl.components, com._tpl);
        TreeLoop([copy], tpl=>{
          this.reCreateComponentId(tpl);
        });
        this.emitTplChanged();
        this.emitComsTreeChanged();
      },

      // 手动删除组件
      delCom: function(com){
        com.del();
        this.emitTplChanged();
        this.emitComsTreeChanged();
        this.hideComBorder();
        this.activeCom();
      },

      // 拖拉组件
      allowDrop: function(ev) {
        ev.preventDefault();
        this.activeComBorder(ev);
      },
      drop: function(ev) {
        const data=ev.dataTransfer.getData("drag-component");
        if(!data) return;
        ev.preventDefault();

        let { componentName, content, designStyle, attrs } = JSON.parse(data);

        if(content){
          if(!attrs) attrs = {};
          attrs.content = content;
        }

        const parentCom = this.getComUnderMouse(ev);
        const childComTpl = this.createComponentTpl(componentName);
        if(designStyle){
          childComTpl.designStyle = designStyle;
        }
        if(attrs){
          childComTpl.attrs = attrs;
        }

        if(parentCom){
          parentCom.addChild(childComTpl);
          this.emitTplChanged();
        }
        else{
          this.emitTplChanged([ ...this.tpl.components, childComTpl ]);
        }
        this.emitComsTreeChanged();
      },

      // 鼠标按下
      mouseDown: function(ev) {
          this.activeCom(ev);
      },

      // 鼠标移动
      mouseMove: function(ev) {
        this.activeComBorder(ev);
      },

      // 鼠标弹起
      mouseUp: function(ev) {
      },


      // 组件名是否有效
      isComponentIdVaild:function(comId){
        let valid = true;
        this.loopComsTree(com=>{
          if(com._id == comId){
            valid = false;
            return false;
          }
        });
        return valid;
      },

      // 创建组件Id
      createComponentId: function(comType){
        comType = "com";
        comType = comType.toLowerCase().replace(/-/g, "");
        let index = 1;
        let comId = null;
        do{
          comId = `${comType}${index++}`
        }
        while(!this.isComponentIdVaild(comId))
        return comId;
      },

      // 重新创建组件Id
      reCreateComponentId: function(com){
        com.id = this.createComponentId(com.tag);
      },

      // 创建控件
      createComponentTpl: function(componentName){
        return { 
          tag: componentName, 
          id: this.createComponentId(componentName)
        }
      },

      // 发送事件
      emitTplChanged: function(components){
          this.$emit("tplChanged", { components: components||[ ...this.tpl.components ] });
      },

      // 发送事件
      emitSelChanged: function(){
        const com = this.cur.activeCom || {};
        this.$emit("selChanged", { id: com._id, tag: com._tag, props: com.props });
      },

      // 组件树变化
      emitComsTreeChanged: function(){
        setTimeout(()=>{
          const trees = this.comsTree();
          this.$emit('treeChanged', trees);
        }, 0);
      },

      // 动态添加属性
      addDynamicProp: function(name, defVal = null){
        if(IsKeyExists(this.dynamicProps, name)) return;
        ObjectSetValue(this.dynamicProps, name, defVal, this.$set);
      },

      // 获取动态添加的属性值
      getDynamicProp: function(name){
        return ObjectGetValue(this.dynamicProps, name);
      },

      // 设置动态添加剂的属性
      setDynamicProp: function(name, value){
        ObjectSetValue(this.dynamicProps, name, value);
      },

      // 获取鼠标偏移量
      getMouseOffset(ev, offset){
        const { left, top } = this.$el.getBoundingClientRect();
        let x = ev.x - left;
        let y  = ev.y - top;
        if(offset){
          x += offset.x;
          y += offset.y;
        }
        return { x, y };
      },

      // 获取鼠标下的com
      getComUnderMouse: function({ x, y }){
        let rtn = null;
        this.loopComsTree(com=>{
          if(com.$el.getBoundingClientRect){
            const { left, top, right, bottom } = com.$el.getBoundingClientRect();
            if(left <= x && x <= right && top <= y && y <= bottom){
              rtn = com;
              return false;
            }
          }
        }, true);
        return rtn;
      },

      // 激活控件
      activeCom: function(){
        const vtoolborder = this.$refs.vtoolborder;
        this.cur.activeCom = vtoolborder.com;
        this.emitSelChanged();
      },

      // 显示控件的边框
      activeComBorder: function(ev, item){
        const vtoolborder = this.$refs.vtoolborder;
        const com = ev ? this.getComUnderMouse(ev) : item;
        if(com){
          vtoolborder.activeCom(com);
        }
        else{
          vtoolborder.hide();
        }
      },
      
      // 隐藏控件边框
      hideComBorder: function(){
        const vtoolborder = this.$refs.vtoolborder;
        vtoolborder.hide();
      },

      // 表单数据变化
      formDataChanged: function(val){
        const obj = JSON.parse(val);
        Object.assign(this.dynamicProps, obj);
      }
  },
  mounted: function() {
    // 初始化事件
    this.emitSelChanged();

    // 禁止右键菜单
    document.addEventListener('contextmenu', event => event.preventDefault());
  },
  watch: {
    tpl: function(){
      console.log("tpl changed");
      if(firstRender){
        // 第一次渲染
        this.emitComsTreeChanged();
        firstRender = false;
      }
      this.$nextTick(()=>{
        // 子组件已显示
        this.allComs(com=>{
          if(!com.hasInit){
            const tpl = com.$el.tpl;
            if(!tpl || tpl.tag != com.$options._componentTag){
              delete com.$el.tpl;
              com.hasInit = true;
              return;
            }
            com._id = tpl.id;
            com._tag = tpl.tag;
            com._tpl = tpl;
            com.addChild = c => {
              AddChild(tpl, c);
            };
            com.del = () => {
              TreeDelItem(this.tpl.components, tpl);
            };

            const props = [];
            const addProp = (name, value, defValue, type)=>{
                if(!type){
                  type = [ String ];
                }
                else if(!Array.isArray(type)){
                  type = [ type ];
                }

                let obj = {
                    title: name,
                    name: name,
                    value: value,
                    defValue: defValue || '',
                    type: type
                };
                obj.get = () => ValToString(obj.value);
                obj.set = (val) => {
                    obj.value = TypeParse(obj.type, val) || obj.defValue;
                    // 通知
                    if(obj.value == obj.defValue){
                      if(tpl.props){
                        delete tpl.props[obj.name];
                        if(Object.keys(tpl.props) == 0){
                          delete tpl.props;
                        }
                      }
                    }
                    else{
                      if(!tpl.props) tpl.props = {};
                      tpl.props[obj.name] = obj.value;
                    }
                    this.emitTplChanged();
                };
                return obj;
            }
            const addAttr = (name, value)=>{
                let obj = {
                    title: name,
                    name: name,
                    value: value
                };
                obj.get = () => ValToString(obj.value);
                obj.set = (val) => {
                    obj.value = val;
                    // 通知
                    if(!obj.value){
                      if(tpl.attrs){
                        delete tpl.attrs[obj.name];
                        if(Object.keys(tpl.attrs) == 0){
                          delete tpl.attrs;
                        }
                      }
                    }
                    else{
                      if(!tpl.attrs) tpl.attrs = {};
                      tpl.attrs[obj.name] = obj.value;
                    }
                    this.emitTplChanged();
                };
                return obj;
            }
            const addStyle = (value)=>{
                let obj = {
                    title: 'style',
                    name: 'style',
                    value: StyleObjToStr(value)
                };
                obj.get = () => obj.value;
                obj.set = (val) => {
                    obj.value = val;
                    // 通知
                    if(!obj.value){
                      delete tpl.style;
                    }
                    else{
                      tpl.style = StyleStrToObj(obj.value);
                    }
                    this.emitTplChanged();
                };
                return obj;
            }
            const propDefs = com.$options.props;
            if(propDefs){
              for (const key in propDefs) {
                  const prop = propDefs[key];
                  const name = key;
                  const defValue = typeof prop.default == "function" ? prop.default.call(com) : prop.default;
                  const value = tpl.props ? tpl.props[name] : defValue;
                  const type = prop.type;
                  LetterbaseArrPush(props, addProp(name, value, defValue, type));
              }
            }
            const attrs = tpl.attrs;
            if(attrs){
              for (const key in attrs) {
                const name = key;
                const value = attrs[name];
                LetterbaseArrPush(props, addAttr(name, value))
              }
            }
            const style = tpl.style;
            LetterbaseArrPush(props, addStyle(style));
            com.props = props;

            tpl.getCom = ()=> com; 

            com.hasInit = true;
          }
        })
      })
    }
  }
}
</script>

<style lang="less">
  .form-design{
      position: relative;
      border: 1px dashed pink;

      &:focus {
        outline-style: none;
      }

      & *{
        -webkit-user-select: none;  /* Chrome all / Safari all */
        -moz-user-select: none;     /* Firefox all */
        -ms-user-select: none;      /* IE 10+ */
        user-select: none;          /* Likely future */      
      }
  }
</style>