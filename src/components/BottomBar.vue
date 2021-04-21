<template>
  <div>
    <div class="bottom">
      <div class="w1200 font14">
        <div class="left fl">
          <p class="fl">
            <font class="pc">{{$t('bottom.serviceNode')}}:</font>
            <u class="click" @click="toUrl('nodeService')">{{$store.getters.getCurrentUrlData.urls}}</u>
          </p>
        </div>
        <div class="right fr">
          <font class="pc">{{$t('bottom.nodeHeight')}}:</font>
          <i v-show="heightInfo.networkHeight ===0 || heightInfo.localHeight===0 " class="el-icon-loading"></i>
          <span>{{heightInfo.networkHeight}}/{{heightInfo.localHeight}}</span>
        </div>
      </div>
    </div>
    <div class="bottom-mobile">
      <ul>
        <router-link active-class="active-li" tag="li" :to="{name:'home'}" exact>
<!--          <img src="../assets/img/nodeIcon1.svg" alt="">-->
          <i class="iconfont icon-zhanghu"></i>
          <span>{{$t('nav.wallet')}}</span>
        </router-link>
        <router-link active-class="active-li" tag="li" :to="{name:'staking'}">
<!--          <img src="../assets/img/nodeIcon2.svg" alt="">-->
          <i class="iconfont icon-zhiya"></i>
          <span>{{$t('nav.staking')}}</span>
        </router-link>
        <router-link active-class="active-li" tag="li" :to="{name:'swap'}">
<!--          <img src="../assets/img/nodeIcon3.svg" alt="">-->
          <i class="iconfont icon-shandui"></i>
          <span>{{$t('nav.convert')}}</span>
        </router-link>
        <router-link active-class="active-li" tag="li" :to="{name:'address'}">
<!--          <img src="../assets/img/nodeIcon3.svg" alt="">-->
          <i class="iconfont icon-shezhi"></i>
          <span>{{$t('nav.manage')}}</span>
        </router-link>
      </ul>
    </div>
  </div>
</template>

<script>
  import nerve from 'nerve-sdk-js'
  import {divisionDecimals} from '@/api/util'

  export default {
    data() {
      return {
        heightInfo: [],//高度信息
        failedNu: 0,//失败请次数
      }
    },
    created() {
      this.getHeaderInfo();
    },
    mounted() {
      setInterval(() => {
        this.getAddressInfo();
      }, 10000);

      setInterval(() => {
        this.getHeaderInfo();
      }, 2000);
    },
    watch: {
      //监控高度，五次高度变化异常则提示切换节点
      heightInfo(val) {
        //console.log(val);
        if (this.$route.path !== '/nodeService' && this.failedNu !== 50) {
          if (val.localHeight === 0 && val.networkHeight === 0) {
            this.failedNu = this.failedNu + 1
          } else {
            this.failedNu = 0
          }
          if (this.failedNu === 50) {
            this.$confirm(this.$t('bottom.err0'), {
              confirmButtonText: this.$t('bottom.err1'),
              cancelButtonText: this.$t('bottom.err2'),
              type: 'error',
              showClose: false,
              closeOnClickModal: false,
              closeOnPressEscape: false,
            }).then(() => {
              this.toUrl('nodeService');
            }).catch(() => {
              location.reload();
            });
          }
        }
      }
    },
    methods: {

      /**
       * 获取主网最新高度和本地高度
       */
      getHeaderInfo() {
        this.$post('/', 'getInfo', [])
          .then((response) => {
            //console.info(response);
            if (response.hasOwnProperty("result")) {
              this.heightInfo = response.result;
              sessionStorage.setItem("info", JSON.stringify(response.result))
            } else {
              this.heightInfo = {localHeight: 0, networkHeight: 0};
              sessionStorage.removeItem("info")
            }
          })
          .catch((error) => {
            sessionStorage.removeItem("info");
            this.heightInfo = {localHeight: 0, networkHeight: 0};
            console.log("getInfo:" + error)
          })
      },

      /**
       * 更新当前选择地址网络信息
       **/
      async getAddressInfo() {
        let addressInfos = this.$store.getters.getSelectAddress;
        let addressList = this.$store.state.addressInfo;
        if (addressInfos) {
          await this.$post('/', 'getAccount', [addressInfos.address], 'BottomBar')
            .then((response) => {
              //console.log(response);
              if (response.hasOwnProperty("result")) {
                for (let item of addressList) {
                  if (item.address === addressInfos.address) {
                    item.alias = response.result.alias;
                    item.balance = divisionDecimals(response.result.balance);
                    item.consensusLock = divisionDecimals(response.result.consensusLock);
                    item.totalReward = divisionDecimals(response.result.totalReward);
                    if (response.result.lastReward) {
                      item.lastReward = divisionDecimals(response.result.lastReward);
                    } else {
                      item.lastReward = 0;
                    }
                    item.tokens = [];
                    item.chainId = nerve.verifyAddress(item.address).chainId;
                  }
                }
                const canUpdate = this.$store.getters.canUpdateAccountList;
                if (canUpdate) {
                  this.$store.commit('setAddressInfo', addressList)
                }
              }
            })
        }
      },

      /**
       * 连接跳转
       * @param name
       */
      toUrl(name) {
        this.$router.push({
          name: name
        })
      },
    }
  }
</script>

<style lang="less">
  @import "./../assets/css/style";

  .bottom {
    height: 60px;
    border-top: 1px solid @Dcolour;
    position: fixed;
    line-height: 60px;
    bottom: 0;
    background-color: @Bcolour;
    width: 100%;
    z-index: 99;
    .w1200 {
      .left {
        width: 50%;
        line-height: 60px;
      }
      .right {
        width: 40%;
        line-height: 60px;
        text-align: right;
        label {
          padding: 0 10px;
        }
      }
    }

  }

  .el-message-box__wrapper {
    .el-message-box {
      .el-message-box__btns {
        .el-button--default {
          color: #FFF;
          background-color: #409EFF;
          border-color: #409EFF;
        }
        .el-button--primary {
          background: #FFF;
          border: 1px solid #DCDFE6;
          color: #606266;
        }
      }
    }
  }
  .bottom-mobile {
    display: none;
  }
  @media screen and (max-width: 1200px) {
    .bottom {
      display: none;
    }
    .bottom-mobile {
      display: block;
      height: 44px;
      border-top: 1px solid @Dcolour;
      position: fixed;
      bottom: 0;
      background-color: @Bcolour;
      width: 100%;
      z-index: 9999;
      ul {
        display: flex;
        height: 100%;
      }
      li {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        img {
          display: block;
          width: 18px;
        }
        .iconfont {
          font-size: 18px;
        }
        span {
          font-size: 12px;
        }
        &.active-li {
          color: #2688f7;
        }
      }
    }
  }
  @supports (bottom: env(safe-area-inset-bottom)){
    .bottom-mobile{
      box-sizing: content-box;
      padding-bottom: constant(safe-area-inset-bottom);
      padding-bottom: env(safe-area-inset-bottom);
      padding-bottom: var(safe-area-inset-bottom);
    }
  }
</style>
