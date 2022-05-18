import { OpenSeaPort, Network } from 'opensea-js'
import { OrderSide } from 'opensea-js/lib/types'
import web3 from 'web3';
import { useState, useEffect } from 'react';
import { useAppContext } from '../src/state';

export default function Card({ url, name, rank, token, contract }) {
    const { address } = useAppContext()
    const [message, setMessage] = useState("BUY")

    async function checkBuy() {
        let provider = window.ethereum;

        try {
            const seaport = new OpenSeaPort(provider, {
                networkName: Network.Main,
                apiKey: "2ed58dd572444abfb3dea518ba5181af"
            })
            const order = await seaport.api.getOrder({
                asset_contract_address: contract,
                token_id: token,
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
            #{name} - rank: {rank}
            <div class="w-full rounded">
                <img src={url}
                    alt="image" loading="lazy"></img>
            </div>
            <div className="w-full mt-1 bg-red-300" onClick={checkBuy}>
                {message}
            </div>
        </div>
    )
}