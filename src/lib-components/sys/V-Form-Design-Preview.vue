<template>
    <div class="form-design">

        <p>绑定属性：<input :value="JSON.stringify(dynamicProps)" 
            @change="formDataChanged($event.target.value)" 
            style="width:100%"/>
        </p>
        <v-contextmenu ref="vctxmenu"></v-contextmenu>
        <div v-if="isLoading">加载中...</div>
        <v-form-design-tpl v-else :template="tpl.components"></v-form-design-tpl>
    </div>
</template>

<script>
import { 
  ObjectSetValue,ObjectGetValue,IsKeyExists,LooseJsonParse
} from "./utility";

export default {
  model: {
    prop: 'tpl',
    event: 'tplChanged'
  },
  provide: function(){
    return {
    }
  },
  data() {
    return {
      formData: '',
      dynamicProps: {},
      isLoading: false
    }
  },
  props: {
      tpl: {
        type: Object,
        default:function(){
          return  { components: [] }
        }
      }
  },
  computed: {
  },
  methods: {
      // 动态添加属性
      addDynamicProp: function(name, defVal = null){
        if(IsKeyExists(this.dynamicProps, name)) return;
        ObjectSetValue(this.dynamicProps, name, defVal, this.$set);
      },
      // 获取动态添加的属性值
      getDynamicProp: function(name){
        return ObjectGetValue(this.dynamicProps, name);
      },
      
      // 设置动态添加剂的属性
      setDynamicProp: function(name, value){
        ObjectSetValue(this.dynamicProps, name, value);
      },

      // 表单数据变化
      formDataChanged: function(val){
        const obj = JSON.parse(val);
        Object.assign(this.dynamicProps, obj);
      },

      // 更新动态属性
      updateDynamicProps: function(data){
        // https://cn.vuejs.org/v2/guide/reactivity.html#检测变化的注意事项
        this.dynamicProps = Object.assign({}, this.dynamicProps, data);
      },
      // 更新方法
      updateMethods: function(methods){
          Object.assign(this, methods);
      }
  },
  mounted: function() {
  },
  watch: {
    tpl: function(){
      console.log('tpl changed');

      const dataUrl = this.tpl.dataUrl;
      if(dataUrl){
        // fetch的用法：
        // https://www.jianshu.com/p/6fd482c9ce19
        // https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch
        this.isLoading = true;
        fetch(dataUrl).then(res=>res.json()).then(data => {
          this.updateDynamicProps(data);
          this.isLoading = false;
        })
      }

      const mixinstr = this.tpl.mixin;
      if(mixinstr){
        const mixinObj = LooseJsonParse(mixinstr.replace(/\b(?<=this\.)\w[\w.]+\s*/g, function(m){
          return m.endsWith('(') ? m : 'dynamicProps.'+m;
        }));
        const data = mixinObj.data.call(this);
        const methods = mixinObj.methods;
        this.updateDynamicProps(data);
        this.updateMethods(methods);
      }
    }
  }
}
</script>

<style lang="less">
  .form-design{
      position: relative;
      border: 1px dashed pink;

      &:focus {
        outline-style: none;
      }
  }
</style>