<template>
  <canvas :style="{ 
      left: x+'px',
      top: y+'px',
    }" :width="w" :height="h"></canvas>
</template>

<script>
import { GetPath, GetPathRect } from "./VLineUtility";

export default {
    name: 'VLine',
    data: function(){
        return {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            mouse: {},
            isActive: false,
            context: null,
            source: null,
            dest: null,
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
        moveTo: function(pos){
            this.mouse.x0 = pos.x;
            this.mouse.y0 = pos.y;
            this.paint();
        },
        lineTo: function(pos) {
            this.mouse.x1 = pos.x;
            this.mouse.y1 = pos.y; 
            this.paint();
        },
        paint: function(){
            const mouse = this.mouse;

            // 计算路径
            const from = { x: mouse.x0 , y: mouse.y0  }; // 起点
            const to = { x: mouse.x1,  y: mouse.y1  };  // 终点
            let paths = null;
            if(this.dest){
                const rectFrom = this.source.el.getRect();
                const rectTo = this.dest.el.getRect();
                paths = GetPath(rectFrom, from, rectTo, to);
            }
            else{
                paths = [ from, to ];
            }

            const pathRect = GetPathRect(paths);
            this.x = pathRect.l - 10;
            this.y = pathRect.t - 10;
            this.w = pathRect.w + 20;
            this.h = pathRect.h + 20;

            this.$nextTick(()=>{
                let ctx = this.context;
                ctx.clearRect(0, 0, this.$el.width, this.$el.height);
                ctx.beginPath();
                ctx.lineWidth = this.width;     // 线条粗细
                ctx.strokeStyle= this.isActive ? "red" : this.color;    // 线条颜色

                for (let i = 0; i < paths.length; i++) {
                    const path = paths[i];
                    let x = path.x - this.x;
                    let y = path.y - this.y;
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

        moveToSource: function(){
            const { el, dot } = this.source;
            const pos = el.getDotPos(dot);
            this.moveTo(pos);
        },
        lineToDest: function(){
            const { el, dot } = this.dest;
            const pos = el.getDotPos(dot);
            this.lineTo(pos);
        },

        bindSource(el, dot){
            if(this.source) el.$off("DotPosChanged", this.moveToSource);
            el.$on("DotPosChanged", this.moveToSource);

            this.source = { el: el, dot: dot }; 

            this.moveToSource();
        },
        bindDest(el, dot){
            if(this.dest) el.$off("DotPosChanged", this.lineToDest);
            el.$on("DotPosChanged", this.lineToDest);

            this.dest = { el: el, dot: dot }; 

            this.lineToDest();
        },
    },
    mounted: function() {
        this.context = this.$el.getContext('2d');

        // this.$el.addEventListener("click", ev=>{
        //     if(ev.button == 0){
        //         this.isActive = true;
        //         this.paint();
        //         ev.stopPropagation();
        //     }
        // });

        // document.addEventListener("click", ev=>{
        //     if(ev.button == 0){
        //         this.isActive = false
        //         this.paint();
        //     }
        // });

        this.$emit('init', this);
    },
    destroyed: function(){
        if(this.source){
            this.source.el.$off("DotPosChanged", this.moveToSource);
        }
        if(this.dest){
            this.dest.el.$off("DotPosChanged", this.lineToDest);
        }
    }
}
</script>

<style lang="less" scoped>
    canvas {
        display: inline-block;
        position: absolute;
        /* background: yellow; */
        background: transparent;
        cursor: pointer;

        &:focus{
            outline: none;
        }
    }
</style>