import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);

Vue.config.devtools = process.env.NODE_ENV === 'development';
export default new Vuex.Store({
  state: {
    network: sessionStorage.getItem("network") || "NERVE"
  },
  mutations: {
    changeNetwork(state, data) {
      state.network = data;
      sessionStorage.setItem("network", data);
    }
  },
  getters: {
    
  },
  actions: {

  }
})
