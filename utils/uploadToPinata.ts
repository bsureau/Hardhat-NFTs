import pinataSDK, { PinataPinResponse } from "@pinata/sdk"
import path from "path"
import fs from "fs"

interface TokenUriMetadataAttributes {
    trait_type: string, 
    value: number
}
export interface TokenUriMetadata {
    name: string,
    description: string,
    image: string,
    attributes: TokenUriMetadataAttributes[]
}

const pinata = pinataSDK(process.env.PINATA_API_KEY || '', process.env.PINATA_API_SECRET || '');

export async function storeImages(imagesFilePath: string) {

    const fullImagesPath: string = path.resolve(imagesFilePath)
    const files: string[] = fs.readdirSync(fullImagesPath)
    
    let responses: PinataPinResponse[] = []
    
    console.log("Uploading to IPFS!")

    for (const fileIndex in files) {
        const readableStreamForFile: fs.ReadStream = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`)

        try {
            const response: PinataPinResponse = await pinata.pinFileToIPFS(readableStreamForFile)
            responses.push(response)
        } catch (error) {
            console.log(error)
        }
    }

    return { responses, files }
}
 

export async function storeTokeUriMetadata(metadata: TokenUriMetadata) {
    try {
        const response = await pinata.pinJSONToIPFS(metadata)
        return response
    } catch (error) {
        console.log(error)
    }
    return null 
}
