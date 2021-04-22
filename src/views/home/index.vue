<template>
  <div class="home">
    <HeaderBar :address="fromAddress" @quit="quit" />
    <div class="home-content" v-loading="loading">
      <div class="support-list" v-if="supportListShow">
        <span class="title">
          Connect to a wallet
        </span>
        <p @click="connectMetamask">
          MetaMask
          <img class="fr" src="../../assets/img/metamask.svg" alt="" />
        </p>
        <!-- <p @click="connectWalletConnect">
          WalletConnect
          <img class="fr" src="../../assets/img/walletConnect.svg" alt="" />
        </p> -->
      </div>
      <div class="show-sign-button" v-else-if="showSign">
        <el-button type="primary" @click="derivedAddress">{{
          $t("home.home1")
        }}</el-button>
      </div>
      <div v-else>
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
            v-model="amount"
            @change="getTransferFee"
          >
            <!-- <el-select v-model="assetId" slot="prepend" :placeholder="$t('home.home6')" @change="selectAsset">
              <el-option v-for="item in assetsList" :key="item.id" :label="item.symbol" :value="item.id">
              </el-option>
            </el-select> -->
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
                {{ chooseAsset.symbol + "(" + chooseAsset.registerChain + ")" }}
                <!-- </span> -->
              </template>
              <i class="el-icon-caret-bottom fw"></i>
            </span>
            <!-- <el-button slot="append">MAX</el-button> -->
          </el-input>
        </div>
        <div class="msg-wrap">
          <span class="amount-validate-msg" v-show="amountMsg">{{
            amountMsg
          }}</span>
        </div>
        <div class="fee">
          <span class="label">{{ $t("public.fee") }}</span>
          <el-tooltip
            effect="dark"
            :content="$t('home.home2')"
            placement="top-start"
          >
            <span class="el-icon-info"></span>
          </el-tooltip>
          <div class="fee-inner">
            <img v-if="!fee" src="../../assets/img/loading.svg" alt="" />
            <div v-else>
              {{ fee }}
              <el-checkbox v-model="speedUpFee" v-if="showSpeedUp">
                {{ $t("home.home11") }}
              </el-checkbox>
            </div>
          </div>
        </div>
        <div class="btn-wrap tc">
          <el-button type="primary" v-if="crossInAuth" @click="approveERC20">{{
            $t("home.home10")
          }}</el-button>
          <el-button type="primary" v-else :disabled="!canNext" @click="next">{{
            $t("public.next")
          }}</el-button>
        </div>
      </div>
    </div>
    <el-dialog
      :title="$t('home.home6')"
      :visible.sync="assetListModal"
      :modal-append-to-body="false"
      width="80%"
      class="assets-list-dialog"
    >
      <ul v-if="assetsList.length">
        <li
          v-for="item in assetsList"
          :key="item.id"
          @click="selectAsset(item)"
          :class="{ active: chooseAsset && chooseAsset.id === item.id }"
        >
          <div class="logo-wrap">
            <img :src="getLogoSrc(item.symbol)" @error="replaceImg" alt="" />
          </div>
          <div class="asset-info">
            <p>{{ item.symbol + "(" + item.registerChain + ")" }}</p>
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
import HeaderBar from "@/components/HeaderBar";
import { MAIN_INFO, NULS_INFO, ETHNET } from "@/config";
import nerve from "nerve-sdk-js";
import {
  superLong,
  divisionDecimals,
  Minus,
  Plus,
  timesDecimals,
  getLogoSrc,
  Times,
} from "@/api/util";
import { ETransfer, getSymbolUSD, swapScale, swapSymbolConfig, crossFee } from "@/api/api";
import { getContractCallData } from "@/api/nulsContractValidate";
import defaultIcon from "@/assets/img/commonIcon.png";
import WalletConnectProvider from "@walletconnect/web3-provider";

const ethers = require("ethers");

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

