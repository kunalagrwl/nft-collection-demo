
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Web3Modal from 'web3modal'
import {ethers} from 'ethers'
import {useState, useEffect, useRef} from 'react'
import {NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI} from '../constants'

export default function Home() {

  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [isPresaleStarted, setIsPresaleStarted] = useState(false)
  const [presaleEnded, setPresaleEnded] = useState(false)
  const [numMintedTokens, setNumTokensMinted] = useState("0")
  const [isLoading, setIsLoading] = useState(false)
  const Web3ModalRef = useRef()

  useEffect(()=>{
    Web3ModalRef.current = new Web3Modal({
      network: "rinkeby", 
      providerOptions: {}
    })

    onPageLoad()
  },[])

  const onPageLoad = async () => {
    try {
      const connected = await connectWallet()
      if (connected) {
        //console.log("running after connect code..")
        await getOwner()
        const presaleStarted = await checkIfPresaleStarted()
        if(presaleStarted) {
          await getNumOfMints()
          await checkIfPresaleEnded()
        }

        setInterval(async ()=>{
          const presaleStarted = await checkIfPresaleStarted()
          if(presaleStarted) {
            await getNumOfMints()
            await checkIfPresaleEnded()
          }
        }, 5000)

      }
    }
    catch(err) {
      console.error(err)
    }    
  }

  const connectWallet = async () => {
    try {
      const value = await getProviderOrSigner()
      if(typeof value !== 'undefined') {
        //console.log(value)
        setIsWalletConnected(true)
        return true
      }
    }
    catch(err) {
      console.error("connectWallet", err)
      return false
    }    
  }

  const getProviderOrSigner = async (needSigner = false) => {
    try {
      const provider = await Web3ModalRef.current.connect()
      //console.log(provider)
      const web3Provider = new ethers.providers.Web3Provider(provider)
      const {chainId} = await web3Provider.getNetwork()
      if(chainId !== 4) {
        alert("Change network to Rinkeby")
        throw new Error("Change network to Rinkeby")
      }
      if(needSigner) {
        const signer = web3Provider.getSigner()
        return signer
      }
      return web3Provider
    }
    catch(err) {
      console.error("getProviderOrSigner", err)
    }
  }

  const getOwner = async() => {
    try {
      const signer = await getProviderOrSigner(true)
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer)
      const owner = await nftContract.owner()
      const userAddress = await signer.getAddress()
      //console.log("owner details",owner,userAddress, owner.toLowerCase() === userAddress.toLowerCase())
      if(owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true)
      }
    }
    catch(err) {
      console.error("getOwner", err)
    }
  }

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner()
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider)
      const block_IsPresaleStarted = await nftContract.presaleStarted()
      setIsPresaleStarted(block_IsPresaleStarted)
      return block_IsPresaleStarted
    }
    catch(err) {
      console.error("checkIfPresaleStarted", err)
      return false
    }
  }

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner()
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider)
      const presaleEndTime = await nftContract.presaleEnded()
      const currentTimeInSeconds = Math.floor(Date.now() / 1000)
      if(presaleEndTime.lt(currentTimeInSeconds)) {
        setPresaleEnded(true)
      }
    }
    catch(err) {
      console.error("checkIfPresaleEnded", err)
    }
  }

  const getNumOfMints = async() => {
    try {
      const provider = await getProviderOrSigner()
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider)
      const bNMints = await nftContract.tokenIds()
      setNumTokensMinted(bNMints.toString())
    }
    catch(err) {
      console.error("getNumOfMints", err)
    }
  }

  const startPresale = async () => {
    try {
      const signer = await getProviderOrSigner(true)
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer)
      
      const contractTxn = await nftContract.startPresale()
      await contractTxn.wait()

      setIsPresaleStarted(true)
      
    }
    catch(err) {
      console.error("startPresale", err)
    }
  }

  const presaleMint = async() => {
    setIsLoading(true)
    try {
      const signer = await getProviderOrSigner(true)
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer)
      
      const presaleTxn = await nftContract.presaleMint({value: ethers.utils.parseEther('0.01')})
      await presaleTxn.wait()

      alert("Presale NFT Minted")
    }
    catch(err) {
      console.error("presaleMint", err)
    }
    setIsLoading(false)
  }

  const publicMint = async () => {
    setIsLoading(true)
    try {
      const signer = await getProviderOrSigner(true)
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer)
      
      const presaleTxn = await nftContract.mint({value: ethers.utils.parseEther('0.01')})
      await presaleTxn.wait()

      alert("NFT Minted")
    }
    catch(err) {
      console.error("publicMint", err)
    }
    setIsLoading(false)
  }

  const RenderButton = () => {
    //console.log("isLoading",isLoading,"isWalletConnected",isWalletConnected,"isPresaleStarted",isPresaleStarted,"isOwner",isOwner,"presaleEnded",presaleEnded)
    if(isLoading) {
      return <p>Loading..</p>
    }
    else {
      if(!isWalletConnected) {
        return <button onClick={connectWallet} className={styles.button}>Connect Wallet</button>
      }
      else {
        if(!isPresaleStarted) {
          if(isOwner) {
            return <button onClick={startPresale} className={styles.button}>Start PreSale</button>
          }
          else {
            return <p>Presale not started yet. Please come back later.</p>
          }        
        }
        else {
          if(!presaleEnded) {
            return (
              <>
                <p>Presale has started. You can mint NFT if your address is whitelisted!</p>
                <p>{numMintedTokens}/20 NFTs have been minted already!</p>
                <button onClick={presaleMint} className={styles.button}>Presale Mint</button>
              </>
            )
          }
          else {
            return (
              <>
                <p>Presale has ended. You can mint an NFT, if remaning.</p>
                <p>{numMintedTokens}/20 NFTs have been minted already!</p>
                <button onClick={publicMint} className={styles.button}>Public Mint</button>
              </>
            )
          }
        }
      }
    }
    
  }

  return (
    <div>
      <Head>
        <title>Crytp Dev NFTs</title>
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs</h1>      
          <RenderButton/>
        </div>
        <img src="./cryptodevs/0.svg" />
      </div>
      <footer className={styles.footer}>
        Made with love by Crypto Devs
      </footer>      
    </div>
  )
}
 