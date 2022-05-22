import clientPromise from "../../lib/mongodb"

export default async function handler(req, res) {
  var requestOptions = {
    method: 'GET',
    headers: {
        "X-API-KEY": "2ed58dd572444abfb3dea518ba5181af"
    },
    redirect: 'follow'
}

  let ALL = { "home": {} }
  const client = await clientPromise

  const db = await client.db('nft')
  const collection = db.collection('pxn')
  let contractInfo = await collection.find({ collectionAddress: { $exists: true } }).toArray()
  let home = await collection.find({ collectionAddress: { $exists: false } }).sort({ "rank": 1 }).limit(20).skip(Number(req.body.index)).toArray()
  let osQ = "";
  for (const i of home) {
    osQ += `&token_ids=${i.tokenid}`
    ALL["home"]["a_"+i.tokenid] ? null : ALL["home"]["a_"+i.tokenid] = {}
    ALL["home"]["a_"+i.tokenid] = ({ name: i.name, img: i.image, prevUrl: null, score: i.score, token: i.tokenid, rank: i.rank, price: null, calldata: null })
  }

  const res1 = await fetch(`https://api.opensea.io/wyvern/v1/orders?asset_contract_address=${contractInfo[0].collectionAddress}&bundled=false&include_bundled=false${osQ}&side=1&limit=20&offset=0&order_by=eth_price&order_direction=asc`, requestOptions)
  const data = await res1.json()
  for (const i of data.orders) {
    ALL["home"]["a_"+i.asset.token_id].prevUrl = i.asset.image_preview_url;
    if (ALL["home"]["a_"+i.asset.token_id].price == null) {
      ALL["home"]["a_"+i.asset.token_id].calldata = i.calldata
      ALL["home"]["a_"+i.asset.token_id].price = i.base_price
    }
  }
    res.status(200).json(ALL["home"])
  }