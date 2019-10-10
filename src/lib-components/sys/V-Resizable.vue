<template>
  <div class="warpper" :style="selfStyle"
    @mousedown.left.stop="mouseDown($event, moveSelf)"
    @mouseenter="mouseEnter"
    @mouseleave="mouseLeave"
    @keyup.delete="delSelf"
    tabindex="1"
  >
      <slot></slot>
      <div v-show="isShowBorder" class="layer"></div>
      <!-- 左上角 -->
      <div class="ctl-dot tl" :class="dotCls" v-show="isShowBorder"
            @mousedown.left.stop="dotMouseDown($event, dotMoveLeftUp, 'tl')"></div>
      <!-- 右上角 -->
      <div class="ctl-dot tr" :class="dotCls" v-show="isShowBorder" 
            @mousedown.left.stop="dotMouseDown($event, dotMoveRightUp, 'tr')"></div>
      <!-- 左下角 -->
      <div class="ctl-dot lb" :class="dotCls" v-show="isShowBorder"
            @mousedown.left.stop="dotMouseDown($event, dotMoveLeftDown, 'lb')"></div>
      <!-- 右下角 -->
      <div class="ctl-dot rb" :class="dotCls" v-show="isShowBorder" 
            @mousedown.left.stop="dotMouseDown($event, dotMoveRightDown, 'rb')"></div>
      <!-- 上中 -->
      <div class="ctl-dot tc" :class="dotCls" v-show="isShowBorder"
            @mousedown.left.stop="dotMouseDown($event, dotMoveUp, 'tc')"></div>
      <!-- 下中 -->
      <div class="ctl-dot bc" :class="dotCls" v-show="isShowBorder"
            @mousedown.left.stop="dotMouseDown($event, dotMoveDown, 'bc')"></div>
      <!-- 左中 -->
      <div class="ctl-dot lc" :class="dotCls" v-show="isShowBorder"
            @mousedown.left.stop="dotMouseDown($event, dotMoveLeft, 'lc')"></div>
      <!-- 右中 -->
      <div class="ctl-dot rc" :class="dotCls" v-show="isShowBorder"
            @mousedown.left.stop="dotMouseDown($event, dotMoveRight, 'rc')"></div>
  </div>
</template>

<script>
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
        'isComponentNameVaild',
        'createNewComponentName',
        'onComponentDotClick'
    ],
    data: function() {
        return {
            connectMode: false
        };
    },
    designProps: [
        {
            title: '一般属性',
            props: [
                {
                    title: '名称',
                    name: 'name',
                    get: function(){
                        return this.name;
                    },
                    set: function(val){
                        if(!val) return;
                        if(!this.isComponentNameVaild(val)){
                            alert("该名字已被占用!");
                        }
                        else{
                            this.name = val;
                        }
                    },
                    init: function(val){
                        this.name = val || this.createNewComponentName(this);
                    }
                },
                {
                    title: '位置',
                    name: 'pos',
                    tooltip: '格式：x,y',
                    get: function() {
                        return `${this.x},${this.y}`;
                    },
                    set: function(val, i){
                        if(!val) return;
                        let tmp = val.split(',');
                        this.x = +tmp[0];
                        this.y = +tmp[1];
                        if(!i) this.emitDotPosChange();
                    }
                },
                {
                    title: '大小',
                    name: 'size',
                    tooltip: '格式：w,h',
                    get: function() {
                        return `${this.w},${this.h}`;
                    },
                    set: function(val, i){
                        if(!val) return;
                        let tmp = val.split(',');
                        this.w = +tmp[0];
                        this.h = +tmp[1];
                        if(!i) this.emitDotPosChange();
                    },
                    init: function(val){
                        if(val){
                            let tmp = val.split(',');
                            this.w = +tmp[0];
                            this.h = +tmp[1];
                        }
                        else{
                            this.w = this.$el.offsetWidth;
                            this.h = this.$el.offsetHeight;
                        }
                    }
                },
            ]
        }
    ],
    methods: {
        // 供外部使用
        setPos: function(pos){
            this.x = QuZheng(pos.x);
            this.y = QuZheng(pos.y);
        },
        getDotPos: function(dot){
            const w = this.$el.offsetWidth;
            const h = this.$el.offsetHeight;
            if(dot == "tc"){
                // 上中
                return { x: this.x + w/2, y: this.y };
            }
            else if(dot == "bc"){
                // 下中
                return { x: this.x + w/2, y: this.y + h };
            }
            else if(dot == "lc"){
                // 左中
                return { x: this.x, y: this.y + h/2 };
            }
            else if(dot == "rc"){
                // 右中
                return { x: this.x + w, y: this.y + h/2 };
            }
            else if(dot == "tl"){
                // 左上角（左中+上中）
                return { x: this.x, y: this.y };
            }
            else if(dot == "tr"){
                // 右上角(右中+上中)
                return { x: this.x + w, y: this.y };
            }
            else if(dot == "lb"){
                // 左下角(左中+下中)
                return { x: this.x, y: this.y + h };
            }
            else if(dot == "rb"){
                // 右下角(右中+下中)
                return { x: this.x + w, y: this.y + h };
            }
        },
        getRect: function(){
            const w = this.$el.offsetWidth;
            const h = this.$el.offsetHeight;
            return { l: this.x, t: this.y, w: w, h: h };
        },

        // Dot
        dotMouseDown: function(ev, handler, dot){
            if(this.connectMode){
                 this.onComponentDotClick(`${this.name}.${dot}`, ev);
                 return;
            }

            // 记录鼠标初始值
            mouse.setData({ orgW: this.w, orgH: this.h, orgX: this.x, orgY: this.y, x: ev.x, y: ev.y });
            this.draggingHandler = handler;
            this.isActive = true;
            document.body.style.cursor = getComputedStyle(ev.currentTarget).cursor;
        },

        // Self
        mouseDown: function(ev, handler){
            // 记录鼠标初始值
            mouse.setData({ offsetX: ev.x - this.x, offsetY: ev.y - this.y });
            this.draggingHandler = handler;
            this.isActive = true;
        },

        // Document
        docMouseMove: function(ev){
            if(!this.draggingHandler) return;
            if(!mouse.isOffsetGreaterThan(ev, 10)) return;

            this.draggingHandler(ev.x, ev.y);
            mouse.setPos(ev);

            this.emitDotPosChange();
        },
        docMouseUp: function(){
            if(!this.draggingHandler){
                this.isActive = false;
            }

            this.draggingHandler = null;
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
        },

        // 发送事件
        emitDotPosChange: function(){
            this.$nextTick(()=>{
                this.$emit("DotPosChanged");
            })
        }
    },
    computed: {
        // 是否显示border
        isShowBorder: function(){
            return this.connectMode || this.showBorderInner || this.isActive;
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
        },
    },
    mixins: [ CommonMixin ]
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