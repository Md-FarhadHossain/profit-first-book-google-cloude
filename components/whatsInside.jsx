import React from "react";
import OrderNowBtn from "./orderNowBtn";

const WhatsInside = () => {
      const featureData = [
    {
      bgColor: "bg-gradient-to-b from-[#FF8000] to-[#B25149]",
      title: "তথ্য",
      description:
        "এই বইতে থাকবে সকল প্রকার তথ্য, সাথে থাকবে সুন্দর ভাবে ভিজ্যুয়াল ভাবে বুঝার জন্য ডেটা কে ভালোভাবে বুঝার",
    },
    {
      bgColor: "bg-gradient-to-b from-[#7B02C3] to-[#33064E]",
      title: "ফর্মুলা",
      description:
        "লাভ এখন আপনার খরচের খাতার মতোই গুরুত্বপূর্ণ একটি বাধ্যতামূলক খাত। আপনি যেমন ভাড়া, বিদ্যুৎ বিল, কর্মচারী বেতন না দিয়ে ব্যবসা চালাতে পারেন না, ঠিক তেমনি লাভও একটি অবশ্য প্রদেয় খাত।",
    },
    {
      bgColor: "bg-gradient-to-b from-[#109E52] to-[#044716]",
      title: "অ্যাকাউন্ট",
      description:
        "এটি ব্যাংক বা বিকাশ/নগদ অ্যাকাউন্ট ব্যবহারের সেই গোপন স্ট্রাটেজি যা আপনার টাকার জগাখিচুড়ি অবস্থা চিরদিনের জন্য শেষ করে দেবে।",
    },
    {
      bgColor: "bg-gradient-to-b from-[#297FFA] to-[#20086B]",
      title: "ADS",
      description:
        "বিজ্ঞাপনের কালো গহ্বরে আর টাকা নয়। কোন অ্যাডে লাভ হচ্ছে আর কোনটাতে লস, সেটা বের করার সবচেয়ে সহজ কিন্তু শক্তিশালী 'ROAS ক্যালকুলেশন' মেথড।",
    },
    {
      bgColor: "bg-gradient-to-b from-[#47ADD2] to-[#064E4B]",
      title: "রিটার্ন প্রোডাক্ট",
      description:
        "'রিটার্ন প্রোডাক্টের অভিশাপ' থেকে মুক্তির উপায়। কীভাবে রিটার্নের খরচকে আপনার সিস্টেমের অংশ বানিয়ে মানসিক চাপমুক্ত থাকবেন।",
    },
    {
      bgColor: "bg-gradient-to-b from-[#D11D8A] to-[#4E0631]",
      title: "স্কেলিং",
      description:
        "ব্যবসা 'বড়' করার সেই মারাত্মক ফাঁদ! কখন টিম বানানো বা শোরুম দেওয়া উচিত এবং কখন উচিত নয় - তার ডেটা-নির্ভর সিদ্ধান্ত নেওয়ার কৌশল।",
    },
    {
      bgColor: "bg-gradient-to-b from-[#34EAF7] to-[#062B4E]",
      title: "বিসনেস টার্মস",
      description:
        "এই বই আপনাকে শেখাবে ব্যবসার সেই 'ভাষা' যা বড় উদ্যোক্তারা ব্যবহার করেন - প্রতিটি টার্মের মানে, ব্যবহার এবং আপনার ব্যবসায় কীভাবে প্রয়োগ করবেন।",
    },
    {
      bgColor: "bg-gradient-to-b from-[#EC008E] to-[#4E062B]",
      title: "আরও অনেক কিছু",
      description:
        "টিম বিল্ডিং, আপনার ব্যাবসার সমস্যা খুঁজে বের করা, স্টক ম্যানেজমেন্ট, ব্যাবসার খারাপ সময়ে  কিভাবে বিজনেসকে টিকিয়ে রাখবেন, আরো অনেক কিছু দিয়ে বইটিকে পরিপূণ্য করা হয়েছে।",
    },
  ];

    const FeatureCard = ({ bgColor, title, description }) => {
    return (
      <div
        className={`${bgColor} text-white p-6 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 hover:shadow-xl`}
      >
        <h2 className="text-4xl text-center font-bold mb-3">{title}</h2>
        <p className="text-xl">{description}</p>
      </div>
    );
  };

  return (
    <section id="whatInside">
      <div className="mt-16">
        <div className="max-w-3xl mx-auto">
          {/* Header Title */}
          <div className="text-center mb-4">
            <h2 className="text-4xl font-bold  mt-4">
              কি কি আছে বইতে? যার জন্য এত জনপ্রিয় বইটি
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {featureData.map((feature, index) => (
              <FeatureCard
                key={index}
                bgColor={feature.bgColor}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
        <OrderNowBtn />
      </div>
    </section>
  );
};

export default WhatsInside;
