import enLocale from 'element-ui/lib/locale/lang/en'

const en = {
  header: {
    header1: "Transactions",
    header2: "Addresses",
    header3: "Submit Token",
    header4: "Audit Report",
    header5: "Current Network",
    header6: "Language",
    header7: "Community",
    header8: "Quit",
    header9: "Nerve Wallet",
  },
  home: {
    home1: "Import Addresses",
    home2: "All fees are used for on-chain transactions and NerveBridge charge nothing",
    home3: "Avaliable: ",
    home4: "From",
    home5: "To",
    home6: "Asset(network)",
    home7: "Balance or fee is not enough",
    // home8: "Metamask network is inconsistent with DApp network",
    home8: "Network error",
    home9: "Contract: ",
    home10: "Approve",
    home11: "Speed up",
    home12: "Failed to check flash fee, please try again later",
    home13: "Swap",
    home14: "Cross-chain",
    home15: "Cross-chain transactions take a long time to confirm on each chain, which takes several minutes, please wait patiently",
    home16: "Receving address",
    home17: "Send",
    home18: "Receive",
    home19: "Order confirmation",
    home20: "Confirm",
    home21: "Send",
    home22: "Receive",
    home23: "All fees are charged by the third-party platform, NerveBridge charge no fees",
    home24: "Enter the token symbol or address",
    home25: "Please wait for the current transaction to complete before sending the next one",
  },
  public: {
    amount: "Amount",
    fee: "Fees",
    next: "Next",
    filter: "Select",
    loading: "Loading",
    noMore: "No More",
    confirmed: "Confirmed",
    pending: "Unconfirmed",
    copySuccess: "Copied to clipboard",
    time: "Date"
  },
  accounts: {
    accounts1: "Network Address",
    accounts2: "All network account addresses are derived from the current network account and controlled by its private key",
  },
  txList: {
    txList1: "Tansactions",
    txList2: "Source",
    txList3: "Target",
    txList4: "Processing",
    txList5: "Failed",
    txList6: "Finished",
    txList7: "Send asset",
    txList8: "Receive asset",
  },
  txDetail: {
    txDetail1: "Detail",
    txDetail2: "(Transfer swap fee)",
    txDetail3: "(Swap withdrawal fee)",
    txDetail4: "To resend",
  },
  transfer: {
    transfer1: "Transfer",
    transfer2: "Transfer asset to Nerve network",
    transfer3: "Transfer fee",
    transfer4: "Swap fee to NVT",
    transfer5: "Transfer asset to target network",
    transfer6: "Transaction data lost，pls try again",
    transfer7: "Decentralized cross-chain requires multiple signatures. Interruption of signatures will result in transaction failure",
  },
  tips: {
    tips1: "Transaction has been sent, waiting for block confirmation",
    tips2: "Failed to query swap information",
    tips3: "Metamask not detected",
    tips4: "The network is abnormal, the account synchronization failed, please try again later",
    tips5: "Failed to derive multi-chain address",
    tips6: "Transfer Failed,pls try again later",
    tips7: "Failed to check balance",
    tips8: "Minimum exchange quantity: ",
    tips9: "Maximum exchange quantity",
    tips10: "Failed to create order",
  },

  crossStatusType: {
    0: "Initiation chain unconfirmed",
    1: "Initiation chain confirmed",
    2: "Waiting for the broadcast swap transaction",
    3: "Swap transaction unconfirmed",
    4: "Swap transaction broadcast failed",
    5: "Waiting to broadcast NERVE transaction",
    6: "NERVE broadcast to be confirmed",
    7: "NERVE broadcast failed",
    8: "Destination chain confirmed",
    9: "Failed",
    noFee: "No transfer fee", // 未转入闪兑所需手续费
    // 1: "跨链交易发起链已确认",
    // 2: "跨链交易NERVE链已广播交易待确认",
    // 3: "跨链交易NERVE链广播失败",
    // 4: "目标链已确认",
    // 5: "跨链交易失败",
  },
  swftStatusType: {
    wait_deposit_send: "Waiting for the deposit",
    timeout: "Time out",
    wait_exchange_push: "Waiting for the swap of information",
    wait_exchange_return: "Waiting for the swap of information to return",
    wait_receive_send: "Waiting for receiving asset to send", 
    wait_receive_confirm: "Waiting for confirmation of receiving asset", 
    receive_complete: "Confirmation of receiving asset is complete",
    wait_refund_send: "Waiting for the return of the original asset to be sent",
    wait_refund_confirm: "Waiting for confirmation of the original asset",
    refund_complete: "Confirmation of the refund of the original asset",
    "ERROR/error": "Order in process" ,
    WAIT_KYC: "Wait for KYC or contact customer service to provide the link"
  },
  ...enLocale

};
export default en
