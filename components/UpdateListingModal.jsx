//這個component的用意是,當NFT的擁有者按下NFT圖片時,會彈出視窗可以更新價格
//Modal是彈出互動視窗
import { Modal, Input, useNotification } from "web3uikit";
import { useState } from "react";
import { useWeb3Contract } from "react-moralis";
import nftMarketplaceAbi from "../constants/NftMarketplace.json";
import { ethers } from "ethers";

//此function,用於呼叫彈出視窗後做的一系列動作,isVisible代表此視窗是否可見
export default function UpdateListingModal({
  nftAddress,
  tokenId,
  isVisible,
  marketplaceAddress,
  onClose,
}) {
  //初始化Notification
  const dispatch = useNotification();

  //宣告useState,用於更新NFT價格
  const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState(0);

  //當成功更新價格後,跳出此Notification
  const handelUpdateListingSuccess = () => {
    dispatch({
      type: "success",
      message: "listing updated",
      title: "Listing updated - please refresh (and move blocks)",
      position: "topR",
    });
    //且關閉彈出視窗
    onClose && onClose();
    //將更新NFT價格的useState設為0,因為價格已經更新成功,需歸0
    setPriceToUpdateListingWith("0");
  };

  //此function用於呼叫合約的updateListing function,用於更新NFT價格
  //_newPrice參數,使用的是useState所存的內容,這個內容會在彈出視窗的input內容的onChange修改
  const { runContractFunction: updateListing } = useWeb3Contract({
    abi: nftMarketplaceAbi,
    contractAddress: marketplaceAddress,
    functionName: "updateListing",
    params: {
      _nftAddress: nftAddress,
      _tokenId: tokenId,
      _newPrice: ethers.utils.parseEther(priceToUpdateListingWith || "0"),
    },
  });

  return (
    <Modal
      //Modal指的是彈出視窗本身,isVisible若為true則顯示此Modal,onClose代表是否關閉此視窗
      //當按下視窗右上角x(onCloseButton),或是cancel(onCancel)按鈕時,關閉此視窗
      //當按下ok按鈕,觸發updateListing更新NFT價格,若成功則觸發handelUpdateListingSuccess
      isVisible={isVisible}
      onCancel={onClose}
      onCloseButtonPressed={onClose}
      onOk={() => {
        updateListing({
          onError: (error) => console.log(error),
          onSuccess: () => handelUpdateListingSuccess(),
        });
      }}
    >
      <Input
        //彈出視窗的內容
        label="Update listing price in L1 Currency (ETH)"
        name="New listing price"
        type="number"
        //onChange,當在text欄位輸入完值,且將滑鼠移開text視窗,就會觸發設定useState,存入輸入的值
        //如果新輸入的值,與上次相同,則不會動作,event.target.value 指的是任何輸入到彈窗畫面中的數字
        onChange={(event) => {
          setPriceToUpdateListingWith(event.target.value);
        }}
      />
    </Modal>
  );
}
