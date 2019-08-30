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
      <el-main @dragover.native="allowDrop" @drop.native="drop">
        <warpper
            v-for="(item, index) in components" 
            :key="item.id" 
            :tabindex="index"
            @init="componentInit"
            @keyup.delete.native="componentDel(index)"
          >
            <component :is="item.name"></component>
        </warpper>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import Warpper from "./Warpper.vue";

var mouse = {
  x:0,
  y:0,
  offsetX: 0, // 鼠标相对控件的位置
  offsetY: 0  // 鼠标相对控件的位置
};

var componentIndex = 1;

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
    }
  },
  methods: {
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

      mouse.x = ev.offsetX - mouse.offsetX;
      mouse.y = ev.offsetY - mouse.offsetY;
    },

    // 组件相关
    componentInit: function(item) {
      item.setPos(mouse.x, mouse.y);
    },
    componentDel: function(i) {
      this.components.splice(i, 1);
    }

  },
  components: {
    Warpper
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .el-menu-item {
    cursor: move;
  }

  .el-main {
    position: relative;
  }
</style>
