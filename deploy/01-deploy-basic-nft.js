import { network } from "hardhat"
import { TypeChainTarget } from "typechain"
import { developmentChains } from "../helper-hardhat-config"
import { verify } from "../utils/verify"
import { BasicNFT } from '../typechain-types/contracts/BasicNFT';


module.exports = async ({
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
  }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("-----------------------")
    const args = []
    const basicNFT: BasicNFT = await deploy("BasicNFT", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })

    if (developmentChains.includes(network.name) === false && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(basicNFT.address, args)
    }
    log("-----------------------")
  }
    
  module.exports.tags = ['MyContract'];

}
