<template>
  <div class="tx-list">
    <ul class="list" v-infinite-scroll="load" infinite-scroll-disabled="disabled">
      <li v-for="(item,index) in oldList" :key="index" @click="handleClick(item)">
        <div class="top">
          <div class="chain">
            <span>{{item.fromChain }}</span>
            <i class="iconfont icon-to"></i>
            <span>{{ item.toChain }}</span>
          </div>
          <div class="amount">
            {{ parseFloat(item.amount) }} {{ item.symbol }}
          </div>
        </div>
        <div class="bottom">
          <div class="time">{{ item.createTime }}</div>
          <div class="status">
            <!-- {{ getTxStatus(item.status) }} -->
            <img src="../assets/img/tx-pending.svg" alt="" v-if="checkStatus(item.status)">
          </div>
        </div>
      </li>
    </ul>
    <p class="load-tip" v-if="loading">{{$t('public.loading')}}...</p>
    <p class="load-tip" v-if="noMore">{{$t('public.noMore')}}</p>
  </div>
</template>

<script>
  import {superLong, tofix} from "@/api/util";

  export default {
    props: {
      list: {
        type: Array,
        default: () => []
      },
      loading: {
        type: Boolean,
        default: true
      },
      total: [String, Number]
    },
    data() {
      // this.failStatus = [4, 7, 9]
      return {
        oldList: [],
      }
    },
    computed: {
      noMore() {
        return this.oldList.length && this.oldList.length >= this.total;
      },
      disabled() {
        return this.loading || this.noMore;
      }
    },
    watch: {
      "list": function (val) {
        if (val.length !== 0) {
          for (let item of val) {
            item.amount = tofix(item.amount, 6, 1)
          }
          if (this.oldList.length !== 0) {
            this.oldList = [...this.oldList, ...val];
          } else {
            this.oldList = val;
          }
        }else{
          this.oldList = [];
        }
        // console.log(this.oldList);
      }
    },
    methods: {

      superLong(str, len = 5) {
        return superLong(str, len);
      },

      handleClick(item) {
        this.$emit("toDetail", item);
      },

      load() {
        this.$emit("loadMoreTx");
      },
      checkStatus(status) {
        const hideStatus = [8, 4, 7, 9]
        // console.log(status, hideStatus.indexOf(status), 52)
        return hideStatus.indexOf(status) < 0
      },
      // getTxStatus(status) {
      //   const failStatus = [4, 7, 9]
      //   if (status === 8) {
      //     return this.$t("txList.txList6")
      //   } else if (failStatus.indexOf(status) > -1) {
      //     return this.$t("txList.txList5")
      //   } else {
      //     return this.$t("txList.txList4")
      //   }
      // }
    }
  }

</script>

<style lang="less" scoped>
  .tx-list {
    overflow: auto;
    // height: 100%;
    height: calc(100% - 30px);
    ul {
      margin-top: 20px;
      border-top: 1px solid #E9EBF3;
    }
    li {
      // height: 82px;
      padding: 12px 0;
      cursor: pointer;
      border-bottom: 1px solid #E9EBF3;
      &:last-child {
        border-bottom: none;
      }
      .top, .bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .top {
        .chain {
          span {
            font-size: 16px;
          }
          i {
            display: inline-block;
            margin: 0 5px;
            font-size: 26px;
            color: #99A3C4;
          }
        }
        .amount {
          font-size: 15px;
        }
      }
      .bottom {
        margin-top: 5px;
        .time {
          font-size: 12px;
          color: #99A3C4
        }
        .icon-queren1 {
          font-size: 20px;
          color: #5BC9F8
        }
        .icon-shibai {
          font-size: 20px;
          color: red
        }
      }
    }
    .load-tip {
      color: #53b8a9;
      font-size: 12px;
      text-align: center;
      margin-top: 10px;
    }
  }
</style>
