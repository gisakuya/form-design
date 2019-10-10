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
          @mouseup.native="mouseUp">

          <v-line-simple ref="vline"></v-line-simple>

          <v-runtime-template :parent="this" :template="tpl" ref="vrt"
              style="position:relative; height: 70%">
          </v-runtime-template>

          <div style="position:relative; height: 30%;">
            <textarea :value="exportTpl" @change="tplChange($event.target.value)" style="width: 100%; height:100%;"/>
          </div>
      </el-main>
    </el-container>

    <el-aside width="260px" style="background-color: rgb(238, 241, 246);">
      <el-menu :default-openeds="['0','1','2','3','4','6','7','8','9']">
          <el-submenu v-for="(group, index) in cur.designProps" :key="group.title" :index="String(index)">
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
        onComponentActived: this.onComponentActived,
        onComponentDeleted: this.onComponentDeleted,
        onComponentDotClick: this.onComponentDotClick,
        getComponentByName: this.getComponentByName,
        createNewComponentName: this.createNewComponentName,
        isComponentNameVaild: this.isComponentNameVaild
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
      cur: {},
      containerRect: null,
      components: []
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
    }
  },
  methods: {
      // 组件创建时
      onComponentCreated: function(com){
        console.log("onComponentCreated", com);
        com.connectMode = this.drawLineMode;
        this.components.push(com);
      },

      // 组件激活时
      onComponentActived: function(com, isActived){
        // console.log("onComponentActived", com, isActived);
        if(isActived){

          this.cur = {
            activeCom: com,
            designProps: com.getDesignPropsByGroup.call(com)
          };
        }
        else{
          if(this.cur.activeCom == com){
            this.cur = {
              designProps: this.props
            }
          }
        }
      },

      // 组件删除时
      onComponentDeleted: function(com){
        const index = this.components.indexOf(com);
        if(index != -1){
          this.components.splice(index, 1);
        }
      },

      // 组件的点点击时
      onComponentDotClick: function(comDot, ev){
        if(!this.drawLineMode) return;
        
        const vline = this.$refs.vline;
        let x = ev.x - this.containerRect.left;
        let y = ev.y - this.containerRect.top;
        if(vline.isSourceSet()){
          vline.saveDest(comDot);

          let curTpl = this.exportTpl;
          let newTpl = `<v-line source="${vline.source}" dest="${vline.dest}"></v-line>`;
          this.tplChange(curTpl + newTpl);

          vline.reset();
        }
        else{
          this.$refs.vrt.$el.appendChild(this.$refs.vline.$el);
          vline.moveTo({ x, y });
          vline.saveSource(comDot);
        }
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
                if(com.allComponentLayoutFinished){
                  com.allComponentLayoutFinished.call(com);
                }
              }
            })
          })
      },

      // 拖拉组件
      drag: function(ev, item) {
        mouse.offsetX = ev.offsetX;
        mouse.offsetY = ev.offsetY;
        ev.dataTransfer.setData("Text", item.componentName);

        this.cur.dragComponent = true;
      },
      allowDrop: function(ev) {
        if(this.cur.dragComponent){
          ev.preventDefault();
        }
      },
      drop: function(ev) {
        ev.preventDefault();
        var componentName = ev.dataTransfer.getData("Text"); // 组件名称

        let x = ev.x - this.containerRect.left - mouse.offsetX;
        let y = ev.y - this.containerRect.top - mouse.offsetY;

        let curTpl = this.exportTpl;
        let newTpl = `<v-resizable pos="${x},${y}"><${componentName}></${componentName}></v-resizable>`;
        this.tplChange(curTpl + newTpl);

        this.cur.dragComponent = false;
      },

      // 连线
      mouseDown: function(ev) {
      },
      mouseMove: function(ev) {
        const vline = this.$refs.vline;
        if(this.drawLineMode && vline.isSourceSet()){
            let x = ev.x - this.containerRect.left;
            let y = ev.y - this.containerRect.top;
            vline.lineTo({x, y});
        }
      },
      mouseUp: function(ev) {
      },

        // 人为改变模板
      tplChange: function(val){
        this.components = [];
        this.tpl = val;
        this.$refs.vrt.refresh();
        this.initComponentsDesignProps();
      },
  },
  mounted: function(params) {
    // 禁止右键菜单
    document.addEventListener('contextmenu', event => event.preventDefault());

    // 初始化所有组件的设计属性
    this.initComponentsDesignProps();

    // 容器位置
    this.$nextTick(()=>{
      this.containerRect = this.$refs.vrt.$el.getBoundingClientRect();
    });
  },
  watch: {
    drawLineMode: function(val){
      for (let i = 0; i < this.components.length; i++) {
        const cmp = this.components[i];
        cmp.connectMode = this.drawLineMode;
      }
    }
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
</style>
