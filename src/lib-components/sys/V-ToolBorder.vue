<template>
  <div class="v-toolborder" :style="selfStyle">
      <!-- <div class="title">{{ com ? com._tag : '' }}</div> -->
      <!-- <div v-if="showTools" class="move">
          <img src="./imgs/move.svg" width="15" height="15"/>
      </div> -->
      <div v-if="showTools" class="del">
          <img src="./imgs/trash.svg" width="15" height="15" title="删除" @mousedown.stop="del" />
          <img src="./imgs/copy.svg" width="15" height="15" title="复制" @mousedown.stop="copy" />
      </div>
  </div>
</template>

<script>
export default {
    data: function(){
        return {
            com: null
        }
    },
    props: {
        showTools: {
            type: Boolean,
            default: true
        },
        zIndex: {
            type: Number,
            default: 99
        }
    },
    methods: {
        activeCom: function(com){
            const { left:pLeft, top:pTop } = this.$el.parentElement.getBoundingClientRect();
            const { left, top, width, height } = com.$el.getBoundingClientRect();
            const x = left - pLeft;
            const y = top - pTop;
            const offset = 5;
            const style = this.$el.style;
            style.left = `${x - offset - 2}px`;
            style.top = `${y - offset - 2}px`;
            style.width = `${width + 2*offset}px`;
            style.height = `${height + 2*offset}px`;
            style.display = "block";
            this.com = com;
        },
        hide: function(){
            const style = this.$el.style;
            style.display = "none";
            this.com = null;
        },
        del: function(){
            this.$emit('del', this.com);
        },
        copy: function(){
            this.$emit('copy', this.com);
        }
    },
    computed: {
        selfStyle: function(){
            return {
                zIndex: this.zIndex
            }
        }
    },
    mounted: function(){
    }
}
</script>

<style lang="less">
    .v-toolborder {
        position: absolute;
        border: 1px dashed red;
        display: none;
        // & > .title {
        //     position: absolute;
        //     left: 0px;
        //     top: -20px;
        //     font-size: x-small;
        //     color: green;
        // }
        & > .del {
            position: absolute;
            right: 1px;
            top: 1px;
            width: 30px;
            height: 15px;
            background: white;
            cursor: pointer;

            & > img {
                float: right;
            }
        }

        // & > .move {
        //     position: absolute;
        //     left: 0px;
        //     top: 0px;
        //     width: 16px;
        //     height: 16px;
        //     background: white;
        //     cursor: move;
        // }
    }
</style>