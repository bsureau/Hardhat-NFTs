import { developmentChains } from "../helper-hardhat-config"
import { deployments, ethers, network } from "hardhat"
import { BasicNFT } from '../typechain-types/contracts/BasicNFT';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractTransaction } from "ethers";
import { assert } from "chai";

!developmentChains.includes(network.name) 
    ? describe.skip 
    : describe("Basic NFT Unit Tests", function () {

        let basicNft: BasicNFT
        let deployer: SignerWithAddress

        beforeEach(async () => {
            const accounts: SignerWithAddress[] = await ethers.getSigners()
            deployer = accounts[0]
            await deployments.fixture(['basicnft'])
            basicNft = await ethers.getContract("BasicNFT")
        })

        it("Allows user to mint, and update state appropriately", async function () {
            
            // Arrange 
            const expectedTokenCounter: string = "1"
            const expectedTokenUri: string = await basicNft.TOKEN_URI()

            // Act
            const tx: ContractTransaction = await basicNft.mintNft()
            tx.wait(1)

            // Assert
            assert.equal((await basicNft.getTokenCounter()).toString(), expectedTokenCounter)
            assert.equal(await basicNft.tokenURI(0), expectedTokenUri)
        })
    })
