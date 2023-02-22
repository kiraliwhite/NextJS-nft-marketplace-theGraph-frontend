import { Form, useNotification, Button } from "web3uikit";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { ethers } from "ethers";
import nftAbi from "../constants/BasicNftTwo.json";
import nftMarketplaceAbi from "../constants/NftMarketplace.json";
import networkMapping from "../constants/networkMapping.json";
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";

export default function Home() {
  const { chainId, account, isWeb3Enabled } = useMoralis();
  const chainString = chainId ? parseInt(chainId).toString() : "31337";
  const marketplaceAddress = networkMapping[chainString].NftMarketplace[0];
  //抓取對應鏈的NftMarketplace地址

  //宣告web3uikit的通知功能
  const dispatch = useNotification();

  //useState宣告proceeds,用於讓NFT賣家領錢
  const [proceeds, setProceeds] = useState("0");

  //另一種runContractFunction的寫法,先將此提取存為變數
  const { runContractFunction } = useWeb3Contract();

  //當表單被按下後觸發此function,輸入參數inputData,代表整個表單和用戶輸入的內容
  async function approveAndList(inputData) {
    console.log("Approving...");
    //從輸入參數中抓取data表單的第0個欄位,的輸入結果,存為變數
    const nftAddress = inputData.data[0].inputResult;
    const tokenId = inputData.data[1].inputResult;
    const price = ethers.utils.parseUnits(inputData.data[2].inputResult, "ether").toString();

    //另一種runContractFunction的寫法,先寫好參數,內容是呼叫ERC721的approve function
    //目的是授權NftMarketplace能夠操作用戶的NFT
    const approveOptions = {
      abi: nftAbi,
      contractAddress: nftAddress,
      functionName: "approve",
      params: {
        to: marketplaceAddress,
        tokenId: tokenId,
      },
    };

    //呼叫runContractFunction,當成功時的transaction傳給handleApproveSuccess
    await runContractFunction({
      params: approveOptions,
      onSuccess: (tx) => handleApproveSuccess(tx, nftAddress, tokenId, price),
      onError: (error) => {
        console.log(error);
      },
    });
  }

  //當approve成功時,將NFT上架
  async function handleApproveSuccess(tx, nftAddress, tokenId, price) {
    console.log("OK! Now time to list");
    await tx.wait(1);
    //先寫好runContractFunction的參數,呼叫listItem function
    const listOptions = {
      abi: nftMarketplaceAbi,
      contractAddress: marketplaceAddress,
      functionName: "listItem",
      params: {
        _nftAddress: nftAddress,
        _tokenId: tokenId,
        _price: price,
      },
    };

    //呼叫runContractFunction,傳入參數,若成功時,呼叫handleListSuccess
    await runContractFunction({
      params: listOptions,
      onSuccess: () => handleListSuccess(),
      onError: (error) => console.log(error),
    });
  }

  //當成功上架時,觸發Notification
  async function handleListSuccess() {
    dispatch({
      type: "success",
      message: "NFT listing",
      title: "NFT listed",
      position: "topR",
    });
  }

  //若成功領錢時,觸發Notification
  const handleWithdrawSuccess = () => {
    dispatch({
      type: "success",
      message: "Withdrawing proceeds",
      position: "topR",
    });
  };

  //刷新頁面用的function,用於更新當前用戶能夠領取的餘額
  async function setupUI() {
    //透過runContractFunction呼叫getProceeds function,抓取當前帳戶餘額
    const returnedProceeds = await runContractFunction({
      params: {
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "getProceeds",
        params: {
          _seller: account,
        },
      },
      onError: (error) => console.log(error),
    });
    //如果有餘額可以領,則設定useState,
    if (returnedProceeds) {
      setProceeds(returnedProceeds.toString());
    }
  }

  //當proceeds,account,isWeb3Enabled,chainId變動時,重新刷新頁面(觸發setupUI function)
  useEffect(() => {
    setupUI();
  }, [proceeds, account, isWeb3Enabled, chainId]);

  return (
    <div className={styles.container}>
      {/* Form是web3uikit的表單,data代表整個表單,其中是每一個欄位,當按下Submit觸發approveAndList function */}
      <Form
        onSubmit={approveAndList}
        data={[
          {
            name: "NFT Address",
            type: "text",
            inputWidth: "50%",
            value: "",
            key: "nftAddress",
          },
          {
            name: "Token ID",
            type: "number",
            value: "",
            key: "tokenId",
          },
          {
            name: "Price (in ETH)",
            type: "number",
            value: "",
            key: "price",
          },
        ]}
        title="Sell your NFT!"
        id="Main Form"
      />
      {/* 顯示useState當前用戶可領的餘額 */}
      <div>Withdraw {proceeds} proceeds</div>
      {/* 若proceeds 不等於0,則顯示按鈕,當按下按鈕時,觸發withdrawProceeds讓用戶領錢,若沒有錢領,則顯示文字*/}
      {proceeds != "0" ? (
        <Button
          onClick={() => {
            runContractFunction({
              params: {
                abi: nftMarketplaceAbi,
                contractAddress: marketplaceAddress,
                functionName: "withdrawProceeds",
                params: {},
              },
              onError: (error) => console.log(error),
              //若成功領錢,則觸發handleWithdrawSuccess
              onSuccess: () => handleWithdrawSuccess,
            });
          }}
          text="Withdraw"
          type="button"
        />
      ) : (
        <div>No proceeds detected</div>
      )}
    </div>
  );
}
