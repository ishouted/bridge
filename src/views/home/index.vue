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
        <!-- <div class="swap-type">
          <el-radio-group  v-model="swapType" size="medium">
            <el-radio-button label="swap">{{ $t("home.home13") }}</el-radio-button>
            <el-radio-button label="nerve">{{ $t("home.home14") }}</el-radio-button>
          </el-radio-group>
        </div> -->
        <tab-switch v-model="swapType"></tab-switch>
        <nerve-swap
          v-show="swapType==='nerve'"
          :address="address"
          :walletType="walletType"
          :provider="provider"
          :fromNetwork="fromNetwork"
          :fromChainId="fromChainId"
          :fromAddress="fromAddress"
        ></nerve-swap>
        <swft-swap
          v-show="swapType==='swft'"
          :address="address"
          :walletType="walletType"
          :provider="provider"
          :fromNetwork="fromNetwork"
          :fromChainId="fromChainId"
          :fromAddress="fromAddress"
        >
        </swft-swap>
        <!-- <nerve-swap
          :address="address"
          :walletType="walletType"
          :provider="provider"
          :fromNetwork="fromNetwork"
          :fromChainId="fromChainId"
          :fromAddress="fromAddress"
        ></nerve-swap> -->
      </div>
    </div>
  </div>
</template>

<script>
import HeaderBar from "@/components/HeaderBar";
import TabSwitch from "@/components/TabSwitch";
import SwftSwap from "./SwftSwap";
import NerveSwap from "./NerveSwap";
import { MAIN_INFO, NULS_INFO, ETHNET } from "@/config";
import nerve from "nerve-sdk-js";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { supportChainList } from "../../api/util"

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

const infuraProjectId = "e81110266e064ad6a21990561a18a6eb";

