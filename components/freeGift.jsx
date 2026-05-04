import Image from "next/image";

import OrderNowBtn from "./orderNowBtn";

import fg1 from "@/public/fg1.png"
import fg2 from "@/public/fg2.png"
import fg3 from "@/public/fg3.png"
import fg4 from "@/public/fg4.png"
import fg5 from "@/public/fg5.jpg"
import fg6 from "@/public/fg6.png"


const FreeGift = () => {
  return (
    <section className="mb-4 mt-16 text-center">
    <h1 className="text-4xl">বইটি পড়ার পর যা বলেছেন</h1>
      {/* <div className="flex w-fit mt-5">
        <Image className="w-1/3 -rotate-7 shadow-xl border" src={fg1} alt="ms01" />
        <Image className="w-1/3 shadow-xl z-10 border" src={fg2} alt="ms01" />
        <Image className="w-1/3 rotate-7 shadow-xl border" src={fg3} alt="ms01" />
      </div>
      <div className="flex w-fit my-2">
        <Image className="w-1/3 -rotate-7 shadow-xl border" src={fg4} alt="ms01" />
        <Image className="w-1/3 shadow-xl border" src={fg5} alt="ms01" />
        <Image className="w-1/3 rotate-7 shadow-xl border" src={fg6} alt="ms01" />
      </div> */}

      <div className="px-2">

      <OrderNowBtn />
      </div>
    </section>
  );
};

export default FreeGift;
