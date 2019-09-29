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

          <v-runtime-template :parent="this" :template="tpl" ref="vrt"
              style="position:relative;height: 70%;">
          </v-runtime-template>

          <div style="height: 30%;">
            <textarea style="width: 100%; height:100%;" :value="tpl" @change="tplChange($event.target.value)"></textarea>
          </div>
      </el-main>
    </el-container>
    <el-aside width="250px" style="background-color: rgb(238, 241, 246);">
      <el-menu :default-openeds="['0','1','2','3','4','6','7','8','9']">
          <el-submenu v-for="(group, index) in cur.designProps" :key="group.title" :index="String(index)">
            <template slot="title">
              <i class="el-icon-edit"></i> {{ group.title }}
            </template>
            <table>
              <tr v-for="prop in group.props" :key="prop.title">
                <td style="width:60px;"><span style="margin-left:5px;font-size:14px">{{ prop.title }}</span></td>
                <td>
                    <input v-if="prop.get" class="el-input__inner"
                      :title="prop.tooltip"
                      :value="prop.get.call(cur.activeCom)" 
                      @change="prop.set.call(cur.activeCom, $event.target.value)"/>
                    <input v-else class="el-input__inner"
                      :title="prop.tooltip"
                      v-model="cur.activeCom[prop.name]"/>
                  </td>
              </tr>
            </table>
          </el-submenu>
      </el-menu>
    </el-aside>
  </el-container>
</template>

<script>
import VRuntimeTemplate from "./VRuntimeTemplate";
import VResizable from "./VResizable";
import VLine from "./VLine";
import { Promise } from 'q';

let mouse = {};

export default {
  name: "Home",
  provide: function(){
    return {
        onComponentCreated: this.onComponentCreated,
        onComponentActived: this.onComponentActived,
        getComponentByName: this.getComponentByName,
        createNewComponentName: this.createNewComponentName,
        isComponentNameVaild: this.isComponentNameVaild,
        onComponentTplChanged: this.onComponentTplChanged
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
        <div>
          <v-resizable name="cmp1">
            <nb-sun2000-36k></nb-sun2000-36k>
          </v-resizable>

          <v-resizable name="cmp2" pos="500,150" size="200,100">
            <nb-sun2000-36k></nb-sun2000-36k>
          </v-resizable>

          <v-line source="cmp1.rc" dest="cmp2.lc"></v-line>
        </div>
      `,
      cur: {},
      components: []
    }
  },
  methods: {
      // 组件创建时
      onComponentCreated: function(com){
        console.log("onComponentCreated", com);
        this.components.push(com);
      },

      // 组件激活时
      onComponentActived: function(com, isActived){
        // console.log("onComponentActived", com, isActived);
        if(isActived){
          this.cur = {
            activeCom: com,
            designProps: (com.$options.designProps && com.$options.designProps.length) ? 
                            com.$options.designProps : this.props
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

      // 组件模板发生变化时
      onComponentTplChanged: function(com, tpl){

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
              const designPropGroups = com.$options.designProps;
              if(!designPropGroups || designPropGroups.length == 0) continue;
              let designProps = [];
              for (let i = 0; i < designPropGroups.length; i++) {
                const group = designPropGroups[i];
                if(group.props){
                  designProps.push(...group.props);
                }
              }
              for (let j = 0; j < designProps.length; j++) {
                const designProp = designProps[j];
                if(!designProp.name) continue;
                const designPropVal = com.$attrs[designProp.name] || designProp.default;
                if(designProp.init){
                  designProp.init.call(com, designPropVal);
                }
                else if(designProp.set){
                  designProp.set.call(com, designPropVal, true);
                }
                else{
                  com.$data[designProp.name] = designPropVal;
                }
              }
            }

            this.$nextTick(()=>{
              for (let i = 0; i < this.components.length; i++) {
                const com = this.components[i];
                if(com.$options.designPropsInitFinish){
                  com.$options.designPropsInitFinish.call(com);
                }
              } 
            });
          });
      },

      // 拖拉组件
      drag: function(ev, item) {
        mouse.offsetX = ev.offsetX;
        mouse.offsetY = ev.offsetY;
        ev.dataTransfer.setData("Text", item.componentName);

        cur.dragComponent = true;
      },
      allowDrop: function(ev) {
        if(cur.dragComponent){
          ev.preventDefault();
        }
      },
      drop: function(ev) {
        ev.preventDefault();
        var componentName = ev.dataTransfer.getData("Text"); // 组件名称
        cur.dragComponent = false;

        console.log(componentName);
      },

      // 连线
      mouseDown: function(ev) {
      },
      mouseMove: function(ev) {
        if(this.drawLineMode && cur.line){
            // cur.line.lineTo(container.getPos(ev));
        }
      },
      mouseUp: function(ev) {
        if(this.drawLineMode && ev.button == 2){
          // 取消画线
          cur.line = null;
        }
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
  },
  components: {
    VRuntimeTemplate,
    VResizable,
    VLine
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less" scoped>
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
