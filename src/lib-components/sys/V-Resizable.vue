<template>
  <div class="v-resiable" :style="selfStyle">
      <slot></slot>
      <!-- 遮罩 -->
      <div v-show="isShowBorder" class="layer" @mousedown.left.self="mouseDown($event, moveSelf)"></div>
      <!-- 左上角 -->
      <div class="ctl-dot tl" :class="dotCls" v-show="isShowBorder"
            @mousedown.left="dotMouseDown($event, dotMoveLeftUp, 'tl')"></div>
      <!-- 右上角 -->
      <div class="ctl-dot tr" :class="dotCls" v-show="isShowBorder" 
            @mousedown.left="dotMouseDown($event, dotMoveRightUp, 'tr')"></div>
      <!-- 左下角 -->
      <div class="ctl-dot lb" :class="dotCls" v-show="isShowBorder"
            @mousedown.left="dotMouseDown($event, dotMoveLeftDown, 'lb')"></div>
      <!-- 右下角 -->
      <div class="ctl-dot rb" :class="dotCls" v-show="isShowBorder" 
            @mousedown.left="dotMouseDown($event, dotMoveRightDown, 'rb')"></div>
      <!-- 上中 -->
      <div class="ctl-dot tc" :class="dotCls" v-show="isShowBorder"
            @mousedown.left="dotMouseDown($event, dotMoveUp, 'tc')"></div>
      <!-- 下中 -->
      <div class="ctl-dot bc" :class="dotCls" v-show="isShowBorder"
            @mousedown.left="dotMouseDown($event, dotMoveDown, 'bc')"></div>
      <!-- 左中 -->
      <div class="ctl-dot lc" :class="dotCls" v-show="isShowBorder"
            @mousedown.left="dotMouseDown($event, dotMoveLeft, 'lc')"></div>
      <!-- 右中 -->
      <div class="ctl-dot rc" :class="dotCls" v-show="isShowBorder"
            @mousedown.left="dotMouseDown($event, dotMoveRight, 'rc')"></div>
  </div>
</template>

<script>
import { QuZheng, GetStyleValue } from "./utility"
import CommonMixin from "./componentMixin"

export default {
    inject: [
        'isComponentIdVaild',
        'setMouseShape'
    ],
    data: function() {
        return {
            connectMode: false,
            draggingDot: null
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
                this.w = tmp[0].trim();
                this.h = tmp[1].trim();
                if(!i) this.emitDotPosChange();
            },
            init: function(val){
                if(val){
                    let tmp = val.split(',');
                    this.w = tmp[0];
                    this.h = tmp[1];
                }
                else{
                    this.w = this.$el.offsetWidth;
                    this.h = this.$el.offsetHeight;
                }
            }
        },
    ],
    methods: {
        // 供外部使用
        getDotPos: function(dot){
            const l = this.$el.offsetLeft;
            const t = this.$el.offsetTop;
            const w = this.$el.offsetWidth;
            const h = this.$el.offsetHeight;
            if(dot == "tc"){
                // 上中
                return { x: l + w/2, y: t };
            }
            else if(dot == "bc"){
                // 下中
                return { x: l + w/2, y: t + h };
            }
            else if(dot == "lc"){
                // 左中
                return { x: l, y: t + h/2 };
            }
            else if(dot == "rc"){
                // 右中
                return { x: l + w, y: t + h/2 };
            }
            else if(dot == "tl"){
                // 左上角（左中+上中）
                return { x: l, y: t };
            }
            else if(dot == "tr"){
                // 右上角(右中+上中)
                return { x: l + w, y: t };
            }
            else if(dot == "lb"){
                // 左下角(左中+下中)
                return { x: l, y: t + h };
            }
            else if(dot == "rb"){
                // 右下角(右中+下中)
                return { x: l + w, y: t + h };
            }
        },
        getRect: function(){
            const l = this.$el.offsetLeft;
            const t = this.$el.offsetTop;
            const w = this.$el.offsetWidth;
            const h = this.$el.offsetHeight;
            return { l, t, w, h };
        },

        // Dot
        dotMouseDown: function(ev, handler, dot){
            if(this.connectMode){
                 this.draggingDot = `${this.id}.${dot}`;
                 this.draggingHandler = null;
                 return;
            }

            const cursor = getComputedStyle(ev.currentTarget).cursor;
            this.draggingBegin = () => {
                this.setMouseShape(cursor);
            };
            this.draggingEnd = () => {
                this.setMouseShape("");
            };
            this.draggingHandler = handler;
        },

        // Self
        mouseDown: function(ev, handler){
            if(this.connectMode){
                this.draggingDot = null;
            }

            this.draggingBegin = null;
            this.draggingEnd = null;
            this.draggingHandler = handler;
        },

        // 放大缩小事件
        dotMoveUp: function({ orgY, orgH }, { oy }){
            this.y = QuZheng(orgY + oy); // y + oy
            this.h = (orgY + orgH) - this.y;  // b - y

            this.emitDotPosChange();
        },
        dotMoveDown: function({ orgH }, { oy }){
            this.h = QuZheng(orgH + oy);   // h + oy

            this.emitDotPosChange();
        },
        dotMoveLeft: function({ orgX, orgW }, { ox }){
            this.x = QuZheng(orgX + ox);   // x + ox
            this.w = (orgX + orgW) - this.x;  // r - x;

            this.emitDotPosChange();
        },
        dotMoveRight: function({ orgW }, { ox }){
            this.w = QuZheng(orgW + ox);   // w + ox

            this.emitDotPosChange();
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
        moveSelf: function({ orgX,  orgY }, { ox, oy }){
            this.x = QuZheng(orgX + ox);
            this.y = QuZheng(orgY + oy);

            this.emitDotPosChange();
        },
        emitDotPosChange: function(){
            this.$nextTick(()=>{
                this.$emit("DotPosChanged");
            })
        }
    },
    computed: {
        // dot样式
        dotCls: function(){
            return {
                'connect-mode': this.connectMode
            }
        },
        // 本身样式
        selfStyle: function(){
            return { 
                left: GetStyleValue(this.x), 
                top: GetStyleValue(this.y),
                width: GetStyleValue(this.w),
                height: GetStyleValue(this.h),
                borderColor: this.isShowBorder ? '#9ed0fa' : 'transparent',
            };
        },
        isShowBorder: function(){
            return this.connectMode || this.active || this.showBorder;
        }
    },
    mixins: [ CommonMixin ]
}
</script>

<style lang="less">
    .v-resiable {
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