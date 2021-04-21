<template>
  <div class="transfer second-page" v-loading="loading">
    <back-bar :backTitle="$t('transfer.transfer1')"></back-bar>
    <div class="content">
      <div class="content-inner">
        <div class="step-list">
          <div class="step" v-for="(item, index) in stepList" :key="index">
            <div
              class="left"
              :class="{ active: index + 1 <= currentStep && item.done }"
            >
              <div class="circle">
                <div class="inner">{{ index + 1 }}</div>
              </div>
              <div class="line" v-if="index + 1 < stepList.length"></div>
            </div>
            <div class="right">
              <span>{{ item.label }}</span>
              <i
                class="el-icon-loading"
                v-if="index + 1 === currentStep && !item.done"
              ></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BackBar from "@/components/BackBar";
import { NTransfer, ETransfer } from "@/api/api";
import { MAIN_INFO, NULS_INFO } from "@/config"


function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export default {
  data() {
    return {
      loading: true,
      stepList: [
        /* {label: this.$t('transfer.transfer2'), done: false},
        {label: this.$t('transfer.transfer3'), done: false},
        {label: this.$t('transfer.transfer4'), done: false},
        {label: this.$t('transfer.transfer5'), done: false}, */
      ],
      currentStep: 1,
    };
  },

  components: {
    BackBar,
  },

  watch: {},

  computed: {},

  created() {},

  mounted() {
    const info = JSON.parse(sessionStorage.getItem("transferInfo"));
    if (!info) {
      this.$message({
        message: this.$t("transfer.transfer6"),
        type: "warning",
      });
      this.$router.push("/");
      return;
    }
    this.sessionInfo = info;
    this.initTransfer();
    // this.constructSwapTx(info.swapInfo)
  },
  destroyed() {
    sessionStorage.removeItem("transferInfo");
  },

  methods: {
    async initTransfer() {
      try {
        const {
          fromChain,
          toChain,
          crossInfo, //普通nerve nuls跨链信息
          crossOutInfo, // 提现
          crossInInfo, // 异构链转入
          NULSContracInfo, // nuls 合约token跨链
          crossInForSwapInfo, // 闪兑资产
          swapInfo // 闪兑交易
        } = this.sessionInfo;
        if (fromChain === "NERVE") {
          let type, transferInfo;
          if (toChain === "NULS") {
            type = 10;
            transferInfo = crossInfo;
          } else {
            type = 43;
            transferInfo = crossOutInfo;
          }
          const txData = transferInfo.txData || {}
          await this.constructTx(
            fromChain, type, transferInfo, txData, this.$t("transfer.transfer5"), true
          )
        } else if (fromChain === "NULS") {
          let type, transferInfo;
          if (NULSContracInfo) {
            type = 16;
            transferInfo = NULSContracInfo;
          } else {
            type = 10;
            transferInfo = crossInfo;
          }
          const txData = transferInfo.txData || {};
          // 转入
          await this.constructTx(
            fromChain, type, transferInfo, txData, this.$t("transfer.transfer2"), true
          )
          if (toChain !== "NERVE") {
            if (crossInForSwapInfo) {
              // 转入一笔主资产用于闪兑手续费
              await this.constructTx(
                fromChain, 10, crossInForSwapInfo, {}, this.$t("transfer.transfer3"), true
              )
            }
            if (swapInfo) {
              //组装闪兑交易
              await this.constructSwapTx(swapInfo, this.$t("transfer.transfer4"))
            }
            // 提现
            await this.constructTx(
              "NERVE", 43, crossOutInfo, crossOutInfo.txData, this.$t("transfer.transfer5"), false
            )
          }
        } else {
          // 异构链转入
          await this.constructCrossInTx(crossInInfo, this.$t("transfer.transfer2"));

          if (toChain !== "NERVE") {
            if (swapInfo) {
              // 转入一笔主资产用于闪兑手续费
              await this.constructCrossInTx(crossInForSwapInfo, this.$t("transfer.transfer3"));

              //组装闪兑交易
              await this.constructSwapTx(swapInfo, this.$t("transfer.transfer4"))
            }
            let type, transferInfo;
            if (toChain === "NULS") {
              type = 10;
              transferInfo = crossInfo
            } else {
              type = 43;
              transferInfo = crossOutInfo
            }
            const txData = transferInfo.txData || {};
            await this.constructTx(
              "NERVE", type, transferInfo, txData, this.$t("transfer.transfer5"), false
            )
          }
        }
        this.runTransfer();
      } catch (e) {
        console.log(e, "===组装交易失败===");
        this.$message({ message: "组装交易失败，请稍后再试", type: "warning" });
      }
      this.loading = false;
    },

    /**
     * @desc 组装nerve nuls普通跨链，token跨链交易
     * @param needBroadcast 是否需要自己先广播
     */
    async constructTx(chain, type, transferInfo, txData, label, needBroadcast) {
      const fn = async () => {
        const { pub, signAddress } = this.sessionInfo
        const transfer = new NTransfer({ chain, type });
        const inputOutput = await transfer.inputsOrOutputs(transferInfo);
        const data = {
          inputs: inputOutput.inputs,
          outputs: inputOutput.outputs,
          txData,
          pub,
          signAddress,
        };
        return await transfer.getTxHex(data);
      }
      const step = {
        label,
        done: false,
        fn,
        needBroadcast
      };
      this.stepList.push(step);
    },

    //广播nerve nuls跨链转账交易
    async broadcastHex(txHex) {
      const url = this.sessionInfo.fromChain === "NERVE" ? MAIN_INFO.rpc : NULS_INFO.rpc;
      const chainId = this.sessionInfo.fromChain === "NERVE" ? MAIN_INFO.chainId : NULS_INFO.chainId;
      const res = await this.$post(url, 'broadcastTx', [chainId, txHex]);
      if (res.result && res.result.hash) {
        return { hash: res.result.hash };
      } else {
        throw "广播nerve nuls交易失败"
      }
    },
    
    // 组装闪兑交易
    async constructSwapTx(swapInfo, label) {
      const fn = async () => {
        const txHexForSign = await this.getSwapHex(swapInfo);
        const transfer = new NTransfer({ chain: "NERVE" }); 
        const { pub, signAddress } = this.sessionInfo;
        return await transfer.appendSignature({
          txHexForSign,
          pub,
          signAddress
        });
      }
      this.stepList.push({
        label,
        done: false,
        fn
      });
      // const txHex = await fn();
      // console.log(swapInfo, "=swapInfo");
      // this.$post("http://beta.public.nerve.network", "validateTx", [txHex])
      // this.$post("http://beta.public.nerve.network", "broadcastTx", [txHex])
    
    },
    // 获取闪兑hex
    async getSwapHex(swapInfo) {
      const res = await this.$request({
        url: "/tx/exchange",
        data: swapInfo
      });
      console.log(res.code, res.data.data)
      if (res.code === 1000 && res.data.data) {
        return res.data.data
      } else {
        throw this.$t("tips.tips2")
      }
    },
    // 组装异构链跨链转入交易
    async constructCrossInTx(crossInInfo, label) {
      const transfer = new ETransfer();
      const fn = async () => await transfer.crossIn(crossInInfo);
      const step = {
        label,
        done: false,
        fn
      };
      this.stepList.push(step);
    },
    async runTransfer() {
      console.log(this.stepList, 55)
      /* this.stepList.map((step, i) => {
        if (i < currentStep && !step.needBroadcast) {
          step.done = true;
        }
      }); */
      const { fromChain, toChain, fromAddress, toAddress, chainId, assetId, contractAddress, amount, symbol } = this.sessionInfo;
      const broadcastData = {
        fromChain,
        toChain,
        fromAddress,
        toAddress,
        chainId,
        assetId,
        contractAddress,
        symbol,
        amount,
        txHash: "",
        feeTxHash: "",
        convertTxHex: "",
        crossTxHex: ""
      }
      try {
        let updateTx = {
          txHash: "",
          feeTxHash: "",
          convertTxHex: "",
          crossTxHex: ""
        }
        for (let i = 0; i < this.stepList.length; i++) {
          const step = this.stepList[i];
          if (!step.done) {
            let res = await step.fn();
            this.currentStep++;
            console.log(res, 123);
            if (step.needBroadcast) {
              res = await this.broadcastHex(res)
            }
            if (res) {
              this.stepList[i].done = true;
              if (res.hash) {
                if (i === 0) {
                  //异构链转入
                  broadcastData.txHash = res.hash;
                  updateTx.txHash = res.hash;
                  await this.broadcast(broadcastData)
                } else {
                  // 异构链转入手续费
                  updateTx.feeTxHash = res.hash;
                }
              } else {
                if (updateTx.feeTxHash && !updateTx.convertTxHex) {
                  // 兑换手续费
                  updateTx.convertTxHex = res
                } else {
                  // nerve转出
                  updateTx.crossTxHex = res
                }
              }
              await sleep(500);
            } else {
              break;
            }
          }
        }
        this.updateTx(updateTx)
      } catch (e) {
        console.error("error: " + e);
        this.$message({ message: "交易失败，请稍后再试", type: "warning" });
      }
    },
    async broadcast(data) {
      const res = await this.$request({
        url: "/tx/cross/bridge/transfer",
        data: data
      });
      if (res.code !== 1000) {
        throw "交易失败"
      }
      /* if (res.code === 1000) {
        this.$message({
          message: this.$t("tips.tips1"),
          type: "success",
          duration: 2000
        })
      } else {
        this.$message({
          message: res.msg,
          type: "warning",
          duration: 2000
        })
      }
      setTimeout(() => {
        this.$router.push("/")
      }, 2000) */
    },
    /**
     * 更新广播交易
     */
    async updateTx(data) {
      const res = await this.$request({
        url: "/tx/bridge/update/tx",
        data: data
      });
      if (res.code === 1000) {
        this.$message({
          message: this.$t("tips.tips1"),
          type: "success",
          duration: 2000
        })
      } else {
        this.$message({
          message: res.msg,
          type: "warning",
          duration: 2000
        })
      }
      setTimeout(() => {
        this.$router.push("/")
      }, 2000)
    }
  },
};
</script>
<style lang="less">
.transfer {
  .step {
    display: flex;
    height: 80px;
    .left {
      margin-right: 15px;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      .circle {
        width: 32px;
        height: 32px;
        font-size: 12px;
        border-radius: 50%;
        background-color: #f2f3f6;
        // opacity: 0.45;
        text-align: center;
        position: relative;
        .inner {
          position: absolute;
          width: 26px;
          height: 26px;
          line-height: 26px;
          border-radius: 50%;
          top: 3px;
          left: 3px;
          background-color: #cacdd8;
          color: #fff;
        }
      }
      .line {
        width: 2px;
        margin: 5px 0;
        background-color: #cacdd8;
        flex: 1;
      }
      &.active {
        .circle {
          background-color: #d2f3ff;
          .inner {
            background-color: #5bcaf9;
          }
        }
        .line {
          background-color: #5bcaf9;
        }
      }
    }
    .right {
      padding-top: 5px;
      span {
        display: inline-block;
        font-size: 14px;
      }
      i {
        margin-left: 5px;
        color: #99a3c4;
        font-size: 18px;
      }
    }
  }
}
</style>
