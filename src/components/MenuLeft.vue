<template>
  <div class="menu_left">
    <el-menu-item index="home">{{$t('nav.wallet')}}</el-menu-item>
    <el-menu-item index="staking" :disabled="addressList.length === 0">{{$t('nav.staking')}}</el-menu-item>
    <el-menu-item index="consensus" :disabled="addressList.length === 0">{{$t('nav.consensus')}}</el-menu-item>
    <el-menu-item index="swap" :disabled="addressList.length === 0">{{$t('nav.convert')}}</el-menu-item>
    <el-menu-item index="application" v-if="false">应用</el-menu-item>
    <div class="fl nerve-dex" @click="open">NerveDEX</div>
  </div>
</template>

<script>
  import {superLong, connectToExplorer} from '@/api/util'
  import { ETHNET } from '@/config.js'

  export default {
    data() {
      return {
        addressList: [], //地址列表
      };
    },
    components: {},
    watch: {},
    created() {
      this.getAddressList();
    },
    mounted() {
      setInterval(() => {
        this.getAddressList();
      }, 1000)
    },
    methods: {

      /**
       * 获取账户列表缩写
       */
      getAddressList() {
        this.addressList = [...this.$store.state.addressInfo];
        if (this.addressList) {
          for (let item  of this.addressList) {
            item.addresss = superLong(item.address, 8);
          }
        }
      },
      open() {
        const url = ETHNET === 'ropsten' ? 'http://beta.nervedex.com/' : 'https://nervedex.com/'
        connectToExplorer('nuls', url)
      }
    },
  }
</script>

<style lang="less">
  .menu_left {
    outline: none;
    .el-menu-item {
      float: left;
      &:focus, &:hover {
        outline: 0;
        background-color: transparent;
      }
    }
    .nerve-dex {
      height: 56px;
      line-height: 56px;
      padding: 0 15px;
      cursor: pointer;
      &:hover {
        color: #2688f7;
      }
    }
  }


</style>
