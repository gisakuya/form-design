<template>
  <el-container style="height: 800px; border: 1px solid #eee">
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

      <el-main @dragover.native="allowDrop" @drop.native="drop" @mousedown.native="mouseDown" @mousemove.native="mouseMove" @mouseup.native="mouseUp"
          ref="mainContainer">
        <VResizable
            v-for="(item, index) in components" 
            :key="item.id" 
            :tabindex="index"
            :connectMode="drawLineMode"
            @init="componentInit"
            @keyup.delete.native="componentDel(index)"
            @dotMouseDown="componentDotMouseDown"
          >
            <component :is="item.name"></component>
        </VResizable>

        <component v-for="(item, index) in shapes"
          :is="item.name"
          :key="item.id"
          :tabindex="index"
          @init="shapeInit"
          @keyup.delete.native="shapeDel(index)" />

      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import VResizable from "./VResizable";
import VLine from "./VLine";
import { Promise } from 'q';

let mouse = {};
let cur = {};
let componentIndex = 1;
let containerOffset = { left: 0, top: 0 };

let componentCreateResolve = null;
function AfterComponentCreate(successFnt){
      new Promise(function(resolve, reject) {
        componentCreateResolve = resolve;
      }).then(successFnt);
}

function GetPos(ev){
  return { 
      x: ev.x - containerOffset.left, 
      y: ev.y - containerOffset.top
  };
}

export default {
  name: "Home",
  data() {
    return {
      menus: [
        { title: '逆变器', icon: 'el-icon-setting', submenus: [ 
            { title: 'SUN2000-33KTL', componentName: 'nb-sun2000-33k' }, 
            { title: 'SUN2000-36KTL', componentName: 'nb-sun2000-36k' }   
          ]  
        },
      ],
      components: [],
      shapes: [],
      drawLineMode: false
    }
  },
  methods: {
    // 测试
    test: function() {

    },
    // 组件相关
    componentInit: function(item) {
      cur.item = item;
      componentCreateResolve(item);
    },
    componentDel: function(i) {
      cur.item = null;
      this.components.splice(i, 1);
    },

    // 形状相关
    shapeInit: function(item) {
      cur.item = item;
      componentCreateResolve(item);
    },
    shapeDel: function(i) {
      cur.item = null;
      this.shapes.splice(i, 1);
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
      var data = ev.dataTransfer.getData("Text");
      this.components.push({
        id: componentIndex++,
        name: data,
      });

      AfterComponentCreate(item => {
        let pos = GetPos(ev);
        item.setPos({ x: pos.x - mouse.offsetX, y: pos.y - mouse.offsetY });
      });

      cur.dragComponent = false;
    },

    // 控制点
    componentDotMouseDown: function(el, pos){
      console.log(el);
    },

    // 连线
    mouseDown: function(ev) {
      if(this.drawLineMode){
          this.shapes.push({
            id: componentIndex++,
            name: 'VLine'
          });

          AfterComponentCreate(item => {
            item.moveTo(GetPos(ev));
          });
      }
    },
    mouseMove: function(ev) {
      if(this.drawLineMode && cur.item){
          cur.item.lineTo(GetPos(ev));
      }
    },
    mouseUp: function(ev) {
      cur = {};
    },
  },
  mounted: function(params) {
    containerOffset = {
      left: this.$refs.mainContainer.$el.offsetLeft,
      top: this.$refs.mainContainer.$el.offsetTop
    };
  },
  components: {
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

  .el-main {
    position: relative;
  }

  .el-header {
    background-color: #f2f2f2;
    line-height: 60px;

    .el-link {
      margin-right: 5px;
    }
  }
</style>
