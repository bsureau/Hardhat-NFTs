import { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS, networkConfig } from "../helper-hardhat-config"
import { verify } from "../utils/verify"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { ContractReceipt, ContractTransaction } from "ethers";
import { VRFCoordinatorV2Mock } from "../typechain-types/@chainlink/contracts/src/v0.8/mocks/VRFCoordinatorV2Mock";
import { TokenUriMetadata, storeImages, storeTokeUriMetadata } from "../utils/uploadToPinata"
import "dotenv/config"


const imagesLocation: string = "./images/randomNft"

const metadataTemplate: TokenUriMetadata = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100,
        },
    ],
}

let tokenUris: string[] = [
    "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
    "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
    "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
]

const deployRandomIpfsNft: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
  ) {
    const { deployments, getNamedAccounts, network, ethers } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId!
    let vrfCoordinatorV2Address: string, subscriptionId: number
    const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS

    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock: VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = await vrfCoordinatorV2Mock.address
        const tx: ContractTransaction = await vrfCoordinatorV2Mock.createSubscription();
        const txReceipt: ContractReceipt = await tx.wait()
        subscriptionId = txReceipt?.events?.[0]?.args?.subId
        // Fund the subscription
        // Our mock makes it so we don't actually have to worry about sending fund
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, "1000000000000000000000")
    } else {
        vrfCoordinatorV2Address = networkConfig[network.config.chainId!].vrfCoordinatorV2 || ""
        subscriptionId = networkConfig[network.config.chainId!].subscriptionId || 4 // Rinkeby by default
    }
    
    log("----------------------------------------------------")
    
    const args: any[] = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId]["gasLane"],
        networkConfig[chainId]["callbackGasLimit"],
        tokenUris,
        networkConfig[chainId]["mintFee"]
    ]

    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: waitBlockConfirmations || 1
    })

    log("----------------------------------------------------")

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(randomIpfsNft.address, args)
    }
}

async function handleTokenUris() {

    tokenUris = []
    
    // upload random nft images to IPFS using Pinata 
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)

    // for each random nft images, upload metadatas to IPFS using Pinata
    for (const imageUploadResponseIndex in imageUploadResponses) {
        let tokenUriMetadata: TokenUriMetadata = { ...metadataTemplate }
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "")
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
        console.log(`Uploading ${tokenUriMetadata.name}...`)
        const metadataUploadResponse = await storeTokeUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse!.IpfsHash}`)
    }
    console.log("Token URIs uploaded! They are:")
    console.log(tokenUris)
    return tokenUris
}

deployRandomIpfsNft.tags = ["all", "randomipfsnft", "main"]

export default deployRandomIpfsNft
 