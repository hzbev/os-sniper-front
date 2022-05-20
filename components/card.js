import { OpenSeaPort, Network } from 'opensea-js'
import { OrderSide } from 'opensea-js/lib/types'
import web3 from 'web3';
import { useState, useEffect } from 'react';
import { useAppContext } from '../src/state';

export default function Card({ allData, contract }) {
    const { address, ABI } = useAppContext()
    const [message, setMessage] = useState("BUY")
    // console.log(contractINS)

    async function CheckBUyy() {
        var requestOptions = {
            method: 'GET',
            headers: {
                "X-API-KEY": "2ed58dd572444abfb3dea518ba5181af"
            },
            redirect: 'follow'
        }
        const res = await fetch(`https://api.opensea.io/api/v1/asset/${contract}/${allData.token}/listings?limit=1`, requestOptions)
        const data = await res.json()
        // if (data.listings.length == 0) return setMessage("Not For Sale");
        // if (Math.floor(Date.now() / 1000) >= data.listings[0].expiration_time) return setMessage("Sale expired");
        // const res2 = await fetch(`https://api.opensea.io/wyvern/v1/orders?asset_contract_address=${contract}&bundled=false&include_bundled=false&token_id=${allData.token}&side=1&limit=20&offset=0&order_by=eth_price&order_direction=asc`, requestOptions)
        // const data2 = await res2.json()
        // console.log(data2.orders[0])
        const _data = data.listings[0]
        console.log(allData.calldata)
        console.log(_data.calldata)


        let args = [
            [
                _data.exchange,
                address,
                _data.maker.address,
                "0x0000000000000000000000000000000000000000",
                _data.target,
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                _data.exchange,
                _data.maker.address,
                "0x0000000000000000000000000000000000000000",
                _data.fee_recipient.address,
                _data.target,
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
            ],
            [
                _data.maker_relayer_fee,
                "0",
                "0",
                "0",
                _data.base_price,
                _data.extra,
                _data.listing_time,
                _data.expiration_time,
                _data.salt,
                _data.maker_relayer_fee,
                "0",
                "0",
                "0",
                _data.base_price,
                _data.extra,
                _data.listing_time,
                _data.expiration_time,
                _data.salt,
            ],
            [
                _data.fee_method,
                _data.side,
                _data.sale_kind,
                _data.how_to_call,
                _data.fee_method,
                _data.side,
                _data.sale_kind,
                _data.how_to_call,
            ],
            _data.calldata,
            allData.calldata,
            _data.replacement_pattern,
            _data.replacement_pattern,
            _data.static_extradata,
            _data.static_extradata,
            [_data.v || 0, _data.v || 0],
            [
                _data.r,
                _data.s,
                _data.r,
                _data.s,
                "0x0000000000000000000000000000000000000000000000000000000000000000",
            ],
        ];

        console.log(args)
        let webb3 = new web3(window.ethereum)
        let test = new webb3.eth.Contract(ABI, contract)
        test.methods.atomicMatch_(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10]).send({ from: address, value: _data.base_price })

    }

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
            console.log("order error")

            console.log(error)
            if (error.message == "Not found: no matching order found") {
                setMessage("Not For Sale")
            }
        }
    }

    return (
        <div className="flex flex-col text-center m-2">
            #{allData.token} - rank: {allData.rank}
            <div class="w-full rounded">
                <img src={allData.prevUrl == null ? allData.img : allData.prevUrl}
                    alt="image" loading="lazy"></img>
            </div>
            <div className="w-full mt-1 bg-red-300" onClick={checkBuy}>
                {allData.price ? web3.utils.fromWei(allData.price, "ether") + " ETH" : "not for sale"}
            </div>
        </div>
    )
}




