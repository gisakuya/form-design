<template>
    <div class="form-design">

        <p>绑定属性：<input :value="JSON.stringify(dynamicProps)" 
            @change="formDataChanged($event.target.value)" 
            style="width:100%"/>
        </p>
        <v-contextmenu ref="vctxmenu"></v-contextmenu>
        <v-form-design-tpl :template="tpl.components"></v-form-design-tpl>
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
      dynamicProps: {}
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
      }
  },
  mounted: function() {
  },
  watch: {
    tpl: function(){
      console.log('tpl changed');
      if(this.tpl.mixin){
        const mixinstr = this.tpl.mixin.replace(/\b(?<=this\.)\w[\w.]+\s*/g, function(m){
          return m.endsWith('(') ? m : 'dynamicProps.'+m;
        });
        let mixin = LooseJsonParse(mixinstr);
        let data = mixin.data.call(this);
        let methods = mixin.methods;
        this.dynamicProps = Object.assign({}, this.dynamicProps, data);
        Object.assign(this, methods);
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