<template>
  <div class="v-col" :style="selftStyle" >
      <slot></slot>
  </div>
</template>

<script>
import CommonMixin from "./componentMixin"

export default {
    data: function(){
        return {
            wrap: false
        }
    },
    designProps: [
        {
            title: '唯一标识',
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
        },
        {
            title: '内容换行',
            name: 'wrap',
            enum: [
                { title: '是', value: true },
                { title: '否', value: false }
            ]
        },
        {
            title: '垂直对齐',
            name: 'valign',
            enum: [
                { title: '上', value: 'flex-start' },
                { title: '中', value: 'center' },
                { title: '下', value: 'flex-end' },
                { title: '两端', value: 'space-between' },
                { title: '等间距', value: 'space-around' }
            ]
        },
        {
            title: '水平对齐',
            name: 'align',
            enum: [
                { title: '左', value: 'flex-start' },
                { title: '中', value: 'center' },
                { title: '右', value: 'flex-end' },
                { title: '拉伸', value: 'stretch' },
                { title: '基线', value: 'baseline' }
            ]
        }
    ],
    computed: {
        selftStyle: function(){
            return {
                borderColor: this.isShowBorder ? 'red' : null,
                flexWrap: this.wrap ? 'wrap':'nowrap',
                justifyContent: this.valign||null,
                alignItems: this.align||null,
            }
        }
    },
    mixins: [ CommonMixin ]
}
</script>

<style lang="less">
    .v-col {
        display: flex;
        flex-direction: column;
        border: 1px lightgray dashed;
        min-width: 20px;
        min-height: 200px;
        padding: 5px;

        & > * {
            position: relative !important;
        }
    }
</style>