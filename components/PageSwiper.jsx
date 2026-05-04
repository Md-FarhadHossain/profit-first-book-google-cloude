"use client";
import React from 'react';
import Image from 'next/image'; // Next.js-এর অপ্টিমাইজড ইমেজ কম্পোনেন্ট ব্যবহার করা হয়েছে
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Swiper React components and styles
import { Swiper, SwiperSlide, useSwiper } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// --- Placeholder image for book pages ---
import page1 from "@/public/bookCover.png";
import page2 from "@/public/page2.jpg"
import page3 from "@/public/page3.jpg"
import page4 from "@/public/page4.jpg"
import page5 from "@/public/page5.jpg"
import page6 from "@/public/page6.jpg"
import page7 from "@/public/page7.jpg"
import page8 from "@/public/page8.jpg"
import page9 from "@/public/page9.jpg"
import page10 from "@/public/page10.jpg"
import page11 from "@/public/page11.jpg"
import page12 from "@/public/page12.jpg"
import page13 from "@/public/page13.jpg"
import page14 from "@/public/page14.jpg"
import page15 from "@/public/page15.jpg"
import page16 from "@/public/page16.jpg"

const bookPages = [
  page1,
  page2,
  page3,
  page4,
  page5,
  page6,
  page7,
  page8,
  page9,
  page10,
  page11,
  page12,
  page13,
  page14,
  page15,
  page16,
];

/**
 * কাস্টম নেভিগেশন বাটন
 */
const SwiperNavButtons = () => {
  const swiper = useSwiper();

  return (
    <>
      <div 
        onClick={() => swiper.slidePrev()}
        className="swiper-button-prev absolute top-1/2 left-2 -translate-y-1/2 z-10 bg-black/40 text-white rounded-full w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
      >
        <ChevronLeft size={24} />
      </div>
      <div 
        onClick={() => swiper.slideNext()}
        className="swiper-button-next absolute top-1/2 right-2 -translate-y-1/2 z-10 bg-black/40 text-white rounded-full w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
      >
        <ChevronRight size={24} />
      </div>
    </>
  );
};

/**
 * BookSwiper Component using Swiper React Components
 */
function BookSwiper({ pages }) {
  return (
    <div className="relative w-full max-w-md mx-auto shadow-xl rounded-lg overflow-hidden bg-gray-200">
      <Swiper
        // Swiper মডিউলগুলো যোগ করা হয়েছে
        modules={[Navigation, Pagination]}
        loop={false}
        slidesPerView={1}
        spaceBetween={10}
        // পেজিনেশন কনফিগারেশন
        pagination={{
          el: '.swiper-custom-pagination', // কাস্টম পেজিনেশন ক্লাস
          clickable: true,
        }}
        // নেভিগেশন এখানে আর প্রয়োজন নেই কারণ আমরা কাস্টম বাটন ব্যবহার করছি
      >
        {/* স্লাইডগুলো ম্যাপ করে দেখাই */}
        {pages.map((page, index) => (
          <SwiperSlide key={index} className="bg-white">
            {/* Next.js Image component ব্যবহার করা হয়েছে */}
            <Image
              src={page.src} // page অবজেক্ট থেকে src প্রোপার্টি ব্যবহার করতে হবে
              alt={`Book Page ${index + 1}`}
              width={page.width} // Image কম্পোনেন্টের জন্য width এবং height দেওয়া ভালো
              height={page.height}
              className="w-full h-auto object-contain"
              style={{ aspectRatio: '8.5 / 11' }}
            />
          </SwiperSlide>
        ))}

        {/* কাস্টম নেভিগেশন বাটন এখানে যোগ করা হয়েছে */}
        <SwiperNavButtons />
      </Swiper>
      
      {/* কাস্টম পেজিনেশন কন্টেইনার */}
      <div className="swiper-custom-pagination absolute bottom-2 w-full text-center z-10"></div>
    </div>
  );
}

/**
 * Main App Component
 */
export default function BookPreviewPage() {
  return (
    <section id='read'>
      {/* Swiper-এর পেজিনেশন ডটগুলোকে স্টাইল করার জন্য গ্লোবাল স্টাইল */}
      <style>{`
        .swiper-custom-pagination .swiper-pagination-bullet {
          background-color: #888;
          opacity: 0.7;
          transition: background-color 0.2s, opacity 0.2s;
        }
        .swiper-custom-pagination .swiper-pagination-bullet-active {
          background-color: #111;
          opacity: 1;
        }
        .swiper-slide {
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `}</style>
      
      <div className=" bg-gray-100 flex flex-col items-center justify-center p-4 font-inter">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900">সূচিপত্র ও কয়েকটি পৃষ্ঠা পরে দেখুন</h1>
          <p className="text-lg text-gray-600">Swipe to see the next page</p>
        </div>
        
        {/* এখানে সোয়াইপার কম্পোনেন্টটি ব্যবহার করা হয়েছে */}
        <BookSwiper pages={bookPages} />
      </div>
    </section>
  );
}