<template>
  <el-container style="height: 900px; border: 1px solid #eee">
    <el-aside width="200px" style="background-color: rgb(238, 241, 246)">
      <el-menu :default-openeds="['0']">
          <el-submenu v-for="(menu, index) in menus" :key="menu.title" :index="String(index)">
            <template slot="title">
              <i v-if="menu.icon" :class="menu.icon"></i> {{ menu.title }}
            </template>
            <el-menu-item v-for="submenu in menu.submenus" :key="submenu.title" draggable="true" @dragstart.native="drag($event, submenu)">
              {{ submenu.title }}
            </el-menu-item>
          </el-submenu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header>
        <el-switch v-model="drawLineMode" inactive-text="连线模式"></el-switch>
      </el-header>

      <el-main 
          @dragover.native="allowDrop" 
          @drop.native="drop" 
          @mousedown.native="mouseDown"
          @mousemove.native="mouseMove"
          @mouseup.native="mouseUp"
          @keyup.delete.native="delComponent"
          tabindex="1"
          >

          <v-line-simple ref="vline"></v-line-simple>

          <v-runtime-template :parent="this" :template="tpl" ref="vrt"
              style="position:relative; height: 700px;">
          </v-runtime-template>

          <div style="position:relative; height: 300px;">
            <textarea :value="exportTpl" @change="tplChange($event.target.value)" style="width: 100%; height:100%;"/>
          </div>
      </el-main>
    </el-container>

    <el-aside width="260px" style="background-color: rgb(238, 241, 246);">
      <el-menu :default-openeds="['0','1','2','3','4','6','7','8','9']">
          <el-submenu v-for="(group, index) in designProps" :key="group.title" :index="String(index)">
            <template slot="title">
              <i class="el-icon-edit"></i> {{ group.title }}
            </template>
            <li>
            <table>
              <tr v-for="prop in group.props" :key="prop.title">
                <td style="width:80px;"><span style="margin-left:5px;font-size:14px">{{ prop.title }}</span></td>
                <td>
                    <input class="el-input__inner"
                      :title="prop.tooltip"
                      :value="prop.get.call(prop.ctx)" 
                      :readonly="prop.readonly"
                      @change="prop.set.call(prop.ctx, $event.target.value)"/>
                  </td>
              </tr>
            </table>
            </li>
          </el-submenu>
      </el-menu>
    </el-aside>
  </el-container>
</template>

<script>
import Vue from 'vue'

let mouse = {};

