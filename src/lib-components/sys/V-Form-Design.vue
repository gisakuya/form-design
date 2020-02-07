<template>
    <div class="form-design"
        @dragover="allowDrop" 
        @drop="drop" 
        @mousedown="mouseDown"
        @mousemove="mouseMove"
        @mouseup="mouseUp"
        @keyup.46="delCom" tabindex="0">

        <p>动态属性：{{dynamicProps}}</p>
        <v-line-simple ref="vline"></v-line-simple>
        <v-form-design-tpl :template="tpl.components">
        </v-form-design-tpl>

    </div>
</template>

<script>
import { TimerHeper, TreeLoop, TreeLoopSkip, TreeFindSingle, TreeFindCollect, TreeDelItem, TreeMoveItem } from "./utility";
import { GetComExportTpl, IsPointInComBoundary, InitComDesignProps, InitComBindProps, GetComTag  } from "./componentUtility";

let mouse = {};
let timerHelper = new TimerHeper();

export default {
  model: {
    prop: 'tpl',
    event: 'tplChanged'
  },
  provide: function(){
    return {
        onComponentDeleted: this.onComponentDeleted,
        getComponentById: this.getComponentById,
        isComponentIdVaild: this.isComponentIdVaild,
        getMouseOffset: this.getMouseOffset,
        setMouseShape: this.setMouseShape
    }
  },
  data() {
    return {
      cur: {},
      components: [],
      dynamicProps: {}
    }
  },
  props: {
      tpl: {
        type: Object,
        default:function(){
          return  { components: [] }
        }
      }, 
      drawLineMode: Boolean,
  },
  computed: {
    designProps: function(){
      if(this.cur && this.cur.activeCom){

        let activeCom = this.cur.activeCom;
        while (activeCom.tagName != 'v-resizable') {
          activeCom = activeCom.parent;
        }

        const arr = [];

        const add = ctx => {
          if(!ctx.designProps || !ctx.designProps.length) return;
          for (let i = 0; i < ctx.designProps.length; i++) {
            const p = ctx.designProps[i];
            arr.push(p);
          }
        };

        add(activeCom);
        add(activeCom.children[0]);

        return arr;
      }

      return {};
    },
    bindProps: function(){
      if(this.cur && this.cur.activeCom){

        let activeCom = this.cur.activeCom;
        while (activeCom.tagName != 'v-resizable') {
          activeCom = activeCom.parent;
        }

        const arr = [];

        const add = ctx => {
          if(!ctx.bindProps || !ctx.bindProps.length) return;
          for (let i = 0; i < ctx.bindProps.length; i++) {
            const p = ctx.bindProps[i];
            arr.push(p);
          }
        };

        add(activeCom);
        add(activeCom.children[0]);

        return arr;
      }
      
      const arr = [];
      for (const key in this.dynamicProps) {
        arr.push({
          title: key,
          get: () => this.dynamicProps[key],
          set: val => this.dynamicProps[key] = val
        })
      }
      return arr;
    }
  },
  methods: {
      // 组件删除时
      onComponentDeleted: function(com){
        TreeDelItem(this.components, com);
        // 手动删除的
        if(this.cur.delComManual){
          timerHelper.ExecAfter(0, ()=>{
            this.cur = {};
            this.emitTplChanged();
            this.emitSelChanged();
          })
        }
      },

      // 手动删除组件
      delCom: function(){
        let activeCom = this.cur.activeCom;
        if(!activeCom) return;
        while (activeCom.tagName != 'v-resizable') {
          activeCom = activeCom.parent;
        }
        this.cur = {
          delComManual: true,
          activeCom: activeCom
        };
        activeCom.delSelf();
      },

      // 拖拉组件
      allowDrop: function(ev) {
        ev.preventDefault();
      },
      drop: function(ev) {
        var data=ev.dataTransfer.getData("drag-component");
        if(!data) return;
        ev.preventDefault();

        let [ componentName, ox, oy ] = data.split(",");
        let { x, y } = this.getMouseOffset(ev, { x: -(ox||0), y: -(oy||0) })

        this.emitTplChanged([ ...this.tpl.components, this.createVComponent({x, y}, componentName) ]);

        this.cur = {};
      },

      // 鼠标按下
      mouseDown: function(ev) {
        if(this.cur.activeCom){
          this.cur.activeCom.active = false;
        }
        
        this.cur = {};

        // 鼠标位置
        const mousePos = this.getMouseOffset(ev);
        
        // 查找激活组件
        TreeLoop(this.components, com => {
            if(com.isPointInBoundary ? com.isPointInBoundary(mousePos) : IsPointInComBoundary(com, ev)){
              if(com.exportMouseDown){
                com.exportMouseDown(mousePos);
              }
              com.active =  true;
              this.cur = {
                activeCom: com,
                designProps: com.designProps,
                bindProps: com.bindProps
              };
              mouse = {
                  dragging: false,
                  draggingCount: 1,
                  orgX: ev.x,
                  orgY: ev.y
              };

              return false; // break;
            }
        }, true);

        const { activeCom } = this.cur;
        if(this.drawLineMode && activeCom && activeCom.draggingDot){
          // 画线模式
          const vline = this.$refs.vline;
          if(vline.isSourceSet()){
            vline.saveDest(activeCom.draggingDot);

            this.emitTplChanged([ ...this.tpl.components, this.createVLine(vline.source, vline.dest) ])

            vline.reset();
          }
          else{
            vline.moveTo(mousePos);
            vline.saveSource(activeCom.draggingDot);
          }
        }

        this.emitSelChanged();
      },

      // 鼠标移动
      mouseMove: function(ev) {
        // 鼠标位置
        const mousePos = this.getMouseOffset(ev);

        // 显示元素边界
        TreeLoop(this.components, com => {
          if(com.hasOwnProperty("showBorder")){
            const preShowBorder = com.showBorder;
            com.showBorder = com.isPointInBoundary ? com.isPointInBoundary(mousePos) : IsPointInComBoundary(com, ev);
            if(com.mouseHoverShape != undefined){
              if(!preShowBorder && com.showBorder){
                // mouse-enter
                this.setMouseShape(com.mouseHoverShape);
              }
              else if(preShowBorder && !com.showBorder){
                // mouseLeave
                this.setMouseShape("");
              }
            }
          }
        });

        if(this.drawLineMode){
          // 画线模式
          const vline = this.$refs.vline;
          if(vline.isSourceSet()){
              vline.lineTo(mousePos);
          }
        }

        // 拖拉缩放....
        const { activeCom } = this.cur;
        if(activeCom && mouse){
          const ox = ev.x - mouse.orgX;
          const oy = ev.y - mouse.orgY;
          if(!(ox >= 5 || oy >= 5 || ox <= -5 || oy <= -5)) return;

          mouse.dragging = true;

          if(activeCom.draggingBegin && mouse.draggingCount++ == 1){
              if(activeCom.isMoving){
                    // 在拖动的时候，改变当前元素的父节点，之后再还原
                    const childEl = activeCom.$el;
                    const oldParentEl = childEl.parentNode;
                    const newParentEl = this.$el;
                    this.cur.activeComReset = ()=>{
                      oldParentEl.appendChild(childEl);
                    };

                    const rect = this.getChildRect(activeCom);
                    this.cur.activeComRect = rect; 
                    activeCom.setPosition(rect.l, rect.t);
                    newParentEl.appendChild(childEl);
              }
              if(activeCom.isResizing){
                this.cur.activeComRect = activeCom.getRect();
              }
              activeCom.draggingBegin();
          }

          if(activeCom.draggingHandler){
            const { l: orgX, t: orgY, w: orgW, h: orgH } = this.cur.activeComRect;
            activeCom.draggingHandler({ orgX, orgY, orgW, orgH }, { ox, oy })
          }
        }
      },

      // 鼠标弹起
      mouseUp: function(ev) {
        if(this.drawLineMode && ev.button == 2){
            // 取消画线
            const vline = this.$refs.vline;
            vline.reset();
        }

        if(mouse.dragging){
            // 拖拉缩放....结束
            const { activeCom, activeComReset } = this.cur;
            if(activeCom.draggingEnd){
              activeCom.draggingEnd();
            }

            if(activeComReset){
              activeComReset();
            }

            if(activeCom.tagName == "v-resizable"){
              // 只对v-resiable处理
              let preInContainer = activeCom.parent ? (activeCom.parent.tagName == "v-row" || activeCom.parent.tagName == "v-col") : false;
              let nowInContainer = false;

              let container = null;
              let beforeChild = null;

              TreeLoopSkip(this.components, activeCom, com => {
                if(com.tagName == "v-row" || com.tagName == "v-col"){
                  if(com.showBorder){
                    // 嵌入容器内
                    container = com;
                    nowInContainer = true;
                    for (let i = 0; i < container.children.length; i++) {
                      const child = container.children[i];
                      if(child.showBorder){
                        beforeChild = child;
                        break;
                      }
                    }
                    return false;
                  }
                }
              }, true)


              if(nowInContainer){
                  // 嵌入容器内
                  activeCom.setPosition(0, 0);

                  // 移动节点
                  TreeMoveItem(this.components, container, activeCom, beforeChild);
              }
              else if(preInContainer){
                  // 移出来了

                  // 移动节点
                  TreeMoveItem(this.components, null, activeCom);
              }
            }

            this.emitTplChanged();
        }

        mouse = {};
      },

      // 通过名称获取组件
      getComponentById: function(comId){
        return TreeFindSingle(this.components, com => com.id == comId);
      },

      // 创建组件名称
      createNewComponentId: function(comType){
        comType = comType.toLowerCase().replace("-", "");
        let index = 1;
        let comName = null;
        do{
          comName = `${comType}${index++}`
        }
        while(!this.isComponentIdVaild(comName))
        return comName;
      },

      // 组件名是否有效
      isComponentIdVaild:function(comId){
        return !TreeFindSingle(this.components, com => com.id == comId);
      },

      // 获取鼠标偏移量
      getMouseOffset(ev, offset){
        const containerRect = this.$el.getBoundingClientRect();
        let x = ev.x - containerRect.left;
        let y  = ev.y - containerRect.top;
        if(offset){
          x += offset.x;
          y += offset.y;
        }
        return { x, y };
      },

      // 获取子控件的矩形大小
      getChildRect(item, offset){
        const containerRect = this.$el.getBoundingClientRect();
        const childRect = item.$el.getBoundingClientRect();
        return { 
          l: childRect.left - containerRect.left,
          t: childRect.top - containerRect.top,
          w: childRect.width,
          h: childRect.height
        }
      },

      // 设置鼠标样式
      setMouseShape: function(shape){
        this.$el.style.cursor = shape;
      },

      // 获取子集合的tpl
      exportChildrenTpl: function(){
        let rtn = [];

        const helper = (tree, arr)=>{
          if(!tree) return;
          for (let i = 0; i < tree.length; i++) {
            const node = tree[i];
            let obj = GetComExportTpl(node);
            if(node.children && node.children.length){
              helper(node.children, (obj.children = []));
            }
            arr.push(obj);
          }
        };

        helper(this.components, rtn);

        return rtn;
      },

      // 发送事件
      emitTplChanged: function(children){
            const childrenTpl = children || this.exportChildrenTpl();
            this.$emit("tplChanged", { components: childrenTpl });
      },

      // 发送事件
      emitSelChanged: function(){
        this.$emit("selChanged", this.cur.activeCom, this.designProps, this.bindProps);
      },

      // 创建控件
      createVComponent: function(pos, componentName){
        return this.createVResiable(pos, componentName);
      },

      // 创建VResiable
      createVResiable: function({ x, y }, childComponent){
        return { 
          tag: "v-resizable", 
          id: this.createNewComponentId('v-resizable'),
          designProps: { pos: `${x},${y}` },
          children: [ { 
            tag: childComponent,
            id: this.createNewComponentId(childComponent),
          } ]
        }
      },

      // 创建VLine
      createVLine: function(source, dest){
        return {
          tag: 'v-line',
          id: this.createNewComponentId('v-line'),
          designProps: { source, dest }
        }
      },
      
      // 动态添加属性
      addDynamicProp: function(name){
        for (const key in this.dynamicProps) {
          if(key == name) return;
        }
        this.$set(this.dynamicProps, name, null);
      }
  },
  mounted: function() {
    // 初始化事件
    this.emitSelChanged();

    // 禁止右键菜单
    document.addEventListener('contextmenu', event => event.preventDefault());
  },
  watch: {
    drawLineMode: function(val){
      TreeLoop(this.components, com => {
        if(com.hasOwnProperty("connectMode")){
          com.connectMode = val;
        }
      });
    },
    tpl: function(){
        console.log("tpl changed");
        this.$nextTick(()=>{
            // 子组件已显示
            let vueComs = [];

            // 跳过v-line-simple控件
            for (let i = 1; i < this.$children.length; i++) {
              vueComs.push(this.$children[i]);
            }

            // 遍历
            TreeLoop(vueComs, (item, parent)=>{
                item.parent = parent; // 额外添加，自用
                item.children = [];   // 额外添加，自用
                item.tagName = GetComTag(item); // 额外添加，自用
                if(parent){
                  const _index = item.$el._index;
                  if(parent.children.length > _index){
                    parent.children.splice(_index, 0, item);
                  }else{
                    parent.children.push(item);
                  }
                  if(item.tagName != "v-row" && item.tagName != "v-col" && parent.tagName == "v-resizable"){
                      return true;                    
                  }
                }
            }, false, "$children");

            this.components = vueComs;

            // 初始化
            TreeLoop(vueComs, item=>{
                InitComDesignProps(item, this.emitTplChanged); // 初始化DesignProps
                InitComBindProps(item, this.emitTplChanged); // 初始化BindProps
            })
        })
    }
  }
}
</script>

<style lang="less">
  .form-design{
      position: relative;

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