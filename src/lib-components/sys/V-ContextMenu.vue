<template>
  <div class="v-contextmenu" :style="selfStyle" v-show="ishow" @click.self="alert('xx')">
      <div class="item" v-for="item in items" :key="item">
          {{ item }}
      </div>
  </div>
</template>

<script>
import { GetStyleValue } from "./utility"

export default {
    data: function(){
        return {
            x: 50,
            y: 150,
            ishow: false,
            items: []
        };
    },
    methods: {
        show: function({x,y}){
            this.ishow = true;
        }
    },
    computed: {
        selfStyle: function(){
            return {
                left: GetStyleValue(this.x),
                top: GetStyleValue(this.y)
            }
        }
    },
    mounted: function(){
        document.onclick = () => {
            this.ishow = false;
        };
    }
}
</script>

<style lang="less">
    .v-contextmenu{
        display: inline-block;
        position: absolute;
        border: 1px solid #eee;
        border-radius: 1px;
        box-shadow: 0 0.5em 1em 0 rgba(0,0,0,.1);

        & > .item {
            cursor: pointer;
            padding: 5px 30px;

            &:hover {
                background: #42b983;
                color: white;
            }
        }
    }
</style>