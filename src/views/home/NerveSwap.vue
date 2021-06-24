<template>
  <div class="nerve-swap">
    <div class="account-select">
      <div class="from">
        <span class="label">{{ $t("home.home4") }}</span>
        <span class="network">
          {{ fromNetwork }}
        </span>
        {{ superLong(fromAddress) }}
      </div>
      <div class="msg-wrap">
        <span class="from-validate-msg" v-show="fromNetworkMsg">{{
          fromNetworkMsg
        }}</span>
      </div>
      <div class="to">
        <span class="label">{{ $t("home.home5") }}</span>
        <el-select v-model="toNetwork" placeholder="">
          <el-option
            v-for="item in networkList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
            :disabled="item.value === fromNetwork"
          >
          </el-option>
        </el-select>
        <span class="address">{{ superLong(toAddress) }}</span>
      </div>
    </div>
    <div class="amount">
      <div class="label-wrap">
        <span class="label">{{ $t("public.amount") }}</span>
        <span>{{ $t("home.home3") }} {{ available }}</span>
      </div>
      <el-input
        class="amount-inner"
        placeholder="0.0"
        :value="amount"
        @input="validateAmount"
      >
        <div
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
              class="logo-img"
              :src="getLogoSrc(chooseAsset.symbol)"
              @error="replaceImg"
              alt=""
            />
            <div class="asset-info-wrap">
              <span>{{ chooseAsset.symbol }}</span>
              <span class="origin-chain">{{ chooseAsset.registerChain }}</span>
            </div>
            <!-- {{ chooseAsset.symbol }}<span class="origin-chain">{{ "(" + chooseAsset.registerChain + ")" }}</span> -->
            <!-- {{ chooseAsset.symbol + "(" + chooseAsset.registerChain + ")" }} -->
            <!-- </span> -->
          </template>
          <i class="el-icon-caret-bottom fw"></i>
        </div>
        <!-- <el-button slot="append">MAX</el-button> -->
      </el-input>
    </div>
    <div class="msg-wrap">
      <span class="amount-validate-msg" v-show="amountMsg">{{
        amountMsg
      }}</span>
    </div>
    <fee-wrap>
      <div class="fee-inner">
        
        <template v-if="!fee">
          <span v-if="!feeLoading">--</span>
          <img v-else src="../../assets/img/loading.svg" alt="" />
        </template>
        <div v-else>
          {{ fee }}
          <el-checkbox v-model="speedUpFee" v-if="showSpeedUp">
            {{ $t("home.home11") }}
          </el-checkbox>
        </div>
      </div>
    </fee-wrap>
    <!-- <div class="fee">
      <span class="label">{{ $t("public.fee") }}</span>
      
        <el-tooltip
          effect="dark"
          :content="$t('home.home2')"
          value="1"
          :append-to-body="false"
          ref="mypop"
        >
          <span class="el-icon-info"></span>
        </el-tooltip>
        <span ref="here">
        </span>
      
      <div class="fee-inner">
        <span v-if="!fee">--</span>
        <div v-else>
          {{ fee }}
          <el-checkbox v-model="speedUpFee" v-if="showSpeedUp">
            {{ $t("home.home11") }}
          </el-checkbox>
        </div>
      </div>
    </div> -->
    <div class="btn-wrap tc">
      <el-button type="primary" v-if="crossInAuth" :disabled="!!fromNetworkMsg" @click="approveERC20">{{
        $t("home.home10")
      }}</el-button>
      <el-button type="primary" v-else :disabled="!canNext" @click="next">{{
        $t("public.next")
      }}</el-button>
    </div>
    <el-dialog
      :title="$t('home.home6')"
      :visible.sync="assetListModal"
      :modal-append-to-body="false"
      width="80%"
      top="10vh"
      class="assets-list-dialog"
    >
      <el-input v-model="searchVal" :placeholder="$t('home.home24')" class="search-input"></el-input>
      <ul v-if="filteredList.length">
        <li
          v-for="item in filteredList"
          :key="item.id"
          @click="selectAsset(item)"
          :class="{ active: chooseAsset && chooseAsset.id === item.id }"
        >
          <div class="logo-wrap">
            <img :src="getLogoSrc(item.symbol)" @error="replaceImg" alt="" />
          </div>
          <div class="asset-info">
            <p>{{ item.symbol }}<span>{{"(" + item.registerChain + ")"}}</span></p>
            <span
              v-if="item.contractAddress && item.contractAddress.length > 20"
            >
              {{ $t("home.home9") + superLong(item.contractAddress) }}
            </span>
          </div>
        </li>
      </ul>
      <p class="no-data" v-else>No Data</p>
    </el-dialog>
  </div>
