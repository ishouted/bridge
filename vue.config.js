const CompressionWebpackPlugin = require('compression-webpack-plugin');
const productionGzipExtensions = ['js', 'css'];
const shell = require("shelljs");
shell.cp(process.cwd() + "/config/" + process.env.NULS_ENV + ".js",process.cwd() + "/src/config.js");
const isProduction = process.env.NODE_ENV === 'production';
console.log("use config file : " + process.cwd() + "/config/" + process.env.NULS_ENV + ".js");
module.exports = {

  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',

  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'locales',
      enableInSFC: false
    },
  },

  configureWebpack: config => {
    if (isProduction) {
      config.plugins.push(new CompressionWebpackPlugin({
        algorithm: 'gzip',
        test: new RegExp('\\.(' + productionGzipExtensions.join('|') + ')$'),
        threshold: 10240,
        minRatio: 0.8
      }));

    }
    config.externals = {
      'vue': 'Vue',
      'vue-router': 'VueRouter',
      'vuex': 'Vuex',
      'moment': 'moment',
      'element-ui': 'ELEMENT',
    }
  },

  devServer: {
    port: 8075,
    host: '0.0.0.0',
    https: false, // https:{type:Boolean}
    open: true, //配置自动启动浏览器
    proxy: {// 配置跨域处理
      "/bridge-api": {
        // target: "http://192.168.1.132:8083", // 周维
        // target: "http://192.168.1.101:8080", // 李超
        target: "http://beta.bridge.nerve.network",
        // target: "https://bridge.nerve.network",
        changeOrigin: true,  // 是否跨域
      },
      "/nabox-api": {
        target: "http://192.168.1.132:8083", // 周维
        // target: "http://192.168.1.101:8080", // 李超
        // target: "http://beta.bridge.nerve.network",
        // target: "https://bridge.nerve.network",
        changeOrigin: true,  // 是否跨域
      },
    }
  }
};
