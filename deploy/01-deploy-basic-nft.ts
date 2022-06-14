import { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS} from "../helper-hardhat-config"
import { verify }  from "../utils/verify"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

export const deployBasicNft: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
  ) {
    const { deployments, getNamedAccounts, network, ethers } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS

    log("----------------------------------------------------")
    const args: any[] = []
    const basicNft = await deploy("BasicNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: waitBlockConfirmations || 1,
    })

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(basicNft.address, args)
    }
}

deployBasicNft.tags = ["all", "basicnft", "main"]
