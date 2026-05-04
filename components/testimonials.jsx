import Image from "next/image";

import ms01 from "@/public/ms01.jpg";
import ms02 from "@/public/ms01.jpg";
import ms03 from "@/public/ms01.jpg";
import ms04 from "@/public/wa01.jpg";
import ms05 from "@/public/wa01.jpg";
import ms06 from "@/public/wa01.jpg";
import OrderNowBtn from "./orderNowBtn";

import wp1 from "@/public/wp1.png"
import wp2 from "@/public/wp2.png"
import wp3 from "@/public/wp3.png"
import wp4 from "@/public/wp4.png"
import wp5 from "@/public/wp5.png"
import wp6 from "@/public/wp6.png"
import wp7 from "@/public/wp7.png"
import wp8 from "@/public/wp8.png"
import wp9 from "@/public/wp9.png"


const Testimonials = () => {
  return (
    <section id="testimonials" className="mb-4 mt-16 text-center">
    <h1 className="text-4xl">বইটি পড়ার পর যা বলেছেন</h1>
      <div className="flex w-fit mt-5">
        <Image className="w-1/3 -rotate-7 shadow-xl" src={wp1} alt="ms01" />
        <Image className="w-1/3 shadow-xl" src={wp2} alt="ms01" />
        <Image className="w-1/3 rotate-7 shadow-xl" src={wp3} alt="ms01" />
      </div>
      <div className="flex w-fit my-2">
        <Image className="w-1/3 -rotate-7 shadow-xl" src={wp4} alt="ms01" />
        <Image className="w-1/3 shadow-xl" src={wp5} alt="ms01" />
        <Image className="w-1/3 rotate-7 shadow-xl" src={wp6} alt="ms01" />
      </div>
      <div className="flex w-fit ">
        <Image className="w-1/3 -rotate-7 shadow-xl" src={wp7} alt="ms01" />
        <Image className="w-1/3 shadow-xl" src={wp8} alt="ms01" />
        <Image className="w-1/3 rotate-7 shadow-xl" src={wp9} alt="ms01" />
      </div>
      <div className="px-2">

      <OrderNowBtn />
      </div>
    </section>
  );
};

export default Testimonials;
