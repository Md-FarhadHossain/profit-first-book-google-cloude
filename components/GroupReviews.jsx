"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import { ThumbsUp, Star, BadgeCheck, ChevronDown, ChevronUp } from 'lucide-react';
import r1 from "@/public/fb-group-review1.jpg"
import r2 from "@/public/fb-group-review2.jpg"
import r3 from "@/public/fb-group-review3.jpg"

const reviews = [
  {
    id: 1,
    name: "S Islam",
    date: "29 January",
    image: r1,
    highlight: "৪ লক্ষ টাকা লস থেকে বাঁচলেন!",
    highlightColor: "from-red-500 to-orange-500",
    badgeBg: "bg-red-50",
    badgeBorder: "border-red-200",
    badgeText: "text-red-700",
    badgeIcon: "💸",
    summary: "মাত্র ৪৯ পৃষ্ঠা পড়েই ৪টি মেজর চেঞ্জ করেছেন। বললেন, নয়তো মিনিমাম ৪ লক্ষ টাকা আটকে যেতো এবং প্রতি মাসে ২০% লস হতো।"
  },
  {
    id: 3,
    name: "Rayhan Sheikh",
    date: "10 ঘণ্টা আগে",
    image: r3,
    highlight: "মাত্র ৫ পেজে ২টি গেম-চেঞ্জিং আইডিয়া!",
    highlightColor: "from-blue-600 to-indigo-600",
    badgeBg: "bg-blue-50",
    badgeBorder: "border-blue-200",
    badgeText: "text-blue-700",
    badgeIcon: "🚀",
    summary: "মাত্র ৫ পেজ পড়েই দুটো বিশাল আইডিয়া পেয়েছেন — \"সেলস - প্রফিট = খরচ\" ফর্মুলা এবং ৫টি আলাদা ব্যাংক একাউন্ট কনসেপ্ট।"
  },
  {
    id: 2,
    name: "রাহে মদিনা",
    date: "১৮ মিনিট আগে",
    image: r2,
    highlight: "ব্যবসার ভুলগুলো শুধরে নেওয়ার পথ পেলেন",
    highlightColor: "from-green-600 to-teal-600",
    badgeBg: "bg-green-50",
    badgeBorder: "border-green-200",
    badgeText: "text-green-700",
    badgeIcon: "✅",
    summary: "বইটা হাতে পেয়ে অল্প পড়েই বুঝতে পারলেন, এটা ব্যবসার সকল ভুল শুধরে অনেক দূর এগিয়ে নিতে সাহায্য করবে। ইনশাআল্লাহ।"
  }
];

const ReviewCard = ({ review }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_8px_40px_rgba(0,0,0,0.07)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-400 group">

      {/* ── Facebook-style top bar ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#1877F2]">
        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
        <div>
          <p className="text-white font-bold text-xs leading-none">F-COMMERCE UDDOKTA</p>
          <p className="text-blue-200 text-[10px] leading-none mt-0.5">Official Group</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1">
          <BadgeCheck size={12} className="text-white" />
          <span className="text-white text-[10px] font-semibold">Verified</span>
        </div>
      </div>

      {/* ── Full screenshot image (no cropping) ── */}
      <div className="relative w-full overflow-hidden bg-slate-50">
        <Image 
          src={review.image}
          alt={`Facebook group review by ${review.name}`}
          width={800}
          height={1000}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          className="group-hover:scale-[1.01] transition-transform duration-700"
          quality={90}
        />
        {/* Subtle vignette bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/60 to-transparent pointer-events-none" />
      </div>

      {/* ── Highlighted quote strip ── */}
      <div className={`mx-2 -mt-2 mb-2 rounded-xl px-4 py-4 border ${review.badgeBg} ${review.badgeBorder} flex items-start gap-4 relative z-10`}>
        <span className="text-3xl leading-none flex-shrink-0 mt-0.5">{review.badgeIcon}</span>
        <div>
          <p className={`font-extrabold text-lg md:text-xl bg-clip-text text-transparent bg-gradient-to-r ${review.highlightColor} leading-tight`}>
            {review.highlight}
          </p>
          <p className="text-slate-800 text-base md:text-lg mt-2 leading-relaxed font-semibold">{review.summary}</p>
        </div>
      </div>
    </div>
  );
};

const GroupReviews = () => {
  return (
    <section className="py-10 md:py-12 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-10 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-100/40 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />

      <div className="container mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-3">
            <ThumbsUp size={14} className="text-blue-600" fill="currentColor" />
            <span className="text-blue-700 font-bold text- uppercase tracking-wider">
              গ্রুপ থেকে রিয়েল স্টোরি
            </span>
          </div>
          <h2 className="text-4xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
            বইটি পড়তে শুরু করেছেন, <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              রেজাল্ট পেতেও শুরু করেছেন!
            </span>
          </h2>
          <p className="text-xl md:text-lg font-medium text-slate-600 leading-relaxed max-w-2xl mx-auto px-1">
            আমাদের প্রাইভেট গ্রুপের সদস্যরা বইটি হাতে পেয়েই তাদের অভিজ্ঞতা শেয়ার করছেন, কেউ কোটি টাকার লস থেকে বেঁচেছেন, কেউ মাত্র ৫ পেজ পড়েই অনেক ভ্যালু পেয়েছেন।
          </p>
        </div>

        {/* Reviews: 1 col mobile, 3 col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {/* Bottom CTA nudge */}
        <div className="text-center mt-14">
          <a
            href="#order"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold py-4 px-10 rounded-full text-lg shadow-xl shadow-orange-500/25 hover:-translate-y-0.5 transition-all duration-300"
          >
            <span>বই অর্ডার করুন — গ্রুপে ঢুকুন</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default GroupReviews;
