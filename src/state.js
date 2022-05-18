import { createContext, useContext, useState, useEffect } from 'react';
import { OpenSeaPort, Network } from 'opensea-js'
import { OrderSide } from 'opensea-js/lib/types'
import web3 from 'web3';


const AppContext = createContext();

export function AppWrapper({ children }) {
  const [address, setAddress] = useState(null)
  let provider;

  useEffect(async () => {
    address ? null :
      ethereum.request({ method: "eth_requestAccounts" }).then((accounts) => {
        // setAddress(web3.utils.toChecksumAddress(accounts[0]))
        setAddress(`${accounts[0]}`)
      }, [])
  })

  let sharedState = {/* whatever you want */ }

  return (
    <AppContext.Provider value={{ address, provider }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}