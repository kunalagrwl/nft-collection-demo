export default function handler(req, res) {
    const tokenId = req.query.tokenId
    res.status(200).json(
        {
            "description": "NFT Collection for Crptyo Devs.", 
            "image": `https://raw.githubusercontent.com/kunalagrwl/nft-collection-demo/main/public/cryptodevs/${tokenId-1}.svg`, 
            "name": `Crypto Dev #${tokenId}` ,
        }
        )
  }