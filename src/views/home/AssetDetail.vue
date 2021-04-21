<template>
  <div class="asset-detail">
    <h3><img :src="asset.icon" alt="" class="coin-img"><span>{{asset.name}}</span></h3>
    <div class="detail">
      <p>{{$t('tab.tab37')}}<span class="fr">{{asset.number}}</span></p>
      <p>{{$t('tab.tab4')}}<span class="fr">{{asset.available}}</span></p>
      <p>{{$t('tab.tab3')}}<span class="fr">{{asset.locking}}</span></p>
      <p>{{$t('tab.tab38')}}<span class="fr">${{asset.valuation | toThousands}}</span></p>
    </div>
    <div class="btn-wrap">
      <el-button @click="inChains(asset)" v-if="showCrossHandle">
        {{$t('home.home3')}}
      </el-button>
      <el-button @click="crossLink(asset)">{{$t('home.home4')}}</el-button>
      <el-button @click="withdrawal(asset)" v-if="showCrossHandle">
        {{$t('home.home5')}}
      </el-button>
    </div>
    <Recharge ref="recharge" :changeAssetInfo="asset" v-if="showRecharge" @destroyDialog="showRecharge=false">
    </Recharge>
  </div>
</template>

<script>
  import Recharge from './Recharge'

  export default {
    name: "",
    data() {
      return {
        asset: {},
        showRecharge: false
      }
    },
    components: {
      Recharge
    },
    computed: {
      showCrossHandle() {
        const showArr = [4, 5, 6, 7, 8, 9];
        return showArr.indexOf(this.asset.source) > -1
      }
    },
    created() {
      const {asset} = this.$route.query;
      this.asset = JSON.parse(decodeURIComponent(asset))
    },
    mounted() {
    },
    methods: {
      //充值
      async inChains() {
        this.showRecharge = true;
        this.$nextTick(() => {
          this.$refs.recharge.showRechargeDialog(true);
        })
      },

      //转账
      crossLink(row) {
        sessionStorage.setItem('transferParams', JSON.stringify(row));
        this.$router.push({
          name: 'transfer',
        })
      },

      //提现
      withdrawal(row) {
        sessionStorage.setItem('rowInfo', JSON.stringify(row));
        this.$router.push({
          name: 'withdrawal',
        })
      },
    }

  }
</script>

<style lang="less">
  .asset-detail {
    padding: 0.24rem;
    h3 {
      text-align: center;
      margin-bottom: 0.6rem;
      img {
        width: 0.8rem;
        vertical-align: middle;
        margin-right: 20px;
        & + span {
          font-size: 0.36rem;
          vertical-align: middle;
        }
      }
    }
    .detail {
      padding: 0 0.4rem;
      margin-bottom: 2rem;
      p {
        font-size: 0.32rem;
        height: 0.6rem;
        line-height: 0.6rem;
        span {
          font-size: 0.32rem;
        }
      }
    }
    .btn-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      .el-button {
        max-width: 48%;
        flex: 1;
      }
    }
  }
</style>
