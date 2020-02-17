<template>
  <div>
      <slot>{{ msg }}</slot>
  </div>
</template>

<script>
export default {
  props: {
    msg: null
  }
}
</script>

<style>

</style>