<template>
  <div class="warpper" :style="{ 
        left: x ? x + 'px' : null, 
        top: y ? y + 'px' : null,
        width: w ? w + 'px' : null,
        height: h ? h + 'px' : null,
        borderColor: isShowBorder ? '#9ed0fa' : 'transparent',
    }"
  >
      <slot></slot>
      <div v-if="isShowBorder" class="layer"></div>
      <!-- 左上角 -->
      <div id="tl" class="ctl-dot tl" :class="{ 'connect-mode': connectMode }" v-show="isShowBorder"></div>
      <!-- 右上角 -->
      <div id="tr" class="ctl-dot tr" :class="{ 'connect-mode': connectMode }" v-show="isShowBorder"></div>
      <!-- 左下角 -->
      <div id="lb" class="ctl-dot lb" :class="{ 'connect-mode': connectMode }" v-show="isShowBorder"></div>
      <!-- 右下角 -->
      <div id="rb" class="ctl-dot rb" :class="{ 'connect-mode': connectMode }" v-show="isShowBorder"></div>
      <!-- 上中 -->
      <div id="tc" class="ctl-dot tc" :class="{ 'connect-mode': connectMode }" v-show="isShowBorder"></div>
      <!-- 下中 -->
      <div id="bc" class="ctl-dot bc" :class="{ 'connect-mode': connectMode }" v-show="isShowBorder"></div>
      <!-- 左中 -->
      <div id="lc" class="ctl-dot lc" :class="{ 'connect-mode': connectMode }" v-show="isShowBorder"></div>
      <!-- 右中 -->
      <div id="rc" class="ctl-dot rc" :class="{ 'connect-mode': connectMode }" v-show="isShowBorder"></div>
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
    handler: (x, y)=>{},
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
        setPos: function(pos){
            this.x = QuZheng(pos.x);
            this.y = QuZheng(pos.y);
        },
        getDotPos: function(dot){
            if(dot == "tc"){
                // 上中
                return { x: this.x + this.$el.offsetWidth/2, y: this. y };
            }
            else if(dot == "bc"){
                // 下中
                return { x: this.x + this.$el.offsetWidth/2, y: this.y+this.$el.offsetHeight };
            }
            else if(dot == "lc"){
                // 左中
                return { x: this.x, y: this.y + this.$el.offsetHeight/2 };
            }
            else if(dot == "rc"){
                // 右中
                return { x: this.x + this.$el.offsetWidth, y: this.y + this.$el.offsetHeight/2 };
            }
            else if(dot == "tl"){
                // 左上角（左中+上中）
                return { x: this.x, y: this.y };
            }
            else if(dot == "tr"){
                // 右上角(右中+上中)
                return { x: this.x + this.$el.offsetWidth, y: this.y };
            }
            else if(dot == "lb"){
                // 左下角(左中+下中)
                return { x: this.x, y: this.y + this.$el.offsetHeight };
            }
            else if(dot == "rb"){
                // 右下角(右中+下中)
                return { x: this.x + this.$el.offsetWidth, y: this.y + this.$el.offsetHeight };
            }
        },
        getRect: function(){
            return { l: this.x, t: this.y, w: this.$el.offsetWidth, h: this.$el.offsetHeight };
        }
    },
    computed: {
        realW: function() {
            return this.w ? this.w : this.$el.offsetWidth;
        },
        realH: function() {
            return this.h ? this.h : this.$el.offsetHeight;
        },
        isShowBorder: function(){
            return this.connectMode || this.showBorderInner;
        }
    },
    mounted: function() {
        const el = this.$el;

        // 初始化控制按钮
        let dots = el.getElementsByClassName("ctl-dot");
        for(let i = 0; i < dots.length; i++){
            let dot = dots[i];
            if(dot.id == "tc"){
                // 上中
                dot.handler = (x, y) => {
                    this.h = mouse.data.orgH - (y - mouse.data.y);
                    this.y = mouse.data.orgY + (y - mouse.data.y);
                };
            }
            else if(dot.id == "bc"){
                // 下中
                dot.handler = (x, y) => {
                    this.h = QuZheng(mouse.data.orgH + y - mouse.data.y);
                };
            }
            else if(dot.id == "lc"){
                // 左中
                dot.handler = (ox, oy) => {
                    this.w = this.realW - ox;
                    this.x += ox;
                };
            }
            else if(dot.id == "rc"){
                // 右中
                dot.handler = (x, y) => {
                    this.w = QuZheng(mouse.data.orgW + x - mouse.data.x);
                };
            }
            else if(dot.id == "tl"){
                // 左上角（左中+上中）
                dot.handler = (ox, oy) => {
                    this.w = this.realW - ox;
                    this.x += ox;
                    this.h = this.realH - oy;
                    this.y += oy;
                };
            }
            else if(dot.id == "tr"){
                // 右上角(右中+上中)
                dot.handler = (ox, oy) => {
                    this.w = this.realW + ox;
                    this.h = this.realH - oy;
                    this.y += oy;
                };
            }
            else if(dot.id == "lb"){
                // 左下角(左中+下中)
                dot.handler = (ox, oy) => {
                    this.w = this.realW - ox;
                    this.x += ox;
                    this.h = this.realH + oy;
                };
            }
            else if(dot.id == "rb"){
                // 右下角(右中+下中)
                dot.handler = (ox, oy) => {
                    this.w = this.realW + ox;
                    this.h = this.realH + oy;
                };
            }

            dot.addEventListener("mousedown", ev => {
                if(ev.button == 0){
                    // 鼠标左键
                    this.$emit('DotMouseDown', el, ev.srcElement.id);

                    if(this.connectMode){
                        ev.stopPropagation();
                        return;
                    }

                    mouse.setData({ orgW: this.realW, orgH: this.realH, orgX: this.x, orgY: this.y, x: ev.x, y: ev.y });
                    mouse.handler = ev.currentTarget.handler;

                    this.dragging = true;
                    ev.stopPropagation();
                    
                    this.isActive = true;  // 激活
                    this.showBorderInner = true;// 显示边框
                    
                    // 设置鼠标样式
                    document.body.style.cursor = getComputedStyle(ev.currentTarget).cursor;
                }
            });

            dot.addEventListener("click", ev => {
                this.$emit('DotClick', this, ev.srcElement.id);
                ev.stopPropagation();
            });
        }

        el.handler = (x, y)=> {
            this.x = QuZheng(x - mouse.data.offsetX);
            this.y = QuZheng(y - mouse.data.offsetY);
        };

        el.addEventListener("mousedown", ev => {
            if(ev.button == 0){
                // 鼠标左键
                mouse.setData({ offsetX: ev.x - this.x, offsetY: ev.y - this.y });
                mouse.handler = ev.currentTarget.handler;
                
                this.dragging = true;
                ev.stopPropagation();
            }

            this.isActive = true;  // 激活
            this.showBorderInner = true;// 显示边框
        })

        el.addEventListener("mouseenter", ev => {
            this.showBorderInner = true;
        })

        el.addEventListener("mouseleave", ev => {
            if(!this.isActive) this.showBorderInner = false;
        })

        document.addEventListener("mousemove", ev => {
            if(!this.dragging) return;            

            if(mouse.isOffsetGreaterThan(ev, 10)){
                // 每次平移10个像素
                mouse.handler(ev.x, ev.y);
                mouse.setPos(ev);

                this.$nextTick(() => {
                    this.$emit("DotPosChanged");
                });
            }
        })

        document.addEventListener("mouseup", () => {
            if(!this.dragging){
                this.isActive = false;
                this.showBorderInner = false;
            }

            this.dragging = false;
            // 还原鼠标样式
            document.body.style.cursor = "";
        })

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