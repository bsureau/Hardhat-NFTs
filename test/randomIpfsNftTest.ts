//constructor
//requestNft
//fulfillRandomWords
//withdraw
//getBreedFromModdedRng

import { developmentChains } from "../helper-hardhat-config"
import { ethers, network } from 'hardhat';
import { RandomIpfsNft } from '../typechain-types/contracts/RandomIpfsNft';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { VRFCoordinatorV2Mock } from '../typechain-types/@chainlink/contracts/src/v0.8/mocks/VRFCoordinatorV2Mock';
import { deployments } from 'hardhat';
import { BigNumber } from "@ethersproject/bignumber";
import { assert, expect } from "chai";

!developmentChains.includes(network.name) 
    ? describe.skip
    : describe("Random IPFS NFT Unit Tests", function () {

        let randomIpfsNft: RandomIpfsNft,
            deployer: SignerWithAddress, 
            vrfCoordinatorV2Mock: VRFCoordinatorV2Mock

        beforeEach(async () =>{
            const accounts: SignerWithAddress[] = await ethers.getSigners()
            deployer = accounts[0]

            await deployments.fixture('randomipfsnft')
            randomIpfsNft = await ethers.getContract("RandomIpfsNft")
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        })

        describe("Request NFT", function() {

            it("Makes a random word request and emits an event", async function() {

                const fee: BigNumber = await randomIpfsNft.getMintFee()
                
                await expect(randomIpfsNft.requestNft({value: fee.toString()})).to.emit(
                    randomIpfsNft,
                    "NftRequested"
                )
            })

            it("Reverts if paiment is not sent", async function() {
                await expect(randomIpfsNft.requestNft()).to.be.revertedWith("RandomIpfsNft__NeedMoreETHSent")
            })
        })

        describe("Fullfill random words", function() {
            it("Mint NFT after random word returned", async function(){

                randomIpfsNft.once("NftMinted", async () => {
                    try {
                        const tokenUri = await randomIpfsNft.tokenURI(0)
                        const tokenCounter = await randomIpfsNft.getTokenCounter()
                        assert.equal(tokenUri.toString().includes("ipfs://"), true)
                        assert.equal(tokenCounter.toString(), "1")
                    } catch (e) {
                        console.log(e)
                    }
                })
                try {
                    const fee = await randomIpfsNft.getMintFee()
                    const requestNftResponse = await randomIpfsNft.requestNft({
                        value: fee.toString(),
                    })
                    const requestNftReceipt = await requestNftResponse.wait(1)
                    await vrfCoordinatorV2Mock.fulfillRandomWords(
                        requestNftReceipt.events![1].args!.requestId,
                        randomIpfsNft.address
                    )
                } catch (e) {
                    console.log(e)
                }
            })
        })

        describe("Withdraw", function() {

        })

        describe("Get Breef from modded rng", function() {
            
            it("Returns Breed depending on modded rng value", async function() {
                const breed: number = await randomIpfsNft.getBreedFromModdedRng(BigNumber.from("15"));
                assert.equal(breed, 1)
            })

            it("Reverts if modded rng is out of bounds", async function() {
                await expect(randomIpfsNft.getBreedFromModdedRng(BigNumber.from("1000"))).to.be.revertedWith("RandomIpfsNft__RangeOutOfBounds")
            })
        })
    })
