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
          <el-button @click="searchList">{{ $t("public.filter") }}</el-button>
        </div>
        <tx-list :list="txList" @toDetail="toTxDetail" :total="txTotal" :loading="txLoading"
                  @loadMoreTx="getTxList">
        </tx-list>
      </div>
    </div>
  </div>
</template>

<script>
import BackBar from '@/components/BackBar'
import TxList from "@/components/TxList";
import { superLong, supportChainList } from '@/api/util'

export default {
  data () {
    this.chainList = supportChainList
    return {
      loading: true,
      fromChain: "", //发起网络
      toChain: "", //接收网络
      txLoading: false,
      txList: [],
      txTotal: 5,
      pageNumber: 1,
      pageSize: 10
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
    const accountList = JSON.parse(sessionStorage.getItem("accountList")) || [];
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
      this.txLoading = true;
      if ((this.pageNumber - 1) * this.pageSize > this.txTotal) {
        this.txLoading = false;
        return;
      }
      // this.txList = [];
      const addressObj = this.currentAccount.address;
      const data = {
        fromChain: this.fromChain,
        toChain: this.toChain,
        addressList: [addressObj.BSC, addressObj.NERVE, addressObj.NULS],
        pageSize: this.pageSize,
        pageNumber: this.pageNumber++
      }
      const res = await this.$request({
        url: "/tx/bridgeTx/list",
        data
      });
      if (res.code === 1000) {
        res.data.records.map(v=> v.createTime = v.createTime.substring(5))
        this.txList = res.data.records;
        this.txTotal = res.data.total;
        this.txLoading = false;
      }
      this.loading = false;
    },
    searchList() {
      this.pageNumber = 1;
      this.txTotal = 0;
      this.txList = [];
      this.getTxList();
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
      this.getTxList();
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