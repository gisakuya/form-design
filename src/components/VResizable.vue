<template>
  <div class="warpper" :style="selfStyle"
    @mousedown.left.stop="mouseDown($event, moveSelf);dragBegin()"
    @mouseenter="mouseEnter"
    @mouseleave="mouseLeave"
  >
      <slot></slot>
      <div v-show="isShowBorder" class="layer"></div>
      <!-- 左上角 -->
      <div class="ctl-dot tl" :class="dotCls" v-show="isShowBorder"
            @mousedown.left.stop="dotMouseDown($event, dotMoveLeftUp);dragBegin()" @click.left.stop="dotClick($event, 'tl')"></div>
      <!-- 右上角 -->
      <div class="ctl-dot tr" :class="dotCls" v-show="isShowBorder" 
            @mousedown.left.stop="dotMouseDown($event, dotMoveRightUp);dragBegin()" @click.left.stop="dotClick($event, 'tr')"></div>
      <!-- 左下角 -->
      <div class="ctl-dot lb" :class="dotCls" v-show="isShowBorder"
            @mousedown.left.stop="dotMouseDown($event, dotMoveLeftDown);dragBegin()" @click.left.stop="dotClick($event, 'lb')"></div>
      <!-- 右下角 -->
      <div class="ctl-dot rb" :class="dotCls" v-show="isShowBorder" 
            @mousedown.left.stop="dotMouseDown($event, dotMoveRightDown);dragBegin()" @click.left.stop="dotClick($event, 'rb')"></div>
      <!-- 上中 -->
      <div class="ctl-dot tc" :class="dotCls" v-show="isShowBorder"
            @mousedown.left.stop="dotMouseDown($event, dotMoveUp);dragBegin()" @click.left.stop="dotClick($event, 'tc')"></div>
      <!-- 下中 -->
      <div class="ctl-dot bc" :class="dotCls" v-show="isShowBorder"
            @mousedown.left.stop="dotMouseDown($event, dotMoveDown);dragBegin()" @click.left.stop="dotClick($event, 'bc')"></div>
      <!-- 左中 -->
      <div class="ctl-dot lc" :class="dotCls" v-show="isShowBorder"
            @mousedown.left.stop="dotMouseDown($event, dotMoveLeft);dragBegin()" @click.left.stop="dotClick($event, 'lc')"></div>
      <!-- 右中 -->
      <div class="ctl-dot rc" :class="dotCls" v-show="isShowBorder"
            @mousedown.left.stop="dotMouseDown($event, dotMoveRight);dragBegin()" @click.left.stop="dotClick($event, 'rc')"></div>
  </div>
</template>

<script>
// 对数进行取整
function QuZheng(val){
    return Math.round(val/10)*10;
}

