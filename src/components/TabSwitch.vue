<template>
  <div class="swap-type">
    <el-radio-group  :valu7="type" @change="handleChange" v-model="type" size="medium">
      <el-radio-button label="nerve">{{ $t("home.home14") }}</el-radio-button>
      <el-radio-button label="swft">{{ $t("home.home13") }}</el-radio-button>
    </el-radio-group>
  </div>
</template>

<script>
export default {
  data () {
    return {
    }
  },

  props: {
    type: {
      type: String,
      default: "nerve"
    }
  },

  methods: {
    handleChange(type) {
      this.$emit("input", type);
    }
  }
}

</script>
<style lang="less">
.swap-type {
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
  .el-radio-group {
    border-radius: 20px;
    background: #EBEEF8;
    .el-radio-button {
      .el-radio-button__inner {
        border: none;
        box-shadow: none;
        background-color: #EBEEF8;
        color: #99A3C4;
        border-radius: 20px;
        padding: 13px 20px;
        font-size: 15px;
      }
      &.is-active {
        .el-radio-button__inner {
          background-color: #5BCAF9;
          color: #fff;
          border-radius: 20px;
        }
      }
    }
    .el-radio-button__inner {
      width: 130px;
    }
  }
  
}
</style>