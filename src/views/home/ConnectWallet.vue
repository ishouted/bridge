<template>
  <div class="connect-wallet" v-loading="loading">
    <div class="metamask" v-if="!noSupport">
      <div class="not-connect" v-if="!address">
        <div class="connect-btn" v-if="!initialAccount" @click="getAccount">
          MetaMask
          <img class="fr" src="../../assets/img/metamask.svg" alt=""/>
        </div>
        <div v-else class="connecting">
          <div v-if="!connectError"><i class="el-icon-loading"></i>&nbsp;&nbsp;Initializing</div>
          <div class="connect-error-tip" v-else>Error connecting.
            <el-button @click="getAccount">Try Again</el-button>
          </div>
          <div>
            <div class="fl">MetaMask<br/> Easy-to-use browser extension.</div>
            <img class="fr" src="../../assets/img/metamask.svg" alt=""/>
          </div>
        </div>
      </div>
      <div class="metamask-account" v-else>
        <div class="heterogeneous-network clear">
          <span class="label fl">{{$t('recharge.recharge25')+': '}}</span>
          <div class="heterogeneous-network-list">
              <span :class="{'active': selectHeterogeneousChain===item.chainName}"
                    v-for="item in heterogeneousList"
                    :key="item.chainName"
                    @click="selectHeterogeneousChain=item.chainName">
                {{getNetworkName(item.chainName)}}
              </span>
          </div>
        </div>
        <div class="netword">
          <span class="network-tip" v-if="networkError">{{networkErrorTip}}</span>
        </div>
        <div class="address">
          <span class="label">{{$t('recharge.recharge26')}}</span>
          <font class="click" @click="toUrl('address')">{{address}}</font>
          <i class="iconfont iconfuzhi click" @click="copy(address)"></i>
        </div>
        <div class="balance">
          <span class="label">{{$t('recharge.recharge27')}}</span>
          <img src="./../../assets/img/loading.svg" v-if="balanceLoading">
          <font v-else>{{ethBalance}}</font>&nbsp;{{selectHeterogeneousChain}}
          <i class="el-icon-refresh fW600 font14 click" @click="getEthBalance" v-show="!balanceLoading"></i>
        </div>
        <div class="balance" v-if="selectedChainItem.isToken">
          <span class="label">{{changeAssetInfo.symbol}}{{$t('recharge.recharge27')}}</span>
          <img src="./../../assets/img/loading.svg" v-if="tokenLoading">
          <font v-else>{{tokenBalance}}</font>&nbsp;{{changeAssetInfo.symbol}}
          <i class="el-icon-refresh fW600 font14 click" @click="getERC20Balance" v-show="!tokenLoading"></i>
        </div>
        <el-form :inline="true" :model="crossForm" :rules="crossRules" ref="crossForm" class="cross_form">
          <el-form-item label="" prop="numbers">
            <el-input v-model="crossForm.numbers" :placeholder="$t('recharge.recharge11')">
            </el-input>
            <div class="click all" @click="allIn">MAX</div>
          </el-form-item>
          <div class="token-tip" v-if="selectedChainItem.isToken && needAuth">
            <template v-if="!refreshAllowance">
              {{selectedChainItem.chainName ==='ETH' ? 'ERC20':selectedChainItem.chainName ==='BNB' ? 'BEP20':'HRC20'}}
              {{$t('recharge.recharge28')}}
              <span class="click" @click="approveERC20" style="margin-right: 5px">{{$t('recharge.recharge29')}}</span>
            </template>
            <template v-else>
              <img src="./../../assets/img/loading.svg">
            </template>
            <i class="el-icon-refresh fW600 font14 click" @click="getERC20Allowance"></i>
          </div>
          <div></div>
          <el-button :class="{'disabled-btn':selectedChainItem.isToken&&needAuth || networkError}" type="primary"
                     size="small" @click="submitCrossForm('crossForm')"
                     :disabled="selectedChainItem.isToken&&needAuth || networkError">{{$t('recharge.recharge13')}}
          </el-button>
        </el-form>
      </div>
    </div>
    <div class="metamask-mobile" v-else>
      <p>{{$t('recharge.recharge33')}}</p>
    </div>
    <el-dialog :title="$t('home.home8')" width="600px" class="across_info"
               :append-to-body="true"
               :close-on-click-modal="false"
               :close-on-press-escape="false"
               :visible.sync="acrossInfoDialogForm">
      <div class="dialog_info">
        <ul>
          <li><span>{{$t('home.home9')}}:</span>{{nvtAddress}}</li>
          <li><span>{{$t('home.home10')}}:</span>{{crossForm.numbers}} {{changeAssetInfo.symbol}}</li>
        </ul>
        <div class="yellow font12">{{$t('home.home11')}}</div>
      </div>

      <div class="dialog-footer" slot="footer">
        <el-button @click="acrossInfoDialogForm = false" style="margin-right: 20px">{{$t('password.password2')}}
        </el-button>
        <el-button type="primary" @click="acrossInfoSubmit">{{$t('password.password3')}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
  import {Minus, copys, connectToExplorer, networkOrigin} from '@/api/util'
  import {ETHNET, RUN_PATTERN} from '@/config'
  import {
    getProvider,
    getEthBalance,
    getERC20Balance,
    getERC20Allowance,
    approveERC20,
    sendETHForMK,
    sendERC20ForMK,
    validateAddress
  } from './api_ethers'

  //metamask上ETH BNB对应的chainID
  const avaliableNetworkList = {
    ETH: {
      ropsten: '0x3',
      homestead: '0x1'
    },
    BNB: {
      ropsten: '0x61',
      homestead: '0x38'
    },
    HT: {
      ropsten: '0x100',
      homestead: '0x80'
    }
  };
  export default {
    name: "",
    data() {
      let checkNumbers = (rule, value, callback) => {
        let decimals = this.changeAssetInfo.decimals;
        let patrn = new RegExp("^([1-9][\\d]{0,20}|0)(\\.[\\d]{0," + decimals + "})?$");
        if (!value || value === 0) {
          return callback(new Error(this.$t('recharge.recharge16')));
        } else if (!patrn.exec(value)) {
          callback(new Error(this.$t('recharge.recharge17')));
        } else {
          if (this.selectedChainItem.isToken) {
            if (Number(value) > Number(this.tokenBalance)) {
              callback(new Error(this.$t('recharge.recharge22') + this.tokenBalance + ' ' + this.changeAssetInfo.symbol))
            } else {
              callback();
            }
          } else {
            if (Number(value) > Number(this.ethBalance) || Number(this.ethBalance) === 0) {
              callback(new Error(this.$t('recharge.recharge22') + this.ethBalance + ' ' + this.changeAssetInfo.symbol));
            } else {
              callback();
            }
          }
        }
      };
      //移动端 桌面应用不支持
      this.noSupport = /Android|webOS|iPhone|iPad|BlackBerry/i.test(navigator.userAgent) || RUN_PATTERN;
      this.maxLimit = 0.01;
      return {
        isBeta: ETHNET === 'ropsten',
        hasMetaMask: false, //是否已安装metamask
        address: '', //metamask 选中的eth address
        ethBalance: 0,
        tokenBalance: 0,
        initialAccount: false, //账户连接中
        crossForm: {
          numbers: '',
        },
        crossRules: {
          numbers: [
            {validator: checkNumbers, trigger: ['blur', 'change']}
          ]
        },
        speedUpFee: false, // 是否加速
        balanceLoading: true,
        tokenLoading: true,
        erc20BalanceAbiFragment: [{
          "constant": true,
          "inputs": [{"name": "", "type": "address"}],
          "name": "balanceOf",
          "outputs": [{"name": "", "type": "uint256"}],
          "type": "function"
        }],
        acrossInfoDialogForm: false,
        loading: false,
        needAuth: false, //erc20资产是否需要授权
        txHash: '', //交易hash
        connectError: '', //连接钱包失败信息
        MKNetworkChainId: '', //metamask网络的chainId
        networkError: 'false',
        selectHeterogeneousChain: '', //选中的异构链名称
        selectedChainItem: {}, //选中的异构链
        refreshAllowance: false
      }
    },
    props: {
      //选中资产信息
      changeAssetInfo: {
        type: Object
      },
      nvtAddress: String,
      heterogeneousList: {
        type: Array,
        default: () => []
      },
    },
    watch: {
      selectHeterogeneousChain: {
        immediate: true,
        async handler(val) {
          if (!val) return;
          this.selectedChainItem = this.heterogeneousList.filter(v => v.chainName === val)[0];
          this.provider = getProvider(val, true);
          this.metamask && this.checkNetwork(this.metamask.chainId)
        }
      },
    },
    components: {},
    computed: {
      networkErrorTip() {
        const errorTip = {
          ETH: {
            beta: this.$t('recharge.recharge38'),
            main: this.$t('recharge.recharge37')
          },
          BNB: {
            beta: this.$t('recharge.recharge43'),
            main: this.$t('recharge.recharge42')
          },
          HT: {
            beta: this.$t('recharge.recharge46'),
            main: this.$t('recharge.recharge45')
          },
        };
        const network = this.isBeta ? "beta" : "main";
        return this.$t('recharge.recharge32') + errorTip[this.selectHeterogeneousChain][network];
      }
    },
    async created() {
      this.selectHeterogeneousChain = this.heterogeneousList[0].chainName;
      this.metamask = window.ethereum;
      if (this.metamask) {
        this.hasMetaMask = true;
        this.address = this.metamask.selectedAddress;
        this.listenAccountChange();
        this.listenNetworkChange()
      } else {
        this.hasMetaMask = false
      }
    },
    mounted() {
    },
    beforeDestroy() {

    },
    methods: {

      //连接metamask
      async getAccount() {
        if (!this.hasMetaMask) {
          this.$alert(this.$t('recharge.recharge36'), '', {
            confirmButtonText: this.$t('password.password3'),
            callback: () => {
              connectToExplorer('nuls', 'https://metamask.io/')
            }
          });
        } else {
          this.initialAccount = true;
          try {
            await this.metamask.request({method: 'eth_requestAccounts'});
            this.address = this.metamask.selectedAddress;
            this.checkNetwork(this.metamask.chainId);
            this.connectError = '';
            this.initialAccount = false
          } catch (e) {
            this.connectError = this.$t('recharge.recharge34');
            console.error('连接metamask失败' + e)
          }
        }
      },

      checkNetwork(chainId) {
        // console.log(chainId, 555, this.selectHeterogeneousChain, ETHNET)
        const selectHeterogeneousChainObj = avaliableNetworkList[this.selectHeterogeneousChain];
        if (selectHeterogeneousChainObj[ETHNET] !== chainId) {
          this.networkError = true
        } else {
          this.networkError = false;
          this.getBalance()
        }
      },

      //监听账户改变
      listenAccountChange() {
        this.metamask.on('accountsChanged', (accounts) => {
          if (accounts.length) {
            this.address = accounts[0];
            this.getBalance()
          } else {
            this.address = ''
          }
        })
      },

      //监听网络改变
      listenNetworkChange() {
        this.metamask.on('chainChanged', (chainId) => {
          if (chainId) {
            this.checkNetwork(chainId)
          }
        })
      },

      async getBalance() {
        if (this.networkError || !this.address) return;
        this.getEthBalance();
        if (this.selectedChainItem.isToken) {
          this.getERC20Balance();
          this.getERC20Allowance()
        }
      },

      /**
       * 获取ETH 余额
       */
      async getEthBalance() {
        this.balanceLoading = true;
        this.ethBalance = await getEthBalance(this.provider, this.address);
        this.balanceLoading = false;
      },

      /**
       * ERC20合约余额
       */
      async getERC20Balance() {
        this.tokenLoading = true;
        this.tokenBalance = await getERC20Balance(this.provider, this.erc20BalanceAbiFragment, this.selectedChainItem.contractAddress, this.changeAssetInfo.decimals, this.address);
        this.tokenLoading = false;
      },

      //查询erc20资产授权额度
      async getERC20Allowance() {
        this.refreshAllowance = true;
        const {contractAddress, heterogeneousChainMultySignAddress} = this.selectedChainItem;
        this.needAuth = await getERC20Allowance(this.provider, contractAddress, heterogeneousChainMultySignAddress, this.address);
        this.refreshAllowance = false;
      },

      copy(sting) {
        copys(sting);
        this.$message({message: this.$t('public.copySuccess'), type: 'success', duration: 1000});
      },

      allIn() {
        if (this.selectedChainItem.isToken) {
          this.crossForm.numbers = this.tokenBalance.toString()
        } else {
          let allNumber = Minus(this.ethBalance, this.maxLimit).toString();
          this.crossForm.numbers = Number(allNumber) < 0 ? '0' : allNumber.toString()
        }
      },

      submitCrossForm(formName) {
        this.$refs[formName].validate((valid) => {
          if (valid) {
            this.acrossInfoDialogForm = true
          } else {
            return false;
          }
        });
      },

      acrossInfoSubmit() {
        this.acrossInfoDialogForm = false;
        if (this.selectedChainItem.isToken) {
          this.sendERC20()
        } else {
          this.sendETH()
        }
      },

      //授权erc20额度
      async approveERC20() {
        this.loading = true;
        this.txHash = '';
        const {contractAddress, heterogeneousChainMultySignAddress} = this.selectedChainItem;
        const valid1 = await validateAddress(contractAddress);
        const valid2 = await validateAddress(heterogeneousChainMultySignAddress);
        if (!valid1 || !valid2) {
          this.$message({message: this.$t('tips.tips27'), type: 'error', duration: 3000});
          this.loading = false;
          return
        }
        const result = await approveERC20(this.provider, contractAddress, heterogeneousChainMultySignAddress, this.address);
        this.loading = false;
        this.handleMsg(result)
      },

      async sendETH() {
        this.loading = true;
        this.txHash = '';
        const {heterogeneousChainMultySignAddress} = this.selectedChainItem;
        const valid = await validateAddress(heterogeneousChainMultySignAddress);
        if (!valid) {
          this.$message({message: this.$t('tips.tips27'), type: 'error', duration: 3000});
          this.loading = false;
          return
        }
        const result = await sendETHForMK(this.provider, heterogeneousChainMultySignAddress, this.changeAssetInfo.address, this.crossForm.numbers);
        this.loading = false;
        this.handleMsg(result)
      },

      async sendERC20() {
        this.loading = true;
        this.txHash = '';
        const {decimals, address} = this.changeAssetInfo;
        const {contractAddress, heterogeneousChainMultySignAddress} = this.selectedChainItem;
        const valid1 = await validateAddress(contractAddress);
        const valid2 = await validateAddress(heterogeneousChainMultySignAddress);
        if (!valid1 || !valid2) {
          this.$message({message: this.$t('tips.tips27'), type: 'error', duration: 3000});
          this.loading = false;
          return
        }
        const result = await sendERC20ForMK(this.provider, contractAddress, heterogeneousChainMultySignAddress, this.address, address, decimals, this.crossForm.numbers);
        this.loading = false;
        this.handleMsg(result)
      },

      handleMsg(data) {
        if (data.success) {
          this.crossForm.numbers = '';
          this.txHash = data.msg;
          this.$message({message: this.$t('tips.tips0'), type: 'success', duration: 3000});
        } else {
          this.$message({message: data.msg, type: 'error', duration: 2000});
        }
      },

      toUrl(type) {
        let url = '';
        if (type === 'tx') {
          console.log(type)
        } else if (this.selectHeterogeneousChain === 'ETH') {
          url = networkOrigin.ETHOrigin + '/address/' + this.address
        } else {
          url = networkOrigin.BNBOrigin + '/address/' + this.address
        }
        connectToExplorer('nuls', url)
      },

      getNetworkName(symbol) {
        const idToNetwork = {ETH: "Ethereum", BNB: "BSC", HT: "Heco"};
        return idToNetwork[symbol]
      }
    }

  }
</script>

<style lang="less">
  .connect-wallet {
    .metamask {
      .not-connect {
        width: 300px;
        margin: 0 auto;
      }
      .connect-btn {
        height: 50px;
        line-height: 50px;
        padding: 0 15px;
        border-radius: 10px;
        border: 1px solid rgb(255, 0, 122);
        cursor: pointer;
        &:hover {
          background-color: rgb(237, 238, 242);
        }
        img {
          margin-top: 7px;
        }
      }
      .connecting {
        > div:first-child {
          height: 50px;
          line-height: 50px;
          padding: 0 15px;
          border-radius: 10px;
          border: 1px solid rgb(195, 197, 203);
          margin-bottom: 10px;
          &.connect-error-tip {
            height: 60px;
            line-height: 60px;
            font-size: 16px;
            color: rgb(255, 104, 113);
            border: 1px solid rgb(255, 104, 113);
            .el-button {
              margin-left: 26px;
              border-radius: 8px;
              padding: 8px;
              background-color: rgb(206, 208, 217);
              border: none;
              &:hover {
                background-color: rgb(168, 171, 179);
                border: none;
              }
              span {
                color: #000;
                font-weight: 600;
                font-size: 12px;
              }
            }
          }
        }

        > div:last-child {
          height: 68px;
          padding: 15px;
          border-radius: 10px;
          border: 1px solid rgb(195, 197, 203);
          margin-bottom: 10px;
        }
      }
      .metamask-account {
        margin-left: 20px;
        & > div {
          margin-bottom: 15px;
          &.heterogeneous-network {
            padding: 0;
          }
        }
        span.label {
          margin-right: 10px;
          color: #606266;
          max-width: 90px;
          display: inline-block;
        }
        span.network-tip {
          color: red;
          margin-left: 90px;
        }
        .token-tip {
          margin-bottom: 15px;
          .click {
            color: #608FFF
          }
        }
        .el-button {
          margin-bottom: 10px;
          span {
            color: #fff;
          }
        }
        .is-disabled.disabled-btn span {
          color: #C0C4CC;
        }
      }
    }
    .metamask-mobile {
      padding-top: 1rem;
      p {
        font-size: 14px !important;
        text-align: center;
        color: #303133 !important;
      }
    }
  }

  .el-message-box__wrapper .el-message-box .el-message-box__content .el-message-box__message p {
    color: #333;
  }

</style>
