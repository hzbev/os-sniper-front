import { OpenSeaPort, Network } from 'opensea-js'
import { OrderSide } from 'opensea-js/lib/types'
import web3 from 'web3';
import { useState, useEffect } from 'react';
import { useAppContext } from '../src/state';

export default function Card({ allData, contract }) {

    // encodeReplacementPattern()
    const { address, ABI } = useAppContext()
    const [message, setMessage] = useState("BUY")
    // console.log(contractINS)

    // async function CheckBUyy() {
    //     var requestOptions = {
    //         method: 'GET',
    //         headers: {
    //             "X-API-KEY": "2ed58dd572444abfb3dea518ba5181af"
    //         },
    //         redirect: 'follow'
    //     }
    //     const res = await fetch(`https://api.opensea.io/api/v1/asset/${contract}/${allData.token}/listings?limit=1`, requestOptions)
    //     const data = await res.json()
    //     // if (data.listings.length == 0) return setMessage("Not For Sale");
    //     // if (Math.floor(Date.now() / 1000) >= data.listings[0].expiration_time) return setMessage("Sale expired");
    //     // const res2 = await fetch(`https://api.opensea.io/wyvern/v1/orders?asset_contract_address=${contract}&bundled=false&include_bundled=false&token_id=${allData.token}&side=1&limit=20&offset=0&order_by=eth_price&order_direction=asc`, requestOptions)
    //     // const data2 = await res2.json()
    //     // console.log(data2.orders[0])
    //     const _data = data.listings[0]
    //     console.log(allData.calldata)
    //     console.log(_data.calldata)

    //     let xd = "0x" +
    //         Buffer.concat([
    //             abiEncode.methodID("matchERC721UsingCriteria", ["address", "address", "address", "uint256", "bytes32", "bytes32[]"]),
    //             abiEncode.rawEncode(["address", "address", "address", "uint256", "bytes32", "bytes32[]"], ["0x0000000000000000000000000000000000000000", address, contract, allData.token, "0x0000000000000000000000000000000000000000000000000000000000000000", "[]"]),
    //         ]).toString("hex")

    //         let teest = {
    //             type: 'function', name: 'matchERC721UsingCriteria', payable: false, constant: false, stateMutability: 'nonpayable',constant: false,
    //             inputs: [
    //                 { kind: 'owner', name: 'from', type: 'address' },
    //                 { kind: 'replaceable', name: 'to', type: 'address' },
    //                 { kind: 'asset', name: 'token', type: 'address', value: contract },
    //                 { kind: 'asset', name: 'tokenId', type: 'uint256', value: allData.token },
    //                 { kind: 'data', name: 'root', type: 'bytes32', value: '0x0000000000000000000000000000000000000000000000000000000000000000' },
    //                 { kind: 'data', name: 'proof', type: 'bytes32[]', value: [] },
    //             ],
    //             name: "matchERC721UsingCriteria",
    //             outputs: [],
    //             payable: false,
    //             stateMutability: "nonpayable",
    //             target: _data.target,
    //             type: "function",
    //         }

    //         let ooop = encodeReplacementPattern(teest, "owner")

    //         console.log(ooop)

    //     console.log(args)
    //     let webb3 = new web3(window.ethereum)
    //     let test = new webb3.eth.Contract(ABI, contract)
    //     test.methods.atomicMatch_(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10]).send({ from: address, value: _data.base_price })

    // }

    async function checkBuy() {
        let provider = window.ethereum;

        try {
            const seaport = new OpenSeaPort(provider, {
                networkName: Network.Main,
                apiKey: "2ed58dd572444abfb3dea518ba5181af"
            })
            const order = await seaport.api.getOrder({
                asset_contract_address: contract,
                token_id: allData.token,
                side: OrderSide.Sell
            })
            setMessage(web3.utils.fromWei(order.currentPrice.toString(), "ether") + " ETH")
            const accountAddress = address;

            await seaport.fulfillOrder({ order, accountAddress })
        } catch (error) {
            if (error.message == "Not found: no matching order found") {
                setMessage("Not For Sale")
            }
        }
    }

    return (
        <div key={allData.token} className="flex flex-col text-center m-2">
            <a target="_blank" href={`https://opensea.io/assets/ethereum/${contract}/${allData.token}`} rel="noopener noreferrer">
                #{allData.token} - rank: {allData.rank}

            </a>
            <div className="w-full rounded">
                <img src={allData.prevUrl == null ? allData.img : allData.prevUrl}
                    alt="image" loading="lazy"></img>
            </div>
            <div className="w-full mt-1 bg-red-300" onClick={checkBuy}>
                {allData.price ? web3.utils.fromWei(allData.price, "ether") + " ETH" : "not for sale"}
            </div>
        </div>
    )
}