export default {
  data() {
    return {
      loading: true,
      supportListShow: true, //显示可连接钱包列表
      showSign: true, //显示派生地址
      address: "", //metamask当前选中地址
      swapType: "nerve",
      provider: null,
      fromChainId: "",
      walletType: sessionStorage.getItem("walletType"), // 连接钱包类型 metamask walletConnect
    };
  },

  components: {
    HeaderBar,
    SwftSwap,
    NerveSwap,
    TabSwitch
  },

  watch: {
    address: {
      immediate: true,
      handler(val) {
        if (!val) return;
        const currentAccount = getCurrentAccount(val);
        const config = JSON.parse(sessionStorage.getItem("config"));
        const chainLength = Object.keys(config).length;
        const addressListLength = currentAccount ? Object.keys(currentAccount.address).length : 0
        // this.showSign = currentAccount ? false : true;
        this.showSign = chainLength !== addressListLength
      },
    },
    fromChainId: {
      immediate: true,
      handler(val) {
        if (!val) return;
        const sessionNetwork = sessionStorage.getItem("network");
        const NChains = ["NERVE", "NULS"]
        if (NChains.indexOf(sessionNetwork) > -1) return;
        const chain = supportChainList.filter(v => v[ETHNET] === val)[0];
        chain && this.$store.commit("changeNetwork", chain.value)
      }
    }
  },

  computed: {
    fromNetwork() {
      return this.$store.state.network;
    },
    fromAddress() {
      const currentAccount = getCurrentAccount(this.address);
      return currentAccount && !this.showSign ? currentAccount.address[this.fromNetwork] : "";
    },
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
          this.initMetamask();
        }
      } else if (this.walletType === "walletConnect") {
        // this.initWalletConnect();
      }
      this.loading = false;

    },
    // 初始化metamask wallet provider address
    async initMetamask() {
      this.wallet = window.ethereum;
      this.address = this.wallet.selectedAddress;
      if (!this.address) {
        await this.requestAccounts();
      }
      this.fromChainId = this.wallet.chainId;
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.supportListShow = false;
      this.listenAccountChange();
      this.listenNetworkChange();
    },
    async requestAccounts() {
      const res = await this.wallet.request({ method: "eth_requestAccounts" });
      if (res.length) {
        this.address = res[0]
      }
    },
    //连接metamask
    async connectMetamask() {
      if (!window.ethereum) {
        this.$message({ message: this.$t("tips.tips3"), type: "warning" });
      } else {
        try {
          this.walletType = "metamask";
          sessionStorage.setItem("walletType", "metamask");
          await this.initMetamask();
        } catch (e) {
          // console.log(e, 222)
          this.$message({ message: e.message, type: "warning"});
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
        // console.log(accounts, "===accounts-changed===")
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
        }
      });
    },
    //通过调用metamask签名，派生多链地址
    async derivedAddress() {
      this.loading = true;
      try {
        if (!this.address) {
          await this.requestAccounts();
        }
        const jsonRpcSigner = this.provider.getSigner();
        let message = "Derive Multi-chain Address";
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
            OKExChain: this.address
          },
        };
        /* const config = JSON.parse(sessionStorage.getItem("config"));
        if (config.OKExChain) {
          account.address.OKExChain = this.address;
        } */
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
          const accountList = getAccountList()
          const existIndex = accountList.findIndex(v => v.pub === account.pub);
          // 原来存在就替换，找不到就push
          if (existIndex > -1) {
            accountList[existIndex] = account
          } else {
            accountList.push(account);
          }
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
              type: "warning",
              message: this.$t("tips.tips4"),
            });
          }
        }
      } catch (e) {
        // console.log(e, 556)
        this.address = "";
        this.$message({ message: this.$t("tips.tips5"), type: "warning" });
      }
      this.loading = false;
      // this.showSign = false;
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
    padding: 25px 15px;
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
      // padding: 12px 50px;
      border-radius: 10px;
      padding: 16px 50px;
    }
  }
  .swap-type {
    margin-bottom: 15px;
    display: flex;
    justify-content: center;
    .el-radio-group {
      border-radius: 20px;
      background: #EBEEF8;
      .el-radio-button {
        .el-radio-button__inner {
          border: none;
          box-shadow: none;
          background-color: #EBEEF8;
          color: #99A3C4;
          border-radius: 20px;
          padding: 13px 20px;
          font-size: 15px;
        }
        &.is-active {
          .el-radio-button__inner {
            background-color: #5BCAF9;
            color: #fff;
            border-radius: 20px;
          }
        }
      }
      .el-radio-button__inner {
        width: 130px;
      }
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
      // color: #515e7b;
      margin: 0 15px 0 10px;
      width: 66px;
    }
    .to {
      margin-bottom: 30px;
      .address {
        position: absolute;
        font-size: 14px;
        left: 147px;
        color: #515B7D;
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
        color: #515B7D;
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
      /* img {
        width: 30px;
        height: 30px;
        margin-right: 5px;
      }
      
      .origin-chain {
        display: inline-block;
        border: 1px solid #5BCAF9;
        border-radius: 2px;
        padding: 1px 5px;
        font-size: 12px;
        font-weight: normal;
        margin-left: -6px;
        color: #5BCAF9;
        transform: scale(0.8);
        min-width: 50px;
        text-align: center;
      } */
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
      /* font-weight: bold;
      color: #99a3c4 !important; */
      font-size: 16px;
      font-weight: normal !important;
      color: #515B7D !important;
      &::-webkit-input-placeholder {
        font-weight: normal;
        color: #515B7D !important;
      }
     /*  &::-webkit-input-placeholder {
        font-weight: bold;
        color: #99a3c4;
      } */
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
    width: 100%;
    margin: 20px auto 0;
    .el-button {
      width: 100%;
      border-radius: 10px;
      padding: 16px 20px;
    }
  }
  .asset-info-wrap {
    display: flex;
    flex-direction: column;
  }
  .logo-img {
    width: 30px;
    height: 30px;
    margin-right: 5px;
  }
  .origin-chain {
    display: inline-block;
    border: 1px solid #5BCAF9;
    border-radius: 2px;
    padding: 1px 5px;
    font-size: 12px;
    font-weight: normal;
    // margin-left: -6px;
    color: #5BCAF9;
    transform: translateX(-10%) scale(0.8);
    min-width: 50px;
    text-align: center;
  }
}
.assets-list-dialog {
  .el-dialog {
    max-height: 60vh;
    overflow: auto;
    .el-dialog__body {
      padding: 5px 20px 15px;
    }
  }
  li {
    display: flex;
    // justify-content: space-between;
    align-items: center;
    cursor: pointer;
    height: 55px;
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
        font-size: 13px;
        color: @labelColor;
      }
    }
    &.active {
      opacity: 0.65;
    }
  }
}
</style>