var mouse = {
    x: 0,
    y: 0,
    data: null,
    handler: ()=>{},
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
    name: 'VResizable',
    data: function() {
        return {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            dragging: false,
            showBorderInner: false,
            isActive: false
        };
    },
    props: {
        connectMode: Boolean
    },
    methods: {
        // 供外部使用
        setPos: function(pos){
            this.x = QuZheng(pos.x);
            this.y = QuZheng(pos.y);
        },
        getDotPos: function(dot){
            if(dot == "tc"){
                // 上中
                return { x: this.x + this.realW()/2, y: this. y };
            }
            else if(dot == "bc"){
                // 下中
                return { x: this.x + this.realW()/2, y: this.y + this.realH() };
            }
            else if(dot == "lc"){
                // 左中
                return { x: this.x, y: this.y + this.realH()/2 };
            }
            else if(dot == "rc"){
                // 右中
                return { x: this.x + this.realW(), y: this.y + this.realH()/2 };
            }
            else if(dot == "tl"){
                // 左上角（左中+上中）
                return { x: this.x, y: this.y };
            }
            else if(dot == "tr"){
                // 右上角(右中+上中)
                return { x: this.x + this.realW(), y: this.y };
            }
            else if(dot == "lb"){
                // 左下角(左中+下中)
                return { x: this.x, y: this.y + this.realH() };
            }
            else if(dot == "rb"){
                // 右下角(右中+下中)
                return { x: this.x + this.realW(), y: this.y + this.realH() };
            }
        },
        getRect: function(){
            return { l: this.x, t: this.y, w: this.realW(), h: this.realH() };
        },
        exportConfig: function(){
            return { class: "VResizeable", left: this.x, top: this.y, width: this.w, height: this.h };
        },
        loadConfig: function(cfg){
            this.x = cfg.left;
            this.y = cfg.top;
            this.w = cfg.width;
            this.h = cfg.height;
        },

        // 供内部使用
        realW: function(){
            return this.$el.offsetWidth;
        },
        realH: function(){
            return this.$el.offsetHeight;
        },
        dragBegin: function(){
            this.dragging = true;       // 拖曳生效
            this.isActive = true;       // 激活
            this.showBorderInner = true;// 显示边框
        },

        // Dot
        dotClick: function(ev, name){
            this.$emit('DotClick', this, name);
        },
        dotMouseDown: function(ev, handler){
            if(this.connectMode) return;

            // 记录鼠标初始值
            mouse.setData({ orgW: this.w, orgH: this.h, orgX: this.x, orgY: this.y, x: ev.x, y: ev.y });
            mouse.handler = handler;

            // 设置鼠标样式
            document.body.style.cursor = getComputedStyle(ev.currentTarget).cursor;
        },

        // Self
        mouseEnter: function(){
            this.showBorderInner = true;
        },
        mouseLeave: function(){
            if(!this.isActive)  this.showBorderInner = false 
        },
        mouseDown: function(ev, handler){
            // 记录鼠标初始值
            mouse.setData({ offsetX: ev.x - this.x, offsetY: ev.y - this.y });
            mouse.handler = handler;
        },

        // Document
        docMouseMove: function(ev){
            if(!this.dragging) return;
            if(!mouse.isOffsetGreaterThan(ev, 10)) return;

            mouse.handler(ev.x, ev.y);
            mouse.setPos(ev);

            this.$nextTick(() => this.$emit("DotPosChanged"));
        },
        docMouseUp: function(){
            if(!this.dragging){
                this.isActive = false;
                this.showBorderInner = false;
            }
            this.dragging = false;

            // 还原鼠标样式
            document.body.style.cursor = "";
        },

        // 放大缩小事件
        dotMoveUp: function(x, y){
            this.y = QuZheng(mouse.data.orgY + (y - mouse.data.y)); // y + oy
            this.h = (mouse.data.orgY + mouse.data.orgH) - this.y;  // b - y
        },
        dotMoveDown: function(x, y){
            this.h = QuZheng(mouse.data.orgH + y - mouse.data.y);   // h + oy
        },
        dotMoveLeft: function(x, y){
            this.x = QuZheng(mouse.data.orgX + x - mouse.data.x);   // x + ox
            this.w = (mouse.data.orgX + mouse.data.orgW) - this.x;  // r - x;
        },
        dotMoveRight: function(x, y){
            this.w = QuZheng(mouse.data.orgW + x - mouse.data.x);   // w + ox
        },
        dotMoveLeftUp: function(x, y){
            this.dotMoveLeft(x, y);
            this.dotMoveUp(x, y);
        },
        dotMoveRightUp: function(x, y){
            this.dotMoveRight(x, y);
            this.dotMoveUp(x, y);
        },
        dotMoveLeftDown: function(x, y){
            this.dotMoveLeft(x, y);
            this.dotMoveDown(x, y);
        },
        dotMoveRightDown: function(x, y){
            this.dotMoveRight(x, y);
            this.dotMoveDown(x, y);
        },
        moveSelf: function(x, y){
            this.x = QuZheng(x - mouse.data.offsetX);
            this.y = QuZheng(y - mouse.data.offsetY);
        }
    },
    computed: {
        // 是否显示border
        isShowBorder: function(){
            return this.connectMode || this.showBorderInner;
        },
        // dot样式
        dotCls: function(){
            return {
                'connect-mode': this.connectMode
            }
        },
        // 本身样式
        selfStyle: function(){
            return { 
                left: this.x ? this.x + 'px' : null, 
                top: this.y ? this.y + 'px' : null,
                width: this.w ? this.w + 'px' : null,
                height: this.h ? this.h + 'px' : null,
                borderColor: this.isShowBorder ? '#9ed0fa' : 'transparent',
            };
        }
    },
    mounted: function() {
        // 初始化本身
        this.w = QuZheng(this.$el.offsetWidth);
        this.h = QuZheng(this.$el.offsetHeight);

        // document
        document.addEventListener("mousemove", this.docMouseMove);
        document.addEventListener("mouseup", this.docMouseUp)

        // 发送初始化完成事件
        this.$emit('init', this);
    }
}
</script>

<style lang="less" scoped>
    .warpper {
        display: inline-block;
        position: absolute;
        padding: 5px;
        border: 2px solid #9ed0fa;
        z-index: 98;

        &:focus{
            outline: none;
        }
    }

    // 控制点的半径
    @dotRadius: 5px;

    .ctl-dot {
        background: #44aaff;
        width: @dotRadius*2;
        height: @dotRadius*2;
        border-radius: 50%;
        position: absolute;
        z-index: 99;
        
        // 左上角
        &.tl {
            left: -@dotRadius;
            top: -@dotRadius;
            cursor: nw-resize;
        }
        // 右上角
        &.tr {
            right: -@dotRadius;
            top: -@dotRadius;
            cursor: ne-resize;
        }
        // 左下角
        &.lb {
            left: -@dotRadius;
            bottom: -@dotRadius;
            cursor: sw-resize;
        }
        // 右下角
        &.rb {
            right: -@dotRadius;
            bottom: -@dotRadius;
            cursor: se-resize;
        }
        // 上中
        &.tc {
            top: -@dotRadius;
            left: 0px;
            right: 0px;
            margin-left: auto; 
            margin-right: auto; 
            cursor: n-resize;
        }
        // 下中
        &.bc {
            bottom: -@dotRadius;
            left: 0px;
            right: 0px;
            margin-left: auto; 
            margin-right: auto;
            cursor: n-resize;
        }
        // 左中
        &.lc {
            left: -@dotRadius*1.3;
            top: 0px;
            bottom: 0px;
            margin-top: auto;
            margin-bottom: auto;
            cursor: e-resize;
        }
        // 右中
        &.rc {
            right: -@dotRadius*1.3;
            top: 0px;
            bottom: 0px;
            margin-top: auto;
            margin-bottom: auto;
            cursor: e-resize;
        }
    }

    // 连接模式
    .connect-mode {
        cursor: crosshair !important;
        &:hover {
            background: red;
        }
    }
    
    // 遮罩
    .layer {
        top:0px;
        left: 0px;
        width: 100%;
        height: 100%;
        z-index: 99;
        position: absolute;
        // background: yellow;
        // opacity: 0.5;
    }
</style>