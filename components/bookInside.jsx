import React from 'react';
import { Hind_Siliguri } from 'next/font/google';
import Link from 'next/link';
import OrderNowBtn from './orderNowBtn';
// 1. Configure the font
const hindSiliguri = Hind_Siliguri({
  weight: ['400', '500', '600', '700'],
  subsets: ['bengali'],
  variable: '--font-hind-siliguri',
});

// 2. Organize your content data here
const chapterData = [
  {
    id: 1,
    icon: '🔥',
    title: 'অধ্যায় ১:',
    label: 'তথ্য', // Optional label
    content: 'এই বইতে থাকবে সকল প্রকার তথ্য, সাথে থাকবে সুন্দর ভাবে ভিজ্যুয়াল ভাবে বুঝার জন্য ডেটা কে ভালোভাবে বুঝার'
  },
  {
    id: 2,
    icon: '🔥',
    title: 'অধ্যায় ৩:',
    label: null,
    content: (
      <>
        <code className="font-mono bg-gray-200 text-gray-900 px-2 py-0.5 rounded text-lg mx-1">
          বিক্রয় - লাভ = খরচ
        </code> 
        – এই একটি মাত্র ফর্মুলা কীভাবে আপনার চিন্তাভাবনাকে বদলে দিয়ে আপনাকে একজন 'লাভজনক ব্যবসায়ী' বানাবে।
      </>
    )
  },
  {
    id: 3,
    icon: '🏦',
    title: 'অধ্যায় ৪:',
    label: null,
    content: '৫টি ব্যাংক বা বিকাশ/নগদ অ্যাকাউন্ট ব্যবহারের সেই গোপন কৌশল যা আপনার টাকার জগাখিচুড়ি অবস্থা চিরদিনের জন্য শেষ করে দেবে।'
  },
  {
    id: 4,
    icon: '💸',
    title: 'অধ্যায় ৮:',
    label: null,
    content: "বিজ্ঞাপনের কালো গহ্বরে আর টাকা নয়! কোন অ্যাডে লাভ হচ্ছে আর কোনটাতে লস, সেটা বের করার সবচেয়ে সহজ কিন্তু শক্তিশালী 'ROAS ক্যালকুলেশন' মেথড।"
  },
  {
    id: 5,
    icon: '🔄',
    title: 'অধ্যায় ৯:',
    label: null,
    content: "'রিটার্ন প্রোডাক্টের অভিশাপ' থেকে মুক্তির উপায়। কীভাবে রিটার্নের খরচকে আপনার সিস্টেমের অংশ বানিয়ে মানসিক চাপমুক্ত থাকবেন।"
  },
  {
    id: 6,
    icon: '📈',
    title: 'অধ্যায় ১০:',
    label: null,
    content: "ব্যবসা 'বড়' করার সেই মারাত্মক ফাঁদ! কখন টিম বানানো বা শোরুম দেওয়া উচিত এবং কখন উচিত নয় - তার ডেটা-নির্ভর সিদ্ধান্ত নেওয়ার কৌশল।"
  },
  {
    id: 7,
    icon: '🚀',
    title: '90-Day Action Plan:',
    label: null,
    content: "বই পড়া শেষ করেই কী করবেন? আপনার জন্য ৯০ দিনের একটি সুস্পষ্ট অ্যাকশন প্ল্যান যা আপনার হাত ধরে পুরো সিস্টেমটি সেট-আপ করতে সাহায্য করবে।"
  },
];

const BookInside = () => {
  return (
    <section className={`py-8 bg-white rounded-2xl shadow-xl max-w-3xl mx-auto ${hindSiliguri.className}`}>
      
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
          বইয়ের ভেতরে যা যা শিখবেন...
        </h2>
      </div>

      {/* List */}
      <ul className="space-y-3 list-none p-0">
        {chapterData.map((item) => (
          <li 
            key={item.id} 
            className="flex items-start  p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors duration-200"
          >
            <span className="text-2xl mr-4 leading-none mt-1 ">{item.icon}</span>
            
            <p className="text-gray-800 text-xl font-bold md:text-xl leading-relaxed m-0">
              <strong className="text-orange-600 font-bold mr-2">
                {item.title}
              </strong>
              
              {/* Render Label if it exists */}
              {item.label && (
                <span className="font-mono bg-gray-200 text-gray-900 px-2 py-0.5 rounded text-base mx-1 align-middle">
                  {item.label}
                </span>
              )}

              {item.content}
            </p>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <div className="mt-8 flex justify-center w-full max-w-md mx-auto">
        <OrderNowBtn />
      </div>
    </section>
  );
};

export default BookInside;