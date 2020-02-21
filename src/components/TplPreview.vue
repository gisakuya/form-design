<template>
  <el-container style="height: 200vh; border: 1px solid #eee">
      <el-main>
          <v-form-design-preview ref="formDesign" style="height:100%;"
              v-model="tpl"
          >
          </v-form-design-preview>
          <textarea style="height:100px; width: 100%; background:lightgray" :value="orgTpl" readonly>
          </textarea>
      </el-main>
  </el-container>
</template>

<script>
import { TreeLoop } from "../lib-components/sys/utility";

export default {
  name: "HomePreview",
  data() {
    return {
      tpl: { components: [] },
      orgTpl: ''
    }
  },
  methods: {
  },
  mounted: function(){
    this.orgTpl = localStorage.getItem('tpl');
    this.tpl = JSON.parse(this.orgTpl);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less">
  .el-menu-item {
    cursor: move;
  }

  .el-header {
    background-color: #f2f2f2;
    line-height: 60px;

    .el-link {
      margin-right: 5px;
    }
  }
</style>
