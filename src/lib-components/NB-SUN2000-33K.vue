<template>
    <img :src="trueUrl"  class="myimg"/>
</template>

<script>
export default {
  data: function(){
    return {
      url: null
    }
  },
  designProps:[
    {
      title: '地址',
      name: 'url'
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