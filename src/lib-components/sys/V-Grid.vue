<template>
    <table class="v-grid" :style="selftStyle">
        <tr v-for="(row, i) in cRows" :key="i" :style="{ height: row }">
            <td ref="cells" :name="`${i},${j}`" v-for="(col, j) in cCols" :key="j" 
                :style="{ borderColor: cellBorder, width: col }">
                <slot :name="`${i},${j}`"></slot>
            </td>
        </tr>
    </table>
</template>

<script>
import CommonMixin from "./componentMixin"

export default {
    data: function(){
        return {
            wrap: false,
        }
    },
    props: {
        rows: {
            type: String,
            default: "50%,50%"
        },
        cols: {
            type: String,
            default: "50%,50%"
        },
    },
    designProps: [
        {
            title: '唯一标识',
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
            title: '内容换行',
            name: 'wrap',
            enum: [
                { title: '是', value: true },
                { title: '否', value: false }
            ]
        },
        {
            title: '水平对齐',
            name: 'align',
            enum: [
                { title: '左', value: 'flex-start' },
                { title: '中', value: 'center' },
                { title: '右', value: 'flex-end' },
                { title: '两端', value: 'space-between' },
                { title: '等间距', value: 'space-around' }
            ]
        },
        {
            title: '垂直对齐',
            name: 'valign',
            enum: [
                { title: '上', value: 'flex-start' },
                { title: '中', value: 'center' },
                { title: '下', value: 'flex-end' },
                { title: '拉伸', value: 'stretch' },
                { title: '基线', value: 'baseline' }
            ]
        },
    ],
    methods: {
        itemMoveIn: function(item, { x, y }){
            const cells = this.$refs.cells;
            if(cells){
                for (let i = 0; i < cells.length; i++) {
                    const cell = cells[i];
                    const rect = cell.getBoundingClientRect();
                    if(rect.left <= x && x <= rect.right &&
                        rect.top <= y && y <= rect.bottom){
                        item.slot = cell.getAttribute("name");
                        return;
                    }
                }
            }
        }
    },
    computed: {
        selftStyle: function(){
            return {
            }
        },
        cellBorder: function(){
            return this.isShowBorder ? 'red' : null;
        },
        cRows: function(){
            return this.rows ? this.rows.split(',') : []
        },
        cCols: function(){
            return this.cols ? this.cols.split(',') : []
        }
    },
    mixins: [ CommonMixin ]
}
</script>

<style lang="less">
    .v-grid {
        border-collapse:collapse;
        min-width: 200px;
        min-height: 200px;
        width: 100%;
        height: 100%;

        & td {
            border: 1px lightgray dashed;

            & > * {
                position: relative !important;
            }
        }
    }
</style>