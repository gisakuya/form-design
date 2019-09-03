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
      <div id="tl" class="ctl-dot tl" v-show="isShowBorder"></div>
      <!-- 右上角 -->
      <div id="tr" class="ctl-dot tr" v-show="isShowBorder"></div>
      <!-- 左下角 -->
      <div id="lb" class="ctl-dot lb" v-show="isShowBorder"></div>
      <!-- 右下角 -->
      <div id="rb" class="ctl-dot rb" v-show="isShowBorder"></div>
      <!-- 上中 -->
      <div id="tc" class="ctl-dot tc" v-show="isShowBorder"></div>
      <!-- 下中 -->
      <div id="bc" class="ctl-dot bc" v-show="isShowBorder"></div>
      <!-- 左中 -->
      <div id="lc" class="ctl-dot lc" v-show="isShowBorder"></div>
      <!-- 右中 -->
      <div id="rc" class="ctl-dot rc" v-show="isShowBorder"></div>
  </div>
</template>

<script>
var mouse = {
    x: 0,
    y: 0,
    handler: (ox, oy)=>{},
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
        onDotClick: null,
        showBorder: false
    },
    methods: {
        setPos: function(x, y){
            this.x = x;
            this.y = y;
        },
    },
    computed: {
        realW: function() {
            return this.w ? this.w : this.$el.offsetWidth;
        },
        realH: function() {
            return this.h ? this.h : this.$el.offsetHeight;
        },
        isShowBorder: function(){
            return this.showBorder || this.showBorderInner;
        }
    },
    mounted: function() {
        const _this = this;
        const el = _this.$el;

        // 初始化控制按钮
        let dots = el.getElementsByClassName("ctl-dot");
        for(let i = 0; i < dots.length; i++){
            let dot = dots[i];
            if(dot.id == "tc"){
                // 上中
                dot.handler = (ox, oy)=> {
                    _this.h = _this.realH - oy;
                    _this.y += oy;
                };
            }
            else if(dot.id == "bc"){
                // 下中
                dot.handler = (ox, oy)=> {
                    _this.h = _this.realH + oy;
                };
            }
            else if(dot.id == "lc"){
                // 左中
                dot.handler = (ox, oy)=> {
                    _this.w = _this.realW - ox;
                    _this.x += ox;
                };
            }
            else if(dot.id == "rc"){
                // 右中
                dot.handler = (ox, oy)=> {
                    _this.w = _this.realW + ox;
                };
            }
            else if(dot.id == "tl"){
                // 左上角（左中+上中）
                dot.handler = (ox, oy)=> {
                    _this.w = _this.realW - ox;
                    _this.x += ox;
                    _this.h = _this.realH - oy;
                    _this.y += oy;
                };
            }
            else if(dot.id == "tr"){
                // 右上角(右中+上中)
                dot.handler = (ox, oy)=> {
                    _this.w = _this.realW + ox;
                    _this.h = _this.realH - oy;
                    _this.y += oy;
                };
            }
            else if(dot.id == "lb"){
                // 左下角(左中+下中)
                dot.handler = (ox, oy)=> {
                    _this.w = _this.realW - ox;
                    _this.x += ox;
                    _this.h = _this.realH + oy;
                };
            }
            else if(dot.id == "rb"){
                // 右下角(右中+下中)
                dot.handler = (ox, oy)=> {
                    _this.w = _this.realW + ox;
                    _this.h = _this.realH + oy;
                };
            }

            dot.addEventListener("mousedown", function(ev) {
                if(ev.button == 0){
                    let handled = false;
                    if(_this.onDotClick){
                        handled = _this.onDotClick(ev);
                    }
                    if(handled){
                        ev.stopPropagation();
                        return;
                    }

                    // 鼠标左键
                    mouse.x = ev.x;
                    mouse.y = ev.y;
                    mouse.handler = ev.currentTarget.handler;

                    _this.dragging = true;
                    ev.stopPropagation();

                    document.body.style.cursor = getComputedStyle(ev.currentTarget).cursor;
                }
            })
        }

        el.handler = (ox, oy)=> {
            _this.x += ox;
            _this.y += oy;
        };

        el.addEventListener("mousedown", function(ev) {
            if(ev.button == 0){
                // 鼠标左键
                mouse.x = ev.x;
                mouse.y = ev.y;
                mouse.handler = ev.currentTarget.handler;
                
                _this.dragging = true;
                ev.stopPropagation();
            }

            _this.isActive = true;  // 激活
            _this.showBorderInner = true;// 显示边框
        })

        el.addEventListener("mouseenter", function(ev) {
            _this.showBorderInner = true;
        })

        el.addEventListener("mouseleave", function(ev) {
            if(!_this.isActive) _this.showBorderInner = false;
        })

        document.addEventListener("mousemove", function(ev) {
            if(!_this.dragging) return;            

            let ox = ev.x - mouse.x;
            let oy = ev.y - mouse.y;
            mouse.handler(ox, oy);
            mouse.x = ev.x;
            mouse.y = ev.y;
        })

        document.addEventListener("mouseup", function() {
            if(!_this.dragging){
                _this.isActive = false;
                _this.showBorderInner = false;
            }

            _this.dragging = false;
            document.body.style.cursor = "";
        })

        _this.$emit('init', _this);
    }
}
</script>

<style lang="less" scoped>
    .warpper {
        display: inline-block;
        position: absolute;
        padding: 5px;
        border: 2px solid #9ed0fa;

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