<template>
    <div class="v-focusrect" 
    :style="selfStyle"></div>
</template>

<script>
export default {
    data: function(){
        return {
            // 画布的坐标和长宽
            x: 0,
            y: 0,
            w: 0,
            h: 0
        };
    },
    methods: {
        // 外部使用
        moveTo: function({ x, y } = pos){
            this.x = x;
            this.y = y;
            this.w = 0;
            this.h = 0;
        },
        // 外部使用
        lineTo: function({ x, y } = pos) {
            this.w = x - this.x;
            this.h = y - this.y;
        },
    },
    computed: {
        // 本身样式
        selfStyle: function(){
            return { 
                left: this.x + 'px', 
                top: this.y + 'px',
                width: this.w + 'px',
                height: this.h + 'px'
            };
        }
    },
}
</script>

<style>
    .v-focusrect {
        background: yellow;
        border: 1px dashed gray;
    }
</style>