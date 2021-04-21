<template>
    <div class="back" :backUrl="backUrl">
      <i class="el-icon-arrow-left" @click="back"></i>
      <span>{{backTitle}}</span>
    </div>
</template>

<script>
  export default {
    props: {
      backTitle: {
        type: String,
        default: ""
      },
      backUrl: {
        type: String,
        default: "1"
      },
      backParams: {
        type: String,
        default: ''
      }
    },
    methods: {
      back() {
        if (this.backUrl === "1") {
          this.$router.go(-1);
        } else {
          this.$router.push({
            name: this.backUrl,
          })
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import url("../assets/css/style.less");
  .back {
    font-size: 16px;
    height: 40px;
    line-height: 40px;
    text-align: center;
    .el-icon-arrow-left {
      position: absolute;
      cursor: pointer;
      left: 15px;
      top: 12px;
      font-weight: 600;
    }
  }
</style>
