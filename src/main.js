import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'

// 导入自身组件
import Home from "./components/Home.vue";
import Tpl from "./components/Tpl.vue";
import TplPreview from "./components/TplPreview.vue";

// 饿了么组件
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

Vue.config.productionTip = false

// 全局使用
// https://element.eleme.cn/#/zh-CN/component/quickstart#wan-zheng-yin-ru
Vue.use(ElementUI);

//https://router.vuejs.org/zh/installation.html#npm
Vue.use(VueRouter)

// 自动注册组件
// https://cn.vuejs.org/v2/guide/components-registration.html#基础组件的自动化全局注册
const requireComponent = require.context(
  // 其组件目录的相对路径
  './lib-components',
  // 是否查询其子目录
  true,
  // 匹配基础组件文件名的正则表达式
  /\w+\.vue$/
)

requireComponent.keys().forEach(fileName => {
  // 获取组件配置
  const componentConfig = requireComponent(fileName)

  // 获取组件的 PascalCase 命名
  let componentName = fileName.split('/').pop().replace(/\.\w+$/, '');
  componentName = componentName.trim().toLowerCase();

  // 全局注册组件
  Vue.component(
    componentName,
    // 如果这个组件选项是通过 `export default` 导出的，
    // 那么就会优先使用 `.default`，
    // 否则回退到使用模块的根。
    componentConfig.default || componentConfig
  )
})

// 定义路由
const routes = [
  { path: '/tpl', component: Tpl },
  { path: '/tpl-preview', component: TplPreview },
  { path: '/', component: Home }
]

const router = new VueRouter({
  mode: 'history',
  routes // (缩写) 相当于 routes: routes
})

new Vue({
  render: h => h(App),
  router: router
}).$mount('#app')
