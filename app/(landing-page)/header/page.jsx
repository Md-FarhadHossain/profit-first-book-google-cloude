
import dynamic from 'next/dynamic';

import BookInfo from "@/components/bookInfo";
import BottomInfo from "@/components/bottomInfo";
import Navbar from "@/components/Navbar";

// Critical components kept static
import AllReaders from "@/components/allReaders"; 

// Lazy load below-the-fold components
const Testimonials = dynamic(() => import("@/components/testimonials"));
const BookVideo = dynamic(() => import("@/components/bookVideo"));
const GetsTheBook = dynamic(() => import("@/components/getsTheBook"));
const ReaderSaid = dynamic(() => import("@/components/readerSaid"));
const WebsiteReview = dynamic(() => import("@/components/websiteReview"));
const OrderNowBtn = dynamic(() => import("@/components/orderNowBtn"));
const AniOrderNowBtn = dynamic(() => import("@/components/aniBtn"));
const TopHeader = dynamic(() => import("@/components/topHeader"));
const BonusGifts = dynamic(() => import("@/components/BonusGifts"));
const BookInside = dynamic(() => import("@/components/bookInside"));
const HeroSction = dynamic(() => import("../hero/page"));
const PageSwiper = dynamic(() => import("@/components/PageSwiper"));
const PrivateCommunity = dynamic(() => import("@/components/PrivateCommunity"));
const GroupReviews = dynamic(() => import("@/components/GroupReviews"));
// const WhatsInside = dynamic(() => import("@/components/whatsInside"));


const HeaderSection = () => {
  return (
    <section className="overflow-x-hidden">
      <div className="container mx-auto px-4">
   {/* <Navbar /> */}

   <BottomInfo />
      
        {/* <TopHeader /> */}
        {/* <AniOrderNowBtn />   */}
        <BookInfo />
        <AllReaders />
      <BookVideo />
        <PrivateCommunity />
        <GroupReviews />
        <BookInside />
        {/* <WhatsInside /> */}

      </div>

      <div>
        <Testimonials />
      </div>
      <GetsTheBook />

      <ReaderSaid />
      <WebsiteReview />
        <PageSwiper />
        {/* <FreeGift /> */}
        <BonusGifts />


      
        <HeroSction />

    </section>
  );
};

export default HeaderSection;
