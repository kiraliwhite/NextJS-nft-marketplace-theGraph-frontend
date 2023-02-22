import { useMoralis } from "react-moralis";
import NFTBox from "../components/NFTBox";
import networkMapping from "../constants/networkMapping.json"; //NftMarketplace地址
import GET_ACTIVE_ITEMS from "../constants/subgraphQueries"; //graphQL語法,用於查詢subGraph(鏈上event)
import { useQuery } from "@apollo/client"; //用於查詢graphQL的套件

export default function Home() {
  /** 使用chainId抓出對應鏈的NftMarketplace地址 */
  const { chainId, isWeb3Enabled } = useMoralis();
  const chainString = chainId ? parseInt(chainId).toString() : null;
  const marketplaceAddress = chainId ? networkMapping[chainString].NftMarketplace[0] : null;

  //使用useQuery輸入寫好的graphQL語法,查詢subGraph,取得鏈上觸發的事件,因graphQL查詢的是activeItem,即代表正在架上的NFT
  const { loading, error, data: listedNfts } = useQuery(GET_ACTIVE_ITEMS);

  return (
    <div className="container mx-auto">
      <h1 className="py-4 px-4 font-bold text-2xl">Recently Listed</h1>
      <div className="flex flex-wrap">
        {isWeb3Enabled && chainId ? (
          //若useQuery正在查詢,或是沒有查到任何架上的NFT,則顯示文字"Loading"
          loading || !listedNfts ? (
            <div>Loading...</div>
          ) : (
            //Array.prototype.map(),使用map遍歷listedNfts.activeItems陣列元素,建立新陣列nft
            listedNfts.activeItems.map((nft) => {
              //console.log(nft);
              //從陣列中提取price,nftAddress,tokenId,seller
              const { price, nftAddress, tokenId, seller } = nft;
              //console.log(`tokenId from query: ${tokenId} `);
              //若marketplaceAddress存在,則呼叫NFTBox component,傳入變數
              return marketplaceAddress ? (
                <NFTBox
                  price={price}
                  nftAddress={nftAddress}
                  tokenId={tokenId}
                  marketplaceAddress={marketplaceAddress}
                  seller={seller}
                  key={`${nftAddress}${tokenId}`}
                />
              ) : (
                <div>Network error, please switch to a supported network. </div>
              );
            })
          )
        ) : (
          <div>Web3 Currently Not Enabled</div>
        )}
      </div>
    </div>
  );
}
