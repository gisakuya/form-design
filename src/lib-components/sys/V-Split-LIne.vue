<template>
  <div class="v-split-line" :style="selfStyle"></div>
</template>

<script>
export default {
    data: function(){
        return {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            com: null,
            dir: null
        };
    },
    methods: {
        moveAfter: function(com){
            const { left:pLeft, top:pTop } = this.$el.parentElement.getBoundingClientRect();
            const { left, top, right, bottom, width, height } = com.$el.getBoundingClientRect();
            const r = right - pLeft;
            const y = top - pTop;

            this.x = r + 5;
            this.y = y;
            this.h = height;
            this.w = 3;

            this.com = com;
            this.dir = 'after';
        },
        moveInner: function(com){
            const { left:pLeft, top:pTop } = this.$el.parentElement.getBoundingClientRect();
            const { left, top, right, bottom, width, height } = com.$el.getBoundingClientRect();
            const c = left - pLeft + width/2;
            const y = top - pTop;

            this.x = c;
            this.y = y;
            this.h = height;
            this.w = 3;

            this.com = com;
            this.dir = 'inner';
        },
        hide: function(){
            this.x = 0;
            this.y = 0;
            this.w = 0;
            this.h = 0;
            this.com = null;
            this.dir = null;
        }
    },
    computed: {
        selfStyle: function(){
            return {
                left: `${this.x}px`,
                top: `${this.y}px`,
                width: `${this.w}px`,
                height: `${this.h}px`
            }
        }
    }
}
</script>

<style lang="less">
    .v-split-line {
        position: absolute;
        background: blue;
        z-index: 80;
    }
</style>