export default {
  name: "Home",
  provide: function(){
    return {
        onComponentCreated: this.onComponentCreated,
        onComponentDeleted: this.onComponentDeleted,
        getComponentByName: this.getComponentByName,
        createNewComponentName: this.createNewComponentName,
        isComponentNameVaild: this.isComponentNameVaild,
        getMouseOffset: this.getMouseOffset,
        setMouseShape: this.setMouseShape
    }
  },
  data() {
    return {
      menus: [
        { title: '逆变器', icon: 'el-icon-setting', submenus: [ 
            { title: 'SUN2000-33KTL', componentName: 'nb-sun2000-33k' }, 
            { title: 'SUN2000-36KTL', componentName: 'nb-sun2000-36k' }   
          ]  
        }
      ],
      props: [{ title: '一般属性', props:[] }],
      drawLineMode: false,
      tpl: `
          <v-resizable name="cmp1">
            <nb-sun2000-36k cust-attr="haha"></nb-sun2000-36k>
          </v-resizable>

          <v-resizable name="cmp2" pos="500,150" size="200,100">
            <nb-sun2000-36k cust-attr="kaka"></nb-sun2000-36k>
          </v-resizable>

          <v-line source="cmp1.rc" dest="cmp2.lc"></v-line>
      `,
      line: null,
      container: null,
      containerRect: null,
      components: [],
      cur: {}
    }
  },
  computed: {
    exportTpl: function(){
      let tpl = "";
      for (let i = 0; i < this.components.length; i++) {
        const cmp = this.components[i];
        tpl += cmp.exportTpl;
      }
      return tpl;
    },
    designProps: function(){
      return this.cur && this.cur.designProps ? this.cur.designProps : this.props;
    }
  },
  methods: {
      // 组件创建时
      onComponentCreated: function(com){
        console.log("onComponentCreated", com);
        com.connectMode = this.drawLineMode;
        this.components.push(com);
      },
      // 组件删除时
      onComponentDeleted: function(com){
        console.log("onComponentDeleted", com);
        const index = this.components.indexOf(com);
        if(index != -1){
          this.components.splice(index, 1);
        }
      },

      // 删除控件
      delComponent: function(){
          if(!this.cur.activeCom) return;
          this.cur.activeCom.delSelf();
          
          this.cur = {};
      },

      // 拖拉组件
      drag: function(ev, item) {
        this.cur = {
          dragComponent: true,
          componentName: item.componentName,
          ox: ev.offsetX,
          oy: ev.offsetY
        }
      },
      allowDrop: function(ev) {
        if(!this.cur.dragComponent) return;
        ev.preventDefault();
      },
      drop: function(ev) {
        if(!this.cur.dragComponent) return;
        ev.preventDefault();

        let { componentName, ox, oy } = this.cur;
        let { x, y } = this.getMouseOffset(ev, { x: -ox, y: -oy })

        let curTpl = this.exportTpl;
        let newTpl = `<v-resizable pos="${x},${y}"><${componentName}></${componentName}></v-resizable>`;
        this.tplChange(curTpl + newTpl);

        this.cur = {};
      },

      // 鼠标按下
      mouseDown: function(ev) {
        if(this.cur.activeCom){
          this.cur.activeCom.active = false;
        }
        
        this.cur = {};
        
        // 查找激活组件
        for (let i = 0; i < this.components.length; i++) {
          const com = this.components[i];
          if(com.isPointInBoundary(this.getMouseOffset(ev))){
            if(com.exportMouseDown){
              com.exportMouseDown(ev);
            }
            com.active =  true;
            this.cur = {
              activeCom: com,
              activeComRect: { orgX: com.x, orgY: com.y, orgW: com.w, orgH: com.h },
              designProps: com.getDesignPropsByGroup.call(com)
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
          const vline = this.line;
          if(vline.isSourceSet()){
            vline.saveDest(activeCom.draggingDot);

            let curTpl = this.exportTpl;
            let newTpl = `<v-line source="${vline.source}" dest="${vline.dest}"></v-line>`;
            this.tplChange(curTpl + newTpl);

            vline.reset();
          }
          else{
            this.container.$el.appendChild(this.line.$el);
            vline.moveTo(this.getMouseOffset(ev));
            vline.saveSource(activeCom.draggingDot);
          }
        }
      },

      // 鼠标移动
      mouseMove: function(ev) {
        // 显示元素边界
        for (let i = 0; i < this.components.length; i++) {
          const cmp = this.components[i];
          const preShowBorder = cmp.showBorder;
          cmp.showBorder = cmp.isPointInBoundary(this.getMouseOffset(ev));
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
          const vline = this.line;
          if(vline.isSourceSet()){
              vline.lineTo(this.getMouseOffset(ev));
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
            const vline = this.line;
            vline.reset();
        }

        if(mouse.dragging){
            // 拖拉缩放....结束
            const { activeCom } = this.cur;
            if(activeCom.draggingEnd){
              activeCom.draggingEnd();
            }
        }

        mouse = {};
      },

      // 人为改变模板
      tplChange: function(val){
        this.components = [];
        this.tpl = val;
        this.container.refresh();
        this.initComponentsDesignProps();
      },

      // 初始化所有组件的设计属性
      initComponentsDesignProps: function(){
          this.$nextTick(()=>{
            for (let i = 0; i < this.components.length; i++) {
              const com = this.components[i];
              if(com.initDesignProps){
                com.initDesignProps.call(com);
              }
            }

            this.$nextTick(()=>{
              for (let i = 0; i < this.components.length; i++) {
                const com = this.components[i];
                if(com.layoutFinished){
                  com.layoutFinished.call(com);
                }
              }
            })
          })
      },

      // 通过名称获取组件
      getComponentByName: function(comId){
        for (let i = 0; i < this.components.length; i++) {
          const com = this.components[i];
          if(com.name == comId) return com;
        }
        return null;
      },

      // 创建组件名称
      createNewComponentName: function(com){
        let comType = com.$options._componentTag;
        comType = comType.toLowerCase().replace("-", "");
        let index = 1;
        let comName = null;
        do{
          comName = `${comType}${index++}`
        }
        while(!this.isComponentNameVaild(comName))
        return comName;
      },

      // 组件名是否有效
      isComponentNameVaild:function(comName){
        for (let i = 0; i < this.components.length; i++) {
          const com = this.components[i];
          if(com.name == comName) return false;
        }
        return true;
      },

      // 获取鼠标偏移量
      getMouseOffset(ev, offset){
        let x = ev.x - this.containerRect.left;
        let y  = ev.y - this.containerRect.top;
        if(offset){
          x += offset.x;
          y += offset.y;
        }
        return { x, y };
      },

      // 设置鼠标样式
      setMouseShape: function(shape){
        this.$el.style.cursor = shape;
      }
  },
  watch: {
    drawLineMode: function(val){
      for (let i = 0; i < this.components.length; i++) {
        const com = this.components[i];
        com.connectMode = this.drawLineMode;
      }
    }
  },
  mounted: function(params) {
    // 禁止右键菜单
    document.addEventListener('contextmenu', event => event.preventDefault());

    // 初始化所有组件的设计属性
    this.initComponentsDesignProps();

    // 容器位置
    this.$nextTick(()=>{
      this.line = this.$refs.vline;
      this.container = this.$refs.vrt;
      this.containerRect = this.container.$el.getBoundingClientRect();
    });

    // 定时刷新容器的位置
    let scrollTimerId = 0;
    document.addEventListener("scroll", ()=>{
      if(scrollTimerId) clearTimeout(scrollTimerId);
      scrollTimerId = setTimeout(() => {
        console.log('ssss')
        this.containerRect = this.container.$el.getBoundingClientRect();
        scrollTimerId = 0;
      }, 1000);
    }, true)
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less">
  .el-menu-item {
    cursor: move;
  }

  .el-header {
    background-color: #f2f2f2;
    line-height: 60px;

    .el-link {
      margin-right: 5px;
    }
  }

  .el-main{
      &:focus{
          outline: none;
      }
  }
</style>
