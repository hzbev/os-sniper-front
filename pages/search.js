import clientPromise from '../lib/mongodb'
import Card from '../components/card'
import Link from 'next/link'


export default function Home({ data }) {
  return (
    <div className="bg-white">
      <div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


          <section aria-labelledby="products-heading" className="pt-6 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-8 gap-y-10">
              <form className="hidden lg:block">
                {
                  Object.keys(data.traits).map(x => (
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="-my-3 flow-root">
                        <button type="button" className="py-3 bg-white w-full flex items-center justify-between text-sm text-gray-400 hover:text-gray-500" aria-controls="filter-section-1" aria-expanded="false">
                          <span className="font-medium text-gray-900"> {x} </span>
                        </button>
                      </h3>
                      {
                        Object.keys(data.traits[x]).map(a => (
                          <div className="pt-2" id="filter-section-1">
                            <div class="space-y-1">
                            <div class="flex items-center ml-2 border-b-2">
                                <Link href={`/search?type=${x}&value=${encodeURIComponent(a)}`}>
                                  <a>  {a} - {data.traits[x][a].count}</a>
                                </Link>
                                </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>

                  ))
                }

              </form>
              <div className="lg:col-span-3">
                <div class="container grid grid-cols-3 gap-2 mx-auto">
                  {
                    Object.keys(data.home).map(x => (
                      <Card url={data.home[x].img} name={data.home[x].token} rank={data.home[x].rank} />
                    ))
                  }


                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export async function getServerSideProps(ctx) {
  let ALL = { "home": [], "traits": {} }
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

  let home = await collection.find({"attributes.traittype": ctx.query.type,"attributes.value": ctx.query.value}).sort({ "score": -1 }).limit(20).toArray()
  for (const i of home) {
    ALL["home"].push({ name: i.name, img: i.image, score: i.score, token: i.tokenid, rank: i.rank })
  }

  return {
    props: { data: ALL },
  }

}


