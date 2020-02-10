export default {
    inject: [
        'onComponentDeleted'
    ],
    data: function(){
        return {
            id: null,
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            draggingBegin: null,
            draggingHandler: null,
            draggingEnd: null,
            mouseHoverShape: null,
            active: false,
            showBorder: false,

            align: null,
            valign: null,

            flexGrow: null,
            flexShrink: null,

            slot: null,

            designProps: [],
            bindProps: []
        }
    },
    methods: {
        delSelf: function(){
            this.$emit("Destory");
            this.onComponentDeleted(this);
        },

        getRect: function(){
            const el = this.$el;
            const l = el.offsetLeft;
            const t = el.offsetTop;
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            return { l, t, w, h };
        },
    },

    computed: {
        isShowBorder: function(){
            return this.active || this.showBorder;
        }
    },

    mounted: function() {
        if(this.layoutFinished){
            setTimeout(() => {
                this.layoutFinished();
            }, 100)
        }
    },
    beforeDestroy: function(){
        this.onComponentDeleted(this);
    }
}