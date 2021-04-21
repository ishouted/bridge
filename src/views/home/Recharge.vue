<template>
  <div class="recharge">
    <el-dialog class="recharge_dialog" width="50rem"
               :visible.sync="rechargeDialog"
               :close-on-click-modal="false"
               :close-on-press-escape="false"
               @open="showRechargeDialog"
               @close="closeRechargeDialog">
      <div slot="title" class="slot-title">
        {{changeAssetInfo.symbol +' '+ $t('home.home3')}}
        <el-button type="text" @click="viewUnconfirmedTxList">{{$t('recharge.recharge39')}}</el-button>
      </div>
      <div class="cross" v-loading="rechargeLoading">
        <div class="top clear">
        </div>
        <el-tabs v-model="activeTab" :tab-position="mobile?'top':'left'" style="min-height: 300px;" >
          <el-tab-pane label="MetaMask" name="first">
            <connect-wallet :nvtAddress="addressInfo.address"
                            :changeAssetInfo="changeAssetInfo"
                            :heterogeneousList="heterogeneousList"
            ></connect-wallet>
          </el-tab-pane>
          <el-tab-pane :label="$t('recharge.recharge24')" name="second">
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
            <h6>
              <span class="yellow">{{$t('recharge.recharge1')}}</span>
              {{$t('recharge.recharge2')}}
              {{changeAssetInfo.symbol}}
              {{tip1}}
              <!-- {{chainName==="ETH"?$t('recharge.recharge3'):$t('recharge.recharge311')}} -->
            </h6>
            <p class="replace-str">
              {{tip2}}
              <!-- {{chainName==="ETH"?$t('recharge.recharge4'):$t('recharge.recharge411')}} -->
              </p>
            <div class="cross_address">
              <h4>
                <span>{{selectHeterogeneousChain}}{{$t('recharge.recharge5')}}</span>
                <p>
                  <img src="./../../assets/img/loading.svg" v-if="investAddressInfo.ethLoading">
                  <font v-else>{{investAddressInfo.ethBalance}}</font>
                  &nbsp;{{selectHeterogeneousChain}}
                  <i class="el-icon-refresh fW600 font14 click" @click="getEthBalance"
                     v-show="!investAddressInfo.ethLoading"></i>
                </p>
              </h4>
              <h4 v-if="selectedChainItem.isToken">
                <span>{{changeAssetInfo.symbol}}{{$t('recharge.recharge6')}}</span>
                <p>
                  <img src="./../../assets/img/loading.svg" v-if="investAddressInfo.tokenLoading">
                  <font v-else>{{investAddressInfo.tokenBalance}}</font>
                  &nbsp;{{changeAssetInfo.symbol}}
                  <i class="el-icon-refresh fW600 font14 click" @click="getERC20Balance"
                     v-show="!investAddressInfo.tokenLoading"></i>
                </p>
              </h4>
              <div class="div_qrcode">
                <div id="qrcode" class="qrcode"></div>
              </div>

              <h5 class="cb">
                {{investAddressInfo.address}}
                <i class="iconfont iconfuzhi click" @click="copy(investAddressInfo.address)"></i>
              </h5>
            </div>
            <h6><span class="yellow">{{$t('recharge.recharge7')}}</span>{{$t('recharge.recharge8')}}</h6>
            <p class="replace-str">
              {{tip3}}
              <!-- {{chainName==="ETH"?$t('recharge.recharge9'):$t('recharge.recharge911')}} -->
              {{changeAssetInfo.symbol}}
              {{tip4}}
              <!-- {{chainName==="ETH"?$t('recharge.recharge10'):$t('recharge.recharge1011')}} -->
            </p>
            <el-form :inline="true" :model="crossForm" :rules="crossRules" ref="crossForm" class="cross_form">
              <el-form-item label="" prop="numbers">
                <el-input v-model="crossForm.numbers" :placeholder="$t('recharge.recharge11')">
                </el-input>
                <div class="click all" @click="allIn">{{$t('recharge.recharge12')}}</div>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="submitCrossForm('crossForm')"
                           :disabled="investAddressInfo.gasPriceLoading">{{$t('recharge.recharge13')}}
                </el-button>
              </el-form-item>
              <div class="font12 fee">
                {{$t('recharge.recharge14')}}
                <img src="./../../assets/img/loading.svg" v-if="investAddressInfo.gasPriceLoading">
                <font v-else>{{investAddressInfo.gasPrice}}</font>
                &nbsp;{{selectHeterogeneousChain}}
                <el-checkbox v-model="speedUpFee" @change="changeSpeedUpFee">{{$t('recharge.recharge20')}}</el-checkbox>
                <font v-if="selectedChainItem.isToken" class="yellow">
                  ｜{{balanceTip}}
                </font>
              </div>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <el-dialog :title="$t('home.home8')" width="600px" class="across_info"
               :close-on-click-modal="false"
               :close-on-press-escape="false"
               :visible.sync="acrossInfoDialogForm">
      <div class="dialog_info">
        <ul>
          <li><span>{{$t('home.home9')}}:</span>{{addressInfo.address}}</li>
          <li><span>{{$t('home.home10')}}:</span>{{crossForm.numbers}} {{changeAssetInfo.symbol}}</li>
          <li><span>{{$t('public.fee')}}:</span>{{investAddressInfo.gasPrice}} {{selectHeterogeneousChain}}</li>
        </ul>
        <div class="yellow font12">{{$t('home.home11')}}</div>
      </div>

      <div class="dialog-footer" slot="footer">
        <el-button @click="acrossInfoDialogForm = false" style="margin-right: 20px">{{$t('password.password2')}}</el-button>
        <el-button type="primary" @click="acrossInfoSubmit">{{$t('password.password3')}}</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="$t('recharge.recharge40')" width="650px" class="un_confirm_list"
               :visible.sync="showUnConfirmedList">
      <div class="dialog_info">
        <div class="list-wrap">
          <span>{{$t('recharge.recharge25')}}</span>
          <span>{{$t('staking.staking4')}}</span>
          <span>TXID</span>
          <span>{{$t('staking.staking16')}}</span>
          <span>{{$t('recharge.recharge44')}}</span>
        </div>
        <div v-show="unConfirmedList.length" v-for="item in unConfirmedList" :key="item.heterogeneousHash" class="unconfirm_item list-wrap">
          <span>{{getNetworkName(item.heterogeneousChainId)}}</span>
          <span>{{item.symbol}}</span>
          <span class="clicks" @click="openExplore(item.heterogeneousHash, item.heterogeneousChainId)" >{{superLong(item.heterogeneousHash)}}</span>
          <span>{{item.amounts}}</span>
          <!-- <span>{{$t('recharge.recharge41')}}</span> -->
          <span>{{item.confirmedHeight}}</span>
        </div>
        <div class="tc" v-show="!unConfirmedList.length">No Data</div>
      </div>

      <div class="dialog-footer" slot="footer">
      </div>
    </el-dialog>

    <Password ref="password" @passwordSubmit="rechargePassSubmit">
    </Password>
  </div>
