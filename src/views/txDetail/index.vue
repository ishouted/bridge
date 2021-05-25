<template>
  <div class="tx-detail second-page">
    <back-bar :backTitle="$t('txDetail.txDetail1')"></back-bar>
    <div class="content" v-loading="loading">
      <div class="content-inner" v-if="!isSwftDetail">
        <div 
          class="status tc"
          :class="status">
          <div class="status-icon">
            <!-- <i class="iconfont icon-queren"></i> -->
            <img src="../../assets/img/detail-success.svg" alt="" v-if="txInfo.status === 8">
            <img src="../../assets/img/detail-fail.svg" alt="" v-else-if="failStatus.indexOf(txInfo.status) > -1">
            <img src="../../assets/img/detail-pending.svg" alt="" v-else>
          </div>
          <span>{{ $t("crossStatusType." + txInfo.status) }}</span>
        </div>
        <div class="amount">
          {{txInfo.amount}} {{txInfo.symbol}}
        </div>
        <div class="other-info">
          <!-- <p class="info-item">
            <span class="left">手续费</span>
            <span class="right">88NVT</span>
          </p> -->
          <p class="info-item">
            <span class="left">{{ $t("public.time") }}</span>
            <span class="right">{{txInfo.createTime}}</span>
          </p>
        </div>
        <div class="network-info">
          <p class="info-item" v-for="(item, index) in hashList" :key="index">
            <span class="left">{{ item.label }}</span>
            <span class="right">
              <span class="clicks hover-bg" @click="copy(item.hash)">{{ superLong(item.hash) }}</span>
              <i class="iconfont icon-lianjie clicks" @click="openUrl(item.hash, item.chain)"></i>
            </span>
          </p>
        </div>
      </div>
      <div class="content-inner swft-detail" v-else>
        <div 
          class="status tc"
          :class="status">
          <div class="status-icon">
            <!-- <i class="iconfont icon-queren"></i> -->
            <img src="../../assets/img/detail-success.svg" alt="" v-if="swftSuccessStatus.indexOf(txInfo.detailState) > -1">
            <img src="../../assets/img/detail-fail.svg" alt="" v-else-if="swftFailStatus.indexOf(txInfo.detailState) > -1">
            <img src="../../assets/img/detail-pending.svg" alt="" v-else>
          </div>
          <span>{{ $t("swftStatusType." + txInfo.detailState) }}</span>
        </div>
        <div class="amount">
          <!-- {{txInfo.amount}} {{txInfo.symbol}} -->
          <span>{{ txInfo.depositCoinAmt }} {{ txInfo.depositCoinCode }}</span>
          <i class="iconfont icon-to"></i>
          <span>{{ txInfo.receiveCoinAmt }} {{ txInfo.receiveCoinCode }}</span>
        </div>
        <div class="other-info">
          <!-- <p class="info-item">
            <span class="left">手续费</span>
            <span class="right">88NVT</span>
          </p> -->
          <p class="info-item">
            <span class="left">{{ $t("public.time") }}</span>
            <span class="right">{{txInfo.createTime}}</span>
          </p>
          <p class="info-item">
            <span class="left">{{ $t("public.fee") }}</span>
            <span class="right">
              {{ txInfo.depositCoinFeeAmt }} {{ txInfo.depositCoinCode }} + 
              {{ txInfo.estimatedFee }} {{ txInfo.receiveCoinCode }}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/*---------------------bridge跨链交易状态-----------------------*/
/* 跨链交易本链未确认
int BG_CROSS_TX_LOCAL_UNCONFIRM = 0;
//跨链交易本链已确认
int BG_CROSS_TX_LOCAL_CONFIRM = 1;
//等待广播闪对交易
int BG_WAIT_BROAD_CONVERT = 2;
//闪对交易已广播待确认
int BG_CROSS_TX_CONVERT_UNCONFIRM = 3;
//闪对交易广播失败
int BG_CROSS_TX_CONVERT_FAIL = 4;
//等待广播nerve跨链交易
int BG_WAIT_BROAD_NERVE = 5;
//跨链交易NERVE链已广播待确认
int BG_CROSS_TX_NERVE_UNCONFIRM = 6;
//跨链交易NERVE链广播失败
int BG_CROSS_TX_NERVE_FAIL = 7;
//目标链最终确认
int BG_CROSS_TX_TARGET_CONFIRM = 8;
//跨链交易失败
int BG_CROSS_TX_FAIL = 9; */

