<template>
  <canvas :style="{ 
      left: x+'px',
      top: y+'px',
    }" :width="w" :height="h"></canvas>
</template>

<script>
let mouse = {};
export default {
    name: 'VLine',
    data: function(){
        return {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            context: null,
        };
    },
    props: {
        width: {
            type: Number,
            default: 1
        },
        color: {
            type: String,
            default: 'black'
        }
    },
    methods: {
        moveTo: function(x, y){
            mouse.x0 = x;
            mouse.y0 = y;
        },
        lineTo: function(x, y) {
            mouse.x1 = x;
            mouse.y1 = y;

            // 计算坐标原点
            this.x = Math.min(mouse.x0, mouse.x1);
            this.y = Math.min(mouse.y0, mouse.y1);

            // 计算长宽
            this.w = Math.abs(mouse.x1 - mouse.x0);
            this.h = Math.abs(mouse.y1 - mouse.y0);

            // 扩大画布的面积，使之包围里面的图形
            this.x -= 10;
            this.y -= 10;
            this.h += 20;
            this.w += 20;

            this.$nextTick(()=>{
                const ctx = this.context;
                ctx.beginPath();
                ctx.lineWidth = this.width;
                ctx.strokeStyle= this.color;

                let from = { x: mouse.x0 - this.x, y: mouse.y0 - this.y  }; // 起点
                let to = { x: mouse.x1 - this.x,  y: mouse.y1 - this.y  };  // 终点

                ctx.moveTo(from.x, from.y);

                if(from.x == to.x || from.y == to.y){
                    // 水平 或者 垂直
                }
                else {
                    if(from.x <= to.x) {
                        // 右边
                        let mid1 = { x: from.x + (to.x - from.x) / 2.0, y: from.y }; // 拐点1
                        let mid2 = { x: mid1.x, y: to.y };                // 拐点2

                        ctx.lineTo(mid1.x, mid1.y);
                        ctx.lineTo(mid2.x, mid2.y);
                    }
                    else {
                        // 左边
                        let mid1 = { x: to.x + (from.x - to.x) / 2.0, y: from.y }; // 拐点1
                        let mid2 = { x: mid1.x, y: to.y };                // 拐点2

                        ctx.lineTo(mid1.x, mid1.y);
                        ctx.lineTo(mid2.x, mid2.y);
                    }
                }

                ctx.lineTo(to.x, to.y);
                ctx.stroke();

                // 画三角
                if(from.x <= to.x){
                    // 右边
                    ctx.beginPath();
                    ctx.moveTo(to.x, to.y);
                    ctx.lineTo(to.x-10, to.y-10);
                    ctx.lineTo(to.x-10, to.y+10);
                    ctx.closePath();
                    ctx.fillStyle = "red";
                    ctx.fill();
                }
                else {
                    // 左边
                    ctx.beginPath();
                    ctx.moveTo(to.x, to.y);
                    ctx.lineTo(to.x+10, to.y-10);
                    ctx.lineTo(to.x+10, to.y+10);
                    ctx.closePath();
                    ctx.fillStyle = "red";
                    ctx.fill();
                }
            });
        }
    },
    mounted: function() {
        this.context = this.$el.getContext('2d');
        this.$emit('init', this);
    }
}
</script>

<style scoped>
    canvas {
        display: inline-block;
        position: absolute;
        background: yellow;
    }
</style>