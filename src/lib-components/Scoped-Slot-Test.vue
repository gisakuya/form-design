<template>
  <div>
      <h4>
        <slot name="header">header</slot>
      </h4>
      <p>
        <slot>body</slot>
      </p>
      <h3 style="color: red">
          <slot name="footer" v-bind:xx="user">
              {{ (user ? user.first : 'footer') }}
          </slot>
      </h3>
  </div>
</template>

<script>
// 测试用数据
// #user={ "first": "ye", "last":"wei", "mid": "jie" }
export default {
    props: [ 'user' ]
}
</script>

<style>

</style>