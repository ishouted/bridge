<template>
  <el-dialog
    class="add-assets-dialog"
    :title="$t('home.home13')"
    :visible.sync="showAssetManage"
    width="600px"
    center
    @closed="close"
  >
    <el-input v-model="searchVal" :placeholder="$t('home.home15')"></el-input>
    <ul class="list-wrap">
      <li v-for="item in list" :key="item.assetKey" @click="changeSelect(item.assetKey)">
        <img :src="item.icon" />
        <div class="asset-base-info">
          <div>{{item.name}}</div>
          <span>ID: {{item.assetKey}}</span>
        </div>
        <div class="circulation-network">
          <div>{{$t("home.home14")+': '}}{{item.circulationNetwork}}</div>
        </div>
        <el-checkbox v-model="item.added" :disabled="checkDisabled(item.assetKey)"></el-checkbox>
      </li>
    </ul>
    <span slot="footer" class="dialog-footer">
      <el-button @click="close">{{$t("address.address10")}}</el-button>
      <el-button type="primary" @click="confirm">{{$t("address.address11")}}</el-button>
    </span>
  </el-dialog>
</template>

<script>
import _ from "lodash";
import { isBeta } from "@/api/util"
export default {
  data () {
    this.allAssetsList = []
    return {
      list: [],
      searchVal: "",
      defaultAssets: isBeta ? ["5-1", "2-1"] : ["9-1", "1-1"]
    }
  },
  props: {
    showAssetManage: Boolean,
    assetList: {
      type: Array,
      default: ()=>[]
    },
    selectAssets: {
      type: Array,
      default: ()=>[]
    },
  },

  components: {},

  watch: {
    searchVal(val){
      this.filter(val)
    },
    assetList: {
      deep: true,
      immediate: true,
      handler(val) {
        if (!val || !val.length) return
        const list = _.cloneDeep(this.assetList)
        list.map(item=> {
          item.added = false
          const network = ["NULS","NERVE"]
          if (item.heterogeneousList && item.heterogeneousList.length) {
            // const network = ["NULS","NERVE"]
            item.heterogeneousList.map(v=>{
              if (v.heterogeneousChainId === 101) {
                network.push("Ethereum")
              } else if (v.heterogeneousChainId === 102) {
                network.push("BSC")
              } else if (v.heterogeneousChainId === 103) {
                network.push("Heco")
              }
            })
          } 
          item.circulationNetwork = network.join()
          this.selectAssets.map(v => {
            if (item.assetKey === v) {
              item.added = true
            }
          })
        })
        this.allAssetsList = list
        this.filter(this.searchVal)
      }
    }
  },
  methods: {
    filter(str) {
      if (!str) {
        this.list = this.allAssetsList.filter(v=>v)
      } else {
        this.list = this.allAssetsList.filter(v=>{
          return v.assetKey.indexOf(str) > -1 || (v.name.toUpperCase()).indexOf(str.toUpperCase()) > -1
        })
      }
      
    },
    changeSelect(key) {
      const isDefaultAsset = this.checkDisabled(key)
      if (isDefaultAsset) return
      this.allAssetsList.map(v=> {
        if (v.assetKey === key) {
          v.added = !v.added
        }
      })
      // this.filter()
    },
    checkDisabled(key) {
      return this.defaultAssets.indexOf(key) > -1
    },
    close() {
      this.$emit("update:showAssetManage", false)
    },
    confirm() {
      const select = []
      this.allAssetsList.map(v=>{
        if (v.added) {
          select.push(v.assetKey)
        }
      })
      const addressInfo = [...this.$store.state.addressInfo];
      addressInfo.map(v=>{
        if (v.selection) {
          v.visiableAssets = select
        }
      })
      this.$store.commit("setAddressInfo", addressInfo)
      this.$emit("addAssets")
      this.close()
    }
  }
}

</script>
<style lang='less'>
  .add-assets-dialog {
    .list-wrap {
      height: 55vh;
      overflow-y: auto;
      li {
        display: flex;
        align-items: center;
        height: 50px;
        border-bottom: 1px solid #dfe4ef;
        cursor: pointer;
        img {
          height: 28px;
          margin-right: 10px;
        }
        .asset-base-info {
          width: 120px;
        }
        .circulation-network {
          flex: 1;
          margin-right: 10px;
          div {
            margin-top: 20px;
          }
          
        }
        .el-checkbox {
          margin-right: 10px;
        }
      }
    }
    
    @media screen and (max-width: 1200px) {
      .list-wrap {
        li {
          .asset-base-info {
            width: 2rem;
          }
          .circulation-network {
            div {
              margin-top: 0;
            }
            
          }
          .el-checkbox {
            margin-right: 0;
          }
        }
      }
      .el-dialog__footer {
        padding: 0 20px 10px;
      }
    }
  }
</style>