const chainToSymbol = {
  Ethereum: "ETH",
  BSC: "BNB",
  Heco: "HT",
  NERVE: "NVT",
  NULS: "NULS",
};

const infuraProjectId = "e81110266e064ad6a21990561a18a6eb";

export default {
  data() {
    this.networkList = [
      { label: "NERVE", value: "NERVE" },
      { label: "NULS", value: "NULS" },
      { label: "Ethereum", value: "Ethereum", ropsten: "0x3", homestead: "0x1" },
      { label: "BSC", value: "BSC", ropsten: "0x61", homestead: "0x38" },
      { label: "Heco", value: "Heco", ropsten: "0x100", homestead: "0x80" },
    ];
    this.storeAccountInfo = []; // 账户各链主资产信息
    this.withdrawalNVTFee = ""; // 提现nvt手续费
    this.needExtraFee = false; //nvt不足，需要额外转入一笔手续费
    this.extraFee = ""; //用于闪兑nvt的异构链主资产数量
    this.NULSContract = false; //是否是nuls的合约资产跨链
    this.walletType = sessionStorage.getItem("walletType"); // 连接钱包类型 metamask walletConnect
    return {
      loading: true,
      supportListShow: true, //显示可连接钱包列表
      showSign: true, //显示派生地址
      address: "", //metamask当前选中地址
      toNetwork: "",
      assetListModal: false,
      assetsList: [], //可跨链资产
      chooseAsset: null, // 选择的跨链资产
      amount: "", //跨链数量
      available: 0,
      fee: "",
      fromNetworkMsg: "", //from网络与插件网络不一致
      amountMsg: "", //转账数量验证失败信息
      crossInAuth: false, //异构链转入nerve是否需要授权
      speedUpFee: false, //是否加速
    };
  },

  components: {
    HeaderBar,
  },

  watch: {
    address: {
      immediate: true,
      handler(val) {
        // if (!val) return;
        this.reset();
        this.toNetwork = "";
        const currentAccount = getCurrentAccount(val);
        this.showSign = currentAccount ? false : true;
      },
    },
    fromNetwork: {
      handler(val) {
        if (!val) return;
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
    }
  },

  computed: {
    fromNetwork() {
      return this.$store.state.network;
    },
    fromAddress() {
      const currentAccount = getCurrentAccount(this.address);
      return currentAccount ? currentAccount.address[this.fromNetwork] : "";
    },
    toAddress() {
      const currentAccount = getCurrentAccount(this.address);
      return currentAccount ? currentAccount.address[this.toNetwork] : "";
    },
    canNext() {
      if (
        !this.toNetwork ||
        !this.chooseAsset ||
        !this.amount ||
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
    this.initConnect();
  },

  mounted() {},

  methods: {
    initConnect() {
      if (!this.walletType) {
        this.loading = false;
        return;
      }
      if (this.walletType === "metamask") {
        if (window.ethereum) {
          this.initMetamask(false);
        }
      } else if (this.walletType === "walletConnect") {
        // this.initWalletConnect();
      }
      this.loading = false;

    },
    // 初始化metamask wallet provider address
    async initMetamask(needRequest = false) {
      this.wallet = window.ethereum;
      this.address = this.wallet.selectedAddress;
      if (needRequest) {
        await this.wallet.request({ method: "eth_requestAccounts" });
      }
      
      this.fromChainId = this.wallet.chainId;
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.supportListShow = false;
      this.checkNetwork(this.fromNetwork);
      this.listenAccountChange();
      this.listenNetworkChange();
    },
    //连接metamask
    async connectMetamask() {
      if (!window.ethereum) {
        this.$message({ message: "未检测到Metamask插件" });
      } else {
        try {
          this.walletType = "metamask";
          sessionStorage.setItem("walletType", "metamask");
          await this.initMetamask(true);
        } catch (e) {
          this.$message({ message: "连接失败, 请稍后重试" });
        }
      }
    },
    // 连接walletConnect
    async connectWalletConnect() {
      const provider = new WalletConnectProvider({
        // infuraId: "27e484dcd9e3efcfd25a83a78777cdf1",
        rpc: {
          1: "https://mainnet.infura.io/v3/" + infuraProjectId, //Ethereum 主网
          3: "https://ropsten.infura.io/v3/" + infuraProjectId, //Ethereum 测试网
          56: "https://bsc-dataseed1.defibit.io", //BSC 主网
          97: "https://data-seed-prebsc-2-s1.binance.org:8545", //BSC 测试网
          // 128: "https://http-mainnet.hecochain.com", //Heco 主网
          128: "https://http-mainnet-node.huobichain.com", //Heco 主网
          256: "https://http-testnet.hecochain.com", //Heco 测试网
        },
      });
      const res = await provider.enable();
      console.log(res);
      // sessionStorage.setItem("walletType", "walletConnect")
      // // Create a connector
      // const connector = new WalletConnect({
      //   bridge: "https://bridge.walletconnect.org", // Required
      //   qrcodeModal: QRCodeModal,
      // });
      // this.wallet = connector;

      // // Check if connection is already established
      // if (!connector.connected) {
      //   // create new session
      //   connector.createSession();
      // }

      // // Subscribe to connection events
      // connector.on("connect", (error, payload) => {
      //   if (error) {
      //     throw error;
      //   }

      //   // Get provided accounts and chainId
      //   const { accounts, chainId } = payload.params[0];
      //   console.log(accounts, chainId, 132465)
      //   this.address = accounts[0];
      //   this.walletListShow = false;
      // });

      // connector.on("session_update", (error, payload) => {
      //   if (error) {
      //     throw error;
      //   }

      //   // Get updated accounts and chainId
      //   const { accounts, chainId } = payload.params[0];
      // });

      // connector.on("disconnect", (error, payload) => {
      //   if (error) {
      //     throw error;
      //   }
      //   console.log(payload, "disconnect")

      //   // Delete connector
      // });
    },
    //监听账户改变
    listenAccountChange() {
      this.wallet.on("accountsChanged", (accounts) => {
        // console.log(accounts, 556)
        if (accounts.length && this.walletType) {
          this.address = accounts[0];
          // this.getBalance();
        } else {
          this.address = "";
        }
      });
    },

    //监听网络改变
    listenNetworkChange() {
      this.wallet.on("chainChanged", (chainId) => {
        if (chainId && this.walletType) {
          this.fromChainId = chainId;
          this.checkNetwork(this.fromNetwork);
        }
      });
    },
    checkNetwork(fromNetwork) {
      const network = this.networkList.filter(
        (item) => item.value === fromNetwork
      )[0];
      // console.log(network[ETHNET], 666, this.fromChainId, 777, network[ETHNET] !== this.fromChainId)
      if (network.hasOwnProperty(ETHNET)) {
        if (
          network[ETHNET] !== this.fromChainId &&
          this.walletType === "metamask"
        ) {
          this.fromNetworkMsg = this.$t("home.home8");
        } else {
          this.fromNetworkMsg = "";
        }
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
    },
    //通过调用metamask签名，派生多链地址
    async derivedAddress() {
      try {
        if (!this.address) {
          await this.wallet.request({ method: "eth_requestAccounts" });
        }
        const jsonRpcSigner = this.provider.getSigner();
        let message = "Derive Accounts";
        const signature = await jsonRpcSigner.signMessage(message);
        const msgHash = ethers.utils.hashMessage(message);
        const msgHashBytes = ethers.utils.arrayify(msgHash);
        const recoveredPubKey = ethers.utils.recoverPublicKey(
          msgHashBytes,
          signature
        );
        const account = {
          address: {
            Ethereum: this.address,
            BSC: this.address,
            Heco: this.address,
          },
        };
        if (recoveredPubKey.startsWith("0x04")) {
          const compressPub = ethers.utils.computePublicKey(
            recoveredPubKey,
            true
          );
          const pub = compressPub.slice(2);
          account.pub = pub;
          const { chainId, assetId, prefix } = MAIN_INFO;
          const {
            chainId: NULSChainId,
            assetId: NULSAssetId,
            prefix: NULSPrefix,
          } = NULS_INFO;
          // console.log(NULSChainId, NULSAssetId, NULSPrefix, 55)
          account.address.NERVE = nerve.getAddressByPub(
            chainId,
            assetId,
            pub,
            prefix
          );
          account.address.NULS = nerve.getAddressByPub(
            NULSChainId,
            NULSAssetId,
            pub,
            NULSPrefix
          );
          const accountList =
            JSON.parse(localStorage.getItem("accountList")) || [];
          accountList.push(account);
          const syncRes = await this.syncAccount(pub, account.address);
          if (syncRes) {
            localStorage.setItem("accountList", JSON.stringify(accountList));
            // 重新计算fromAddress
            const address = this.address;
            this.address = "";
            setTimeout(()=> {
              this.address = address;
            }, 16)
          } else {
            this.$message({
              type: "error",
              message: "网络异常，同步账户失败，请稍后再试",
            });
          }
        }
      } catch (e) {
        console.log(e, 556)
        this.address = "";
        this.$message({ message: "派生多链地址失败", type: "error" });
      }
      this.showSign = false;
    },
    async syncAccount(pub, accounts) {
      const addressList = [];
      Object.keys(accounts).map((v) => {
        addressList.push({
          chain: v,
          address: accounts[v],
        });
      });
      const res = await this.$request({
        url: "/wallet/sync",
        data: { pubKey: pub, addressList },
      });
      if (res.code === 1000) {
        return true;
      }
      return false;
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
        this.assetsList = res.data;
      }
    },
    // 下拉选择资产
    async selectAsset(asset) {
      this.amount = "";
      this.chooseAsset = asset;
      this.assetListModal = false;
      // console.log(asset)
      //assset.assetId为0 则为异构链上token资产
      if (asset.assetId === 0 && this.fromNetwork !== "NULS") {
        this.checkCrossInAuthStatus(asset);
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
    // 计算交易手续费
    async getTransferFee() {
      try {
        this.fee = "";
        if (!this.chooseAsset || !this.amount) return;
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
        this.checkAmountFee();
      } catch (e) {
        console.error(e, "计算手续费失败")
      }
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
        console.log(res, 55);
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
      nvtFee = this.speedUpFee ? Number(nvtFee) + 3 : nvtFee;
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
        console.log(res, 55)
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
      if (res.success) {
        this.$message({
          message: this.$t("tips.tips1"),
          type: "success",
          duration: 2000,
        });
      } else {
        this.$message({ message: res.msg, type: "warning", duration: 2000 });
      }
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
    quit() {
      this.walletType = "";
      sessionStorage.removeItem("walletType");
      this.address = "";
      this.supportListShow = true;
    },
  },
};
</script>
<style lang="less">
@BColor: #ebeef8;
@labelColor: #99a3c4;
.home {
  background-color: #f0f2f7;
  height: 100%;
  .home-content {
    background-color: #fff;
    margin: 15px;
    padding: 15px;
    min-height: calc(100% - 94px);
    border-radius: 10px;
  }
  .support-list {
    width: 80%;
    margin: 0 auto;
    .title {
      font-size: 20px;
      font-weight: 600;
      line-height: 2;
      margin-bottom: 5px;
      display: inline-block;
    }
    p {
      height: 50px;
      line-height: 50px;
      padding: 0 15px;
      margin-bottom: 10px;
      border-radius: 16px;
      background-color: rgb(239, 244, 245);
      transition: background-color 0.2s ease 0s;
      cursor: pointer;
      color: rgb(31, 199, 212);
      font-size: 16px;
      font-weight: 600;
      &:hover {
        opacity: 0.65;
      }
      img {
        margin-top: 7px;
      }
    }
  }
  .show-sign-button {
    text-align: center;
    padding-top: 50px;
    .el-button {
      padding: 12px 50px;
    }
  }
  .account-select {
    .from,
    .to {
      width: 100%;
      height: 54px;
      font-size: 14px;
      border-radius: 10px;
      background-color: @BColor;
      padding: 15px;
      display: flex;
      align-items: center;
      color: @labelColor;
    }

    .network {
      color: #515e7b;
      margin: 0 10px;
      width: 66px;
    }
    .to {
      margin-bottom: 30px;
      .address {
        position: absolute;
        font-size: 14px;
        left: 142px;
      }
    }
    .el-select {
      width: 100%;
      left: 10px;
      z-index: 2;
      .el-input__inner {
        background: transparent;
        border: none;
        height: auto;
        line-height: initial;
        padding: 0;
        // font-size: 14px;
      }
      .el-input__suffix {
        .el-input__icon {
          line-height: initial;
          font-size: 16px;
          font-weight: 600;
        }
      }
    }
  }
  .amount,
  .fee {
    .label {
      font-size: 12px;
      color: @labelColor;
      margin-right: 5px;
      margin-bottom: 6px;
      line-height: 1;
    }
  }
  .amount {
    .label-wrap {
      display: flex;
      justify-content: space-between;
      align-items: center;
      span {
        color: @labelColor;
        font-size: 12px;
      }
    }
    .amount-inner {
      height: 74px;
      background-color: @BColor;
      border-radius: 10px;
      display: flex;
      align-items: center;
    }
    .select-asset-btn {
      cursor: pointer;
      color: #99a3c4;
      padding: 5px 10px;
      border-radius: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      // min-width: 130px;
      &:hover {
        background-color: rgb(224, 217, 235);
      }
      img {
        width: 30px;
        height: 30px;
        margin-right: 5px;
      }
    }
    .el-input-group__prepend {
      .el-select .el-input {
        width: auto;
        min-width: 150px;
      }
    }
    .el-input-group__prepend,
    .el-input-group__append {
      background-color: @BColor;
      padding: 0 10px;
      border: none;
      width: auto;
      .el-button {
        color: @labelColor;
        font-weight: bold;
      }
    }
    .el-select .el-select__caret {
      font-weight: bold;
      color: #99a3c4;
    }
    .el-input__inner {
      background-color: @BColor !important;
      border: none !important;
      font-weight: bold;
      color: #99a3c4 !important;
      &::-webkit-input-placeholder {
        font-weight: bold;
        color: #99a3c4;
      }
    }
  }
  .fee {
    margin-bottom: 30px;
    .fee-inner {
      font-size: 15px;
    }
  }
  .msg-wrap {
    margin-bottom: 30px;
    position: relative;
    .from-validate-msg,
    .amount-validate-msg {
      position: absolute;
      color: #f56c6c;
      font-size: 12px;
      line-height: 1;
      padding: 4px 0 0 5px;
    }
  }

  .btn-wrap {
    width: 90%;
    margin: 20px auto 0;
    .el-button {
      width: 100%;
    }
  }
}
.assets-list-dialog {
  li {
    display: flex;
    // justify-content: space-between;
    align-items: center;
    cursor: pointer;
    height: 48px;
    &:hover {
      // background-color: rgb(224, 217, 235);
    }
    .logo-wrap {
      width: 30px;
      height: 30px;
      margin-right: 15px;
      img {
        width: 100%;
        height: 100%;
      }
    }
    .asset-info {
      p {
        font-size: 15px;
        font-weight: bold;
        color: #515b7d;
      }
      span {
        font-size: 12px;
        color: @labelColor;
      }
    }
    &.active {
      opacity: 0.65;
    }
  }
}
</style>