</template>

<script>
import { MAIN_INFO, NULS_INFO, ETHNET } from "@/config";
import {
  superLong,
  divisionDecimals,
  Minus,
  Plus,
  timesDecimals,
  getLogoSrc,
  Times,
  supportChainList,
  debounce
} from "@/api/util";
import { ETransfer, getSymbolUSD, swapScale, swapSymbolConfig, crossFee } from "@/api/api";
import { getContractCallData } from "@/api/nulsContractValidate";
import defaultIcon from "@/assets/img/commonIcon.png";
import FeeWrap from "@/components/FeeWrap"


function getAccountList() {
  return JSON.parse(localStorage.getItem("accountList")) || [];
}
function getCurrentAccount(address) {
  const accountList = getAccountList();
  const currentAccount = accountList.filter((item) => {
    return item.address.Ethereum === address;
  });
  return currentAccount[0] || null;
}

let chainToSymbol = {}
supportChainList.map(v => {
   chainToSymbol[v.value] = v.symbol
})
// console.log(chainToSymbol, 666)
/* const chainToSymbol = {
  Ethereum: "ETH",
  BSC: "BNB",
  Heco: "HT",
  NERVE: "NVT",
  NULS: "NULS",
}; */


export default {
  data () {
    this.networkList = supportChainList;
    this.storeAccountInfo = []; // 账户各链主资产信息
    this.withdrawalNVTFee = ""; // 提现nvt手续费
    this.needExtraFee = false; //nvt不足，需要额外转入一笔手续费
    this.extraFee = ""; //用于闪兑nvt的异构链主资产数量
    this.NULSContract = false; //是否是nuls的合约资产跨链
    this.getFeeDebounce = debounce(this.getTransferFee, 1000)
    this.getAllowanceTimer = null; // 查询授权额度定时器
    return {
      toNetwork: "",
      assetListModal: false,
      assetsList: [], //可跨链资产
      chooseAsset: null, // 选择的跨链资产
      amount: "", //跨链数量
      available: 0,
      fee: "",
      feeLoading: false,
      fromNetworkMsg: "", //from网络与插件网络不一致
      amountMsg: "", //转账数量验证失败信息
      crossInAuth: false, //异构链转入nerve是否需要授权
      speedUpFee: false, //是否加速
      searchVal: "",
      filteredList: []
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
    address: {
      immediate: true,
      handler(val) {
        if (!val) return;
        this.reset();
        this.toNetwork = "";
      },
    },
    fromChainId: {
      handler(val) {
        if (!val) return;
        const network = this.networkList.filter(v => v.ropsten === val || v.homestead === val)[0]
        // console.log(network, 11, val, this.networkList, ETHNET)
        network && this.checkNetwork(network.value);
      },
    },
    fromNetwork: {
      immediate: true,
      handler(val) {
        if (!val) return;
        // console.log(val, 111)
        this.checkNetwork(val);
        if (val === this.toNetwork) {
          this.toNetwork = "";
        }
      },
    },
    networkPair(val) {
      this.reset();
      if (val[0] && val[1]) {
        this.getCanCrossAssets();
        this.getTransferFee();
      }
    },
    speedUpFee() {
      this.getTransferFee();
    },
    assetListModal(val) {
      if (!val) {
        this.searchVal = ""
      }
    },
    searchVal(val) {
      if (val) {
        this.filteredList = this.assetsList.filter(v => {
          const search  = val.toUpperCase();
          const symbol = v.symbol.toUpperCase()
          const contractAddress = v.contractAddress.toUpperCase();
          // console.log(search, symbol, contractAddress, 45)
          return symbol.indexOf(search) > -1 || contractAddress.indexOf(search) > -1
        })
      } else {
        this.filteredList = this.assetsList
      }
    }
  },

  computed: {
    toAddress() {
      const currentAccount = getCurrentAccount(this.address);
      return currentAccount ? currentAccount.address[this.toNetwork] : "";
    },
    canNext() {
      if (
        !this.toNetwork ||
        !this.chooseAsset ||
        !Number(this.amount) ||
        !this.fee ||
        this.amountMsg ||
        this.fromNetworkMsg
      )
        return false;
      return true;
    },
    networkPair() {
      return [this.fromNetwork, this.toNetwork];
    },
    showSpeedUp() {
      const parallelChain = ["NERVE", "NULS"]
      if (parallelChain.indexOf(this.fromNetwork) > -1 && parallelChain.indexOf(this.toNetwork) > -1) {
        return false
      }
      return true
    }
  },

  created() {
  },

  mounted() {},

  methods: {

    checkNetwork(fromNetwork) {

      const network = this.networkList.filter(
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
    reset() {
      this.available = 0;
      this.amount = "";
      this.chooseAsset = null;
      this.assetsList = [];
      this.crossInAuth = false;
      this.speedUpFee = false;
      this.storeAccountInfo = [];
      this.withdrawalNVTFee = "";
      this.needExtraFee = false;
      this.extraFee = "";
      this.NULSContract = false;
      this.clearGetAllowanceTimer();
    },
    // 查询可跨链资产
    async getCanCrossAssets() {
      const res = await this.$request({
        url: "/asset/chain/cross",
        data: {
          fromChain: this.fromNetwork,
          toChain: this.toNetwork,
        },
      });
      if (res.code === 1000) {
        res.data.map(v => {
          // 去除ETH资产contractAddress为ETH
          v.contractAddress = v.contractAddress && v.assetId !== 1 ? v.contractAddress : "";
        })
        this.assetsList = res.data.sort((a, b) => {
          return a.symbol > b.symbol ? 1 : -1
        });
        this.filteredList = [...this.assetsList];
      }
    },
    // 下拉选择资产
    async selectAsset(asset) {
      this.amount = "";
      this.chooseAsset = asset;
      this.assetListModal = false;
      this.clearGetAllowanceTimer();
      //assset.assetId为0 则为异构链上token资产
      if (asset.assetId === 0 && this.fromNetwork !== "NULS") {
        this.checkCrossInAuthStatus();
      }
      const params = {
        chain: this.fromNetwork,
        address: this.fromAddress,
        chainId: asset.chainId,
        assetId: asset.assetId,
        contractAddress: asset.contractAddress
      };
      //关注资产
      await this.$request({
        url: "/wallet/address/asset/focus",
        data: {
          focus: true,
          ...params,
        },
      });
      this.getAssetInfo(params);
    },
    replaceImg(e) {
      e.target.src = defaultIcon;
    },
    // 查询异构链token资产授权情况
    async checkCrossInAuthStatus() {
      const transfer = new ETransfer();
      const heterogeneousInfo = this.chooseAsset.heterogeneousList.filter(
        (v) => v.chainName === this.fromNetwork
      )[0];
      const contractAddress = this.chooseAsset.contractAddress;
      const needAuth = await transfer.getERC20Allowance(
        contractAddress,
        heterogeneousInfo.heterogeneousChainMultySignAddress,
        this.fromAddress
      );
      this.crossInAuth = needAuth;
      if (!needAuth && this.getAllowanceTimer) {
        this.clearGetAllowanceTimer();
      }
    },
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
        this.getTransferFee();
      }
    },
    validateAmount(val) {
      const decimals = this.chooseAsset && this.chooseAsset.decimals || 8;
      const patrn = new RegExp("^([1-9][\\d]{0,20}|0)(\\.[\\d]{0," + decimals + "})?$");
      if (patrn.exec(val)|| val==="") {
        this.amount = val
      }

      this.getFeeDebounce();
      // this.getTransferFee()
    },
    // 计算交易手续费
    async getTransferFee() {
      try {
        if (!this.chooseAsset || !Number(this.amount)) {
          this.fee = "";
          this.feeLoading = false;
          return;
        }
        this.fee = "";
        this.feeLoading = true;
        const nerveToNulsFee = crossFee + "NVT" + "+" + crossFee + "NULS";
        const nulsToNerveFee = crossFee + "NULS";

        const pubKey = getCurrentAccount(this.address).pub;
        const accountInfo = await this.$request({
          url: "/wallet/chain/main",
          data: { pubKey },
        });
        this.storeAccountInfo = accountInfo.data;

        if (this.fromNetwork === "NERVE") {
          if (this.toNetwork === "NULS") {
            /* const nulsBalance = await this.getNulsInfo(this.fromAddress);
            if (nulsBalance - crossFee < 0) {

            } else {
              this.fee =  crossFee + "NVT" + "+" + crossFee + "NULS";
            } */
            this.fee =  nerveToNulsFee;
            
          } else {
            const crossOutFee = await this.getCrossOutFee();
            this.fee = crossOutFee;
          }
        } else if (this.fromNetwork === "NULS") {
          let crossInFee = nulsToNerveFee;
          this.NULSContract = !!this.chooseAsset.contractAddress;
          if (this.chooseAsset.contractAddress) {
            this.NULSContract = true;
            crossInFee = await this.getContractCallData();
            if (crossInFee) {
              crossInFee = crossInFee + "NULS";
            } else {
              return null;
            }
          }
          if (this.toNetwork === "NERVE") {
            this.fee = crossInFee;
          } else {
            const crossOutFee = await this.getCrossOutFee();
            if (this.needExtraFee) {
              const symbol = chainToSymbol[this.fromNetwork];
              const extraFee = this.splitFeeSymbol(crossOutFee).value;
              this.extraFee = extraFee;
              const oldCrossInFee = this.splitFeeSymbol(crossInFee).value;
              // this.fee = Plus(oldCrossInFee, extraFee) + symbol
              const asset = this.chooseAsset
              if (asset.contractAddress) {
                // 转入资产为token资产
                this.fee = Plus(oldCrossInFee, Plus(crossFee, extraFee)) + symbol
              } else if (asset.chainId === NULS_INFO.chainId && asset.assetId === NULS_INFO.assetId) {
                // 转入资产为NULS
                this.fee = Plus(oldCrossInFee, extraFee) + symbol
              } else {
                this.fee = Plus(Times(oldCrossInFee, 2), extraFee) + symbol
              }
            } else {
              this.fee = crossInFee + "+" + crossOutFee;
            }
          }
        } else {
          const crossInFee = await this.getCrossInFee();
          if (this.toNetwork === "NERVE") {
            this.fee = crossInFee;
          } else if (this.toNetwork === "NULS") {
            // TODO 如果nvt不足续费0.01,闪兑nvt手续费
            
            // nerve链上nvt余额
            const nvtBalance = this.getNvtBalanceInfo()
            if (nvtBalance < 0.01) {
              // 如果nvt不足续费0.01,闪兑1个nvt
              const swapNvtFee = 1;
              // 再次转入的异构链主资产数量
              const hgcFee = await this.getSwapCost(swapNvtFee);
              const symbol = chainToSymbol[this.fromNetwork];
               this.extraFee = hgcFee;
              // fee = hgcFee + chainToSymbol[this.fromNetwork];
              const oldCrossInFee = this.splitFeeSymbol(crossInFee).value;
              this.fee = Plus(Times(oldCrossInFee, 2), hgcFee) + symbol + "+" + crossFee + "NULS";
            } else {
              this.fee = crossInFee + "+" + nerveToNulsFee;
            }
          } else {
            const crossOutFee = await this.getCrossOutFee();
            if (this.needExtraFee) {
              // nvt不足，需转入一笔异构链主资产闪兑为手续费
              const symbol = chainToSymbol[this.fromNetwork];
              const extraFee = this.splitFeeSymbol(crossOutFee).value;
              this.extraFee = extraFee;
              const oldCrossInFee = this.splitFeeSymbol(crossInFee).value;
              this.fee = Plus(Times(oldCrossInFee, 2), extraFee) + symbol;
              // this.fee = oldCrossInFee * 2 + Number(extraFee) + symbol;
            } else {
              this.fee = crossInFee + "+" + crossOutFee;
            }
          }
        }
        await this.checkAmountFee();
      } catch (e) {
        console.error(e, "计算手续费失败")
      }
      this.feeLoading = false;
    },
    //nuls合约资产跨链 计算手续费&其他信息
    async getContractCallData() {
      const currentAccount = getCurrentAccount(this.address);
      const NERVEAddress = currentAccount.address.NERVE;
      const price = 25;
      const res = await getContractCallData(
        this.fromAddress,
        NERVEAddress,
        price,
        this.chooseAsset.contractAddress,
        "transferCrossChain",
        this.amount,
        this.chooseAsset.decimals
      );
      if (res.success) {
        // console.log(res, 55);
        // this.fee = res.data.fee;
        this.NULSContractGas = res.data.gas;
        this.NULSContractTxData = res.data.contractCallData;
        return res.data.fee;
      } else {
        this.$message({ message: res.msg, type: "warning", duration: 2000 });
        return null;
      }
    },
    // 异构链转入nerve手续费
    async getCrossInFee() {
      const assetHeterogeneousInfo = this.chooseAsset.heterogeneousList.filter(
        (v) => v.chainName === this.fromNetwork
      )[0];
      const isToken = assetHeterogeneousInfo.token;
      const gasLimit = isToken ? "100000" : "33594";
      const transfer = new ETransfer();
      let fee
      if (this.speedUpFee) {
        fee = await transfer.getSpeedUpFee(gasLimit);
      } else {
        fee = await transfer.getGasPrice(gasLimit);
      }
      return fee + chainToSymbol[this.fromNetwork];
    },
    // nerve转出到异构链手续费
    async getCrossOutFee() {
      const asset = this.chooseAsset;
      const assetHeterogeneousInfo = asset.heterogeneousList.filter(
        (v) => v.chainName === this.toNetwork
      )[0];
      const isToken = assetHeterogeneousInfo.token;
      const transfer = new ETransfer({chain: this.toNetwork});
      let nvtUSD = await getSymbolUSD("NERVE");
      nvtUSD = nvtUSD + "";
      let heterogeneousChainUSD = await getSymbolUSD(this.toNetwork);
      heterogeneousChainUSD = heterogeneousChainUSD + "";
      const res = await transfer.calWithdrawalNVTFee(
        nvtUSD,
        heterogeneousChainUSD,
        isToken
      );
      let nvtFee = divisionDecimals(res, 8); // 异构跨链手续费-nvt
      // console.log(nvtFee, 66)
      nvtFee = this.speedUpFee ? Number(nvtFee) * 1.5 : nvtFee * 1.2;
      this.withdrawalNVTFee = nvtFee;
      // nerve链上nvt余额
      const nvtBalance = this.getNvtBalanceInfo()

      let fee;
      this.needExtraFee = false; //nvt不足，需要额外转入一笔手续费
      
      if (this.fromNetwork === "NERVE") {
        fee = nvtFee + "NVT";
      } else {
        // debugger
        if (nvtBalance && nvtBalance - nvtFee >= 0) {
          fee = nvtFee + "NVT";
        } else {
          this.needExtraFee = true;
          const hgcFee = await this.getSwapCost(nvtFee);
          fee = hgcFee + chainToSymbol[this.fromNetwork];
        }
      }
      return fee;
    },
    // 查询兑换一定数量nvt需要花费的异构链主资产数量
    async getSwapCost(amount) {
      const config = JSON.parse(sessionStorage.getItem("config"));
      const swapAssetInfo = config[this.fromNetwork];
      const nerveInfoParams = {
        assetsChainId: swapAssetInfo.chainId,
        assetsId: swapAssetInfo.assetId,
      };
      const { chainId, assetId } = await this.getAssetNerveInfo(nerveInfoParams);
      const swapAmount = timesDecimals(Times(amount, swapScale), 8);
      const nerveAddress = getCurrentAccount(this.address).address.NERVE;
      const params = {
        address: nerveAddress,
        toAmount: swapAmount,
        fromToken: {
          symbol: swapSymbolConfig[swapAssetInfo.symbol],
          chainId: chainId,
          assetId: assetId
        },
        toToken: {
          symbol: "NVT",
          chainId: MAIN_INFO.chainId,
          assetId: MAIN_INFO.assetId
        }
      }
      const res = await this.$request({
        url: "/tx/quantity",
        data: params
      });
      if (res.code === 1000 && res.data.data) {
        // console.log(res, 55)
        // return res.data.result
        // return divisionDecimals(res.data.data, swapAssetInfo.decimal)
        return res.data.data.quantityPlain
      } else {
        /* this.$message({
          message: this.$t("home.home12"),
          type: "warning",
          duration: 2000
        }) */
        // throw new Error(this.$t("home.home12"))
        throw this.$t("home.home12")
      }
      
    },
    // 异构链token资产转入nerve授权
    async approveERC20() {
      const transfer = new ETransfer();
      const heterogeneousInfo = this.chooseAsset.heterogeneousList.filter(
        (v) => v.chainName === this.fromNetwork
      )[0];
      const contractAddress = this.chooseAsset.contractAddress;
      const res = await transfer.approveERC20(
        contractAddress,
        heterogeneousInfo.heterogeneousChainMultySignAddress,
        this.fromAddress
      );
      if (res.hash) {
        this.$message({
          message: this.$t("tips.tips1"),
          type: "success",
          duration: 2000,
        });
        this.setGetAllowanceTimer();
      } else {
        this.$message({ message: JSON.stringify(res), type: "warning", duration: 2000 });
      }
    },
    setGetAllowanceTimer() {
      this.getAllowanceTimer = setInterval(() => {
        this.checkCrossInAuthStatus();
      }, 3000)
    },
    clearGetAllowanceTimer() {
      if (!this.getAllowanceTimer) return;
      clearInterval(this.getAllowanceTimer);
      this.getAllowanceTimer = null;
    },
    splitFeeSymbol(str) {
      return {
        symbol: str.match(/[a-z|A-Z]+/gi)[0],
        value: str.match(/[\d|.]+/gi)[0],
      };
    },
    async next() {
      const currentAccount = getCurrentAccount(this.address);
      const asset = this.chooseAsset;
      /* const nerveInfoParams = asset.contractAddress
        ? {
            contractAddress: asset.contractAddress,
          }
        : {
            assetsChainId: asset.chainId,
            assetsId: asset.assetId,
          }; */
      const nerveInfoParams = {
        contractAddress: asset.contractAddress,
        assetsChainId: asset.chainId,
        assetsId: asset.assetId,
      }
      const { chainId, assetId } = await this.getAssetNerveInfo(
        nerveInfoParams
      );
      const config = JSON.parse(sessionStorage.getItem("config"));

      const mainAssetInfo = config[this.fromNetwork];
      const transferInfo = {
        fromChain: this.fromNetwork,
        toChain: this.toNetwork,
        fromAddress: currentAccount.address[this.fromNetwork],
        toAddress: currentAccount.address[this.toNetwork],
        chainId: asset.chainId,
        assetId: asset.assetId,
        contractAddress: asset.contractAddress,
        amount: this.amount,
        symbol: asset.symbol,
        pub: currentAccount.pub,
        signAddress: currentAccount.address.Ethereum,
        isTransferMainAsset: mainAssetInfo.symbol === asset.symbol,
        asset,
      };

      const baseCrossFee = timesDecimals(crossFee, MAIN_INFO.decimal);
      const from = transferInfo.fromAddress;
      const to = transferInfo.toAddress;
      const nerveAddress = currentAccount.address.NERVE;
      const amount = timesDecimals(this.amount, asset.decimals);
      const assetsId = assetId === 0 ? asset.assetId : assetId; //nuls上的token资产通过getAssetNerveInfo查出来assetId为0
      // nerve nuls跨链
      const crossInfo = {
        from,
        to,
        assetsChainId: chainId,
        assetsId, 
        amount,
        fee: baseCrossFee,
        // type: 10
      }
      // 跨链转入
      // 提现
      let crossOutInfo
      if (this.withdrawalNVTFee) {
        const proposalPrice = timesDecimals(
          this.withdrawalNVTFee,
          MAIN_INFO.decimal
        );
        const heterogeneousChain_Out = asset.heterogeneousList.filter(
          (v) => v.chainName === this.toNetwork
        )[0];
        const txData = {
          heterogeneousAddress: currentAccount.address[this.toNetwork],
          heterogeneousChainId: heterogeneousChain_Out.heterogeneousChainId,
        };
        crossOutInfo = {
          from: nerveAddress,
          assetsChainId: chainId,
          assetsId,
          amount,
          fee: 0,
          proposalPrice,
          txData,
          // type: 43
        }
      }

      //手续费不够，需要闪兑
      let swapInfo, crossInForSwapInfo
      if (this.extraFee) {
        const fromChainInfo = this.storeAccountInfo.filter(
          (v) => v.chain === this.fromNetwork
        )[0];
        
        if (this.fromNetwork !== "NULS") {
          // 异构链跨链转入一笔主资产作为手续费
          crossInForSwapInfo = {
            multySignAddress: mainAssetInfo.config.crossAddress,
            nerveAddress: nerveAddress,
            numbers: this.extraFee,
            fromAddress: from,
            // contractAddress: mainAssetInfo.contractAddress,
            decimals: fromChainInfo.decimals,
          }
        } else {
          crossInForSwapInfo = {
            from,
            to: nerveAddress,
            assetsChainId: NULS_INFO.chainId,
            assetsId: NULS_INFO.assetId,
            amount: timesDecimals(this.extraFee, NULS_INFO.decimal),
            fee: baseCrossFee,
            // type: 10
          }
          /*
          //  转入资产为nuls，再以nuls作为闪兑手续费，直接修改amount没有转入手续费hash 
          if (asset.chainId === NULS_INFO.chainId && asset.assetId === NULS_INFO.assetId) {
            // 跨链资产为NULS
            crossInfo.amount = timesDecimals(Plus(this.amount, this.extraFee), asset.decimals)
            crossInForSwapInfo = null;
          } */
        }
        const nerveInfoParams = {
          assetsChainId: fromChainInfo.chainId,
          assetsId: fromChainInfo.assetId,
        }
        const fromAssetOnNerve = await this.getAssetNerveInfo(
          nerveInfoParams
        );
        swapInfo = {
          fromToken: {
            symbol: swapSymbolConfig[fromChainInfo.symbol],
            chainId: fromAssetOnNerve.chainId,
            assetId: fromAssetOnNerve.assetId
          },
          toToken: {
            symbol: "NVT",
            chainId: MAIN_INFO.chainId,
            assetId: MAIN_INFO.assetId
          },
          fromAmount: timesDecimals(this.extraFee, fromChainInfo.decimals),
          address: nerveAddress
        }
      }

      if (this.fromNetwork === "NERVE") {
        if (this.toNetwork === "NULS") {
          transferInfo.crossInfo = crossInfo
        } else {
          transferInfo.crossOutInfo = crossOutInfo
        }
      } else if (this.fromNetwork === "NULS") {
        if (this.NULSContract) {
          // nuls合约资产跨链
          const price = 25;
          transferInfo.NULSContracInfo = {
            from,
            assetsChainId: NULS_INFO.chainId,
            assetsId: NULS_INFO.assetId,
            amount: Plus(20000000, Times(this.NULSContractGas, price)).toFixed(),
            toContractValue: 10000000,
            to: asset.contractAddress,
            txData: this.NULSContractTxData,
            fee: timesDecimals(0.1, MAIN_INFO.decimal),
            // type: 16
          }
        } else {
          crossInfo.to = nerveAddress
          transferInfo.crossInfo = crossInfo
        }
        if (this.toNetwork !== "NERVE") {
          if (this.extraFee) {
            transferInfo.crossInForSwapInfo = crossInForSwapInfo;
            transferInfo.swapInfo = swapInfo;
          }
          transferInfo.crossOutInfo = crossOutInfo
        }
      } else {
        // 异构链跨链转入nerve
        const heterogeneousChain_In = asset.heterogeneousList.filter(
          (v) => v.chainName === this.fromNetwork
        )[0];
        transferInfo.crossInInfo = {
          multySignAddress: heterogeneousChain_In.heterogeneousChainMultySignAddress,
          nerveAddress: nerveAddress,
          numbers: this.amount,
          fromAddress: from,
          contractAddress: heterogeneousChain_In.contractAddress,
          decimals: asset.decimals
        };
        if (this.toNetwork !== "NERVE") {
          if (this.extraFee) {
            transferInfo.crossInForSwapInfo = crossInForSwapInfo;
            transferInfo.swapInfo = swapInfo;
          }
          if (this.toNetwork !== "NULS") {
            transferInfo.crossOutInfo = crossOutInfo
          } else {
            crossInfo.from = nerveAddress
            transferInfo.crossInfo = crossInfo
          }
        }
      }
      sessionStorage.setItem("transferInfo", JSON.stringify(transferInfo));
      this.$router.push({
        name: "transfer",
      });
    },
    // 验证主资产余额是否够转账,手续费
    async checkAmountFee() {
      let flag = true;
      // 验证可用余额
      if (Minus(this.amount, this.available) > 0) flag = false;
      const asset = this.chooseAsset;
      const assetSymbol = asset.symbol;
      const feeList = this.fee.split("+");
      const config = JSON.parse(sessionStorage.getItem("config"));
      const mainAssetInfo = config[this.fromNetwork]; // 发起链
      const isMainAsset = assetSymbol === mainAssetInfo.symbol;
      /* const fromChainInfo = this.storeAccountInfo.filter(v => v.chain === this.fromNetwork)[0];
      const fromChainBalance = divisionDecimals(fromChainInfo.balance, fromChainInfo.decimals); */

      if (this.fromNetwork === "NERVE") {
        if (this.toNetwork === "NULS") {
          if (assetSymbol === "NULS") {
            // console.log(Minus(Plus(this.amount, crossFee), this.available), 333)
            if (Minus(Plus(this.amount, crossFee), this.available) > 0) flag = false;
          } else {
            const nulsBalance = await this.getNulsInfo(this.fromAddress);
            if (nulsBalance - crossFee < 0) flag = false;
          }
          if (!this.checkFee(crossFee, isMainAsset)) {
            flag = false
          }
        } else {
          const { value } = this.splitFeeSymbol(this.fee);
          // flag = this.checkFee(value, isMainAsset)
          if (!this.checkFee(value, isMainAsset)) {
            flag = false
          }
        }
      } else if (this.fromNetwork === "NULS") {
        let nulsFee
        feeList.map(v => {
          const { symbol, value } = this.splitFeeSymbol(v);
          if (symbol === "NULS") {
            nulsFee = value;
          }
        })
        if (!this.checkFee(nulsFee, isMainAsset)) {
          flag = false
        }
      } else {
        if (this.toNetwork === "NERVE") {
          const { value } = this.splitFeeSymbol(this.fee);
          // flag = this.checkFee(value, isMainAsset)
          if (!this.checkFee(value, isMainAsset)) {
            flag = false
          }
        } else {
          if (this.toNetwork === "NULS") {
            const currentAccount = getCurrentAccount(this.address);
            const nerveAddress = currentAccount.address.NERVE;
            const nulsBalance = await this.getNulsInfo(nerveAddress);
            if (nulsBalance - crossFee < 0) flag = false;
          }
          let mainAssetFee
          feeList.map(v => {
            const { symbol, value } = this.splitFeeSymbol(v);
            if (symbol !== "NULS" && symbol !== "NVT") {
              mainAssetFee = value;
            }
          })
          if (!this.checkFee(mainAssetFee, isMainAsset)) {
            flag = false
          }
        }
      }
      this.amountMsg = flag ? "" : this.$t("home.home7");
    },
    // 验证主资产是否够手续费/手续费+转账数量
    checkFee(fee, isMainAsset) {
      let flag = true;
      const fromChainInfo = this.storeAccountInfo.filter(v => v.chain === this.fromNetwork)[0];
      const fromChainBalance = divisionDecimals(fromChainInfo.balance, fromChainInfo.decimals);
      if (isMainAsset) {
        if (Minus(Plus(this.amount, fee), this.available) > 0) flag = false;
      } else {
        if (fromChainBalance - fee < 0) flag = false;
      }
      return flag
    },
    superLong(str, len = 8) {
      return superLong(str, len);
    },
    getLogoSrc(symbol) {
      return getLogoSrc(symbol);
    },
    
    /**
     * 获取资产在nerve链上的信息
     * @param data.contractAddress //token资产合约地址
     * @param data.assetsChainId //非token资产链id
     * @param data.assetsId //非token资产资产id
     */
    async getAssetNerveInfo(data) {
      if (this.fromNetwork === "NULS" || this.fromNetwork === "NERVE") {
        return {
          chainId: data.assetsChainId,
          assetId: data.assetsId
        }
      }
      let result = null;
      let params = {};
      if (data.contractAddress) {
        const config = JSON.parse(sessionStorage.getItem("config"));
        const mainAsset = config[this.fromNetwork]; //来源链(eth,bnb,heco)主资产信息
        params = {
          chainId: mainAsset.chainId,
          contractAddress: data.contractAddress,
        };
      } else {
        params = { chainId: data.assetsChainId, assetId: data.assetsId };
      }
      //console.log(params);
      try {
        const res = await this.$request({
          url: "/asset/nerve/chain/info",
          data: params,
        });
        //console.log(res);
        if (res.code === 1000) {
          result = res.data;
        }
      } catch (e) {
        console.error(e);
      }
      return result;
    },
    // 查询nerve链上nvt余额
    getNvtBalanceInfo() {
      const nvtInfo = this.storeAccountInfo.filter(v => v.chain === "NERVE")[0];
      // nerve链上nvt余额
      const nvtBalance = divisionDecimals(nvtInfo.balance, nvtInfo.decimals);
      return nvtBalance;
    },
    /**
     * 查询nerve链上nuls余额
     * @param address //nerveAddress
     */
    async getNulsInfo(address) {
      const data = {
        address,
        assetId: NULS_INFO.assetId,
        chainId: NULS_INFO.chainId,
        chain: "NERVE",
        refresh: true,
      }
      const res = await this.$request({
        url: "/wallet/address/asset",
        data
      });
      let balance = 0;
      if (res.code === 1000) {
        balance = divisionDecimals(res.data.balance, res.data.decimals);
      }
      return balance;
    },
  },
}

</script>
<style lang="less">

</style>