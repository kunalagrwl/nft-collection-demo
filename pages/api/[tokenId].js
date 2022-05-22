export default function handler(req, res) {
    const tokenId = req.query.tokenId
    res.status(200).json(
        {
            "description": "NFT Collection for Crptyo Devs.", 
            "image": `https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/${tokenId}.svg`, 
            "name": `Crypto Dev #${tokenId}` ,
        }
        )
  }