<template>
  <canvas 
    :style="selfStyle" :width="w" :height="h" 
    @mousemove="mouseMove($event)"
    @mousedown.left.stop="mouseDown($event);"
    @keyup.delete="delSelf"
    tabindex="1"
    ></canvas>
</template>

<script>
import { GetPath, GetPathRect, IsPointInPath } from "./VLineUtility";
import { QuZheng } from "./utility";

export default {
    name: 'VLine',
    inject: [
        'onComponentCreated', 
        'onComponentActived', 
        'getComponentByName',
    ],
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
            dest: null,

            // 线条是否处于拖曳状态
            dragging: false,
            // 被拖曳的线条的处理器
            draggingHandler: null,

            // 线条是否激活
            isActive: false,
            // 是否显示边框
            showBorderInner: false,

            // 宽度
            width: null,
            // 颜色
            color: null,
        };
    },
    props: { },
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
                    return this.drawPath ?
                            this.drawPath.map(pt=>`${pt.x},${pt.y}`).join('|') :
                            '';
                },
                set: function(val){
                    if(!val) return;
                    let points = val.split('|');
                    points.forEach(pt => {
                        const [ x, y ] = pt.split(',');
                        this.drawPath.push({ x, y });
                    });
                    this.paint();
                }
            }
        ]
    }],
    methods: {
        // 外部使用
        moveTo: function(pos){
            this.drawPath = [ pos ];
        },
        // 外部使用
        lineTo: function(pos) {
            this.drawPath.push(pos);
            this.paint();
        },

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

            this.paint();
        },

        // 内部使用
        mouseMove: function(ev){
            if(this.dragging)
            {
                this.draggingHandler(ev);
            }
            else if(this.dest)
            {
                const el = this.$el;
                let pointInPath = IsPointInPath({ x: el.offsetLeft + ev.offsetX, y: el.offsetTop + ev.offsetY }, this.drawPath, 5);
                if(pointInPath){
                    // 相当于mouse-enter
                    el.style.cursor = pointInPath.type == "VL" ? "e-resize" : pointInPath.type == "HL" ? "n-resize" : "";
                    this.showBorderInner = true;
                }
                else{
                    // 相当于mouse-leave
                    el.style.cursor = "";
                    this.showBorderInner = false;
                }
            }
            this.paint();
        },

        mouseDown: function(ev){
            const el = this.$el;
            let pointInPath = IsPointInPath({ x: el.offsetLeft + ev.offsetX, y: el.offsetTop + ev.offsetY }, this.drawPath, 5);
            if(pointInPath){
                let [pt, npt] = pointInPath.path;
                let lineType = pointInPath.type;
                let { x: x0, y: y0 } = ev;
                this.draggingHandler = nev => {
                    let { x: x1, y: y1 } = nev;
                    let ox = x1 - x0;
                    let oy = y1 - y0;
                    if(lineType == "VL"){
                        pt.x += ox;
                        npt.x += ox;
                    }
                    else if(lineType == "HL"){
                        pt.y += oy;
                        npt.y += oy;
                    }
                    x0 = x1;
                    y0 = y1;
                };
                
                this.dragging = true;
                this.isActive = true;
            }
        },

        docMouseUp: function(ev){
            if(!this.dragging){
                this.isActive = false;
                this.paint();
            }

            this.draggingHandler = null;
            this.dragging = false;
        },

        // 删除自己
        delSelf: function(){
            this.$emit("Destory");
            this.$el.parentNode.removeChild(this.$el);
            this.$destroy();
        },

        // 删除事件
        unSubscribeEvent: function(com){
            com.$off("DotPosChanged", this.refreshPath);
            com.$off("Destory", this.delSelf);
        },
        // 订阅事件
        subscribeEvent: function(com){
            com.$on("DotPosChanged", this.refreshPath);
            com.$on("Destory", this.delSelf);
        }
    },
    computed: {
        // 是否显示border
        isShowBorder: function(){
            return this.showBorderInner || this.isActive;
        },
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

        // document
        this.$el.parentNode.addEventListener("mouseup", this.docMouseUp);

        // 发送事件给父
        this.onComponentCreated(this);
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
        isActive: function(val){
            this.onComponentActived(this, val);
        }
    },
    destroyed: function(){
        if(this.source) this.unSubscribeEvent(this.source.el);
        if(this.dest) this.unSubscribeEvent(this.dest.el);
    }
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