<template>
  <el-container style="height: 900px; border: 1px solid #eee">
    <el-aside width="200px" style="background-color: rgb(238, 241, 246)">
      <el-menu :default-openeds="['0','1','2','3','4','6','7','8','9']">
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

      <el-main>
          <v-form-design ref="formDesign" style="position:relative; height: 500px;" 
              :drawLineMode="drawLineMode"
              v-model="tpl2"
              @selChanged="selChanged"
          >
          </v-form-design>

          <div style="position:relative; height: 300px;">
            {{ tpl2 }}
            <textarea  @change="tplChanged($event.target.value)" style="width: 100%; height:100%;"></textarea>
          </div>
      </el-main>
    </el-container>

    <el-aside width="260px" style="background-color: rgb(238, 241, 246);">
      <el-menu :default-openeds="['0','1']">
          <el-submenu index="0">
            <template slot="title">
              <i class="el-icon-edit"></i> 设计属性
            </template>
            <li>
            <table>
              <tr v-for="prop in designProps" :key="prop.title">
                <td style="width:80px;"><span style="margin-left:5px;font-size:14px">{{ prop.title }}</span></td>
                <td>
                    <input class="el-input__inner"
                      :title="prop.tooltip"
                      :value="prop.get()" 
                      :readonly="prop.readonly"
                      @change="prop.set($event.target.value)"/>
                  </td>
              </tr>
            </table>
            </li>
          </el-submenu>
          <el-submenu index="1">
            <template slot="title">
              <i class="el-icon-edit"></i> 内置属性
            </template>
            <li>
            <table>
              <tr v-for="prop in bindProps" :key="prop.title">
                <td style="width:80px;"><span style="margin-left:5px;font-size:14px">{{ prop.title }}</span></td>
                <td>
                    <input class="el-input__inner" 
                        :value="prop.get()" 
                        @change="prop.set($event.target.value)" />
                </td>
              </tr>
              <tr>
                  <td style="width:80px;">
                    <input class="el-input__inner" ref="a_name" placeholder="name" />
                  </td>
                  <td>
                      <input class="el-input__inner" ref="a_val" placeholder="value" />
                  </td>
              </tr>
              <tr>
                <td colspan="2">
                      <el-button @click="addBindProp($refs.a_name, $refs.a_val);">添加</el-button>
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
export default {
  name: "Home",
  data() {
    return {
      menus: [
        { title: '基本控件', icon: 'el-icon-bell', submenus: [
          { title: '标签', componentName: 'v-label' },
          { title: '文本框', componentName: 'el-input'  },
          { title: '日期选择器', componentName: 'el-date-picker'  },
        ] },
        {
          title: '容器', icon: 'el-icon-s-grid', submenus: [
            { title: '行', componentName: 'v-row' },
            { title: '列', componentName: 'v-col' },
          ]
        },
        { title: '逆变器', icon: 'el-icon-setting', submenus: [ 
            { title: 'SUN2000-33KTL', componentName: 'nb-sun2000-33k' }, 
            { title: 'SUN2000-36KTL', componentName: 'nb-sun2000-36k' }
          ]  
        }
      ],
      drawLineMode: false,
      designProps: [],
      bindProps: {},
      tpl2: { 
        components:[
          { tag: "v-resizable", id: "cmp1",
            children: [
              { tag: "nb-sun2000-36k", designProps: { "cust-attr": "haha" } }
            ]
          },
          { tag: "v-resizable", id: "cmp2", designProps: { pos: "500,150", size: "200,100" },
            children: [
              { tag: "nb-sun2000-36k", designProps: { "cust-attr": "kaka" } }
            ]
          },
          { tag: "v-line", id: "line1", designProps: { source: "cmp1.rc", dest: "cmp2.lc" } }
        ]
      }
    }
  },
  methods: {
      // 拖拉组件
      drag: function(ev, item) {
        ev.dataTransfer.setData("drag-component", `${item.componentName},${ev.offsetX},${ev.offsetY}`);
      },

      // 选择发生变化
      selChanged: function(com, designProps, bindProps){
        this.designProps = designProps
        this.bindProps = bindProps;
      },

      // 添加绑定属性
      addBindProp: function(nameEl, valEl){
        this.bindProps.setProp(nameEl.value, valEl.value);
        nameEl.value = "";
        valEl.value = "";
      },

      // 模板发生变化
      tplChanged: function(val){
        this.tpl2 = val ? JSON.parse(val) : [];
      }
  },
  mounted: function(){
  }
}
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