</template>

<script>
  import QRCode from 'qrcodejs2'
  import {Minus, connectToExplorer, copys, passwordVerification, superLong, networkOrigin} from '@/api/util'
  import Password from '@/components/PasswordBar'
  import ConnectWallet from "./ConnectWallet";
  import {
    getProvider,
    getEthBalance,
    getERC20Balance,
    getGasPrice,
    getSpeedUpFee,
    sendETH,
    speedUpSendETH,
    sendERC20,
    speedUpSendERC20,
    getEthBlockNumber,
    validateAddress
  } from './api_ethers'
  import { divisionDecimals, getSymbolInfo } from '../../api/util';
  import {ETHNET} from '@/config.js'
  export default {
    data() {
      let checkNumbers = (rule, value, callback) => {
        let decimals = this.changeAssetInfo.decimals;
        let patrn = new RegExp("^([1-9][\\d]{0,20}|0)(\\.[\\d]{0," + decimals + "})?$");
        if (!value) {
          return callback(new Error(this.$t('recharge.recharge16')));
        } else if (!patrn.exec(value)) {
          callback(new Error(this.$t('recharge.recharge17')));
        }/* else if (value > this.investAddressInfo.ethBalance) {
          callback(new Error(this.$t('recharge.recharge18') + this.investAddressInfo.ethBalance + ' ' + this.changeAssetInfo.symbol));
        }*/ else {
          if (this.selectedChainItem.isToken) {
           /* console.info(this.investAddressInfo.tokenBalance);
            console.info(value);*/
            if (Number(this.investAddressInfo.ethBalance) === 0 || this.investAddressInfo.ethBalance < this.investAddressInfo.gasPrice) {
              callback(new Error(this.$t('recharge.recharge19')));
            } else if (Number(value)> Number(this.investAddressInfo.tokenBalance)) {
              // callback(new Error(this.$t('recharge.recharge21')))
              callback(new Error(this.$t('recharge.recharge22')+ this.investAddressInfo.tokenBalance + ' ' + this.changeAssetInfo.symbol))
              // callback(new Error(this.$t('recharge.recharge18') + this.investAddressInfo.tokenBalance + ' ' + this.changeAssetInfo.symbol));
            } else {
              callback();
            }
          } else {
            let maxNumber = Minus(this.investAddressInfo.ethBalance, this.investAddressInfo.gasPrice);
            /*console.info(maxNumber);
            console.info(value);*/
            if (this.investAddressInfo.ethBalance <  this.investAddressInfo.gasPrice) {
              callback(new Error(this.$t('recharge.recharge21')))
            } else if ( Number(value) > Number(maxNumber) || Number(this.investAddressInfo.ethBalance) === 0) {
              callback(new Error(this.$t('recharge.recharge22') + maxNumber + ' ' + this.changeAssetInfo.symbol));
            } else {
              callback();
            }
          }
        }
      };
      this.mobile =/Android|webOS|iPhone|iPad|BlackBerry/i.test(navigator.userAgent)
      return {
        activeTab: 'first',
        addressInfo: {},//默认账户信息
        investAddressInfo: {
          ethLoading: true,
          ethBalance: 0,
          tokenLoading: true,
          tokenBalance: 0,
          gasPriceLoading: true,
          gasPrice: 0
        },//充值资产信息
        rechargeDialog: false, //充值弹框
        rechargeLoading: false, //充值弹框
        crossForm: {
          numbers: '',
        },
        crossRules: {
          numbers: [
            {validator: checkNumbers, trigger: ['blur', 'change']}
          ]
        },
        ethers: {},
        provider: {},
        erc20BalanceAbiFragment: [{
          "constant": true,
          "inputs": [{"name": "", "type": "address"}],
          "name": "balanceOf",
          "outputs": [{"name": "", "type": "uint256"}],
          "type": "function"
        }],
        speedUpFee: false,//是否加速
        acrossInfoDialogForm: false,//跨链转入确认单 弹框
        unConfirmedList: [], //转入还未确认列表
        showUnConfirmedList: false,
        selectHeterogeneousChain: '', //选中的异构链名称
        selectedChainItem: {}, //选中的异构链
      };
    },
    created() {
      //console.log(this.changeAssetInfo)
    },
    mounted() {
      this.getConverterRechargeUnconfirmedTxList()
      const timer = setInterval(()=>{
        this.getConverterRechargeUnconfirmedTxList()
      }, 5000)
      this.$once('hook:beforeDestroy', () => {
        clearInterval(timer)
      })
    },
    components: {
      Password,
      ConnectWallet
    },
    props: {
      //选中资产信息
      changeAssetInfo: {
        type: Object
      },
      loading: {
        type: Boolean,
        default: false
      },

      total: {
        type: String,
      }
    },
    watch: {
      selectHeterogeneousChain: {
        immediate: true,
        async handler(val) {
          if (!val) return
          this.selectedChainItem = this.changeAssetInfo.heterogeneousList.filter(v=>v.chainName === val)[0]
          this.provider = getProvider(val)
          this.getBalanceAndGas()
        }
      }
    },
    computed: {
      heterogeneousList() {
        return [...this.changeAssetInfo.heterogeneousList].sort((a, b) => {
          return a.heterogeneousChainId > b.heterogeneousChainId ? 1 : -1
        })
      },
      chainName() {
        return this.selectedChainItem.chainName
      },
      tip1() {
        if (this.chainName === "ETH") {
          return this.$t('recharge.recharge3')
        } else if (this.chainName === "BNB") {
          return this.$t('recharge.recharge311')
        } else {
          return this.$t('recharge.recharge312')
        }
      },
      tip2() {
        if (this.chainName === "ETH") {
          return this.$t('recharge.recharge4')
        } else if (this.chainName === "BNB") {
          return this.$t('recharge.recharge411')
        } else {
          return this.$t('recharge.recharge412')
        }
      },
      tip3() {
        if (this.chainName === "ETH") {
          return this.$t('recharge.recharge9')
        } else if (this.chainName === "BNB") {
          return this.$t('recharge.recharge911')
        } else {
          return this.$t('recharge.recharge912')
        }
      },
      tip4() {
        if (this.chainName === "ETH") {
          return this.$t('recharge.recharge10')
        } else if (this.chainName === "BNB") {
          return this.$t('recharge.recharge1011')
        } else {
          return this.$t('recharge.recharge1012')
        }
      },
      balanceTip() {
        if (this.chainName === "ETH") {
          return this.$t('recharge.recharge15')
        } else if (this.chainName === "BNB") {
          return this.$t('recharge.recharge1511')
        } else {
          return this.$t('recharge.recharge1512')
        }
      }
    },
    methods: {

      /**
       * @disc: 显示充值弹框
       * @params: boolean
       * @date: 2019-12-03 15:45
       * @author: Wave
       */
      showRechargeDialog(boolean) {
        this.rechargeDialog = boolean;
        this.init();
      },

      /**
       * @disc: 关闭充值弹框
       * @date: 2019-12-03 15:45
       * @author: Wave
       */
      closeRechargeDialog() {
        /*document.getElementById('qrcode').innerHTML = '';
        this.investAddressInfo = {
          ethLoading: true,
          ethBalance: 0,
          tokenLoading: true,
          tokenBalance: 0,
          gasPriceLoading: true,
          gasPrice: 0
        };
        this.crossForm.numbers = '';
        this.speedUpFee = false;
        this.$refs['crossForm'].resetFields();*/
        this.rechargeDialog = false;
        this.$emit('destroyDialog')
      },

      /**
       * @disc: 初始化信息
       * @params:
       * @date: 2020-06-10 13:46
       * @author: Wave
       */
      init() {
        this.addressInfo = this.$store.getters.getSelectAddress;
        this.ethers = require('ethers');
        // this.changeAssetInfo.heterogeneousList.sort()
        this.selectHeterogeneousChain = this.heterogeneousList[0].chainName//'ETH'
        this.rechargeDialog = true;
        this.investAddressInfo.address = this.ethers.utils.computeAddress(this.ethers.utils.hexZeroPad(this.ethers.utils.hexStripZeros('0x' + this.addressInfo.pub), 33));
        this.$nextTick(()=>{
          this.qrcode(this.investAddressInfo.address);
        })
      },

      async getBalanceAndGas() {
        this.getEthBalance()
        this.selectedChainItem.isToken && this.getERC20Balance()
        this.gasLimit = this.selectedChainItem.isToken ? '100000' : '33594'
        this.getGasPrice()
      },

      /**
       * @disc: 获取ETH 余额
       */
      async getEthBalance() {
        this.investAddressInfo.ethLoading = true;
        this.investAddressInfo.ethBalance =  await getEthBalance(this.provider, this.investAddressInfo.address);
        this.investAddressInfo.ethLoading = false;
      },

      /**
       @disc:  ERC20合约余额
       */
      async getERC20Balance() {
        this.investAddressInfo.tokenLoading = true;
        this.investAddressInfo.tokenBalance =  await getERC20Balance(this.provider, this.erc20BalanceAbiFragment, this.selectedChainItem.contractAddress, this.changeAssetInfo.decimals, this.investAddressInfo.address);
        this.investAddressInfo.tokenLoading = false;
      },

      /**
       * @disc: 获取ETH交易手续费
       */
      async getGasPrice() {
        this.investAddressInfo.gasPriceLoading = true;
        this.investAddressInfo.gasPrice = await getGasPrice(this.provider, this.gasLimit);
        this.investAddressInfo.gasPriceLoading = false;
      },

      /**
       * @disc: 选中加速
       * @params: e
       * @date: 2020-06-17 15:12
       * @author: Wave
       */
      async changeSpeedUpFee(e) {
        //console.log(e);
        if (e) {
          this.getSpeedUpFee()
        } else {
          this.getGasPrice();
        }
      },

      /**
       * 获取加速的手续费
       */
      async getSpeedUpFee() {
        this.investAddressInfo.gasPriceLoading = true;
        this.investAddressInfo.gasPrice = await getSpeedUpFee(this.provider, this.gasLimit)
        this.investAddressInfo.gasPriceLoading = false;
      },

      /**
       * @disc: 确认充值转入
       * @params: formName
       * @date: 2020-06-11 14:08
       * @author: Wave
       */
      submitCrossForm(formName) {
        this.$refs[formName].validate((valid) => {
          if (valid) {
            this.acrossInfoDialogForm = true;
          } else {
            return false;
          }
        });
      },

      /**
       * @disc: 跨链转入确认单 确定
       * @params:
       * @date: 2020-08-10 18:27
       * @author: Wave
       */
      acrossInfoSubmit() {
        this.acrossInfoDialogForm = false;
        this.$refs.password.showPassword(true);
      },

      /**
       * @disc: 转账密码输入
       * @params: password
       * @date: 2019-09-02 10:49
       * @author: Wave
       */
      async rechargePassSubmit(password) {
        this.transferLoading = true;
        let prefixList = sessionStorage.hasOwnProperty('prefixData') ? JSON.parse(sessionStorage.getItem('prefixData')) : [];
        let prefixInfo = prefixList.filter(v => v.chainId === this.addressInfo.chainId)[0];
        let passwordInfo = await passwordVerification(this.addressInfo, password, prefixInfo.addressPrefix);
        //console.log(passwordInfo);
        if (!passwordInfo.success) {
          this.$message({message: this.$t('tips.tips24'), type: 'error', duration: 3000});
          this.transferLoading = false;
          return;
        }

        this.rechargeLoading = true;
        let txHash = '';
        if (this.selectedChainItem.isToken) {
          const valid1 = await validateAddress(this.selectedChainItem.contractAddress);
          const valid2 = await validateAddress(this.selectedChainItem.heterogeneousChainMultySignAddress);
          if (!valid1 || !valid2) {
            this.$message({message: this.$t('tips.tips27'), type: 'error', duration: 3000});
            this.rechargeLoading = false;
            return
          }
          if (this.speedUpFee) {
            txHash = await speedUpSendERC20(this.provider, passwordInfo.pri, this.selectedChainItem.contractAddress, this.changeAssetInfo.decimals, this.selectedChainItem.heterogeneousChainMultySignAddress, this.crossForm.numbers)
          } else {
            txHash = await sendERC20(this.provider, passwordInfo.pri, this.selectedChainItem.contractAddress, this.changeAssetInfo.decimals, this.selectedChainItem.heterogeneousChainMultySignAddress, this.crossForm.numbers);
          }
        } else {
          const valid = await validateAddress(this.selectedChainItem.heterogeneousChainMultySignAddress);
          if (!valid) {
            this.$message({message: this.$t('tips.tips27'), type: 'error', duration: 3000});
            this.rechargeLoading = false;
            return
          }
          if (this.speedUpFee) {
            txHash = await speedUpSendETH(this.provider, passwordInfo.pri, this.selectedChainItem.heterogeneousChainMultySignAddress, this.crossForm.numbers)
          } else {
            txHash = await sendETH(this.provider, passwordInfo.pri, this.selectedChainItem.heterogeneousChainMultySignAddress, this.crossForm.numbers);
          }
        }
        //console.info(txHash);
        if (txHash) {
          this.$message({message: this.$t('tips.tips0'), type: 'success', duration: 1000});
          this.rechargeLoading = false;
          this.toUrl("txList", '', 0);
        }
      },

      /**
       * @disc: 二维码生成
       * @params: address
       * @date: 2019-08-27 11:12
       * @author: Wave
       */
      qrcode(address) {
        if (document.getElementById('qrcode')) {
          document.getElementById('qrcode').innerHTML = '';
        }
        let qrcode = new QRCode('qrcode', {
          width: 200,
          height: 200,
          colorDark: "#000000",
          colorLight: "#ffffff",
        });
        let qrcodeInfo = address.replace(/\\"/g, '');
        //console.log(qrcodeInfo);
        qrcode.makeCode(qrcodeInfo)
      },

      /**
       * @disc: 全部
       * @date: 2020-06-12 15:38
       * @author: Wave
       */
      allIn() {
        if (this.selectedChainItem.isToken) {
          this.crossForm.numbers = this.investAddressInfo.tokenBalance.toString()
        } else {
          let allNumber = Minus(this.investAddressInfo.ethBalance, this.investAddressInfo.gasPrice).toString();
          this.crossForm.numbers = Number(allNumber) < 0 ? '0' : allNumber.toString()
        }
      },

      /**
       * 复制方法
       * @param sting
       **/
      copy(sting) {
        copys(sting);
        this.$message({message: this.$t('public.copySuccess'), type: 'success', duration: 1000});
      },

      /**
       * 连接跳转
       * @param name
       * @param parameter
       * @param type 0:路由跳转 1:浏览器跳转
       */
      toUrl(name, parameter, type) {
        if (type === 0) {
          let newQuery = {};
          if (name === 'transfer') {
            sessionStorage.setItem('transferParams', JSON.stringify(parameter))
          } else if (name === 'txList') {
            newQuery = {
              chainId: parameter.chainId,
              assetId: parameter.assetId
            }
          }
          //console.info(newQuery);
          this.$router.push({
            name: name,
            query: newQuery
          })
        } else {
          connectToExplorer(name, parameter);
        }
      },
      viewUnconfirmedTxList() {
        this.showUnConfirmedList=true
        // this.getConverterRechargeUnconfirmedTxList()
      },
      //查询跨链转入中的hash列表
      getConverterRechargeUnconfirmedTxList() {
        this.$post('/', 'getConverterRechargeUnconfirmedTxList', [this.changeAssetInfo.address])
        .then(async res=>{
          if (res.result&&res.result.length) {
           /*  res.result.map(async (v) => {
              const coinInfo = await getSymbolInfo(v.assetChainId, v.assetId)
              v.amounts = divisionDecimals(v.amount, coinInfo.decimals)
              let provider = ''
              if (v.heterogeneousChainId === 101) {
                provider = getProvider('ETH')
              } else if (v.heterogeneousChainId === 102) {
                provider = getProvider('BNB')
              }
              const height = await getEthBlockNumber(provider)
              const totalHeight = ETHNET === 'ropsten' ? 5 : 30
              console.log(totalHeight,'===totalHeight')
              console.log(height,'===height')
              console.log(v.heterogeneousHeight,'===heterogeneousHeight')
              v.confirmedHeight = (height - v.heterogeneousHeight) + '/' + totalHeight
            }) */
            for (let i = 0; i < res.result.length; i++) {
              const v = res.result[i]
              const coinInfo = await getSymbolInfo(v.assetChainId, v.assetId)
              v.amounts = divisionDecimals(v.amount, coinInfo.decimals)
              let provider = ''
              if (v.heterogeneousChainId === 101) {
                provider = getProvider('ETH')
              } else if (v.heterogeneousChainId === 102) {
                provider = getProvider('BNB')
              } else if (v.heterogeneousChainId === 103) {
                provider = getProvider('HT')
              }
              const height = await getEthBlockNumber(provider)
              const totalHeight = ETHNET === 'ropsten' ? 5 : 30
              const confirmedHeight = height - v.heterogeneousHeight > totalHeight ? totalHeight : height - v.heterogeneousHeight
              v.confirmedHeight = confirmedHeight + '/' + totalHeight
            }
            this.unConfirmedList = res.result
          } else {
            this.unConfirmedList = []
          }
        }).catch(e=>{
          console.error(e)
        })
      },
      superLong(item, lang=8) {
        return superLong(item, lang)
      },
      openExplore(hash, id) {
        let url = ''
        if (id === 101) {
          url = networkOrigin.ETHOrigin + '/tx/' + hash
        } else if (id === 102) {
          url = networkOrigin.BNBOrigin + '/tx/' + hash
        } else {
          url = networkOrigin.HTOrigin + '/tx/' + hash
        }
        connectToExplorer('nuls', url);
      },
      getNetworkName(symbol) {
        if (symbol === 'ETH' || symbol === 101) {
          return 'Ethereum'
        } else if (symbol === 'BNB' || symbol === 102) {
          return 'BSC'
        } else if (symbol === 'HT' || symbol === 103) {
          return 'Heco'
        }
      }
    }
  }
</script>

<style lang="less">
  .recharge {
    .recharge_dialog {
      .el-dialog__header {
        .el-dialog__title {
          font-size: 16px;
        }
        .slot-title {
          color: #303133;
          .el-button {
            float: right;
            padding: 0;
            span {
              color: #608FFF;
            }
          }
        }
      }
      .el-dialog__body {
        padding-left: 0;
        padding-top: 20px;
        .heterogeneous-network {
            padding: 0 0 10px 0;
            .label {
              color :#303133;
              line-height: 25px;
              margin-right: 10px;
            }
            .heterogeneous-network-list {
              span {
                display: inline-block;
                font-size: 14px;
                min-width: 80px;
                height: 26px;
                line-height: 26px;
                text-align: center;
                border: 1px solid #dcdfe6;
                margin-right: 8px;
                cursor: pointer;
                color: #606266;
                border-radius: 4px;
                &:hover {
                  color: #409eff;
                }
                &.active {
                  border-color: #409eff;
                  color: #409eff;
                }
              }
            }
          }
        .cross {
          padding: 0 0 20px 0;
          h6 {
            font-size: 14px;
            span {
              color: #FD9D2D;
            }
          }
          p {
            font-size: 12px;
            color: #c0c4cc;
            margin: 5px auto;
            min-height: 20px;
            padding: 0;
          }
          .cross_address {
            background-color: #c0c4cc;
            padding: 5px 15px 10px 15px;
            margin: 10px 0 10px 0;
            text-align: center;
            h4 {
              font-size: 14px;
              margin: 0 0 10px 0;
              height: 20px;
              span {
                display: block;
                float: left;
                color: #5e6983;
                width: 48%;
                text-align: right;
              }
              p {
                float: left;
                width: 200px;
                color: #5e6983;
                margin: 0 0 5px 5px;
                text-align: left;
                line-height: 20px;
              }
            }
            .div_qrcode {
              width: 200px;
              height: 210px;
              margin: 0 auto;
              .qrcode {
                text-align: center;
                margin: 10px auto;
                width: 200px;
                clear: none;
              }
            }

            h5 {
              font-size: 14px;
              margin: 10px 0;
            }

          }
          .cross_form {
            .el-form-item {
              .el-form-item__content {
                .el-input {
                  .el-input__inner {
                    width: 40% !important;
                  }
                }
                .all {
                  position: absolute;
                  right: 7px;
                  top: 0;
                  font-size: 12px;
                }
                .el-button--primary {
                  padding: 8px 30px;
                  margin: 0 0 0 10px;
                  span {
                    color: #ffffff;
                  }
                }
              }
            }
            .fee {
              /*height: 25px;*/
              /*line-height: 25px;*/
            }
            .el-checkbox {
              .el-checkbox__label {
                //color: red;
                padding: 0 5px 0 3px;
                line-height: 5px;
              }
            }
          }
        }
      }
    }
    .el-tabs .el-tabs__header .el-tabs__nav-wrap::after {
      /*min-height: 520px;*/
    }
    @media screen and (max-width: 1200px) {
      .recharge_dialog {
        .el-dialog__body {
          padding: 0 0.24rem 0.2rem;
          .cross {
            padding: 0;
            .heterogeneous-network {
              padding: 0;
              .label {
                font-size: 0.26rem;
              }
              .heterogeneous-network-list {
                span {
                  font-size: 0.24rem;
                  min-width: 1.5rem;
                  height: 0.4rem;
                  line-height: 0.4rem;
                  margin-top: 4px;
                }
              }
            }
            h6 {
              font-size: 0.26rem;
            }
            p {
              font-size: 0.24rem;
            }
            .cross_address {
              padding: 0.24rem;
              h4 {
                margin: 0;
                p {
                  width: 48%;
                }
              }

              h5 {
                font-size: 0.28rem;
                margin: 10px 0 0;
                .iconfont {
                  font-size: 0.3rem;
                }
              }

            }
            .cross_form {
              .el-form-item {
                width: 100%;
                .el-form-item__content {
                  width: 100%;
                  .el-input {
                    .el-input__inner {
                      width: 100% !important;
                    }
                  }
                  .all {
                    font-size: 0.24rem;
                  }
                  .el-button--primary {
                    width: 100%;
                    margin: 0;
                  }
                }
              }
              .fee {
                height: auto;
                line-height: 25px;
              }
              .el-checkbox {
                .el-checkbox__label {
                  //color: red;
                  padding: 0 5px 0 3px;
                  line-height: 5px;
                }
              }
            }
          }
        }
      }
    }
  }
  .across_info {
    .el-dialog__body {
      background-color: #ffffff;
      padding: 20px;
      ul {
        li {
          line-height: 30px;
          span {
            width: 100px;
            text-align: right;
            display: block;
            float: left;
            margin-right: 10px;
          }
          font {

          }
          .remark {
            display: block;
            float: right;
            width: 350px;
            overflow-x: auto;
            max-height: 50px;
            line-height: 26px;
            font-size: 14px;
          }
        }
      }
      .yellow {
        height: 40px;
        line-height: 30px;
        text-align: center;
      }
    }
    .el-dialog__footer {
      padding: 0 0 10px 0;
      .dialog-footer {
        margin: 20px 0 10px 0;
        .el-button {
          width: 150px;
        }
        .el-button--default {
          margin-right: 30px;
        }
      }
    }
    @media screen and (max-width: 1200px) {
      .recharge_dialog {
        .el-dialog__body {
          .cross {
            padding: 0;
            h6 {
              font-size: 0.26rem;
            }
            p {
              font-size: 0.24rem;
            }
            .cross_address {
              padding: 0.12rem;
              margin: 0.2rem 0;
              h4 {
                font-size: 0.26rem;
                margin-bottom: 0.2rem;
                height: 0.4rem;
                line-height: 0.4rem;
                span {
                  width: 35%;
                }
                p {
                  width: auto;
                  line-height: 0.4rem;
                }
              }

              h5 {
                font-size: 0.26rem;
                margin: 0;
              }
            }
            .cross_form {
              .el-form-item {
                margin-bottom: 0.1rem;
                .el-form-item__content {
                  .el-input {
                    .el-input__inner {
                      width: 100% !important;
                    }
                  }

                  .el-button--primary {
                    padding: 0.16rem 0.3rem;
                  }
                }
              }
            }
          }
        }
      }
      .across_info {
        .el-dialog__body {
          padding: 0.24rem 0.24rem 0.2rem;
          ul {
            li {
              line-height: 0.6rem;
              span {
                width: 1.8rem;
              }
            }
          }
        }
        .el-dialog__footer {
          .dialog-footer {
            margin: 0.24rem 0 0;
            .el-button {
              width: 1.8rem;
              padding: 0.2rem;
            }
          }
        }
      }
    }
  }
  .un_confirm_list {
    .el-dialog .el-dialog__body {
      padding-top: 0;
      background-color: #fff;
    }
    .el-dialog__title {
      font-size: 16px;
    }
    .dialog_info {
      padding: 20px 0;
      .list-wrap {
        overflow: hidden;
        display: flex;
        span {
          flex: 1;
          color: #606266;
          white-space: nowrap;
          overflow: auto;
          margin-right: 5px;
          &.clicks {
            color: #608FFF;
          }
          &:nth-child(3) {
            flex: 2;
          }
          &:last-child {
            flex: 1.4;
          }
        }
      }
      .unconfirm_item {
        border-top: 1px solid #dfe4ef;
        padding: 5px 0;
      }
    }
  }

</style>
