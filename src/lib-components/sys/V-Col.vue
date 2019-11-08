<template>
  <div class="v-vcontainer" :style="selftStyle" ></div>
</template>

<script>
function getAlign(align){
    if(align == "top") return "flex-start";
    if(align == "center") return "center";
    if(align == "bottom") return "flex-end";
    if(align == "between") return "space-between";
    if(align == "around") return "space-around";

    return null;
}

function getWrap(warp){
    return warp ? 'warp':'nowrap';
}

export default {
    props: {
        wrap: {
            type: Boolean,
            default: false
        },
        align: {
            type: String,
            default: null
        }
    },
    computed: {
        selftStyle: function(){
            return {
                flexWrap: getWrap(this.wrap),
                justifyContent: getAlign(this.align)
            }
        }
    }
}
</script>

<style lang="less">
    .v-vcontainer {
        display: flex;
        flex-direction: column; // 垂直排列
    }
</style>