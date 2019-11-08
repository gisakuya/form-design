<template>
  <label>{{ text }}</label>
</template>

<script>
export default {
    props: {
        text: {
            type: String,
            default: 'some text'
        }
    }
}
</script>

<style>

</style>