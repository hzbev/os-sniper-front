import clientPromise from '../lib/mongodb'
import Card from '../components/card'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'



export default function Home({ data, info }) {
  const router = useRouter()
  const [pageData, setData] = useState(data.home);

  async function fetchNew() {
    let ress = await fetch("/api/load", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "index": pageData[Object.keys(pageData)[Object.keys(pageData).length - 1]].rank
      }),
    })
    let res = await ress.json()
    setData({ ...pageData, ...res })

  }

  function handleSubmit(e) {
    e.preventDefault()
    router.push(`/search?type=ID&value=${e.target.elements.search.value}`)
  }
  return (
    <div className="bg-white">
      <div>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className='text-center text-5xl font-extrabold'>not a wallet drainer</div>
          <form onSubmit={handleSubmit}>
            <input
              type="number"
              className="w-full mt-2 text-base font-normal bg-white bg-clip-padding border border-solid border-gray-300 rounded focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
              id="search"
              placeholder="token id search"
            />
          </form>
          <section aria-labelledby="products-heading" className="pt-6 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-8 gap-y-10">
              <div className="hidden lg:block">
                {
                  Object.keys(data.traits).map(x => (
                    <div key={x} className="border-b border-gray-200 pb-6">
                      <h3 className="-my-3 flow-root">
                        <button type="button" className="py-3 bg-white w-full flex items-center justify-between text-sm text-gray-400 hover:text-gray-500" aria-controls="filter-section-1" aria-expanded="false">
                          <span className="font-bold text-gray-900 text-3xl"> {x} </span>
                        </button>
                      </h3>
                      {
                        Object.keys(data.traits[x]).map(a => (
                          <div key={a} className="pt-2" id="filter-section-1">
                            <div className="space-y-1">
                              <div className="flex items-center ml-2 border-b-2">
                                <Link href={`/search?type=${x}&value=${encodeURIComponent(a)}`}>
                                  <a>  {a} ({data.traits[x][a].count})</a>
                                </Link>
                                {/* <input id="filter-category-0" name="category[]" value={a} type="checkbox" class="h-4 w-4 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"></input>
                                <label for="filter-category-0" class="ml-3 text-sm text-gray-600"> {a} - {data.traits[x][a].count}</label> */}
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>

                  ))
                }

              </div>
              <div className="lg:col-span-3">
                <div className="container grid grid-cols-3 gap-2 mx-auto">
                  {
                    Object.keys(pageData).map(x => (
                      <div key={x.tokenid}>
                        <Card allData={pageData[x]} contract={info} />
                      </div>
                    ))
                  }
                </div>
                <div onClick={fetchNew}>LOAD MORE</div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export async function getServerSideProps(context) {

  var requestOptions = {
    method: 'GET',
    headers: {
      "X-API-KEY": "2ed58dd572444abfb3dea518ba5181af"
    },
    redirect: 'follow'
  }

  let ALL = { "home": {}, "traits": {} }
  const client = await clientPromise

  const db = await client.db('nft')
  const collection = db.collection('pxn')
  const res = collection.aggregate([
    { $unwind: "$attributes" },
    {
      $group: {
        _id: "$attributes.value",
        type: {
          "$first": "$attributes.traittype"
        },
        count: { "$sum": 1 }
      }
    }])

  for await (const i of res) {
    ALL["traits"][i.type] ? null : ALL["traits"][i.type] = {}
    ALL["traits"][i.type][i._id] = { "count": i.count }
  }
  let contractInfo = await collection.find({ collectionAddress: { $exists: true } }).toArray()
  let home = await collection.find({ collectionAddress: { $exists: false } }).sort({ "rank": 1 }).limit(20).toArray()
  let osQ = "";
  for (const i of home) {
    osQ += `&token_ids=${i.tokenid}`
    ALL["home"]["a_" + i.tokenid] ? null : ALL["home"]["a_" + i.tokenid] = {}
    ALL["home"]["a_" + i.tokenid] = ({ name: i.name, img: i.image, prevUrl: null, score: i.score, token: i.tokenid, rank: i.rank, price: null, calldata: null })
  }

  const res1 = await fetch(`https://api.opensea.io/wyvern/v1/orders?asset_contract_address=${contractInfo[0].collectionAddress}&bundled=false&include_bundled=false${osQ}&side=1&limit=20&offset=0&order_by=eth_price&order_direction=asc`, requestOptions)
  const data = await res1.json()
  for (const i of data.orders) {
    ALL["home"]["a_" + i.asset.token_id].prevUrl = i.asset.image_preview_url;
    if (ALL["home"]["a_" + i.asset.token_id].price == null) {
      ALL["home"]["a_" + i.asset.token_id].calldata = i.calldata
      ALL["home"]["a_" + i.asset.token_id].price = i.base_price
    }
  }


  return {
    props: { data: ALL, info: contractInfo[0].collectionAddress },
  }

}


