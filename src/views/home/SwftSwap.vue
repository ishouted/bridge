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
          @click="showDialog('from')"
        >
          <template v-if="!chooseFromAsset">
            <span>{{ $t("home.home6") }}</span>
          </template>
          <template v-else>
            <!-- <span> -->
            <img
              class="logo-img"
              :src="getLogoSrc(chooseFromAsset.symbol)"
              @error="replaceImg"
              alt=""
            />
            <div class="asset-info-wrap">
              <span>{{ chooseFromAsset.symbol }}</span>
              <span class="origin-chain">{{ chooseFromAsset.chain }}</span>
            </div>
          </template>
          <i class="el-icon-caret-bottom fw"></i>
        </span>
        <el-button slot="append" @click="maxAmount">MAX</el-button>
      </el-input>
    </div>
    <div class="msg-wrap">
      <span class="from-validate-msg" v-show="amountMsg || fromNetworkMsg">{{
        amountMsg || fromNetworkMsg
      }}</span>
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
        :value="toAmount"
      >
        <div
          class="select-asset-btn fw"
          slot="prepend"
          @click="showDialog('to')"
        >
          <template v-if="!chooseToAsset">
            <span>{{ $t("home.home6") }}</span>
          </template>
          <template v-else>
            <!-- <span> -->
            <img
              class="logo-img"
              :src="getLogoSrc(chooseToAsset.symbol)"
              @error="replaceImg"
              alt=""
            />
            <div class="asset-info-wrap">
              <span>{{ chooseToAsset.symbol }}</span>
              <span class="origin-chain">{{ chooseToAsset.chain }}</span>
            </div>
          </template>
          <i class="el-icon-caret-bottom fw"></i>
        </div>
      </el-input>
    </div>
    <div class="to-address">
      <span class="label">{{ $t("home.home16") }}</span>
      <div class="address-inner">
        <span class="network">
          {{ toNetwork }}
        </span>
        {{ superLong(toAddress) }}
      </div>
    </div>
    <div class="swap-rate" v-if="swapRate&&chooseFromAsset&&chooseToAsset">

      1 {{chooseFromAsset.symbol}}≈{{swapRate}} {{chooseToAsset.symbol}}
    </div>
    <div class="btn-wrap tc">
      <el-button type="primary" :disabled="!canNext" @click="next">
        {{ $t("public.next") }}
      </el-button>
    </div>
    <el-dialog
      :title="$t('home.home6')"
      :visible.sync="assetListModal"
      :modal-append-to-body="false"
      width="80%"
      top="10vh"
      class="assets-list-dialog"
    >
      <ul v-if="dialogCoinList.length">
        <li
          v-for="item in dialogCoinList"
          :key="item.coinId"
          @click="selectAsset(item)"
          :class="checkActive(item)"
        >
          <div class="logo-wrap">
            <img :src="getLogoSrc(item.symbol)" @error="replaceImg" alt="" />
          </div>
          <div class="asset-info">
            <p>{{ item.symbol }}<span>{{"(" + item.chain + ")"}}</span></p>
            <span
              v-if="item.contact && item.contact.length > 20"
            >
              {{ $t("home.home9") + superLong(item.contact) }}
            </span>
          </div>
        </li>
      </ul>
      <p class="no-data" v-else>No Data</p>
    </el-dialog>
    <el-dialog
      :title="$t('home.home19')"
      :visible.sync="confirmModal"
      :modal-append-to-body="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      width="80%"
      top="10vh"
      class="confirm-dialog"
    >
      <div v-if="canNext" v-loading="feeLoading">
        <div class="wrap">
          <span class="label">{{ $t("home.home17") }}</span>
          <div class="inner">
            <span class="left">
              {{ amount }}
            </span>
            <div class="right">
              <img
                class="logo-img"
                :src="getLogoSrc(chooseFromAsset.symbol)"
                @error="replaceImg"
                alt=""
              />
              <div class="asset-info-wrap">
                <span>{{ chooseFromAsset.symbol }}</span>
                <span class="origin-chain">{{ chooseFromAsset.chain }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="wrap">
          <span class="label">{{ $t("home.home18") }}</span>
          <div class="inner">
            <span class="left">
              {{ toAmount }}
            </span>
            <div class="right">
              <img
                class="logo-img"
                :src="getLogoSrc(chooseToAsset.symbol)"
                @error="replaceImg"
                alt=""
              />
              <div class="asset-info-wrap">
                <span>{{ chooseToAsset.symbol }}</span>
                <span class="origin-chain">{{ chooseToAsset.chain }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="wrap">
          <span class="label">{{ $t("home.home16") }}</span>
          <div class="inner">
            <span class="left">
              {{ toNetwork }} 
              <span>{{ superLong(toAddress) }}</span>
            </span>
          </div>
        </div>
        <div class="wrap">
          <span class="label">{{ $t("public.fee") }}</span>
          <div class="inner">
            <span class="left">
              {{ fee }} {{chooseFromAsset.symbol}}
            </span>
          </div>
        </div>
        <div class="btn-wrap">
          <el-button type="primary" :disabled="!canNext || !fee || !platformAddress" @click="transfer">
            {{ $t("home.home20") }}
          </el-button>
        </div>
      </div>
    </el-dialog>
    {{chooseToAsset}}
  </div>
</template>

<script>
import { ETHNET, MAIN_INFO, NULS_INFO } from "@/config";
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
import { networkOrigin } from '../../api/util';
import defaultIcon from "@/assets/img/commonIcon.png";
import { ETransfer, NTransfer } from "@/api/api"

export const valideNetwork = supportChainList.map(v => {
  return v.SwftChain
});

export const networkToChain = {};
valideNetwork.map(v=> {
  const chain = supportChainList.filter(item => item.SwftChain === v)[0]
  networkToChain[v] = {
    chain: chain.value,
    chainId: chain.chainId,
    assetId: chain.assetId
  }
})

function getAccountList() {
  return JSON.parse(sessionStorage.getItem("accountList")) || [];
}
function getCurrentAccount(address) {
  const accountList = getAccountList();
  const currentAccount = accountList.filter((item) => {
    return item.address.Ethereum === address;
  });
  return currentAccount[0] || null;
}


export default {
  data () {
    return {
      supportList: [], // 支持的币种
      dialogCoinList: [], // 弹窗显示的列表
      fromCoinList: [], // fromChain支持币种
      toCoinList: [], // toChain 支持币种
      assetListModal: false,
      chooseFromAsset: null, // 选择的跨链from资产
      chooseToAsset: null, // 选择的跨链to资产
      toNetwork: "",
      amount: "",
      toAmount: "",
      available: 0,
      fromNetworkMsg: "", //from网络与插件网络不一致 / 数量验证失败
      amountMsg: "", //转账数量验证失败信息
      dialogType: "from",
      max: "", // 最大兑换数
      min: "", //最小兑换数
      swapRate: "", // 兑换比例
      confirmModal: false, 
      feeLoading: false,
      fee: "", // 兑换消耗手续费
      platformAddress: "", //swft兑换地址
    }
  },

  props: {
    address: String,
    provider: Object,
    fromNetwork: String,
    fromChainId: String,
    walletType: String,
    fromAddress: String
  },

  components: {
    FeeWrap
  },

  watch: {
    dialogType(val) {
      if (!val) return;
      if (val === "from") {
        this.dialogCoinList = this.fromCoinList;
      } else {
        this.dialogCoinList = this.toCoinList;
      }
    },
    address: {
      immediate: true,
      handler(val) {
        if (!val) return;
        // this.reset();
        // this.toNetwork = "";
      },
    },
    fromChainId: {
      handler(val) {
        if (!val) return;
        this.reset();
        const network = supportChainList.filter(v => v.ropsten === val || v.homestead === val)[0]
        network && this.checkNetwork(network.value);
      },
    },
    fromNetwork: {
      immediate: true,
      handler(val) {
        if (!val) return;
        this.reset();
        
        this.checkNetwork(val);
        if (val === this.toNetwork) {
          this.toNetwork = "";
        }
      },
    },
  },


  computed: {
    toAddress() {
      const currentAccount = getCurrentAccount(this.address);
      return currentAccount ? currentAccount.address[this.toNetwork] : "";
    },
    canNext() {
      if (
        !this.amount ||
        !this.toAmount ||
        !this.chooseFromAsset ||
        !this.chooseToAsset ||
        !this.swapRate ||
        this.fromNetworkMsg ||
        this.amountMsg
      )
        return false;
      return true;
    },
  },

  created() {},

  mounted() {
    this.getCoins();
  },

  methods: {
    reset() {
      this.available = 0;
      this.amount = this.toAmount = "";
      this.chooseFromAsset = this.chooseToAsset = null;
      this.fromCoinList = this.dialogCoinList = this.supportList.filter(v => v.chain === this.fromNetwork);
      this.toCoinList = [];
      this.fromNetworkMsg = this.amountMsg = ""
      this.min = this.max= "";
      this.swapRate = "";
    },
    superLong(str, len = 8) {
      return superLong(str, len);
    },
    getLogoSrc(symbol) {
      return getLogoSrc(symbol);
    },
    replaceImg(e) {
      e.target.src = defaultIcon;
    },
    maxAmount() {
      this.amount = this.available;
    },
    validateAmount(val) {
      if (this.chooseFromAsset) {
        const decimals = this.chooseFromAsset.decimals || 8;
        const patrn = new RegExp("^([1-9][\\d]{0,20}|0)(\\.[\\d]{0," + decimals + "})?$");
        // TODO 去掉注释, 大于可用禁止输入
        // if (this.available && Minus(val, this.available) > 0) return
        if (patrn.exec(val) || val==="") {
          this.amount = val
          this.toAmount = this.swapRate ? this.swapRate * this.amount : "";
          this.checkAmount();
        }
      }
    },
    checkAmount() {
      if (!this.min || !this.max) return
      let msg = ""
      if (Minus(this.amount, this.min) < 0 ) {
        msg = this.$t("tips.tips8") + this.min
      } else if (Minus(this.amount, this.max) > 0) {
        msg = this.$t("tips.tips9") + this.max
      }
      this.amountMsg = msg;
    },
    // 获取swft支持的闪兑列表
    async getCoins() {
      const res = await this.$request({
        url: "/coins"
      });
      if (res.msg === "success") {
        const coins = res.data.filter(v => valideNetwork.indexOf(v.mainNetwork) > -1);
        coins.map(v => {
          const chain = networkToChain[v.mainNetwork]
          v.chain = chain.chain
          v.symbol = v.coinCode.split("(")[0]
          /* v.chainId = chain.chainId
          v.assetId = v.contact ? 0 : chain.assetId */
          v.contractAddress = v.contact
        })
        this.supportList = coins;
        this.fromCoinList = this.dialogCoinList = this.supportList.filter(v => v.chain === this.fromNetwork);
      }
    },
    // 下拉选择资产
    async selectAsset(asset) {
      console.log(asset, 555, this.dialogType)
      this.assetListModal = false;
      if (this.dialogType === "from") {
        this.amount = "";
        this.chooseFromAsset = asset;
        this.getBalance(asset);
        this.toCoinList = [];
        this.chooseToAsset = null;
        this.getToCoinList();
      } else {
        this.chooseToAsset = asset;
        this.toNetwork = asset.chain;
        this.getExchangeRate()
      }
    },
    async getBalance(asset) {
      if (this.fromNetwork === "NERVE" || this.fromNetwork === "NULS") {
        const params = {
          chain: this.fromNetwork,
          address: this.fromAddress,
          chainId: asset.chainId,
          assetId: asset.assetId,
          contractAddress: asset.contractAddress
        };
        // 关注资产
        await this.$request({
          url: "/wallet/address/asset/focus",
          data: {
            focus: true,
            ...params,
          },
        });
        this.getAssetInfo(params);
      } else {
        try {
          const transfer = new ETransfer();
          if (asset.contractAddress) {
            this.available = await transfer.getERC20Balance(asset.contractAddress, asset.decimals, this.fromAddress);
          } else {
            this.available = await transfer.getEthBalance(this.fromAddress);
          }
        } catch (e) {
          this.available = 0;
          this.$message({ message: this.$t("tips.tips7"), type: "warning", duration: 1000 });
        }
      }
    },
    // nerve nuls链上获取资产信息
    async getAssetInfo(params) {
      const res = await this.$request({
        url: "/wallet/address/asset",
        data: {
          refresh: true,
          ...params,
        },
      });
      if (res.code === 1000) {
        this.available = divisionDecimals(res.data.balance, res.data.decimals);
      }
    },
    showDialog(dialogType) {
      this.dialogType = dialogType;
      this.assetListModal = true
    },
    checkActive(item) {
      if (this.dialogType === "from") {
        return { active: this.chooseFromAsset && this.chooseFromAsset.coinId === item.coinId }
      } else {
        return { active: this.chooseToAsset && this.chooseToAsset.coinId === item.coinId }
      }
    },
    // 获取to List
    getToCoinList() {
      const noSupportCoin = this.supportList.filter(v => {
        const noSupportItem = this.chooseFromAsset.noSupportCoin.find(item => item.coinId === v.coinId)
        return !!noSupportItem
      })
      this.toCoinList = this.supportList.filter(v => {
        const support = !noSupportCoin.find(item => item.coinId === v.coinId)
        return v.coinId !== this.chooseFromAsset.coinId && support
      })
    },
    // 检查metamask网络与nervebridge网络是否一致
    checkNetwork(fromNetwork) {
      const network = supportChainList.filter(
        (item) => item.value === fromNetwork
      )[0];
      if (network.hasOwnProperty(ETHNET)) {
        if (
          network[ETHNET] !== this.fromChainId &&
          this.walletType === "metamask"
        ) {
          this.fromNetworkMsg = this.$t("home.home8");
        } else {
          this.fromNetworkMsg = "";
        }
      } else {
        this.fromNetworkMsg = "";
      }
    },
    // 通过fromCoin toCoin查询兑换汇率
    async getExchangeRate() {
      if (!this.chooseFromAsset || !this.chooseToAsset) return
      const res = await this.$request({
        url: "/base",
        data: {
          depositCoinCode: this.chooseFromAsset.coinCode,
          receiveCoinCode: this.chooseToAsset.coinCode,
        },
      });
      if (res.msg === "success") {
        this.max = res.data.depositMax
        this.min = res.data.depositMin
        this.swapRate = res.data.instantRate
        this.toAmount = this.amount ? this.swapRate * this.amount : "";
        this.checkAmount();
      }
    },
    next() {
      this.confirmModal = true;
      this.createOrder();
    },
    async createOrder() {
      this.feeLoading = true;
      this.fee = "";
      this.platformAddress = "";
      try {
        const res = await this.$request({
          url: "/exchange",
          data: {
            depositCoinCode: this.chooseFromAsset.coinCode,
            receiveCoinCode: this.chooseToAsset.coinCode,
            depositCoinAmt: this.amount,
            receiveCoinAmt: this.toAmount,
            destinationAddr: this.toAddress,
            refundAddr: this.fromAddress
          },
        });
        if (res.msg === "success") {
          this.fee = res.data.depositCoinFeeAmt;
          this.platformAddress = res.data.platformAddr;
        }
      } catch(e) {
        this.confirmModal = false;
        this.$message({ message: this.$t("tips.tips10"), type: "warning", duration: 3000 });
      }
      this.feeLoading = false;
    },

    async transfer() {
      try {
        const currentAccount = getCurrentAccount(this.address);
        if (this.fromNetwork === "NERVE" || this.fromNetwork === "NULS") {
          // 普通转账
          const transfer = new NTransfer({
            chain: this.fromNetwork,
            type: 2
          })
          const transferInfo = {
            from: this.fromAddress,
            to: this.platformAddress,
            assetsChainId: this.chooseFromAsset.chainId,
            assetsId: this.chooseFromAsset.assetId,
            amount: timesDecimals(this.amount, this.chooseFromAsset.decimals),
            fee: timesDecimals(0.001, 8)
          }
          const inputOutput = await transfer.inputsOrOutputs(transferInfo);
          const data = {
            inputs: inputOutput.inputs,
            outputs: inputOutput.outputs,
            txData: {},
            pub: currentAccount.pub,
            signAddress: currentAccount.address.Ethereum,
          };
          const txHex = await transfer.getTxHex(data);
          console.log(txHex, 55)
          if (txHex) {
            // this.broadcastHex(txHex);
          }
        } else {
          const transfer = new ETransfer()
          const transferInfo = {
            value: this.amount,
            decimals: this.chooseFromAsset.decimals,
            contractAddress: this.chooseFromAsset.contractAddress,
            to: this.platformAddress
          }
          const res = await transfer.commonTransfer(transferInfo);
          if (res && res.hash) {
            this.$message({ message: this.$t("tips.tips1"), type: "success", duration: 2000 });
          }
        }
      } catch (e) {
        this.$message({ message: this.$t("tips.tips6"), type: "warning", duration: 2000 })
      }
       this.confirmModal = false;
    },

    //广播nerve nuls跨链转账交易
    async broadcastHex(txHex) {
      const url = this.fromNetwork === "NERVE" ? MAIN_INFO.rpc : NULS_INFO.rpc;
      const chainId = this.fromNetwork === "NERVE" ? MAIN_INFO.chainId : NULS_INFO.chainId;
      const res = await this.$post(url, 'broadcastTx', [chainId, txHex]);
      if (res.result && res.result.hash) {
        this.$message({ message: this.$t("tips.tips1"), type: "success", duration: 2000 })
      } else {
        this.$message({ message: this.$t("tips.tips6"), type: "warning", duration: 2000 })
      }
     
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
      padding: 0 30px;
      color: #99A3C4;
      .network {
        color: #515E7B;
        margin-right: 15px;
      }
    }
  }
  .swap-rate {
    text-align: center;
    color: #515E7B;
    font-size: 13px;
    margin: 10px 0;
  }
  .confirm-dialog {
    .el-dialog__body {
      padding-top: 0;
      padding-bottom: 40px;
    }
    .wrap {
      margin-top: 15px;
      .label {
        font-size: 12px;
        color: #99a3c4;
        margin-bottom: 6px;
        line-height: 1;
        display: inline-block;
      }
      .inner {
        height: 54px;
        background-color: #ebeef8;;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 15px;
        color: #99A3C4;
        .left span {
          margin-left: 10px;
        }
        .right {
          display: flex;
          align-items: center;
          color: #99a3c4;
          font-weight: 600;
          .origin-chain {
            font-size: 12px;
          }
        }
      }
    }
  }
}
</style>