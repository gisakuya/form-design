<template>
    <div class="form-design"
        @dragover="allowDrop" 
        @drop="drop" 
        @mousedown="mouseDown"
        @mousemove="mouseMove"
        @mouseup="mouseUp"
        @keyup.46="delComponent"
        tabindex="1">

        <p>动态属性：{{dynamicProps}}</p>
        <v-line-simple ref="vline"></v-line-simple>
        <v-form-design-tpl :template="tpl.components">
        </v-form-design-tpl>

    </div>
</template>

<script>
import { ExecDelay } from "./utility";

let mouse = {};

export default {
  model: {
    prop: 'tpl',
    event: 'tplChanged'
  },
  provide: function(){
    return {
        onComponentCreated: this.onComponentCreated,
        onComponentDeleted: this.onComponentDeleted,
        getComponentById: this.getComponentById,
        isComponentIdVaild: this.isComponentIdVaild,
        getMouseOffset: this.getMouseOffset,
        setMouseShape: this.setMouseShape,
        emitTplChanged: this.emitTplChanged
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
      return this.cur && this.cur.designProps ? this.cur.designProps : [];
    },
    bindProps: function(){
      if(this.cur && this.cur.bindProps) return this.cur.bindProps;
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
      // 组件创建时
      onComponentCreated: function(com){
        this.components.push(com);
        // const comTag = com.$options._componentTag;
        // if(comTag == "v-row" || comTag == "v-col" || comTag == "v-line"){
        //   this.components.push(com);
        // }else{
        //   this.components.splice(0, 0, com);
        // }
      },
      // 组件删除时
      onComponentDeleted: function(com){
        const index = this.components.indexOf(com);
        if(index != -1){
          this.components.splice(index, 1);
          if(this.cur && this.cur.delManual){
            // 手动删除的
            ExecDelay(50, ()=>{
              this.cur = {};
              this.emitTplChanged();
              this.emitSelChanged();
            });
          }
        }
      },

      // 删除控件
      delComponent: function(){
          if(!this.cur.activeCom) return;
          this.cur.delManual = true;
          this.cur.activeCom.delSelf();
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

        this.emitTplChanged([ ...this.tpl.components, this.createVResiable({x, y}, componentName) ]);

        this.cur = {};
      },

      // 鼠标按下
      mouseDown: function(ev) {
        if(this.cur.activeCom){
          this.cur.activeCom.active = false;
        }
        
        this.cur = {};
        
        // 查找激活组件
        const mousePos = this.getMouseOffset(ev);
        for (let i = 0; i < this.components.length; i++) {
          const com = this.components[i];
          if(com.isPointInBoundary(mousePos)){
            if(com.exportMouseDown){
              com.exportMouseDown(ev);
            }
            com.active =  true;
            this.cur = {
              activeCom: com,
              activeComRect: { orgX: com.x, orgY: com.y, orgW: com.w, orgH: com.h },
              designProps: com.designProps,
              bindProps: com.bindProps
            };
            mouse = {
                dragging: false,
                draggingCount: 1,
                orgX: ev.x,
                orgY: ev.y
            };
            break;
          }
        }

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
        // 显示元素边界
        const mousePos = this.getMouseOffset(ev);
        for (let i = 0; i < this.components.length; i++) {
          const cmp = this.components[i];
          const preShowBorder = cmp.showBorder;
          cmp.showBorder = cmp.isPointInBoundary(mousePos);
          if(cmp.mouseHoverShape != undefined){
            if(!preShowBorder && cmp.showBorder){
              // mouse-enter
              this.setMouseShape(cmp.mouseHoverShape);
            }
            else if(preShowBorder && !cmp.showBorder){
              // mouseLeave
              this.setMouseShape("");
            }
          }
        }

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
          if(!(ox >= 10 || oy >= 10 || ox <= -10 || oy <= -10)) return;

          mouse.dragging = true;

          if(activeCom.draggingBegin && mouse.draggingCount++ == 1){
              activeCom.draggingBegin();
          }

          if(activeCom.draggingHandler){
            activeCom.draggingHandler(this.cur.activeComRect, { ox, oy })
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
            const { activeCom } = this.cur;
            if(activeCom.draggingEnd){
              activeCom.draggingEnd();
            }

            this.emitTplChanged();
        }

        mouse = {};
      },

      // 通过名称获取组件
      getComponentById: function(comId){
        for (let i = 0; i < this.components.length; i++) {
          const com = this.components[i];
          if(com.id == comId) return com;
        }
        return null;
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
        for (let i = 0; i < this.components.length; i++) {
          const com = this.components[i];
          if(com.id == comId) return false;
        }
        return true;
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

      // 设置鼠标样式
      setMouseShape: function(shape){
        this.$el.style.cursor = shape;
      },

      // 获取子集合的tpl
      exportChildrenTpl: function(){
        let rtn = [];

        for (let i = 0; i < this.components.length; i++) {
          const com = this.components[i];
          rtn.push(com.exportTpl);
        }

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

      // 创建VResiable
      createVResiable: function({ x, y }, childComponent){
        if(childComponent == "v-row" || childComponent == "v-col"){
          // 容器类
          return {
            tag: childComponent,
            id: this.createNewComponentId(childComponent)
          }
        }
        return { 
          tag: "v-resizable", 
          id: this.createNewComponentId('v-resizable'),
          designProps: { pos: `${x},${y}` },
          children: [ { tag: childComponent } ]
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
      for (let i = 0; i < this.components.length; i++) {
        const com = this.components[i];
        com.connectMode = val;
      }
    },
    tpl: function(){
        console.log("tpl changed");
    }
  }
}
</script>

<style lang="less">
  .form-design{
      position: relative;
      &:focus{
          outline: none;
      }
  }
</style>