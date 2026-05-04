"use client"

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';

// Import local images from public folder
import web1 from "@/public/web1.png"
import web2 from "@/public/web2.png"
import web3 from "@/public/web3.png"
import web4 from "@/public/web4.png"
import web5 from "@/public/web5.png"
import web6 from "@/public/web6.png"
import web7 from "@/public/web7.png"
import web8 from "@/public/web8.png"
import web9 from "@/public/web9.png"
import web10 from "@/public/web10.png"
import web11 from "@/public/web11.png"
import web12 from "@/public/web12.png"
import web13 from "@/public/web13.png"
import web14 from "@/public/web14.png"
import web15 from "@/public/web15.png"
import web16 from "@/public/web16.png"
import web17 from "@/public/web17.png"
import web18 from "@/public/web18.png"
import web19 from "@/public/web19.png"

// image reviewer profile
import rp1 from '@/public/rp-1.jpg'
import rp2 from '@/public/rp-2.jpg'
import rp3 from '@/public/rp-3.jpg'
import rp4 from '@/public/rp-4.jpg'
import rp5 from '@/public/rp-5.jpg'
import rp6 from '@/public/rp-6.jpg'
import rp7 from '@/public/rp-7.jpg'

// Reviews data using the imported images
const reviewsData = [
  {
    id: 1,
    author: 'মুরাদ জাফর',
    verified: true,
    rating: 5,
    date: '30 Oct 2025',
    text: `আমি একা কিনি নাই, আমাদের ভার্সিটির একটা গ্রুপ আছে যারা টুকটাক পেজ চালায়, সবাই মিলে কিনছি। বিশ্বাস করেন, এরপর থেকে আমাদের আড্ডার টপিকই পাল্টে গেছে! আগে আলোচনা হতো কার কত সেল, আর এখন হয় কার প্রফিট মার্জিন কত ভালো। It's a total game-changer for us. Thanks to the author for creating such a masterpiece!`,
    images: [web1, web2, web3],
    profileImage: rp1,
  },
  {
    id: 2,
    author: 'কাবির জাহান',
    verified: true,
    rating: 4,
    date: '12 Aug 2025',
    text: 'OMG! মাত্র বইটা শেষ করলাম and I am speechless! মাথায় এখন হাজারটা আইডিয়া ঘুরছে। লসগুলোকে কীভাবে প্রফিটে কনভার্ট করা যায়, তার এত simple solution থাকতে পারে, ভাবিই নাই। ল্যাপটপ নিয়ে বসতেছি এখন, পুরো বিজনেস মডেল নতুন করে সাজাবো। What a book!',
    images: [web4, web5],
    profileImage: rp2,
  },
  {
    id: 202,
    author: 'কাবির জাহান',
    verified: true,
    rating: 5,
    date: '01 Nov 2025',
    text: 'বেশি কিছু বলব না। এফ-কমার্স নিয়ে এত কার্যকরী আর ডেটা-ভিত্তিক বই বাংলা ভাষায় আর একটাও নেই। ব্যস, এটাই।',
    images: [web13],
    profileImage: rp3,
  },
  {
    id: 3,
    author: 'Hasibuzzaman',
    verified: true,
    rating: 5,
    date: '27 Oct 2025',
    text: 'ফেসবুকে অ্যাড দিলেই সেল আসতো, আমি ভাবতাম ব্যবসাই তো হচ্ছে! কিন্তু লাভের টাকা যে কোথায় উবে যেত, তার হিসাব পেতাম না। এই বইটা আমাকে সেলস আর প্রফিটের পার্থক্যটা চোখে আঙুল দিয়ে দেখিয়ে দিয়েছে। যারা আমার মতো শুধু সেলস নিয়ে পাগল, তাদের জন্য এটা একটা Wake-up Call..',
    images: [web6, web7, web8],
    profileImage: rp4,
  },
  // {
  //   id: 4,
  //   author: 'শরীফউদ্দিন আহমদ',
  //   verified: true,
  //   rating: 5,
  //   date: '09 Nov 2025',
  //   text: 'বইটার সবচেয়ে শক্তিশালী দিক হলো এর প্রফিট ক্যালকুলেশনের ফর্মুলাটা। COGS (Cost of Goods Sold), Return Rate, Customer Acquisition Cost (CAC) - এই বিষয়গুলো যে এত সহজ করে বাংলা ভাষায় একটা বইয়ে গুছিয়ে দেওয়া যায়, তা অকল্পনীয়। মোটিভেশন নয়, যারা পিওর বিজনেস ম্যাথ আর স্ট্র্যাটেজি খুঁজছেন, চোখ বন্ধ করে নিয়ে নিন।',
  //   images: [web9, web10, web11, web12],
  //   profileImage: rp5,
  // },
  // {
  //   id: 5,
  //   author: 'S. Ahmed',
  //   verified: true,
  //   rating: 5,
  //   date: '18 Oct 2025',
  //   text: 'Honestly, I thought it was another typical business book. But man, I was wrong! Literally page 1 থেকে কাজের কথা শুরু, কোনো প্যানপ্যানানি নাই। Paid course-এ হাজার হাজার টাকা ঢালার চেয়ে এই বইটা one hundred times better. Solid একটা বই, no bullshit theory. Highly recommended for serious people.',
  //   images: [web14, web15, web16, web17],
  //   profileImage: rp6,
  // },
  // {
  //   id: 6,
  //   author: 'Tawhidul Islam',
  //   verified: true,
  //   rating: 5,
  //   date: '22 Oct 2025',
  //   text: 'This is a great book. Highly recommended for everyone.',
  //   images: [web18, web19],
  //   profileImage: rp7,
  // },
];