/*---------------------swft跨链交易状态-----------------------*/
/* 
(1)wait_deposit_send:等待存币发送
(2)timeout:超时；
(3)wait_exchange_push:等待交换信息推送；
(4)wait_exchange_return:等待交换信息返回；
(5.1)wait_receive_send:等待接收币种发送, wait_receive_confirm:等待接收币种确认, receive_complete:接收币种确认完成.
(5.2)wait_refund_send:等待退原币币种发送, wait_refund_confirm:等待退原币币种确认, refund_complete:退原币币种确认完成；
(6)ERROR/error:正在处理的订单 
(7)WAIT_KYC: 等待进行KYC或联系客服提供链接
*/
import BackBar from '@/components/BackBar'
import { superLong, divisionAndFix, networkOrigin, copys } from '@/api/util'
import moment from "moment"
export default {
  data () {
    this.failStatus = [4, 7, 9];
    this.swftSuccessStatus = ["receive_complete"];
    this.swftFailStatus = ["timeout", "ERROR/error", "wait_refund_send", "wait_refund_confirm", "refund_complete", "WAIT_KYC"];
    this.swftPendingStatus = ["wait_deposit_send", "wait_exchange_push", "wait_exchange_return", "wait_receive_send", "wait_receive_confirm"];
    return {
      loading: true,
      txInfo: {},
      hashList: [],
      isSwftDetail: false
    }
  },

  components: {
    BackBar
  },

  watch: {},

  computed: {
    status() {
      const status = this.txInfo.status;
      if (status === 8) {
        return ""
      } else if (this.failStatus.indexOf(status) > -1) {
        return "fail"
      } else {
        return "pending"
      }
    }
  },

  created() {},

  mounted() {
    const {txHash, orderId} = this.$route.query;
    if (txHash) {
      this.isSwftDetail = false;
      this.getDetail();
      const timer = setInterval(() => {
        this.getDetail();
      }, 10000)
      this.$once("hook:beforeDestroy", () => {
        clearInterval(timer)
      })
    } else if (orderId) {
      this.isSwftDetail = true;
      this.getSwftDetail();
      const timer = setInterval(() => {
        this.getSwftDetail();
      }, 10000)
      this.$once("hook:beforeDestroy", () => {
        clearInterval(timer)
      })
    }
    
  },

  methods: {
    superLong(str, len = 5) {
      return superLong(str, len)
    },
    async getSwftDetail() {
      const {equipmentNo, orderId} = this.$route.query
      if (!equipmentNo || !orderId) {
        this.$message({message: "not fount", type: 'warning', duration: 2000});
        this.$router.push('/')
      }
      const res = await this.$request({
        url: "/orderinfo",
        data: {
          sourceType: "H5",
          orderId,
          equipmentNo
        }
      });
      if (res.msg === "success") {
        res.data.createTime = moment(res.data.createdDate).format("MM-DD HH:mm:ss")
        this.txInfo = res.data;
      }
      this.loading = false;
    },
    async getDetail() {
      const txHash = this.$route.query.txHash;
      const res = await this.$request({
        url: "/tx/bridge/tx",
        data: { txHash }
      })
      let hashList = [];
      if (res.code === 1000) {
        const data = res.data;
        this.txInfo = data;
        this.handleHash(data);
        hashList.push({
          chain: data.fromChain,
          label: data.fromChain + this.$t("transfer.transfer2"),
          hash: data.txHash
        })
        if (data.feeTxHash) {
          hashList.push({
            chain: data.fromChain,
            label: data.fromChain + this.$t("transfer.transfer2"),
            hash: data.txHash
          })
        }
      }
      this.loading = false;
    },
    // 每笔交易hash处理
    handleHash(data) {
      const { fromChain, toChain, txHash, feeTxHash, convertTxHash, nerveTxHash, crossTxHash } = data;
      let hashList = [];
      hashList.push({
        chain: fromChain,
        label: fromChain,
        hash: txHash
      })
      if (feeTxHash) {
        hashList = hashList.concat([
          { chain: fromChain, label: fromChain + this.$t("txDetail.txDetail2"), hash: feeTxHash }, // 转入闪兑手续费
          { chain: "NERVE", label: "NERVE" + this.$t("txDetail.txDetail3"), hash: convertTxHash } // nerve闪兑
        ])
      }
      if (nerveTxHash) {
        hashList.push(
          { chain: "NERVE",label: "NERVE",hash: nerveTxHash }
        )
      }
      hashList.push({
        chain: toChain,
        label: toChain,
        hash: crossTxHash
      })
      this.hashList = hashList;
    },
    copy(str) {
      copys(str)
      this.$message({message: this.$t('public.copySuccess'), type: 'success', duration: 1000});
    },
    openUrl(hash, chain) {
      const baseUrl = networkOrigin[chain];
      let url;
      if (chain !== "NERVE" && chain !== "NULS") {
        url = baseUrl + "/tx/" + hash;
      } else {
        url = baseUrl + "/transaction/info?hash=" + hash
      }
      window.open(url)
    }
  }
}

</script>
<style lang="less">
.tx-detail {
  .content-inner {
    position: relative;
    margin-top: 20px;
    .status span {
      font-size: 14px;
      color: #18CCB1;
      padding: 10px 0;
      display: inline-block;
    }
    .status-icon {
      position: absolute;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      left: 50%;
      transform: translateX(-50%);
      top: -25px;
      img {
        width: 100%;
        height: 100%;
      }
    }
    .amount {
      font-size: 24px;
      text-align: center;
      margin-bottom: 30px;
    }
    .info-item {
      font-size: 14px;
      display: flex;
      align-content: center;
      justify-content: space-between;
      margin-bottom: 25px;
      .left {
        color: #99A3C4;
        width: 60px;
      }
      .right {
        text-align: right;
      }
    }
    .network-info {
      padding-top: 25px;
      border-top: 1px solid #CED3E5;
      .right {
        cursor: pointer;
      }
      .iconfont {
        margin-left: 10px;
      }
    }
  }
  .swft-detail {
    .amount {
      font-size: 17px;
      .icon-to {
        margin: 0 10px;
        font-size: 26px;
        color: #99A3C4;
      }
    }
  }
}
</style>