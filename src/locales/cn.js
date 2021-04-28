import zhLocale from 'element-ui/lib/locale/lang/zh-CN'

const cn = {
  header: {
    header1: "交易记录",
    header2: "网络账户",
    header3: "资产上架",
    header4: "审计报告",
    header5: "当前网络",
    header6: "语言",
    header7: "社区",
    header8: "退出钱包",
  },
  home: {
    home1: "生成多链地址",
    home2: "手续费全部用于链上交易，NerveBridge未收取任何费用",
    home3: "可用: ",
    home4: "从",
    home5: "到",
    home6: "选择资产",
    home7: "余额或手续费不足",
    home8: "metamask网络与bridge网络不一致",
    home9: "合约地址: ",
    home10: "点击授权",
    home11: "加速",
    home12: "查询闪兑费用失败，请稍后重试",
  },
  public: {
    amount: "数量",
    fee: "手续费",
    next: "下一步",
    filter: "筛选",
    loading: "加载中...",
    noMore: "没有更多了",
    confirmed: "已确认",
    pending: "未确认",
    copySuccess: "已复制到剪切板",
    time: "时间"
  },
  accounts: {
    accounts1: "网络账户",
    accounts2: "所有网络账户地址，均为当前网络账户推导而出由当前网络账户私钥控制",
  },
  txList: {
    txList1: "交易记录",
    txList2: "发起网络",
    txList3: "接收网络",
    txList4: "进行中",
    txList5: "失败",
    txList6: "已完成",
  },
  txDetail: {
    txDetail1: "交易详情",
    txDetail2: "(转入闪兑手续费)",
    txDetail3: "(闪兑提现手续费)",
  },
  transfer: {
    transfer1: "转账",
    transfer2: "转入NERVE网络",
    transfer3: "转入手续费",
    transfer4: "手续费兑换为NVT",
    transfer5: "转入目标网络",
    transfer6: "交易数据丢失, 请重新操作",
  },
  tips: {
    tips1: "交易已发出，等待区块确认",
    tips2: "获取闪兑信息失败",
  },

  crossStatusType: {
    0: "跨链交易发起链未确认",
    1: "跨链交易发起链已确认",
    2: "等待广播闪对交易",
    3: "闪对交易已广播待确认",
    4: "闪对交易广播失败",
    5: "等待广播NERVE跨链交易",
    6: "跨链交易NERVE链已广播待确认",
    7: "跨链交易NERVE链广播失败",
    8: "目标链已确认",
    9: "跨链交易失败",
    // 1: "跨链交易发起链已确认",
    // 2: "跨链交易NERVE链已广播交易待确认",
    // 3: "跨链交易NERVE链广播失败",
    // 4: "目标链已确认",
    // 5: "跨链交易失败",
  },

  ...zhLocale
};
export default cn
