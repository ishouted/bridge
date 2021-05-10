<template>
  <div class="header">
    <div class="left">
      <img src="../assets/img/NVT.png" alt="">
      NerveBridge
    </div>
    <div class="right" v-if="address">
      <div class="address" @click="showAccountDialog=true">
        <!-- <span class="network"> {{ network }} </span> -->
        <span>{{ superLong(address, 5) }}</span>
      </div>
      <span @click="showMenu=true" class="iconfont icon-menu"></span>
    </div>
    <transition name="drawer-fade">
      <div class="nav-menu" v-show="showMenu">
        <transition name="model">
          <div class="model" v-show="showMenu" @click="toggleMenu"></div>
        </transition>
        <div class="content" :class="showMenu ? 'show' : 'hide'">
          <div class="account">
            <ul class="menu-wrap">
              <li @click="toUrl('txList')">
                <i class="iconfont icon-jiaoyijilu"></i>
                <span>{{ $t("header.header1") }}</span>
              </li>
              <li @click="toUrl('accounts')">
                <i class="iconfont icon-wangluozhanghu"></i>
                <span>{{ $t("header.header2") }}</span>
              </li>
              <li>
                <a href="https://forms.gle/XFMrcYQLhapYyLaSA" target="_blank">
                  <i class="iconfont icon-zichanshangjia"></i>
                  <span>{{ $t("header.header3") }}</span>
                </a>
              </li>
              <li>
               <a href="https://drive.google.com/drive/folders/13gk5XzfJmCUyRCmoleWH47REUOyGc4yo" target="_blank">
                  <i class="iconfont icon-shenjibaogao"></i>
                  <span>{{ $t("header.header4") }}</span>
               </a>
              </li>
            </ul>
          </div>
          <div class="network">
            <p class="label">{{ $t("header.header5") }}</p>
            <el-radio-group v-model="currentChain" @change="toggleMenu">
              <el-radio-button
                v-for="item in supportChainList"
                :key="item.value"
                :label="item.value"
              >
              {{ item.label }}
              </el-radio-button>
            </el-radio-group>
          </div>
          <div class="bottom-wrap">
            <div class="community">
              <a href="https://t.me/NerveNetwork" target="_blank">
                <img src="../assets/img/Telegram.svg" alt="">
              </a>
              <a href="https://discord.gg/PBkHeD7" target="_blank">
                <img src="../assets/img/Discord.svg" alt="">
              </a>
            </div>
            <div class="language clicks" @click="lang=lang==='cn' ? 'en' : 'cn'">
              <span class="iconfont icon-yuyan"></span>
              {{ lang === "cn" ? "EN" : "中文" }}
            </div>
          </div>
        </div>
        
      </div>
    </transition>
    <el-dialog
      title="账户"
      :visible.sync="showAccountDialog"
      :modal-append-to-body="false"
      class="account-dialog"
      width="80%">
      <div class="content tc">
        <div class="address">
          {{superLong(address, 6)}}
          <i class="iconfont icon-lianjie" @click="openUrl"></i>
          <i class="iconfont icon-fuzhi1" @click="copy(address)"></i>
        </div>
        <el-button @click="quit">{{ $t("header.header8") }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
  import { superLong, copys, networkOrigin, supportChainList } from '@/api/util'

  export default {
    data() {
      this.supportChainList = supportChainList;
      return {
        showMenu: false,
        currentChain: this.$store.state.network,
        lang: localStorage.getItem("lang") || "cn",
        showAccountDialog: false,
      };
    },
    props: {
      address: String
    },
    components: {
    },
    watch: {
      '$store.state.network': {
        handler(val) {
          this.currentChain = val
        }
      },
      currentChain(val) {
        this.$store.commit("changeNetwork", val)
      },
      lang(val) {
        if (val) {
          this.$i18n.locale = val;
          localStorage.setItem("lang", val)
          this.toggleMenu();
        }
      }
    },
    created() {
    },
    mounted() {
    },
    methods: {
      superLong(str, len = 8) {
        return superLong(str, len)
      },
      toggleMenu() {
        this.showMenu = !this.showMenu
      },

      /**
       * 连接跳转
       * @param name
       */
      toUrl(name) {
        this.$router.push({
          name,
          query: { address: this.address }
        })
      },
      openUrl() {
        const baseUrl = networkOrigin[this.currentChain];
        let url;
        if (this.currentChain !== "NERVE" && this.currentChain !== "NULS") {
          url = baseUrl + "/address/" + this.address;
        } else {
          url = baseUrl + "/address/info?address=" + this.address
        }
        window.open(url)
        this.showAccountDialog = false
      },
      copy(str) {
        copys(str)
        this.$message({message: this.$t('public.copySuccess'), type: 'success', duration: 1000});
        this.showAccountDialog = false
      },
      quit() {
        this.$emit("quit")
        this.showAccountDialog = false;
      },
      openLink(url) {
        window.open(url)
      }
    },
  }
</script>

<style lang="less">
  @import "./../assets/css/style";
  .header {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    border-bottom: 1px solid #EBF0F3;
    background-color: #fff;
    img {
      width: 34px;
      height: 34px;
      margin-right: 5px;
    }
    .left, .right {
      display: flex;
      align-items: center;
    }

    .right {
      .address {
        // width: 170px;
        width: 150px;
        height: 32px;
        line-height: 32px;
        padding: 0 10px;
        background-color: #EBEEF8;
        color: #5BCAF9;
        font-weight: bold;
        font-size: 14px;
        border-radius: 18px;
        text-align: center;
        margin-right: 12px;
        cursor: pointer;
        .network {
          font-size: 15px;
          color: #99A3C4;
          &::before {
            content: " ";
            display: inline-block;
            vertical-align: middle;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            margin: 0 2px;
            background-color: #5BCAF9;
          }
        }
      }
      .icon-menu {
        cursor: pointer;
        font-size: 24px;
        color: #515B7D;
      }
    } 
    .nav-menu {
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
      overflow: hidden;
      z-index: 9;
      .model {
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        opacity: 0.46;
        background-color: rgb(33, 33, 33);
      }
      .content {
        &.show {
          animation: rtl-drawer-in .3s;
        }
        animation: rtl-drawer-out .3s;
        background-color: #fff;
        position: absolute;
        width: 210px;
        height: 100%;
        right: 0;
        top: 0;
        padding-top: 15px;
        // padding: 30px 20px 20px;
        .menu-wrap {
          li {
            padding: 15px 20px;
            cursor: pointer;
            line-height: 1;
            .iconfont {
              margin-right: 10px;
              font-size: 18px;
            }
            &:hover {
              background-color: rgb(239, 244, 245);
            }
          }
        }
      }
      .network {
        padding: 10px 20px 0;
        .label {
          color: #99A3C4;
          font-size: 12px;
          margin-bottom: 5px;
        }
        .el-radio-group {
          .el-radio-button {
            margin: 0 5px 5px 0;
            &.is-active .el-radio-button__inner {
              box-shadow: none;
              // border-color: #409EFF;
               background-color: #409EFF;
              color: #fff;
            }
          }
          .el-radio-button__inner {
            // border: 1px solid #DCDFE6;
            border-radius: 10px;
            font-size: 12px;
            width: 80px;
            height: 35px;
            line-height: 35px;
            padding: 0;
            color: #515E7B;
            background-color: #EBEEF8;
            border: none;
            &:hover {
              color: #409EFF;
            }
          }
        }
      }
      .bottom-wrap {
        display: flex;
        align-items: center;
        margin-top: 40px;
        padding: 0 20px;
        .community, .language {
          display: flex;
          align-items: center;
        }
        img {
          width: 22px;
          height: 22px;
          margin-right: 20px;
          cursor: pointer;
          vertical-align: middle;
          &:hover {
            opacity: 0.65;
          }
        }
        .language {
          cursor: pointer;
          &:hover {
            opacity: 0.65;
          }
        }
        .icon-yuyan {
          font-size: 22px;
          margin-right: 5px;
          margin-left: 10px;
        }
      }
    }
    /* .account-dialog {
      position: absolute;
    }
    .v-modal {
      position: absolute;
    } */
    .account-dialog {

      .address {
        color: #5BCAF9;
        font-size: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        .iconfont {
          margin-left: 25px;
          font-size: 20px;
          color: #515B7D;
          cursor: pointer;
        }
      }
      .el-button {
        // width: 80px;
        // height: 34px;
        padding: 12px 30px;
        border-color: #5BCAF9;
        color: #5BCAF9;
        border-radius: 10px;
      }
    }
  }
  .drawer-fade-enter-active,.drawer-fade-leave-active {
    transition: opacity 0.3s
  }

  .drawer-fade-enter, .drawer-fade-leave-to {
    opacity: 0;
  }

  .model-enter-active,.model-leave-active {
    transition: opacity 0.2s
  }

  .model-enter, .model-leave-to {
    opacity: 0;
  }

  @keyframes rtl-drawer-in {
    0% {
      transform: translateX(100%);
    }
    100% {
      transform: translateX(0%);
    }
  }
  @keyframes rtl-drawer-out {
    0% {
      transform: translateX(0%);
    }
    100% {
      transform: translateX(100%);
    }
  }

</style>
