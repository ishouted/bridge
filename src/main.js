import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import i18n from './i18n'
import {post, request} from './api/https'
import { toThousands, isBeta } from "./api/util";
// import './api/rem'
// import VConsole from 'vconsole'
// new VConsole()
const development = process.env.NODE_ENV === "development"

Vue.config.devtools = development;

if (!development) {
  console.log = () => {};
}

Vue.config.productionTip = false;

Vue.filter('toThousands', toThousands)

Vue.prototype.$post = post;

Vue.prototype.$request = request;

const network = isBeta ? "beta" : "main";

async function getConfig(network) {
  try {
    const res = await request({url: "/api/chain/config", method: "get", network});
    let config = {};
    if (res.data && res.data.length) {
      res.data.map(v => {
        const mainInfo = v.mainAsset;
        config[v.chain] = {
          chainId: mainInfo ? mainInfo.chainId : "",
          assetId: mainInfo ? mainInfo.assetId : "",
          prefix: v.prefix,
          symbol: mainInfo ? mainInfo.symbol : "",
          decimal: mainInfo ? mainInfo.decimals : "",
          assets: v.assets,
          config: v.configs
        }
      });
    }
    sessionStorage.setItem("config", JSON.stringify(config));
  } catch (e) {
    console.error(e, "获取链配置失败");
  }
  /* eslint-disable no-new */
  new Vue({
    el: "#app",
    router,
    store,
    i18n,
    render: h => h(App)
  });
  if (development && window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
    window.__VUE_DEVTOOLS_GLOBAL_HOOK__.Vue = app.constructor
  }
}

getConfig(network);


// new Vue({
//   el: "#app",
//   router,
//   store,
//   i18n,
//   render: h => h(App)
// });
