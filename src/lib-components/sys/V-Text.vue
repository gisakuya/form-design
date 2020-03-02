<script>
export default {
    props: {
        text: {
            type: [String, Number],
            default: 'some text'
        },
        tag: {
            type: String,
            default: 'label'
        }
    },
    render: function(h){
        return h(this.tag || 'label', this.text);
    }
}
</script>