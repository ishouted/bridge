<template>
  <div class="connect-example w1200">
    <el-button type="primary" @click="walletListShow = true">连接钱包</el-button>
    <div class="content" v-if="address">
        <div class="address">账户地址: {{ address }}</div>
        <div class="network">metamask网络: {{network}}</div>
        <el-button type="primary" @click="sign" v-if="showSign">获取公钥派生账户</el-button>
        <el-button type="primary" @click="send">发起交易</el-button>
        <el-button type="primary" @click="sendWC">walletConnect发起交易</el-button>
        <el-button type="primary" @click="transfer">测试拼接Pub转账</el-button>
    </div>
   
    <el-dialog
      title="选择钱包"
      class="wallet-select-dialog"
      :visible.sync="walletListShow"
      width="40%">
      <ul>
        <li @click="connectMetamask">Metamask</li>
        <li @click="connectWalletConnect">WalletConnect</li>
      </ul>
    </el-dialog>
  </div>
</template>

<script>
import { getTransactionParameters } from "./api"
const ethers = require('ethers');
var ethUtil = require('ethereumjs-util');
var sigUtil = require('eth-sig-util');
import axios from "axios"
// import WalletConnectProvider from "@walletconnect/web3-provider";
import { getAddressByPub, appSplicingPub, transactionAssemble } from "nerve-sdk-js"
var Signature = require("elliptic/lib/elliptic/ec/signature")
import { isBeta } from "@/api/util"
import { MAIN_INFO, NULS_INFO } from "@/config"
export default {
  data () {
    return {
      address: "",
      walletListShow: false,
      showSign: true,
      wallet: null,
      provider: null,
      fromChainId: ""
    }
  },

  components: {},

  watch: {
    // 跨链交易对变更 检查插件网络是否选择正确
    pair(val) {
      this.checkNetwork()
    },
    address: {
      immediate: true,
      handler(val) {
        if (!val) return;
        const accountList = this.getAccountList();
        const exist = accountList.find((item) => {
          return item.address.Ethereum === val
        })
        this.showSign = exist ? false : true
      }
    }
  },

  computed: {
    network() {
      const chainEnum = {
        "0x1": "Ethereum Mainnet",
        "0x3": "Ethereum Beta",
        "0x38": "BSC Mainnet",
        "0x61": "BSC Beta",
        "0x80": "Heco Mainnet",
        "0x100": "Heco Beta"
      }
      return chainEnum[this.fromChainId] ? chainEnum[this.fromChainId] : "metamask网络与交易网络不符，请重新选择"
    }
  },

  created() {
    this.initConnect();
  },

  mounted() {
    console.log(window.ethereum, 11)
    this.testPub = "a8272dd5d6583cfec2495231d729e2b61e4a5b71ffaaeefed3e8768689876d5ee102028d1f751c93def0f261e8140cd54973e679ec4e47246cad5ceae9be4b16"
    this.nervePub = "02a8272dd5d6583cfec2495231d729e2b61e4a5b71ffaaeefed3e8768689876d5e"
    // const pri = "d8cdccd432fd1bb7711505d97c441672c540ccfcdbba17397619702eeef1d403";
    // console.log("address: " + ethers.utils.computeAddress("0x04" + this.testPub))
    // console.log("addressByNuls: " + ethers.utils.computeAddress("0x" + "02a8272dd5d6583cfec2495231d729e2b61e4a5b71ffaaeefed3e8768689876d5e"))
  },

  methods: {
    getAccountList() {
      return JSON.parse(sessionStorage.getItem("accountList")) || [];
    },
    async sign() {
      const jsonRpcSigner = this.provider.getSigner();
      let message = "Derive Accounts";
      const signature = await jsonRpcSigner.signMessage(message);
      const msgHash = ethers.utils.hashMessage(message);
      const msgHashBytes = ethers.utils.arrayify(msgHash);
      const recoveredPubKey = ethers.utils.recoverPublicKey(msgHashBytes, signature);
      const account = {
        address: {
          Ethereum: this.address,
          BSC: this.address,
          Heco: this.address
        }
      }
      if (recoveredPubKey.startsWith("0x04")) {
        const compressPub = ethers.utils.computePublicKey(recoveredPubKey, true)
        const pub = compressPub.slice(2);
        account.pub = pub;
        const { chainId, assetId, prefix } = MAIN_INFO
        const { chainId: NULSChainId, assetId: NULSAssetId, prefix: NULSPrefix } = NULS_INFO
        console.log(NULSChainId, NULSAssetId, NULSPrefix, 55)
        account.address.NERVE = getAddressByPub(chainId, assetId, pub, prefix);
        account.address.NULS = getAddressByPub(NULSChainId, NULSAssetId, pub, NULSPrefix);
        const accountList = JSON.parse(sessionStorage.getItem("accountList")) || [];
        accountList.push(account)
        sessionStorage.setItem("accountList", JSON.stringify(accountList))
        this.showSign = false;
      }

      /* const signature = await jsonRpcSigner.signMessage(message);
      const msgParams = { data: message }
      msgParams.sig = signature
      const recovered = sigUtil.extractPublicKey(msgParams)
      console.log(recovered, 665544) */
    },
    initConnect() {
      const walletType = sessionStorage.getItem("walletType");
      if (!walletType) return;
      if (walletType === "metamask") {
        if (window.ethereum) {
          this.initMetamask(false)
        }
      } else if (walletType === "walletConnect") {
        this.initWalletConnect();
      }
      
      this.listenAccountChange();
      this.listenNetworkChange()
    },
    // 初始化metamask wallet provider address
    async initMetamask(needRequest = false) {
      this.wallet = window.ethereum;
      if (needRequest) {
        await this.wallet.request({method: 'eth_requestAccounts'});
      }
      this.address = this.wallet.selectedAddress;
      this.fromChainId = this.wallet.chainId;
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
    },
    async initWalletConnect() {
      const provider = new WalletConnectProvider({
        rpc: {
          /* 1: "https://mainnet.mycustomnode.com",
          3: "https://ropsten.mycustomnode.com", */
          256: "https://http-testnet.hecochain.com",
        },
      });
      const res = await provider.enable();
      console.log(res)
     /*  const connector = new WalletConnect({
        bridge: "https://bridge.walletconnect.org", // Required
        qrcodeModal: QRCodeModal,
      });
      this.wallet = connector;
      this.address = connector.accounts && connector.accounts[0]; 
      console.log(connector, 55)*/
    },
    async connectMetamask() {
      if (!window.ethereum) {
        this.$message({message: "未检测到Metamask插件"});
      } else {
        try {
          sessionStorage.setItem("walletType", "metamask")
          await this.initMetamask(true);
          this.walletListShow = false;
        } catch (e) {
          this.$message({message: "连接失败, 请稍后重试"});
        }
      }
    },
    async connectWalletConnect() {
      const provider = new WalletConnectProvider({
        // infuraId: "27e484dcd9e3efcfd25a83a78777cdf1",
        rpc: {
          // 1: "https://mainnet.infura.io/v3"
          // 3: "https://ropsten.infura.io/v3"
          // 56: "https://bsc-dataseed1.defibit.io",
          // 97: "https://data-seed-prebsc-2-s1.binance.org:8545",
          // 128: "https://http-mainnet.hecochain.com", //Heco 主网
          // 256: "https://http-testnet.hecochain.com", //Heco 测试网
        },
      });
      const res = await provider.enable();
      console.log(res)
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
      this.wallet.on('accountsChanged', (accounts) => {
        // console.log(accounts, 556)
        if (accounts.length) {
          this.address = accounts[0];
          this.getBalance();
        } else {
          this.address = ''
        }
      })
    },

    //监听网络改变
    listenNetworkChange() {
      this.wallet.on('chainChanged', (chainId) => {
        if (chainId) {
          this.fromChainId = chainId;
          this.checkNetwork(chainId)
        }
      })
    },
    checkNetwork() {
      /* const selectHeterogeneousChainObj = avaliableNetworkList[this.selectHeterogeneousChain];
      if (selectHeterogeneousChainObj[ETHNET] !== chainId) {
        this.networkError = true
      } else {
        this.networkError = false;
        this.getBalance()
      } */
    },

    async getBalance() {
      /* if (this.networkError || !this.address) return;
      this.getEthBalance();
      if (this.selectedChainItem.isToken) {
        this.getERC20Balance();
        this.getERC20Allowance()
      } */
    },

    async send() {
      const multySignAddress = "0xb339211438dcbf3d00d7999ad009637472fc72b3";
      const nerveAddress = "TNVTdTSPTXQudD2FBSefpQRkXTyhhtSjyEVAF";
      const contractAddress = "0x74a163fcd791ec7aab2204ffabf1a1dfb8854883"
      // console.log(this.address, 4)
      const transactionParameters = await getTransactionParameters(this.address, multySignAddress, nerveAddress, "0.01", contractAddress, 8)
      console.log(transactionParameters, 123)

      const nonce = await this.provider.getSigner().getTransactionCount();
      console.log(nonce, 555)
      const gasPrice = await this.provider.getGasPrice();
      const gasLimit = 100000;
      const gas = '0x2710'
      const optional = {nonce, gasLimit, gasPrice};
      // const optional = {nonce, gasPrice, gas};
      const params = {...transactionParameters, ...optional}
      console.log(params, 555)

      /* const hash = ethers.utils.serializeTransaction(params)
      console.log(hash, 55)
      var msg = ethUtil.bufferToHex(new Buffer(hash, 'utf8'))
      const result = await this.wallet.request({
        method: "personal_sign",
        params: [msg, this.address]
      }) */
      //metamask


      /* var msgHash = ethUtil.keccak256('An amazing message, for use with MetaMask!')
      console.log(msgHash, "msgHashmsgHashmsgHash")
      var from = this.address
      web3.eth.sign(from, msgHash, function (err, result) {
        if (err) return console.error(err, 665544)
        console.log('SIGNED:' + result)
      }) */
      /* const result = await this.wallet.request({
        method: "eth_sign",
        params: [this.address, msgHash]
      }) */
      // return

      /* var msg = ethUtil.bufferToHex(new Buffer(JSON.stringify(params), 'utf8'))
      const result = await this.wallet.request({
        method: "personal_sign",
        params: [msg, this.address]
      }) */


      // var msgHash = ethUtil.keccak256(new Buffer(JSON.stringify(params), 'utf8'))
      /* var msgHash = ethUtil.keccak256('An amazing message, for use with MetaMask!')
      const result = await this.wallet.request({
        method: "eth_sign",
        params: [this.address, msgHash]
      }) */

      /* const msgParams = JSON.stringify({
        domain: {
          chainId: 256,
          name: 'Cross In',
          verifyingContract: '0x74a163fcd791ec7aab2204ffabf1a1dfb8854883',
          version: '1',
        },

        message: {
          ...params
        },
        // Refers to the keys of the *types* object below.
        primaryType: 'CrossIn',
        types: {
          // TODO: Clarify if EIP712Domain refers to the domain the contract is hosted on
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          // Not an EIP712Domain definition
          CrossIn: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'string' },
            { name: 'data', type: 'string' },
            { name: 'nonce', type: 'string' },
            { name: 'gasLimit', type: 'string' },
            { name: 'gasPrice', type: 'string' },
          ],
        },
      });

      const result = await this.wallet.request({
        method: "eth_signTypedData_v4",
        params: [this.address, msgParams]
      }) */

      console.log(result, 55)
      axios.post("/nabox-api/tx/cross/transfer", {
        language: "CHS",
        fromChain: "Heco",
        toChain: "NERVE",
        fromAddress: this.address,
        toAddress: "TNVTdTSPTXQudD2FBSefpQRkXTyhhtSjyEVAF",
        txHex: result,
        // chainId: 103, 
        // assetId: 1,
        contractAddress: "0x74a163fcd791ec7aab2204ffabf1a1dfb8854883"
      })

      /* const signer = this.provider.getSigner();
      const res = await signer.signTransaction(transactionParameters)
      console.log(res, 'signer-sign') */

     /*  const randomWallet = ethers.Wallet.createRandom();
      const wallet = randomWallet.connect(this.provider);
      var a = await wallet.sign(transactionParameters.data);
      console.log(a, 5465465); */

      /* if (transactionParameters) {
        const res = await window.ethereum.request({
          method: 'eth_signTransaction',
          params: [transactionParameters.data],
        });
        console.log(res, 66)
        
      } else {
        this.$message({message: transactionParameters.msg})
      } */

      //walletconnect
      /* try {
        const res = await this.wallet.signTransaction(transactionParameters)
        console.log(res, 'walletconnect-sign')
      } catch(e) {
        console.log(e, 'wallet-send-error')
      } */
      
    },

    async sendWC() {
      const multySignAddress = "0xb339211438dcbf3d00d7999ad009637472fc72b3";
      const nerveAddress = "TNVTdTSPTXQudD2FBSefpQRkXTyhhtSjyEVAF";
      const contractAddress = "0x74a163fcd791ec7aab2204ffabf1a1dfb8854883"
      // console.log(this.address, 4)
      const transactionParameters = await getTransactionParameters(this.address, multySignAddress, nerveAddress, "0.01", contractAddress, 8)
      console.log(transactionParameters, 123)

      const nonce = await this.provider.getSigner().getTransactionCount();
      // console.log(nonce, 555)
      const gasPrice = await this.provider.getGasPrice();
      // const gasLimit = 100000;
      const gas = '0x2710'
      // const optional = {nonce, gasLimit, gasPrice};
      const optional = {nonce, gasPrice, gas, from: this.address};
      const params = {...transactionParameters, ...optional}
      //walletconnect
      try {
        const res = await this.wallet.signTransaction(params)
        console.log(res, 'walletconnect-sign')
      } catch(e) {
        console.log(e, 'wallet-send-error')
      }
    },
    async transfer() {
      let nonce
      try {
        let data = {
          language: "CHS",
          chain: "NERVE",
          address: "TNVTdTSPKugPqpJX3wes3YcuB4nHqdTR33uvD",
          chainId: 5,
          assetId: 1,
          refresh: true
        };
        const res = await axios.post("/nabox-api/wallet/address/asset", data);
        if (res.data.code === 1000) {
          nonce = res.data.data.nonce;
        }
      } catch (e) {
        console.error(e);
      }
      let inputs = [], outputs = []
      inputs.push({
        address: "TNVTdTSPKugPqpJX3wes3YcuB4nHqdTR33uvD",
        assetsChainId: 5,
        assetsId: 1,
        amount: 10000000,
        locked: 0,
        nonce: nonce
      });
      outputs.push({
        address: "TNVTdTSPTXQudD2FBSefpQRkXTyhhtSjyEVAF",
        assetsChainId: 5,
        assetsId: 1,
        amount: 10000000,
        lockTime: 0
      });
      const tAssemble = transactionAssemble(inputs, outputs, "", 2, {});
      const hash = tAssemble.getHash().toString("hex");

      const msgHash = "0x" + hash
      /* const msgHash = ethers.utils.arrayify(hash);
      const jsonRpcSigner = this.provider.getSigner();
      let x = await jsonRpcSigner.signMessage(aaa); */

      /* let flat = await this.wallet.request({
        method: "personal_sign",
        params: [msgHash, this.address]
      }) */
      let flat = await this.wallet.request({
        method: "eth_sign",
        params: [this.address, msgHash]
      })
      // const expanded = ethers.utils.splitSignature(flat);
      flat = flat.slice(2) // 去掉0x
      
      const r = flat.slice(0, 64);
      const s = flat.slice(64, 128);
      const recoveryParam = flat.slice(128)
      let signature = new Signature({r, s}).toDER("hex");
      // signature = signature.slice(2)
      const signData = appSplicingPub(signature, this.nervePub);

      console.log("msgHash: " + msgHash)
      console.log("公钥: " + this.nervePub)
      console.log("old: " + flat)
      console.log("new: " + signature)
      console.log("signData: " + signData.toString("hex"))

      tAssemble.signatures = signData;
      const txHex = tAssemble.txSerialize().toString("hex");
      this.broadcastTx(txHex)
    },
    async broadcastTx(txHex) {
      this.$post("http://beta.public.nerve.network", "validateTx", [txHex])
    },
  }
}

</script>
<style lang="less">
  .connect-example{
    padding-top: 100px;
  }
  .wallet-select-dialog {
    .el-dialog__body {
      padding-bottom: 30px;
    }
    li {
      text-align: center;
      height: 40px;
      line-height: 40px;
      font-size: 20px;
      border-bottom: 1px solid #ccc;
      cursor: pointer;
      &:last-child {
        border-bottom: none;
      }
    }
  }
</style>