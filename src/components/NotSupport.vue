<template>
  <div class="_not-support">
    <div class="_not-support-tip">
      不支持中国大陆用户
    </div>
  </div>
</template>

<script>
export default {
  name: "NotSupport",

}
</script>

<style scoped>
._not-support {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0,0,0,0.7);
}
._not-support ._not-support-tip {
  width: 300px;
  height: 100px;
  text-align: center;
  line-height: 100px;
  border-radius: 15px;
  background-color: #fff;
  position: absolute;
  left: 50%;
  top: 20%;
  transform: translateX(-50%);
}
</style>