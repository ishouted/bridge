<template>
  <div class="tx-list second-page">
    <back-bar :backTitle="$t('txList.txList1')"></back-bar>
    <div class="content" v-loading="loading">
      <div class="content-inner">
        <div class="search">
          <el-select v-model="fromChain" clearable :placeholder="$t('txList.txList2')">
            <el-option
              v-for="item in chainList"
              :key="item.value"
              :disabled="item.value === toChain"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
          <el-select v-model="toChain" clearable :placeholder="$t('txList.txList3')">
            <el-option
              v-for="item in chainList"
              :key="item.value"
              :disabled="item.value === fromChain"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
          <el-button @click="getTxList">{{ $t("public.filter") }}</el-button>
        </div>
        <tx-list :list="txList" @toDetail="toTxDetail" :total="txTotal" :loading="txLoading"
                  @loadMoreTx="loadMoreTx">
        </tx-list>
      </div>
    </div>
  </div>
</template>

<script>
import BackBar from '@/components/BackBar'
import TxList from "@/components/TxList";
import { superLong } from '@/api/util'

export default {
  data () {
    this.chainList = [
      { label: "NERVE", value: "NERVE" },
      { label: "NULS", value: "NULS" },
      { label: "Ethereum", value: "Ethereum" },
      { label: "BSC", value: "BSC" },
      { label: "Heco", value: "Heco" },
    ]
    return {
      loading: true,
      fromChain: "", //发起网络
      toChain: "", //接收网络
      txLoading: false,
      txList: [],
      txTotal: 5,
      
    }
  },

  components: {
    BackBar,
    TxList
  },

  watch: {},

  computed: {},

  created() {
    const address = this.$route.query.address;
    const network = sessionStorage.getItem("network");
    const accountList = JSON.parse(localStorage.getItem("accountList")) || [];
    this.currentAccount = accountList.filter(item => {
      return item.address[network] === address
    })[0]
    this.getTxList();
  },

  mounted() {},

  methods: {
    superLong(str, len = 5) {
      return superLong(str, len);
    },
    async getTxList() {
      this.loading = true;
      this.txList = [];
      const addressObj = this.currentAccount.address;
      const data = {
        fromChain: this.fromChain,
        toChain: this.toChain,
        addressList: [addressObj.BSC, addressObj.NERVE, addressObj.NULS]
      }
      const res = await this.$request({
        url: "/tx/bridgeTx/list",
        data
      });
      if (res.code === 1000) {
        this.txList = res.data
      }
      this.loading = false;
    },
    toTxDetail(txData) {
      this.$router.push({
        path: "/tx-detail",
        query: {
          txHash: txData.txHash,
        }
      })
      // console.log(456)
    },
    loadMoreTx() {
      // console.log(123)
    }
  }
}

</script>
<style lang="less">
.tx-list {
  .content {
    height: 390px;
  }
  .content-inner {
    height: calc(100% - 15px);
    .search {
      display: flex;
      align-items: center;
      .el-select {
        width: 120px;
        height: 34px;
        margin-right: 20px;
      }
      .el-input__inner {
        height: 34px;
        line-height: 34px;
        border-radius: 4px;
        border-color: #EBEEF8;
      }
      .el-button {
        width: 80px;
        height: 34px;
        padding: 0;
        border-color: #5BCAF9;
        color: #5BCAF9;
        border-radius: 4px;
      }
      @media screen and (max-width: 1200px) {
        .el-select {
          width: auto;
          margin-right: 10px;
        }
        .el-input__inner {
          font-size: 13px;
        }
      }
    }
  }
}
</style>