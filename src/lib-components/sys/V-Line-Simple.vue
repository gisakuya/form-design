<template>
  <canvas
  :style="selfStyle" :width="w" :height="h" 
  ></canvas>
</template>

<script>
import { GetPathRect } from "./lineUtility";

export default {
    data: function(){
        return {
            // 画布的坐标和长宽
            x: 0,
            y: 0,
            w: 0,
            h: 0,

            // 画布的上下文和路线
            drawContext: null,
            // 路径的所有点组成
            drawPath: null,

            // 连接的源和目标
            source:  null,
            dest:  null,

            // 线条宽度
            width: 1,
            // 线条颜色
            color: 'black',
        };
    },
    methods: {
        // 外部使用
        moveTo: function(pos){
            this.drawPath = [ pos ];
        },
        // 外部使用
        lineTo: function(pos) {
            this.drawPath = [ this.drawPath[0], pos ]
            this.paint();
        },

        // 内部使用
        paint: function(){
            if(!this.drawPath){
                this.w = 0;
                this.h = 0;
                return;
            }

            let paths = this.drawPath;

            const pathRect = GetPathRect(this.drawPath);
            this.x = pathRect.l - 10;
            this.y = pathRect.t - 10;
            this.w = pathRect.w + 20;
            this.h = pathRect.h + 20;

            this.$nextTick(()=>{
                // 画布准备好
                let ctx = this.drawContext;
                ctx.clearRect(0, 0, this.$el.width, this.$el.height);
                ctx.beginPath();
                ctx.lineWidth = this.width;     // 线条粗细
                ctx.strokeStyle = this.color;    // 线条颜色

                for (let i = 0; i < paths.length; i++) {
                    const path = paths[i];
                    let x = path.x - this.x;    // 坐标原点转换
                    let y = path.y - this.y;    // 坐标原点转换
                    if(i == 0){
                        ctx.moveTo(x, y);
                    }
                    else{
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            });
        },

        saveSource: function(s){
            this.source = s;
        },

        saveDest: function(d){
            this.dest = d;
        },

        isSourceSet: function(){
            return this.source != null;
        },

        isDestSet: function(){
            return this.dest != null;
        },

        reset: function(){
            this.source = null;
            this.dest = null;
            this.drawPath = null;
            this.paint();
        }
    },
    computed: {
        // 本身样式
        selfStyle: function(){
            return { 
                left: this.x + 'px', 
                top: this.y + 'px',
            };
        }
    },
    mounted: function() {
        // 获取画图上下文
        this.drawContext = this.$el.getContext('2d');
    }
}
</script>

<style lang="less" scoped>
    canvas {
        display: inline-block;
        position: absolute;
        // background: yellow;
        background: transparent;
    }
</style>