// Star Rating Component
const StarRating = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={i <= rating ? 'text-2xl text-yellow-400' : 'text-2xl text-gray-300'}>
        ★
      </span>
    );
  }
  return <div className="flex">{stars}</div>;
};

// Review Card Component
const ReviewCard = ({ review, onImageClick }) => {
  const getInitials = (name) => {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
      {/* Reviewer Info */}
      <div className="flex items-center mb-3">
        <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center font-bold text-white text-lg mr-3 uppercase shadow-md relative overflow-hidden">
          {review.profileImage ? (
            <Image
              src={review.profileImage}
              alt={review.author}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            getInitials(review.author)
          )}
        </div>
        <div className="flex flex-col flex-1">
          <div className="font-bold text-gray-800 text-base flex items-center gap-1 justify-between">
            {review.author}
            {review.date && (
              <span className="text-sm text-gray-500">
                {review.date}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {review.verified && (
              <ShieldCheck className="text-green-500 w-5 h-5" strokeWidth={2.5} />
            )}
            {review.verified && (
              <span className="text-[.9rem] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                ভেরিফাইড কাস্টমার
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="mb-3">
        <StarRating rating={review.rating} />
      </div>

      {/* Review Text */}
      <p className="text-gray-700 text-base leading-relaxed mb-4">
        {review.text}
      </p>

      {/* Review Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1.5">
          {review.images.map((imageSrc, index) => (
            <div
              key={index}
              className="border border-gray-300 rounded overflow-hidden cursor-pointer shrink-0 relative w-20 h-20 hover:border-blue-400 transition-colors"
              onClick={() => onImageClick(imageSrc, review.images)}
            >
              <Image
                src={imageSrc}
                alt={`Review image ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
                placeholder="blur"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Image Modal Component
const ImageModal = ({ images, initialImage, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const initialIndex = images.indexOf(initialImage);
    if (initialIndex !== -1) {
      setCurrentIndex(initialIndex);
    }
  }, [initialImage, images]);

  const goToPrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleThumbnailClick = (e, index) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg p-4 w-full max-w-sm flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full text-3xl text-gray-700 cursor-pointer flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
          onClick={onClose}
        >
          &times;
        </button>
        <div className="relative w-full h-64 sm:h-80 mb-4">
          <Image
            src={currentImage}
            alt="Full screen review"
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, 640px"
            placeholder="blur"
            priority
          />
          {images.length > 1 && (
            <>
              <button
                className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 cursor-pointer text-2xl z-10 flex items-center justify-center transition-colors"
                onClick={goToPrevious}
              >
                &lt;
              </button>
              <button
                className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 cursor-pointer text-2xl z-10 flex items-center justify-center transition-colors"
                onClick={goToNext}
              >
                &gt;
              </button>
            </>
          )}
        </div>
        <div className="text-sm text-gray-600 mb-2">
          {currentIndex + 1} / {images.length}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto w-full justify-center p-2">
            {images.map((imageSrc, index) => (
              <div
                key={index}
                className={`border-2 cursor-pointer rounded overflow-hidden shrink-0 relative w-16 h-16 transition-all ${
                  index === currentIndex ? 'border-blue-500 scale-110' : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={(e) => handleThumbnailClick(e, index)}
              >
                <Image
                  src={imageSrc}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                  placeholder="blur"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// New Component for the top image gallery
const ReviewImageGallery = ({ images, onImageClick }) => {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Customer Reviews</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {images.map((imageSrc, index) => (
          <div
            key={index}
            className="border border-gray-300 rounded-lg overflow-hidden cursor-pointer shrink-0 relative w-28 h-28 hover:border-blue-400 transition-colors"
            onClick={() => onImageClick(imageSrc, images)}
          >
            <Image
              src={imageSrc}
              alt={`Review gallery image ${index + 1}`}
              fill
              className="object-cover"
              sizes="112px"
              placeholder="blur"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Main App Component
export default function ReviewCardPage() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    images: [],
    initialImage: null,
  });

  // Consolidate all images from all reviews into one array
  const allReviewImages = reviewsData.flatMap(review => review.images);

  const openModal = (imageSrc, allImages) => {
    setModalState({
      isOpen: true,
      images: allImages,
      initialImage: imageSrc,
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      images: [],
      initialImage: null,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="max-w-md mx-auto p-4">
        
        {/* Add the new image gallery component here */}
        <ReviewImageGallery 
          images={allReviewImages}
          onImageClick={openModal}
        />

        <div className="space-y-4">
          {reviewsData.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onImageClick={openModal}
            />
          ))}
        </div>
      </div>

      {modalState.isOpen && (
        <ImageModal
          images={modalState.images}
          initialImage={modalState.initialImage}
          onClose={closeModal}
        />
      )}
    </div>
  );
}