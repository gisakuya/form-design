<template>
  <div>
    <h4>NB-SUN2000-36K bb2</h4>
    <p>{{ a }}</p>
  </div>
</template>

<script>
export default {
  data: function(){
    return {
      a: ''
    }
  },
  designProps: [
    {
      title: '一般属性',
      props: [
        {
              title: '36K属性',
              name: 'cust-attr',
              get: function() {
                  return this.a;
              },
              set: function(val){
                  this.a = val;
              }
        }
      ]
    }
  ]
}
</script>

<style>

</style>