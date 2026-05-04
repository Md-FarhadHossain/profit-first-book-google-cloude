// import ReviewCardPage from "../app/reviewCard/page"
import ReviewCardPage from "../app/(landing-page)/reviewCard/page"
import OrderNowBtn from "./orderNowBtn";

const WebsiteReview = () => {
  return (
    <section id="websiteReview" className="mb-12">
      <div className="container mx-auto">
        <h1 className="text-4xl px-4 text-center mt-16 mb-4">আমাদের ওয়েবসাইটে যারা রিভিউ দিয়েছেন</h1>
        <ReviewCardPage />
        
      </div>
      <div className="px-2">
        <OrderNowBtn />
      </div>
    </section>
  );
};

export default WebsiteReview;
