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
          <el-link :underline="false" @click="straightLine">直线</el-link>
          <el-link :underline="false" @click="foldLine">折线</el-link>
      </el-header>

      <el-main @dragover.native="allowDrop" @drop.native="drop" @mousedown.native="mouseDown" @mousemove.native="mouseMove" @mouseup.native="mouseUp"
          ref="mainContainer">
        <VResizable
            v-for="(item, index) in components" 
            :key="item.id" 
            :tabindex="index"
            :showBorder="allShowBorder"
            :onDotClick="componentDotClick"
            @init="componentInit"
            @keyup.delete.native="componentDel(index)"
          >
            <component :is="item.name"></component>
        </VResizable>

        <component v-for="(item, index) in shapes"
          :is="item.name"
          :key="item.id"
          :tabindex="index"
          @init="shapeInit"
          @keyup.delete.native="shapeDel(index)"  />

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
      allShowBorder: false
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
      cur = {};
      this.components.splice(i, 1);
    },
    componentDotClick: function(ev){
        return false;
    },

    // 形状相关
    shapeInit: function(item) {
      cur.item = item;
      componentCreateResolve(item);
    },
    shapeDel: function(i) {
      cur = {};
      this.shapes.splice(i, 1);
    },

    // 直线
    straightLine: function() {
      this.allShowBorder = !this.allShowBorder;
      cur.drawShape = this.allShowBorder ? 'VLine' : null;
    },
    // 折线
    foldLine: function() {
    },

    // 拖拉
    drag: function(ev, item) {
      mouse.offsetX = ev.offsetX;
      mouse.offsetY = ev.offsetY;
      ev.dataTransfer.setData("Text", item.componentName);
    },
    allowDrop: function(ev) {
      ev.preventDefault();
    },
    drop: function(ev) {
      ev.preventDefault();
      var data = ev.dataTransfer.getData("Text");
      this.components.push({
        id: componentIndex++,
        name: data,
      });

      AfterComponentCreate(item => {
        item.setPos(ev.offsetX - mouse.offsetX, ev.offsetY - mouse.offsetY);
      });
    },

    // 鼠标行为
    mouseDown: function(ev) {
      if(cur.drawShape){
          this.shapes.push({
            id: componentIndex++,
            name: cur.drawShape
          });

          AfterComponentCreate(item => {
            mouse.prex = ev.offsetX;
            mouse.prey = ev.offsetY;
            item.moveTo(ev.x - containerOffset.left, ev.y - containerOffset.top);
          });
      }
    },
    mouseMove: function(ev) {
      if(cur.item && cur.drawShape){
          cur.item.lineTo(ev.x - containerOffset.left, ev.y - containerOffset.top);
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
