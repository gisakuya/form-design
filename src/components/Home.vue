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
                    <input v-if="prop.name" class="el-input__inner" v-model="cur.activeCom[prop.name]"/>
                    <input v-else class="el-input__inner"
                      :value="prop.getVal.call(cur.activeCom)" 
                      @change="prop.setVal.call(cur.activeCom, $event.target.value)"/>
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
        onComponentActived: this.onComponentActived
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
          <v-resizable ref="cmp1">
            <nb-sun2000-36k></nb-sun2000-36k>
          </v-resizable>

          <v-resizable ref="cmp2" pos="500,150" size="200,100">
            <nb-sun2000-36k></nb-sun2000-36k>
          </v-resizable>

          <v-line source="cmp1.rc" dest="cmp2.lc" path="0,0|100,100"></v-line>
        </div>
      `,
      cur: {}
    }
  },
  methods: {
      // 人为改变模板
      tplChange: function(val){
        this.tpl = val;
        this.$refs.vrt.refresh();
      },
 
      // 组件创建时
      onComponentCreated: function(com){
        console.log("onComponentCreated", com);
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
  },
  mounted: function(params) {
    // 禁止右键菜单
    document.addEventListener('contextmenu', event => event.preventDefault());
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
