<template>
  <div class="home" v-loading="$store.state.homeLoading">
    <div class="w1200 title">
      <span class="title-pc">{{currentAddress.address}}<font v-if="currentAddress.alias">({{currentAddress.alias}})</font></span>
      <span class="title-mobile">{{superLong(currentAddress.address)}}<font v-if="currentAddress.alias">({{currentAddress.alias}})</font></span>
      <i class="iconfont iconfuzhi clicks" @click="copy(currentAddress.address)"></i>
      <i class="iconfont iconerweima clicks" @click="showCode"></i>
    </div>
    <div class="top w1200 clear">
      <div class="left fl shadow1">
        <div>
          <div class="total">
            <h6>{{$t('tab.tab2')}}
              <span class=" font14 fr click" @click="toUrl('txList','',0)">{{$t('home.home2')}}</span>
            </h6>
            <div class="fW600">≈ ${{parseFloat(myAssetsInfo.total)}}
              <el-button type="primary" plain @click="crossLink(accountList[0])">{{$t('home.home4')}}</el-button>
            </div>
          </div>
          <div class="lock clear">
            <div class="fl">
              <h6>{{$t('tab.tab4')}}</h6>
              <p>≈ ${{parseFloat(myAssetsInfo.available)}}</p>
            </div>
            <div class="fl">
              <h6>{{$t('tab.tab3')}}</h6>
              <p>
                <!--≈ $<font class="click" @click="toUrl('frozenList',{chainId:0,assetId:0},0)">{{parseFloat(myAssetsInfo.locking)}}</font>-->
                ≈ ${{parseFloat(myAssetsInfo.locking)}}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="right fr shadow1">
        <PieChart :data="chartData" :total="myAssetsInfo.total">
        </PieChart>
      </div>
    </div>
    <div class="footer cb w1200">
      <div class="asset-list-title">
        <span>{{$t('home.home16')}}</span>
        <i class="fr el-icon-circle-plus-outline" @click="showAssetManage=true"></i>
      </div>
      <div class="cb">
        <el-table :data="accountList" stripe class="tabs">
          <el-table-column label="" width="20">
          </el-table-column>
          <el-table-column :label="$t('tab.tab35')" width="160">
            <template slot-scope="scope">
              <div class="icon-wrap">
                <img :src="scope.row.icon" alt="" class="coin-img">
                <div>
                  {{scope.row.name}}
                  <p>{{scope.row.assetKey}}</p>
                </div>
              </div>
            </template>
          </el-table-column>
          <!-- <el-table-column prop="name" :label="$t('tab.tab36')" width="90" align="center">
          </el-table-column> -->
          <el-table-column prop="number" :label="$t('tab.tab37')" width="140" align="center">
          </el-table-column>
          <el-table-column :label="$t('tab.tab38')" width="140" align="center">
            <template slot-scope="scope">
              ${{scope.row.valuation | toThousands}}
            </template>
          </el-table-column>
          <el-table-column :label="$t('tab.tab3')" width="120" align="center">
            <template slot-scope="scope">
              <!--<span class="click" @click="toUrl('frozenList',scope.row,0)">{{scope.row.locking }}</span>-->
              <span>{{scope.row.locking }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="available" :label="$t('tab.tab4')" width="140" align="center">
          </el-table-column>
          <el-table-column :label="$t('home.home14')" width="240">
            <template slot-scope="scope">
              <div class="cir-icon">
                <span @click="toScan(item)" :style="getStyle(item)" :key="item" v-for="item in getCirculationNetwork(scope.row.heterogeneousList)">{{item}}</span>
                <!-- <img :src="getSrc(item)" :key="item" v-for="item in getCirculationNetwork(scope.row.heterogeneousList)" alt=""> -->
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('nodeService.nodeService6')" min-width="200" align="center">
            <template slot-scope="scope">
              <el-button @click="inChains(scope.row)" type="text"
                         v-if="isShowCrossHandle(scope.row.source)">
                {{$t('home.home3')}}
              </el-button>
              <!--              <el-button type="text" v-else disabled>-</el-button>-->
              <el-button @click="crossLink(scope.row)" type="text">{{$t('home.home4')}}</el-button>
              <el-button @click="withdrawal(scope.row)" type="text"
                         v-if="isShowCrossHandle(scope.row.source)">
                {{$t('home.home5')}}
              </el-button>
              <!--              <el-button type="text" v-else disabled>-</el-button>-->
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    <div class="footer-mobile">
      <div class="asset-list-title">
        <span>{{$t('home.home16')}}</span>
        <i class="fr el-icon-circle-plus-outline" @click="showAssetManage=true"></i>
      </div>
      <div class="asset-list">
        <div v-for="item in accountList" :key="item.assetKey" @click="toAssetDetail(item)">
          <div class="fl">
            <img :src="item.icon" alt="" class="coin-img">
            <span>{{item.name}}</span>
          </div>
          <div class="fr">
            {{item.number}}<br/>
            <span>≈ ${{item.valuation | toThousands}}</span>
          </div>
        </div>
      </div>
    </div>
    <el-dialog :title="$t('home.home12')" :visible.sync="codeDialog" width="30%" center class="code_dialog">
      <div id="qrcode" class="qrcode"></div>
    </el-dialog>
    <Recharge ref="recharge" :changeAssetInfo="rowInfo" v-if="showRecharge" @destroyDialog="showRecharge=false">
    </Recharge>
    <asset-manage 
      :showAssetManage.sync="showAssetManage" 
      :assetList="allAssetsList" 
      :selectAssets="selectAssets"
      @addAssets="filterAssets"
      >
    </asset-manage>
  </div>
</template>

<script>
  import QRCode from 'qrcodejs2';
  import {Plus, Division, divisionDecimals, connectToExplorer, copys, tofix, assetSort, superLong, isBeta, networkOrigin} from '@/api/util';
  import PieChart from '@/components/PieChart'
  import Recharge from './Recharge'
  import AssetManage from './AssetManage'
  import {ETHNET} from '@/config.js'

  export default {
    data() {
      return {
        addressInfo: {},//默认账户信息
        myAssetsInfo: {},//我的资产信息
        chartData: [],//环形图表数据
        accountList: [],//资产列表
        rowInfo: {},
        codeDialog: false,//二维码弹框
        hideSmall: false,//隐藏小额资产
        showRecharge: false,
        showAssetManage: false,
        selectAssets: [],
        allAssetsList: []
      };
    },
    async created() {
      if (!this.$store.state.addressInfo.length) {
        this.$router.push({
          name: 'newAddress',
        })
      } else {
        await this.$store.dispatch('getAccountList')
      }
    },
    mounted() {
      // this.accountList = this.$store.state.accountList;
      document.title = ETHNET === 'ropsten' ? "NERVE Wallet - Beta" : "NERVE Wallet";
      /* let newHideSmall = sessionStorage.hasOwnProperty('hideSmall') ? sessionStorage.getItem('hideSmall') : 'false';
      if (newHideSmall === 'true') {
        let newSetInterval = setInterval(() => {
          if (!this.$store.state.homeLoading) {
            this.hideSmall = true;
            clearInterval(newSetInterval);
          }
        }, 800);

      } */
    },
    components: {
      PieChart, 
      Recharge,
      AssetManage
    },
    watch: {
      //监听切换账户
      '$store.state.accountList': {
        handler: function () {
          this.init();
          this.filterAssets()
        }
      }
    },
    computed: {
      currentAddress() {
        return this.$store.getters.getSelectAddress
      }
    },
    methods: {

      /**
       * @disc: 初始化信息
       * @params:
       * @date: 2020-06-10 13:46
       * @author: Wave
       */
      init() {
        let myAssetsInfo = {total: 0, available: 0, locking: 0};
        let chartData = [];
        this.addressInfo = this.$store.getters.getSelectAddress;
        //console.info(this.addressInfo);
        let assetsList = this.$store.state.accountList;
        // this.accountList = assetSort([...assetsList]);
        //console.info(this.accountList);
        const total = assetsList.reduce((cur, next) => {
          return Number(Plus(cur, next.valuation))
        }, 0);
        assetsList.forEach(item => {
          item.totalBalance = tofix(Number(divisionDecimals(item.totalBalance, item.decimals)), 3, -1);
          myAssetsInfo.total = tofix(Number(Plus(myAssetsInfo.total, item.valuation)), 3, -1);
          myAssetsInfo.available = tofix(Number(Plus(myAssetsInfo.available, item.usdAvailable)), 2, -1);
          myAssetsInfo.locking = tofix(Number(Plus(myAssetsInfo.locking, item.usdLocking)), 2, -1);
          chartData.push({
            key: item.symbol,
            name: item.symbol,
            amount: item.totalBalance,
            value: item.valuation,
            rate: total ? (Number(Division(item.valuation, total)) * 100).toFixed(2) + '%' : '0%'
          });
          //console.log(chartData);
        });
        this.myAssetsInfo = myAssetsInfo;
        //console.log(this.myAssetsInfo);
        this.chartData = chartData.filter(obj => obj.amount !== '0.000');
        //console.log(this.chartData)
      },

      //过滤展示资产列表
      filterAssets() {
        const currentAddress = this.$store.getters.getSelectAddress
        const accountList = this.$store.state.accountList;
        this.allAssetsList = assetSort([...accountList])
        if (currentAddress.visiableAssets) {
          const list = assetSort([...accountList]);
          const res = []

          // 解决线上nvt nuls不被勾选无法修改问题
          const nerve = ETHNET === 'ropsten' ? "5-1": "9-1"
          const nuls = ETHNET === 'ropsten' ? "2-1": "1-1"
          if (currentAddress.visiableAssets.indexOf(nerve) === -1 || currentAddress.visiableAssets.indexOf(nuls) === -1) {
            const defaultAsset = ETHNET === 'ropsten' ? ["5-1", "2-1", "5-2", "5-22"] : ["9-1", "1-1", "9-2", "9-25"]
            const list = assetSort([...accountList]).filter(item => {
              return defaultAsset.indexOf(item.assetKey) > -1 || Number(item.totalBalance) !== 0
            })
            this.selectAssets = list.map(v=>v.assetKey)
            this.accountList = list
          //
          } else {
            list.map(item=>{
              currentAddress.visiableAssets.map(v=>{
                if (item.assetKey === v) {
                  res.push(item)
                }
              })
            })
            this.selectAssets = [...currentAddress.visiableAssets]
            this.accountList = res
          }
        } else {
          const defaultAsset = ETHNET === 'ropsten' ? ["5-1", "2-1", "5-2", "5-22"] : ["9-1", "1-1", "9-2", "9-25"]
          const list = assetSort([...accountList]).filter(item => {
            return defaultAsset.indexOf(item.assetKey) > -1 || Number(item.totalBalance) !== 0
          })
          this.selectAssets = list.map(v=>v.assetKey)
          this.accountList = list
        }
      },

      /**
       * @disc: 充值
       * @params: row 选择币种信息
       * @date: 2020-04-07 16:30
       * @author: Wave
       */
      async inChains(row) {
        // console.log(row);
        this.rowInfo = row;
        this.showRecharge = true
        this.$nextTick(()=>{
          this.$refs.recharge.showRechargeDialog(true);
        })
      },

      /**
       * @disc: 转账
       * @params: row 选择币种信息
       * @date: 2020-04-07 16:30
       * @author: Wave
       */
      crossLink(row) {
        //console.log(row);
        this.toUrl('transfer', row, 0)
      },

      /**
       * @disc: 提现
       * @params: row 选择币种信息
       * @date: 2020-04-07 16:30
       * @author: Wave
       */
      withdrawal(row) {
        //console.info(row);
        sessionStorage.setItem('rowInfo', JSON.stringify(row));
        this.$router.push({
          name: 'withdrawal',
          //query: {rowInfo: row}
        })
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
       * @disc:显示二维码
       * @params:
       * @date: 2020-07-22 13:44
       * @author: Wave
       */
      showCode() {
        this.codeDialog = true;
        if (document.getElementById('qrcode')) {
          document.getElementById('qrcode').innerHTML = '';
        }

        setTimeout(() => {
          this.qrcode(this.addressInfo.address);
        }, 500);

      },

      /**
       * @disc: 二维码生成
       * @params: address
       * @date: 2019-08-27 11:12
       * @author: Wave
       */
      qrcode(address) {
        let qrcode = new QRCode('qrcode', {
          width: 250,
          height: 250,
          colorDark: "#000000",
          colorLight: "#ffffff",
        });

        let qrcodeInfo = {
          "address": address,
        };
        //console.log(qrcodeInfo);
        qrcode.makeCode(JSON.stringify(qrcodeInfo))
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
          } else if (name === 'frozenList') {
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
      toAssetDetail(item) {
        this.$router.push({
          name: 'assetDetail',
          query: {
            asset: encodeURIComponent(JSON.stringify(item))
          }
        })
      },
      superLong(item) {
        return superLong(item, 12)
      },
      isShowCrossHandle(status) {
        const showArr = [4, 5, 6, 7, 8, 9]
        return showArr.indexOf(status) > -1
      },
      getCirculationNetwork(heterogeneousList) {
        const network = ["NULS", "NERVE"];
        if (heterogeneousList && heterogeneousList.length) {
          heterogeneousList.map(v=>{
            if (v.heterogeneousChainId === 101) {
              network.push("Ethereum")
            } else if (v.heterogeneousChainId === 102) {
              network.push("BSC")
            } else if (v.heterogeneousChainId === 103) {
              network.push("Heco")
            }
          })
        }
        return network
      },
      getStyle(network) {
        if (network === "NULS") {
          return "color:#7bb63e;border-color:#d4e9c2"
        } else if (network === "Ethereum") {
          return "color:#5e5e5e;border-color:#cfcfcf"
        } else if (network === "BSC") {
          return "color:#f6cc78;border-color:#fae9bb"
        } else if (network === "Heco") {
          return "color:#05054c;border-color:#777dad"
        } else {
          return "color:#6b90e9;border-color:#d4dffb"
        }
      },
      toScan(network) {
        let url = "";//isBeta
        /* if (network === "NULS") {
          url = isBeta ? "http://beta.nulscan.io/" : "https://nulscan.io/"
        } else if (network === "Ethereum") {
          url = isBeta ? "https://ropsten.etherscan.io/" : "https://etherscan.io/"
        } else if (network === "BSC") {
          url = isBeta ? "https://testnet.bscscan.com" : "https://explorer.binance.org/"
        } else if (network === "Heco"){
          url = isBeta ? "https://scan-testnet.hecochain.com" : "https://scan.hecochain.com/"
        } else {
          url = isBeta ? "http://beta.scan.nerve.network/" : "https://scan.nerve.network/"
        } */
        if (network === "NULS") {
          url = networkOrigin.NULSOrigin
        } else if (network === "Ethereum") {
          url = networkOrigin.ETHOrigin
        } else if (network === "BSC") {
          url = networkOrigin.BNBOrigin
        } else if (network === "Heco") {
          url = networkOrigin.HTOrigin
        } else {
          url = networkOrigin.NERVEOrigin
        }
        connectToExplorer('nuls', url)
      }
    }
  }
</script>

<style lang="less">
  @import "../../assets/css/style";

  .home {
    .title {
      margin: 25px auto 25px;
      text-align: left;
      height: 22px;
      line-height: 22px;
      font-size: 18px;
      font-weight: bold;
      .title-pc {
        font-size: 18px;
      }
      .title-mobile {
        display: none;
      }
      .title-pc,.title-mobile {
        font {
          font-size: 14px;
          font-weight: 400;
        }
      }
      .iconfuzhi {
        font-size: 20px;
        font-weight: 400;
      }
    }
    .top {
      .left {
        width: 580px;
        height: 200px;
        background-color: #ffffff;
        margin: 0 0 15px 0;
        border-radius: 5px;
        h4 {
          font-size: 16px;
          font-weight: bold;
          color: #8794b1;
          border-bottom: 1px solid #dfe4ef;
          padding: 10px 0 10px 20px;
        }
        .total {
          margin: 24px 0 0 30px;
          h6 {
            margin: 0 0 7px 0;
            span {
              margin: 2px 30px 0 0;
            }
          }
          .fW600 {
            font-size: 26px;
            .el-button--primary {
              background-color: transparent;
            }
            .is-plain {
              padding: 4px 5px;
              border-radius: 2px;
              width: 66px;
              margin: 0 0 0 10px;
              &:hover {
                color: #608FFF;
              }
            }
          }
        }
        .lock {
          margin: 30px 0 0 30px;
          height: 100px;
          p {
            font-size: 20px;
          }
          .fl:last-of-type {
            margin-left: 50px;
          }
        }
        h6 {
          font-size: 14px;
          color: #8794b1;
          margin: 0 0 0 0;
        }
        p {
          margin: 5px 0 0 0;
          font-size: 18px;
          //font-weight: bold;
          color: #475472;
        }
      }
      .right {
        width: 580px;
        height: 200px;
        background-color: #ffffff;
        margin: 0 0 0 0;
        border-radius: 5px;
      }
    }
    .footer {
      margin-bottom: 100px;
      padding-top: 15px;
      .asset-list-title {
        margin-bottom: 10px;
      }
      .el-checkbox {
        margin-bottom: 10px;
      }
      .titles {
        border-bottom: 1px solid #dfe4ef;
        height: 40px;
        h4 {
          font-size: 16px;
          font-weight: bold;
          color: #2688f7;
          padding: 10px 0 0 0;
          margin: 0;
        }
        .el-icon-search {
          line-height: 30px;
        }
      }
      .tabs {
        margin: 0;
        .icon-wrap {
          display:flex;
          align-items: center;
          p {
            font-size: 14px;
            text-align: left;
            color: #c0c4cc;
            line-height: 1;
          }
        }
        .coin-img {
          width: 28px;
          height: 28px;
          margin-right: 5px;
          vertical-align: middle;
        }
        .cir-icon {
          span {
            font-size: 12px;
            display: inline-block;
            margin-right: 5px;
            padding: 1px 5px;
            line-height: 1;
            border: 1px solid #6b90e9;
            border-radius: 2px;
            cursor:pointer;
          }
        }
        .cir-icon img {
          width: 28px;
          margin-right: 5px;
        }
        .el-table__header-wrapper {
          .has-gutter {
            th {
              background-color: #78a0f3 !important;
              .cell {
                color: #eaeffd;
              }
            }
          }
        }
      }
    }
    .footer-mobile {
      display: none;
    }
    .code_dialog {
      .el-dialog {
        .el-dialog__body {
          height: 310px;
          .qrcode {
            img {
              margin: 0 auto 20px;
            }
          }
        }
      }
    }
    .recharge_dialog {
      .el-dialog__header {
        .el-dialog__title {
          font-size: 16px;
        }
      }
      .el-dialog__body {
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
              margin: 10px 0;
            }
            .qrcode {
              text-align: center;
              margin: 20px auto;
              width: 200px;
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
                    width: 400px !important;
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
          }
        }
      }
    }
    .el-icon-circle-plus-outline {
      cursor: pointer;
      font-size: 24px;
      color: #409EFF;
      // margin-top: 5px;
    }
    @media screen and (max-width: 1200px) {
      padding: 0 0.24rem;
      .title {
        margin: 0.24rem auto;
        font-size: 0.28rem;
        .title-pc {
          display: none;
        }
        .title-mobile {
          display: inline-block;
          font-size: 0.28rem;
          font {
            font-size: 0.24rem;
          }
        }
        .iconfuzhi {
          font-size: 0.32rem;
          margin: 0;
        }
        .iconerweima {
          display: none;
        }
      }
      .top {
        .left {
          width: 100%;
          height: 3rem;
          padding: 0.24rem 0.36rem;
          margin-bottom: 0.4rem;
          .total {
            margin: 0;
            h6 {
              span {
                margin-right: 0;
              }
            }
            .fW600 {
              font-size: 0.36rem;
              margin-bottom: 0.2rem;
            }
          }
          .lock {
            margin: 0;
            height: auto;
            p {
              font-size: 0.36rem;
            }
            .fl:last-of-type {
              margin-left: 0.8rem;
            }
          }
          h6 {
            font-size: 0.28rem;
          }
        }
        .right {
          width: 100%;
          height: 3rem;
          margin-bottom: 0.4rem;
        }
      }
      .footer {
        display: none;
      }
      .footer-mobile {
        display: block;
        .asset-list {
          margin-top: 5px;
          &>div {
            overflow: hidden;
            padding: 0.1rem 0;
            border-bottom: 1px solid #dfe4ef;
            &:last-of-type{
              border-bottom: none;
            }
          }
          img {
            width: 0.5rem;
            vertical-align: middle;
            margin-right: 15px;
            &+span {
              font-size: 0.28rem;
              vertical-align: middle;
            }
          }
          .fl {
            margin-top: 0.1rem;
          }
          .fr {
            text-align: right;
            font-size: 0.28rem;
            span{
              font-size: 0.28rem;
              color: #8794b1;
            }
          }
        }
      }
      .el-icon-circle-plus-outline {
        font-size: 0.4rem;
      }
    }
  }
</style>
