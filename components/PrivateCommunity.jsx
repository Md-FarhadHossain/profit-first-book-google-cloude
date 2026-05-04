"use client"
import React from 'react';
import { Users, ArrowRight, Star, ThumbsUp, Facebook, Quote, BadgeCheck, Lock, MessageSquare, TrendingUp, Shirt, Leaf, ShoppingBag } from 'lucide-react';
import page1 from "@/public/fbpage-1.jpg"
import page2 from "@/public/fbpage-2.jpg"
import page3 from "@/public/fbpage-3.jpg"
import page4 from "@/public/fbpage-4.jpg"
import page5 from "@/public/fbpage-5.jpg"
import page6 from "@/public/fbpage-6.jpg"
import groupImage from "@/public/facebook-group.jpg"
import Image from 'next/image';



// Data moved outside component for better performance
const entrepreneurs = [
  {
    id: 1,
    pageName: "Sukher Khamar - সুখের খামার",
    pageLogo: page1,
    category: "Agriculture",
    likes: "222K+",
  },
  {
    id: 2,
    pageName: "Hope71",
    pageLogo: page2,
    category: "Clothing (brand)",
    likes: "208K+",
  },
  {
    id: 6,
    pageName: "Rahul Group (রাহুল গ্রুপ)",
    pageLogo: page6,
    category: "Organic Food",
    likes: "178K+",
    quote: "প্রফিট ফার্স্ট মেথড আর এই কমিউনিটির গাইডলাইন—দুটো মিলেই আমার সাকসেস।"
  },
  {
    id: 3,
    pageName: "KORAS",
    pageLogo: page3,
    category: "Clothing (brand)",
    likes: "69K+",
  },
  {
    id: 4,
    pageName: "Musami Leather",
    pageLogo: page4,
    likes: "69K+",
  },
  {
    id: 5,
    pageName: "Kabbik",
    pageLogo: page5,
    category: "Arts & Entertainment",
    likes: "125K+",
    quote: "প্রফিট ফার্স্ট মেথড আর এই কমিউনিটির গাইডলাইন—দুটো মিলেই আমার সাকসেস।"
  },
  
];

