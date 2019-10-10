<template>
  <img :src="trueUrl"  class="myimg"/>
</template>

<script>
// http://img0.imgtn.bdimg.com/it/u=3357786243,3135716437&fm=26&gp=0.jpg
// http://img3.imgtn.bdimg.com/it/u=222247294,2919493301&fm=26&gp=0.jpg
export default {
  data: function(){
    return {
      url: null
    }
  },
  designProps:[
    {
      title: '一般属性',
      props: [
        {
          title: '地址',
          name: 'url'
        }
      ]
    }
  ],
  computed: {
    trueUrl: function(){
      return this.url || "https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=4135477902,3355939884&fm=26&gp=0.jpg";
    }
  }
}
</script>

<style>
  .myimg {
    max-width: 100%;
    max-height: 100%;
  }
</style>