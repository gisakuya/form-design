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
            h: 0,
            orgX: 0,
            orgY: 0
        };
    },
    methods: {
        // 外部使用
        isSet: function(){
            return this.orgX > 0 && this.orgY > 0;
        },
        moveTo: function({ x, y } = pos){
            this.x = x;
            this.y = y;
            this.w = 0;
            this.h = 0;
            this.orgX = x;
            this.orgY = y;
        },
        lineTo: function({ x, y } = pos) {
            if(x >= this.orgX){
                this.x = this.orgX;
                this.w = x - this.orgX;
            }
            else{
                this.x = x;
                this.w = this.orgX - x;
            }

            if(y >= this.orgY){
                this.y = this.orgY;
                this.h = y - this.orgY;
            }
            else{
                this.y = y;
                this.h = this.orgY - y;
            }
        },
        reset: function(){
            this.x = 0;
            this.y = 0;
            this.w = 0;
            this.h = 0;
            this.orgX = 0;
            this.orgY = 0;
        }
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
        position: absolute;
        /* background: yellow; */
        border: 1px dashed gray;
    }
</style>