<template>
  <div class="swft-swap">
    <div class="tip">{{ $t("home.home15") }}</div>
    <div class="amount">
      <div class="label-wrap">
        <span class="label">From</span>
        <span>{{ $t("home.home3") }} {{ available }}</span>
      </div>
      <el-input
        class="amount-inner"
        placeholder="0.0"
        :value="amount"
        @input="validateAmount"
        @change="getTransferFee"
      >
        <span
          class="select-asset-btn fw"
          slot="prepend"
          @click="assetListModal = true"
        >
          <template v-if="!chooseAsset">
            <span>{{ $t("home.home6") }}</span>
          </template>
          <template v-else>
            <!-- <span> -->
            <img
              :src="getLogoSrc(chooseAsset.symbol)"
              @error="replaceImg"
              alt=""
            />
            {{ chooseAsset.symbol }}<span class="origin-chain">{{ "(" + chooseAsset.registerChain + ")" }}</span>
            <!-- {{ chooseAsset.symbol + "(" + chooseAsset.registerChain + ")" }} -->
            <!-- </span> -->
          </template>
          <i class="el-icon-caret-bottom fw"></i>
        </span>
        <el-button slot="append">MAX</el-button>
      </el-input>
    </div>
    <div class="swap-icon">
      <span>
        <i class="el-icon-bottom"></i>
      </span>
      
    </div>
    <div class="amount">
      <div class="label-wrap">
        <span class="label">To</span>
      </div>
      <el-input
        class="amount-inner"
        placeholder="--"
        disabled
        :value="amount"
      >
        <span
          class="select-asset-btn fw"
          slot="prepend"
          @click="assetListModal = true"
        >
          <template v-if="!chooseAsset">
            <span>{{ $t("home.home6") }}</span>
          </template>
          <template v-else>
            <!-- <span> -->
            <img
              :src="getLogoSrc(chooseAsset.symbol)"
              @error="replaceImg"
              alt=""
            />
            {{ chooseAsset.symbol }}<span class="origin-chain">{{ "(" + chooseAsset.registerChain + ")" }}</span>
            <!-- {{ chooseAsset.symbol + "(" + chooseAsset.registerChain + ")" }} -->
            <!-- </span> -->
          </template>
          <i class="el-icon-caret-bottom fw"></i>
        </span>
        <!-- <el-button slot="append">MAX</el-button> -->
      </el-input>
    </div>
    <div class="to-address">
      <span class="label">{{ $t("home.home16") }}</span>
      <div class="address-inner">
        <span class="network">
          {{ fromNetwork }}
        </span>
        {{ superLong(fromAddress) }}
      </div>
    </div>
    <div class="swap-rate">
      1 USDT≈0.00244 ETH
    </div>
    <fee-wrap>
      <div class="fee-inner">
        <span v-if="!fee">--</span>
        <!-- <img v-if="!fee" src="../../assets/img/loading.svg" alt="" /> -->
        <div v-else>
          {{ fee }}
          <el-checkbox v-model="speedUpFee" v-if="showSpeedUp">
            {{ $t("home.home11") }}
          </el-checkbox>
        </div>
      </div>
    </fee-wrap>
    <div class="btn-wrap tc">
      <el-button type="primary" :disabled="!canNext" @click="next">{{
        $t("public.next")
      }}</el-button>
    </div>
  </div>
</template>

<script>
import {
  superLong,
  divisionDecimals,
  Minus,
  Plus,
  timesDecimals,
  getLogoSrc,
  Times,
  supportChainList
} from "@/api/util";
import FeeWrap from "@/components/FeeWrap"
export default {
  data () {
    return {
    }
  },

  components: {
    FeeWrap
  },

  watch: {},

  computed: {},

  created() {},

  mounted() {},

  methods: {
    superLong(str, len = 8) {
      return superLong(str, len);
    },
  }
}

</script>
<style lang="less">
.swft-swap {
  .tip {
    padding: 12px;
    margin-bottom: 15px;
    color: #5BCAF9;
    background-color: #F0FBFF;
    font-size: 14px;
    border-radius: 8px;
  }
  .swap-icon {
    margin: 15px 0 5px;
    text-align: center;
    span {
      display: inline-block;
      background-color: #515B7C;
      width: 20px;
      height: 20px;
      line-height: 20px;
      border-radius: 50%;
      i {
        color: #fff;
      }
    }
  }
  .amount {
    .el-input.is-disabled .el-input__inner {
      cursor: auto;
    }
  }
  .to-address {
    margin-top: 15px;
    .label {
      font-size: 12px;
      color: #99a3c4;
      margin-bottom: 6px;
      line-height: 1;
      display: inline-block;
    }
    .address-inner {
      height: 54px;
      background-color: #ebeef8;;
      border-radius: 10px;
      display: flex;
      align-items: center;
    }
  }
  .swap-rate {
    text-align: center;
    color: #515E7B;
    font-size: 13px;
    margin: 10px 0;
  }
}
</style>