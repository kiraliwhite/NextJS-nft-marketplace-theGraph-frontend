import { useState, useEffect } from "react";
import { useWeb3Contract, useMoralis } from "react-moralis";
import nftMarketplaceAbi from "../constants/NftMarketplace.json";
import nftAbi from "../constants/BasicNftTwo.json";
import { Card, useNotification } from "web3uikit";
import { ethers } from "ethers";
import UpdateListingModal from "./UpdateListingModal";
import Image from "next/image";

//這個function的用意是將錢包地址做掩碼,中間的字被遮住,strLen是數字,例如15,
//則包含0x,包含三個點總共顯示15個字元,例如: 0xabc123...9978
const truncateStr = (fullStr, strLen) => {
  if (fullStr.length <= strLen) return fullStr; //如果輸入的錢包地址長度,小於設定的長度,則直接回傳

  const separator = "..."; //中間掩蓋的部分使用三個點
  const seperatorLength = separator.length; //三個點的長度
  const charsToShow = strLen - seperatorLength; //要顯示多少個字母是,strLen減掉,三個點的長度
  const frontChars = Math.ceil(charsToShow / 2); //開頭字母
  const backChars = Math.floor(charsToShow / 2); //結尾字母
  return (
    fullStr.substring(0, frontChars) + separator + fullStr.substring(fullStr.length - backChars)
  );
};

export default function NFTBox({ price, nftAddress, tokenId, marketplaceAddress, seller }) {
  const { isWeb3Enabled, account } = useMoralis();
  const [imageURI, setImageURI] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  //顯示彈窗預設為false
  const [showModal, setShowModal] = useState(false);
  //hideModal,一個箭頭函式,被呼叫時,對showModal的useState設定為false
  const hideModal = () => setShowModal(false);
  //Notification初始化
  const dispatch = useNotification();

  
  //取得合約中的tokenURI
  const { runContractFunction: getTokenURI } = useWeb3Contract({
    abi: nftAbi,
    contractAddress: nftAddress,
    functionName: "tokenURI",
    params: {
      tokenId: tokenId,
    },
  });

  //呼叫合約的buyItem function
  const { runContractFunction: buyItem } = useWeb3Contract({
    abi: nftMarketplaceAbi,
    contractAddress: marketplaceAddress,
    functionName: "buyItem",
    msgValue: price,
    params: {
      _nftAddress: nftAddress,
      _tokenId: tokenId,
    },
  });

  //更新頁面用的function
  async function updateUI() {
    //抓取合約中的tokenURI
    const tokenURI = await getTokenURI();
    //console.log(`The tokenURI is ${tokenURI}`)
    //如果有抓到tokenURI
    if (tokenURI) {
      //把tokenURI的ipfs://替換掉
      const requestURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
      //fetch是一個javascript的關鍵字,用意是將東西貼到瀏覽器上,然後抓取回應,所以上面那行是先把requestURL貼到瀏覽器上
      //獲得回傳結果之後,再轉為json格式,就是抓取tokenURI的那串json,存成變數,因為要提取其中的imageURI
      const tokenURIResponse = await (await fetch(requestURL)).json();
      //console.log(tokenURIResponse.image)
      //從json檔中抓取image屬性,例如https://ipfs.io/ipfs/asd123xxx
      const imageURI = tokenURIResponse.image;
      //替換掉ipfs:// 如果沒有完全符合的字,則會略過
      const imageURIURL = imageURI.replace("ipfs://", "https://ipfs.io/ipfs/");
      //將tokenName,tokenDescription, imageURL,存成useState
      setImageURI(imageURIURL);
      setTokenName(tokenURIResponse.name);
      setTokenDescription(tokenURIResponse.description);
    }
  }

  //當metaMask錢包連接時,呼叫updateUI更新頁面
  useEffect(() => {
    if (isWeb3Enabled) {
      updateUI();
    }
  }, [isWeb3Enabled]);

  //這是一個判斷式, seller是否完全等於現在metaMask連接的account,若為是,則回傳true,若否則回傳false
  //或是seller完全等於undefined,兩者其一只要為true就回傳true
  const isOwnedByUser = seller === account || seller === undefined;
  //console.log(isOwnedByUser)
  //將seller做區別,如果列在架上的NFT,是自己列上去的,則NFT的owner顯示的不是錢包地址,而是you這個字
  //即當前連接MetaMask的帳號 = seller為true, 則等於you 若isOwnedByUser為false,則將地址掩碼
  const formattedSellerAddress = isOwnedByUser ? "you" : truncateStr(seller || "", 15);

  //這個function在有人按下NFT圖案時觸發,如果按的人市NFT擁有者,則顯示更新價格的彈窗,
  //如果不是NFT擁有者,則顯示購買NFT的彈窗
  const handleCardClick = () => {
    isOwnedByUser
      ? setShowModal(true)
      : buyItem({
          onError: (error) => console.log(error),
          onSuccess: () => handleBuyItemSuccess(),
        });
  };

  //若購買成功,則顯示success Notification
  const handleBuyItemSuccess = () => {
    dispatch({
      type: "success",
      message: "Item bought!",
      title: "Item Bought",
      position: "topR",
    });
  };

  return (
    <div>
      <div>
        {imageURI ? (
          <div>
            {/* 用於更新NFT價格的彈出視窗 */}
            <UpdateListingModal
              //是否顯示預設為false
              isVisible={showModal}
              tokenId={tokenId}
              marketplaceAddress={marketplaceAddress}
              nftAddress={nftAddress}
              //按下onClose,則觸發hideModal function將isVisible設為false
              onClose={hideModal}
            />
            {/* 在網頁上列出web3Uikit的Card樣式*/}
            <Card title={tokenName} description={tokenDescription} onClick={handleCardClick}>
              <div className="p-2">
                <div className="flex flex-col items-end gap-2">
                  <div>#{tokenId}</div>
                  <div className="italic text-sm">Owned by {formattedSellerAddress}</div>
                  {/* 用next/Image讀取imageURI顯示圖片*/}
                  <Image
                    alt="pug"
                    loader={() => imageURI}
                    src={imageURI}
                    height="200"
                    width="200"
                  />
                  <div className="font-bold">{ethers.utils.formatUnits(price, "ether")} ETH</div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    </div>
  );
}
