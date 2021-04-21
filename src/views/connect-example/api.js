const ethers = require('ethers');

const CROSS_OUT_ABI = [
  "function crossOut(string to, uint256 amount, address ERC20) public payable returns (bool)"
];
const ERC20_ABI = [
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

/**
 * metamask 发送网络主资产
 * @param provider
 * @param from //插件地址
 * @param multySignAddress 多签地址
 * @param address nerve地址
 * @param numbers 交易数量
 * @param contractAddress 合约地址
 * @param decimal token精度
 */
export async function getTransactionParameters(from, multySignAddress, nerveAddress, numbers, contractAddress, decimal) {
  const iface = new ethers.utils.Interface(CROSS_OUT_ABI);
  // const data = iface.encodeFunctionData("crossOut(string,uint256,address)",[nerveAddress, amount, '0x0000000000000000000000000000000000000000']);
  let transactionParameters;
  if (decimal && contractAddress) {
    const numberOfTokens = ethers.utils.parseUnits(numbers, decimal);
    const data = iface.functions.crossOut.encode([nerveAddress, numberOfTokens, contractAddress]);
    transactionParameters = {
      // from, //验证合约调用需要from,必传
      to: multySignAddress,
      value: '0x00',
      data
    };
  } else {
    const amount = ethers.utils.parseEther(numbers);
    const data = iface.functions.crossOut.encode([nerveAddress, amount, '0x0000000000000000000000000000000000000000']);
    transactionParameters = {
      from,
      to: multySignAddress,
      value: amount.toHexString(),
      data,
      // gas: "0x76c0",
      // gasPrice: "0x9184e72a000",
    };
  }
  
  
  console.log(transactionParameters, 666)
  return transactionParameters;
  /* console.log(transactionParameters)
  const failed = await validate(provider, transactionParameters);
  if (failed) {
    console.error('failed approveERC20' + failed);
    return {success: false, msg: 'failed approveERC20' + failed}
  }
  return { success: true, data: transactionParameters } */
}

//验证交易参数
async function validate(provider, tx) {
  try {
    const result = await provider.call(tx);
    return ethers.utils.toUtf8String('0x' + result.substr(138));
  } catch (e) {
    return false
  }
}


