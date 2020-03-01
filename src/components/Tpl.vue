<template>
  <el-container style="height: 200vh; border: 1px solid #eee">
    <el-aside width="200px" style="background-color: rgb(238, 241, 246)">
      <el-menu :default-openeds="['0','1','2','3','4','6','7','8','9']">
          <el-submenu v-for="(menu, index) in menus" :key="menu.title" :index="String(index)">
            <template slot="title">
              <i v-if="menu.icon" :class="menu.icon"></i> {{ menu.title }}
            </template>
            <el-menu-item v-for="submenu in menu.submenus" :key="submenu.title" draggable @dragstart.native="drag($event, submenu)">
              {{ submenu.title }}
            </el-menu-item>
          </el-submenu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header style="height:100px; background:white;">
        <div style="height:100%; overflow-y:auto;">
          <el-tree ref="comsTree" :data="comsTree" node-key="id"
                  :highlight-current="true"
                  :default-expand-all="true" 
                  :expand-on-click-node="false" 
                  @node-click="treeNodeClick"
                  :render-content="renderContent"
                  draggable
                  @node-drop="treeNodeDrop"
            >
          </el-tree>
        </div>
      </el-header>

      <el-main>
          <v-form-design ref="formDesign" style="height:100%;"
              v-model="tpl"
              @selChanged="selChanged"
              @treeChanged="treeChanged"
          >
          </v-form-design>
          <textarea style="height:100px; width: 100%; background:lightgray" :value="JSON.stringify(tpl)" readonly></textarea>
          <textarea style="height: 100px; width: 100%;" @change="tplChange($event.target.value)" />
      </el-main>
    </el-container>

    <el-aside width="260px" style="background-color: rgb(238, 241, 246);">
      <div style="text-align:center;background:#FAF5F5;padding:5px;">
        {{ activeCom.tag }}
      </div>
      <el-menu :default-openeds="['0','1']">
          <el-submenu index="0">
            <template slot="title">
              <i class="el-icon-edit"></i> 属性
            </template>
            <li>
            <table>
              <tr v-for="prop in activeCom.props" :key="prop.title">
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
          <el-submenu index="1">
            <template slot="title">
              <i class="el-icon-edit"></i> 事件
            </template>
            <li>
            <table>
              <tr v-for="event in activeCom.events" :key="event.title">
                <td style="width:80px;"><span style="margin-left:5px;font-size:14px">{{ event.title }}</span></td>
                <td>
                    <input class="el-input__inner" 
                        :value="event.get()" 
                        @change="event.set($event.target.value)" />
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
  data() {
    return {
      menus: [
        { title: '基本控件', icon: 'el-icon-bell', submenus: [
          { title: '文本', componentName: 'v-text'},
          { title: '文本框', componentName: 'el-input'},
          { title: '日期选择器', componentName: 'el-date-picker'},
          { title: '时间选择器', componentName: 'el-time-picker'},
          { title: '下拉', componentName: 'el-select'},
          { title: '下拉选项', componentName: 'el-option'},
          { title: '开关', componentName: 'el-switch'},
          { title: '单选', componentName: 'el-radio', content: '选项1'},
          { title: '单选组', componentName: 'el-radio-group', designStyle: { 
            minWidth: "100%", minHeight: "20px", border: "1px dashed lightblue" 
          }},
          { title: '多选', componentName: 'el-checkbox', content: '选项1'},
          { title: '多选组', componentName: 'el-checkbox-group', designStyle: { 
            minWidth: "100%", minHeight: "20px", border: "1px dashed lightblue" 
          }},
          { title: '按钮', componentName: 'el-button', content: '默认按钮', events: {
            click: null
          }},
          { title: '按钮组', componentName: 'el-button-group', designStyle: { 
            minWidth: "100%", minHeight: "20px", border: "1px dashed lightblue" 
          }},
          { title: '表单', componentName: 'el-form', designStyle: { 
            minHeight: "100px", border: "1px dashed lightblue" 
          }},
          { title: '表单项', componentName: 'el-form-item', designStyle: { 
            minHeight: "20px", border: "1px dashed lightgreen" 
          }},
          { title: '图标', componentName: 'v-icon'},
          { title: '弹出框', componentName: 'el-popover'},
          { title: 'Tag', componentName: 'el-tag'},
          { title: '模板', componentName: 'v-template', designStyle: { 
            minHeight: "20px", border: "1px dashed lightgreen" 
          }},
        ]},
        {
          title: '容器', icon: 'el-icon-s-grid', submenus: [
            { title: '行', componentName: 'el-row', designStyle: { 
              minHeight: "20px", border: "1px dashed lightblue" 
            }},
            { title: '列', componentName: 'el-col', designStyle: { 
              minHeight: "20px", border: "1px dashed green" 
            }},
            {title: 'DIV', componentName: 'v-div', designStyle: { 
              minHeight: "20px", border: "1px dashed lightblue" 
              }}
            // { title: '行', componentName: 'v-row' },
            // { title: '列', componentName: 'v-col' },
            // { title: '网格', componentName: 'v-grid' }
          ]
        },
        { title: '数据', icon: 'el-icon-setting', submenus: [ 
            { title: '表格', componentName: 'el-table', designStyle: { 
              minHeight: "20px", border: "1px dashed lightblue" 
            }},
            { title: '表格头', componentName: 'el-table-column'}
          ]
        },
        { title: '逆变器', icon: 'el-icon-setting', submenus: [ 
            { title: 'SUN2000-33KTL', componentName: 'nb-sun2000-33k' }, 
            { title: 'SUN2000-36KTL', componentName: 'nb-sun2000-36k' },
          ]  
        },
        { title: '测试', icon: 'el-icon-setting', submenus: [ 
            { title: '作用插槽', componentName: 'scoped-slot-test'},
          ]  
        },
      ],
      activeCom: {},
      comsTree: [],
      tpl: { components: [] }
    }
  },
  methods: {
      // 树节点的拖拉
      treeNodeDrop(draggingNode, dropNode, dropType, ev) {
        this.$refs.formDesign.treeMove(draggingNode.data.id, dropNode.data.id, dropType);
      },

      // 拖拉组件
      drag: function(ev, item) {
        ev.dataTransfer.setData("drag-component", JSON.stringify({
          x: ev.offsetX,
          y: ev.offsetY,
         ...item
        }));
      },

      // 选择发生变化
      selChanged: function(com){
        this.activeCom = com;
        const tree = this.$refs.comsTree;
        if(com.id){
          tree.setCurrentKey(com.id);
        }
        else{
          tree.setCurrentKey(null);
        }
      },

      // 组件树发生变化
      treeChanged: function(val){
        this.comsTree = val;
      },

      // 树节点点击
      treeNodeClick: function(node){
        node.active();
      },

      // 模板变化
      tplChange: function(val){
        this.tpl = JSON.parse(val);
      },

      // 自定义渲染控件树
      renderContent(h, { node, data, store }) {
        return (
          <span class="custom-tree-node">
            <span>{node.label}</span>
            <span>
              <el-button size="mini" type="text" on-click={ () => data.copy() }>复制</el-button>
              <el-button size="mini" type="text" on-click={ () => data.delete() }>删除</el-button>
            </span>
          </span>);
      },

      // 添加绑定属性
      addBindProp: function(nameEl, valEl){
        this.activeCom.props.addAttr(nameEl.value, valEl.value);
        nameEl.value = "";
        valEl.value = "";
      },
  },
  mounted: function(){
  },
  watch: {
    tpl: function(val){
      localStorage.setItem('tpl', JSON.stringify(val));
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less">
  .el-menu-item {
    cursor: move;
  }

  .custom-tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    padding-right: 8px;
  }
</style>
