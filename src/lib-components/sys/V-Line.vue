<template>
  <canvas 
    :style="selfStyle" :width="w" :height="h" 
    ></canvas>
</template>

<script>
import { GetPath, GetPathRect, IsPointInPath } from "./lineUtility"
import { QuZheng } from "./utility"
import CommonMixin from "./componentMixin"

export default {
    inject: [
        'isComponentIdVaild',
        'getComponentById',
        'getMouseOffset'
    ],
    data: function(){
        return {
            // 画布的上下文和路线
            drawContext: null,
            // 路径的所有点组成
            drawPath: null,
            // 是否自定义路径
            isCustDrawPath: false,

            // 连接的源和目标
            source:  null,
            dest: null,

            // 线条宽度
            width: null,
            // 线条颜色
            color: null,
        };
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
        },
        { title: '宽度', name: 'width', default: 1 },
        { title: '颜色', name: 'color', default: 'black' },
        {
            title: '连接起点',
            name: 'source',
            get: function(){
                return this.source ?  `${this.source.el.id}.${this.source.dot}` : '';
            },
            set: function(val){
                if(!val) return;
                let [comName, dotName] = val.split('.');
                if(!comName || !dotName) return;
                let com = this.getComponentById(comName);
                if(!com) return;
                this.source = { el: com, dot: dotName };
            }
        },
        {
            title: '连接终点',
            name: 'dest',
            get: function(){
                return this.dest ?  `${this.dest.el.id}.${this.dest.dot}` : '';
            },
            set: function(val){
                if(!val) return;
                let [comName, dotName] = val.split('.');
                if(!comName || !dotName) return;
                let com = this.getComponentById(comName);
                if(!com) return;
                this.dest = { el: com, dot: dotName };
            }
        },
        {
            title: '路径',
            name: 'path',
            get: function(){
                if(!this.isCustDrawPath) return;
                return this.drawPath ?
                        this.drawPath.map(pt=>`${pt.x},${pt.y}`).join('|') :
                        '';
            },
            set: function(val, i){
                if(!val) return;
                let points = val.split('|');
                let arr = [];
                points.forEach(pt => {
                    const [ x, y ] = pt.split(',');
                    arr.push({ x: +x, y: +y });
                });
                this.drawPath = arr;
                this.isCustDrawPath = true;
                if(!i) this.paint();
            },
            readonly: true
        }
    ],
    methods: {
        // 内部使用
        paint: function(){
            if(!this.drawPath || this.drawPath.length == 1) return;

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
                ctx.strokeStyle = this.isShowBorder ? "red" : this.color;    // 线条颜色

                for (let i = 0; i < paths.length; i++) {
                    const path = paths[i];
                    let x = path.x - this.x;    // 转换成画画板的坐标
                    let y = path.y - this.y;    // 转换成画画板的坐标
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

        //内部使用
        refreshPath: function(){
            if(!this.source || !this.dest) return;

            const pos1 = this.source.el.getDotPos(this.source.dot);
            const rect1 = this.source.el.getRect();
            const pos2 = this.dest.el.getDotPos(this.dest.dot);
            const rect2 = this.dest.el.getRect();

            this.drawPath = GetPath(rect1, pos1, rect2, pos2);
            this.isCustDrawPath = false;

            this.paint();
        },

        // 外部使用
        exportMouseDown: function(ev){
            let pointInPath = IsPointInPath(this.getMouseOffset(ev), this.drawPath, 5);
            if(pointInPath){
                let [pt, npt] = pointInPath.path;
                let orgX = pt.x;
                let orgY = pt.y;
                let lineType = pointInPath.type;
                this.draggingHandler = (_, { ox, oy }) => {
                    if(lineType == "VL"){
                        pt.x = QuZheng(orgX + ox);
                        npt.x =  pt.x;
                    }
                    else if(lineType == "HL"){
                        pt.y = QuZheng(orgY + oy);
                        npt.y = pt.y;
                    }
                    this.paint();
                }
                this.draggingBegin = ()=>{
                    this.isCustDrawPath = true;
                };
            }
        },

        // 是否在边界内
        isPointInBoundary(point){
            let pointInPath = IsPointInPath(point, this.drawPath, 5);
            if(pointInPath){
                this.mouseHoverShape = pointInPath.type == "VL" ? "e-resize" : pointInPath.type == "HL" ? "n-resize" : "";
                return true;
            }
            else{
                this.mouseHoverShape = "";
                return false;
            }
        },

        // 取消订阅
        unSubscribeEvent: function(com){
            com.$off("DotPosChanged", this.refreshPath);
            com.$off("Destory", this.delSelf);
        },
        // 订阅
        subscribeEvent: function(com){
            com.$on("DotPosChanged", this.refreshPath);
            com.$on("Destory", this.delSelf);
        },

        // 所有组件的布局完成
        layoutFinished: function(){
            if(this.isCustDrawPath){
                this.paint();
            }
            else{
                this.refreshPath();
            }
        },
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
    },
    watch: {
        source: function(val, oldVal){
            if(oldVal) this.unSubscribeEvent(oldVal.el);
            if(val) this.subscribeEvent(val.el);
        },
        dest: function(val, oldVal){
            if(oldVal) this.unSubscribeEvent(oldVal.el);
            if(val) this.subscribeEvent(val.el);
        },
        showBorder: function(){
            this.paint();
        },
        active: function(){
            this.paint();
        }
    },
    destroyed: function(){
        if(this.source) this.unSubscribeEvent(this.source.el);
        if(this.dest) this.unSubscribeEvent(this.dest.el);
    },
    mixins: [ CommonMixin ]
}
</script>

<style lang="less" scoped>
    canvas {
        display: inline-block;
        position: absolute;
        // background: yellow;
        background: transparent;

        &:focus{
            outline: none;
        }
    }
</style>