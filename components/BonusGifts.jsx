import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

import fg1 from "@/public/fg1.png";
import fg2 from "@/public/fg2.png";
import fg3 from "@/public/fg3.png";
import fg4 from "@/public/fg4.png";
import fg5 from "@/public/fg5.png";
import fg6 from "@/public/fg6.png";

const BonusGifts = () => {
  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 leading-tight">
          এই বইটির সাথে আরো গিফট <br /> হিসাবে পাচ্ছেন
        </h2>

        {/* Image Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 mb-10">
          <div className="relative group">
            <Image
              src={fg1}
              alt="Bonus Gift 1"
              className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300 border"
              placeholder="blur"
            />
          </div>
          <div className="relative group">
            <Image
              src={fg2}
              alt="Bonus Gift 2"
              className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300 border"
              placeholder="blur"
            />
          </div>
          <div className="relative group">
            <Image
              src={fg3}
              alt="Bonus Gift 3"
              className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300 border"
              placeholder="blur"
            />
          </div>
          <div className="relative group">
            <Image
              src={fg4}
              alt="Bonus Gift 4"
              className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300 border"
              placeholder="blur"
            />
          </div>
          <div className="relative group">
            <Image
              src={fg5}
              alt="Bonus Gift 5"
              className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300 border"
              placeholder="blur"
            />
          </div>
          <div className="relative group">
            <Image
              src={fg6}
              alt="Bonus Gift 6"
              className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300 border"
              placeholder="blur"
            />
          </div>
        </div>

        {/* Gift List */}
        <div className="bg-gray-50 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-lg md:text-xl font-medium text-gray-800">
              <CheckCircle2 className="text-green-500 w-6 h-6 flex-shrink-0" />
              <span>৪ টি প্রবলেম সলভিং প্রিমিয়াম ই-বুক</span>
            </li>
            <li className="flex items-center gap-3 text-lg md:text-xl font-medium text-gray-800">
              <CheckCircle2 className="text-green-500 w-6 h-6 flex-shrink-0" />
              <span>এফ-কমার্স বিজনেস কেস স্টাডি ইবুক</span>
            </li>
            <li className="flex items-center gap-3 text-lg md:text-xl font-medium text-gray-800">
              <CheckCircle2 className="text-green-500 w-6 h-6 flex-shrink-0" />
              <span>৬০০+ ওয়ার্ডপ্রেস থিম & প্লাগিন</span>
            </li>
            <li className="flex items-center gap-3 text-lg md:text-xl font-medium text-gray-800">
              <CheckCircle2 className="text-green-500 w-6 h-6 flex-shrink-0" />
              <span>এক্সক্লুসিভ ফেইসবুক প্রাইভেট গ্রুপ</span>
            </li>
            <li className="flex items-center gap-3 text-lg md:text-xl font-medium text-gray-800">
              <CheckCircle2 className="text-green-500 w-6 h-6 flex-shrink-0" />
              <span>একটি স্পেশাল গিফট যা বইয়ের সাথে পেয়ে যাবেন</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default BonusGifts;
