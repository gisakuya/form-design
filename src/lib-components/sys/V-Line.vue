<template>
  <canvas 
    :style="selfStyle" :width="w" :height="h" 
    @mousedown.left.stop="mouseDown($event);"
    @keyup.delete="delSelf"
    tabindex="1"
    ></canvas>
</template>

<script>
import { GetPath, GetPathRect, IsPointInPath } from "./lineUtility"
import { QuZheng } from "./utility"
import CommonMixin from "./componentMixin"

var mouse = {
    x: 0,
    y: 0,
    data: null,
    setPos: function(pos){
        this.x = pos.x;
        this.y = pos.y;
    },
    setData: function(data){
        this.data = data;
    },
    isOffsetGreaterThan(ev, offset){
        const ox = ev.x - this.x;
        const oy = ev.y - this.y;
        return ox >= offset || ox <= offset || oy >= offset || oy <= offset;
    }
}

export default {
    inject: [
        'getComponentByName',
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
    designProps: [{
        title: '一般属性',
        props: [
            { title: '宽度', name: 'width', default: 1 },
            { title: '颜色', name: 'color', default: 'black' },
            {
                title: '连接起点',
                name: 'source',
                get: function(){
                    return this.source ?  `${this.source.el.name}.${this.source.dot}` : '';
                },
                set: function(val){
                    if(!val) return;
                    let [comName, dotName] = val.split('.');
                    if(!comName || !dotName) return;
                    let com = this.getComponentByName(comName);
                    if(!com) return;
                    this.source = { el: com, dot: dotName };
                }
            },
            {
                title: '连接终点',
                name: 'dest',
                get: function(){
                    return this.dest ?  `${this.dest.el.name}.${this.dest.dot}` : '';
                },
                set: function(val){
                    if(!val) return;
                    let [comName, dotName] = val.split('.');
                    if(!comName || !dotName) return;
                    let com = this.getComponentByName(comName);
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
        ]
    }],
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

        // 内部使用
        mouseDown: function(ev){
            const el = this.$el;
            let pointInPath = IsPointInPath(this.getMouseOffset(ev), this.drawPath, 5);
            if(pointInPath){
                let [pt, npt] = pointInPath.path;
                let lineType = pointInPath.type;
                let orgPt = Object.assign({}, pt);
                let orgNPt = Object.assign({}, npt);
                let oev = { x: ev.x, y: ev.y };
                this.draggingHandler = ev => {
                    let ox = ev.x - oev.x;
                    let oy = ev.y - oev.y;
                    if(lineType == "VL"){
                        pt.x = QuZheng(orgPt.x + ox);
                        npt.x =  pt.x;
                    }
                    else if(lineType == "HL"){
                        pt.y = QuZheng(orgPt.y + oy);
                        npt.y = pt.y
                    }
                };
                
                this.isActive = true;
            }
        },

        docMouseMove: function(ev){
            if(this.draggingHandler)
            {
                this.draggingHandler(ev);
                this.isCustDrawPath =  true;
            }
            else
            {
                const el = this.$el;
                let pointInPath = IsPointInPath(this.getMouseOffset(ev), this.drawPath, 5);
                if(pointInPath){
                    // 相当于mouse-enter
                    el.style.cursor = pointInPath.type == "VL" ? "e-resize" : pointInPath.type == "HL" ? "n-resize" : "";
                    this.mouseEnter();
                }
                else{
                    // 相当于mouse-leave
                    el.style.cursor = "";
                    this.mouseLeave();
                }
            }
            this.paint();
        },

        docMouseUp: function(ev){
            if(!this.draggingHandler){
                this.isActive = false;
                this.paint();
            }

            this.draggingHandler = null;
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