const PrivateCommunity = () => {
  return (
    <section className="py-12 md:py-24 bg-linear-to-b from-slate-50 to-white overflow-hidden relative mt-12">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] mix-blend-multiply"></div>
        <div className="absolute top-[20%] -left-[10%] w-[400px] h-[400px] bg-orange-50 rounded-full blur-[100px] mix-blend-multiply"></div>
      </div>

      <div className="container mx-auto px- relative z-10">
        
        {/* HEADLINE SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-5">
            <Users size={16} className="text-blue-600" />
            <span className="text-blue-700 font-bold text-xs md:text-sm uppercase tracking-wider">
              Trusted by Top F-Commerce Owners
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            বাংলাদেশের লিডিং <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600"> এফ-কমার্স ব্র্যান্ডগুলো </span>
            এখন 'প্রফিট ফার্স্ট' কমিউনিটিতে
          </h2>
          
          <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            বইটি অর্ডার করলেই আপনি পাবেন একটি <span className="text-slate-900 font-semibold underline decoration-orange-400 underline-offset-2">সিক্রেট ইনভাইটেশন</span>, যা আপনাকে এই সফল উদ্যোক্তাদের নেটওয়ার্কে যুক্ত হওয়ার সুযোগ করে দেবে।
          </p>
        </div>

        {/* CARDS SECTION (Flex Wrap for perfect centering of 5 items) */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-6">
          {entrepreneurs.map((item) => (
            <div 
              key={item.id} 
              className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] flex flex-col bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:border-blue-200 transition-all duration-300 group"
            >
              {/* Card Header: Identity */}
              <div className="p-5 flex items-start gap-4 border-b border-slate-50">
                <div className="relative shrink-0">
                  <Image 
                    src={item.pageLogo} 
                    alt={item.pageName} 
                    className="w-24 h-24 md:w-16 md:h-16 rounded-full object-cover ring-2 ring-[#0866ff] shadow-md group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-2 -right-1 bg-blue-600 text-white  rounded-full border-2 border-white">
                    {/* <Facebook size={10} fill="currentColor" /> */}
                    <BadgeCheck size={20} />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-base md:text-lg truncate leading-tight">
                    {item.pageName}
                  </h4>
                  <p className="text-slate-500 text-xs uppercase tracking-wide font-medium mt-0.5 mb-2">
                    {item.category}
                  </p>
                  <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-lg font-bold">
                    <ThumbsUp size={20} />
                    <span>{item.likes} Followers</span>
                  </div>
                </div>
              </div>   
            </div>
          ))}
        </div>

        {/* SECRET FACEBOOK GROUP SECTION */}
        <div className="mt-16 mb-4">
          {/* Section Label */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-1.5 rounded-full mb-4">
              <Lock size={14} className="text-red-600" />
              <span className="text-red-700 font-bold text-xs uppercase tracking-wider">Secret Exclusive Group</span>
            </div>
            <h3 className="text-4xl md:text-3xl font-extrabold text-slate-900 leading-tight">
              বইটি কিনলেই পাবেন{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
                সিক্রেট গ্রুপে ইনভাইট
              </span>
            </h3>
            <p className="text-slate-500 mt-2 text-xl md:text-base max-w-xl mx-auto">
              যেখানে ৬০০+ উদ্যোক্তারা প্রতিদিন নেটওয়ার্ক করছেন, সমস্যার সমাধান খুঁজছেন, এবং একে অপরকে সাহায্য করছেন
            </p>
          </div>

          {/* Main Group Card */}
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden border-2 border-blue-200 shadow-2xl shadow-blue-100/60 bg-white group hover:shadow-blue-200/70 hover:border-blue-400 transition-all duration-500">
              
              {/* Gradient top bar */}
              <div className="h-1.5 w-full bg-linear-to-r from-blue-500 via-indigo-500 to-blue-600"></div>

              <div className="flex flex-col md:flex-row">
                {/* LEFT: Group screenshot */}
                <div className="relative md:w-[55%] overflow-hidden">
                  <Image
                    src={groupImage}
                    alt="F-COMMERCE UDDOKTA Official Group - Private group with 621 members"
                    className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                    style={{ minHeight: "240px" }}
                  />
                  {/* Dark overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent"></div>

                  {/* Member badge - floating over image */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-xl border border-blue-100">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                      <Users size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium leading-none">Active Members</p>
                      <p className="text-xl font-black text-blue-700 leading-tight">৬২১+</p>
                    </div>
                  </div>

                 
                </div>

                {/* RIGHT: Info panel */}
                <div className="md:w-[45%] p-5 md:p-7 flex flex-col justify-between">
                  <div>
                    {/* Group name */}
                    <div className="flex items-start gap-2 mb-4">
                      <div className="w-8 h-8 shrink-0 bg-blue-600 rounded-lg flex items-center justify-center mt-0.5">
                        <Facebook size={16} className="text-white" fill="white" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base leading-tight">F-COMMERCE UDDOKTA</h4>
                        <p className="text-xs text-slate-400 font-medium">Official Group</p>
                      </div>
                    </div>

                    {/* Benefits list */}
                    <ul className="space-y-2.5 mb-5">
                      {[
                        { icon: <Shirt size={14} />, text: "পোশাক, অর্গানিক ফুড, ইলেকট্রনিক্স সব ক্যাটাগরির উদ্যোক্তারা" },
                        { icon: <MessageSquare size={14} />, text: "সরাসরি আলোচনা ও সমস্যার সমাধান পাবেন" },
                        { icon: <TrendingUp size={14} />, text: "বিজনেস টিপস, আইডিয়া ও স্ট্র্যাটেজি শেয়ার" },
                        { icon: <Users size={14} />, text: "নেটওয়ার্কিং,পাশাপাশি বাড়বে আপনার ব্যবসাও" },
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-0.5 w-5 h-5 shrink-0 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center">
                            {item.icon}
                          </span>
                          <span className="text- text-slate-600 leading-snug">{item.text}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Category tags */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      {[
                        { name: "Clothing", style: "bg-pink-100 text-pink-700 border-pink-200" },
                        { name: "Organic Food", style: "bg-green-100 text-green-700 border-green-200" },
                        { name: "Electronics", style: "bg-blue-100 text-blue-700 border-blue-200" },
                        { name: "Jewelry", style: "bg-purple-100 text-purple-700 border-purple-200" },
                        { name: "Handicraft", style: "bg-amber-100 text-amber-700 border-amber-200" },
                        { name: "আরও...", style: "bg-slate-100 text-slate-700 border-slate-200" }
                      ].map((cat) => (
                        <span key={cat.name} className={`text-sm font-bold border px-3 py-1 rounded-full shadow-sm hover:scale-105 transition-transform ${cat.style}`}>
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA SECTION */}
        <div className="mt-10 text-center">
          
          <div className="flex flex-col items-center gap-4">
            <a 
              href="#order" 
              className="group relative inline-flex items-center justify-center gap-3 bg-linear-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold py-4 px-10 rounded-full text-lg shadow-xl shadow-orange-500/20 transform hover:-translate-y-1 transition-all duration-300 w-full md:w-auto"
            >
              <span>এখনই অর্ডার করে গ্রুপে জয়েন করুন</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              
              {/* Button Shine Effect */}
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <div className="absolute top-0 -left-full w-[50%] h-full bg-white/20 skew-x-25 group-hover:animate-[shimmer_1s_infinite]"></div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Tailwind Animation for Button Shine (Add to global css if not present, but safe to include inline styles usually) */}
      <style jsx>{`
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `}</style>
    </section>
  );
};

// Helper icon for the money back guarantee
const ShieldCheck = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
)

export default PrivateCommunity;