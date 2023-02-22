import { ConnectButton } from "web3uikit";
import Link from "next/link";

const Header = () => {
  return (
    <nav className="p-5 border-b-2 flex flex-row justify-between items-center">
      <h1 className="py-4 px-4 font-bold text-3xl">NFT Marketplace</h1>
      <div className="flex flex-row items-center">
      <Link href="/" className="mr-4 p-6">Home</Link> {/* link連結 跳轉到根目錄頁面(home) */}
      <Link href="/sell-nft" className="mr-4 p-6">Sell NFT</Link> {/* link連結 跳轉到sell-nft頁面 */}
      <ConnectButton moralisAuth={false}/> 
      {/* moralisAuth的用意是,不讓它自動連線到Moralis的database,因為我們這裡指使用metaMask,且查詢是使用graph*/}
      </div>
    </nav>
  );
};

export default Header;
