<template>
  <div class="v-row" :style="selftStyle" >
      <slot></slot>
  </div>
</template>

<script>
import { GetStyleValue } from "./utility"
import CommonMixin from "./componentMixin"

function getAlign(align){
    if(align == "left") return "flex-start";
    if(align == "center") return "center";
    if(align == "right") return "flex-end";
    if(align == "between") return "space-between";
    if(align == "around") return "space-around";

    return null;
}

export default {
    props: {
        wrap: {
            type: Boolean,
            default: false
        },
        align: {
            type: String,
            default: null
        },
        height: {
            type: [String, Number],
            default: 50
        }
    },
    designProps: [
        {
            title: '唯一标志',
            name: 'id',
            get: function(){
                return this.id;
            },
            set: function(val){
                if(!val) return;
                if(!this.isComponentIdVaild(val)){
                    alert("该标志已被占用!");
                }
                else{
                    this.id = val;
                }
            },
            init: function(val){
                this.id = val;
            }
        }
    ],
    computed: {
        selftStyle: function(){
            return {
                borderColor: this.isShowBorder ? 'red' : null,
                flexWrap: this.warp ? 'warp':'nowrap',
                justifyContent: getAlign(this.align),
                height: GetStyleValue(this.height),
            }
        }
    },
    methods: {
        initDesignProps: function(){
            let arr = [];
            this.initDesignPropsCore(arr, this);
            this.designProps = arr;
        },
        initBindProps: function(){
        },
    },
    mixins: [ CommonMixin ]
}
</script>

<style lang="less">
    .v-row {
        display: flex;
        flex-direction: row; // 水平排列

        border: 1px lightgray dashed;

        & > * {
            position: relative;
        }
    }
</style>