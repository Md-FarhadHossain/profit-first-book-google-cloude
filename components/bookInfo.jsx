import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableRow,
} from "@/components/ui/table";

import bookCover from "@/public/bookCover.png";
import ReadBtn from "@/components/readBth";
import Image from "next/image";

const BookInfo = () => {
      const bookData = [
    { label: "পৃষ্ঠা", value: "৩২০টি" },
    { label: "কভার", value: "প্রিমিয়াম হার্ড কভার" },
    { label: "লেখক", value: "মোঃ ফরহাদ হোসেন" },
    { label: "ক্যাটাগরি", value: "বিজনেস / উদ্যোক্তা" },
    { label: "প্রকাশনী", value: "ওরানোট প্রকাশনী" },
    { label: "প্রথম প্রকাশ", value: "জুলাই ২০২৪" },
    { label: "দ্বিতীয় প্রকাশ", value: "সেপ্টেম্বর ২০২৪" },
    { label: "ভাষা", value: "বাংলা" },
    { label: "ISBN", value: "978-984-35-8289-8" },
  ];
  return (
    <>
      <header>
        {/* <Image
        className="border mt-1"
          src={bookCover}
          alt="Profit First for F-commerce business in Bangladesh book"
        />
        <div>
          <ReadBtn />
        </div>

        <div>
          <h1 className="text-4xl font-semibold">
            প্রফিট ফার্স্ট ফর এফ-কমার্স বিজনেস ইন বাংলাদেশ <span className="text-blue-600">(হার্ড কভার)</span>
          </h1>
        </div>
        <div className="border-t border-gray-300 text-xl py-4 mt-4">
          <p>
            ফেইসবুক ব্যবসার ডেটা ভিত্তিক সকল সমস্যার সমাধান নিয়ে বাংলাদেশের
            প্রথম ও একমাত্র বই প্রফিট ফার্স্ট ফর এফ-কমার্স
          </p>
        </div> */}

        <div className="my-4">
          <h1 className="text-4xl mb-4">বইটির বৈশিষ্ট:</h1>
          <div className="flex justify-center items-start mb-10">
            <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-sm shadow-md overflow-hidden border dark:border-gray-700">
              <Table>
                <TableBody>
                  {bookData.map((row) => (
                    <TableRow
                      key={row.label}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <TableCell className="font- text-gray-700 dark:text-gray-300 w-[150px] sm:w-[200px] text-xl">
                        {row.label}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100 text-xl">
                        {row.value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Contact Section */}
          <section className="bg-slate-50 py-10 md:py-16 border border-slate-200 mt-10 rounded-xl max-w-4xl mx-auto shadow-sm">
            <div className="container mx-auto px-4 text-center">
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
                বইটি সম্পর্কে যেকোনো প্রয়োজনে যোগাযোগ করুন
              </h3>
              <p className="text-slate-500 mb-8">আমাদের সাপোর্ট টিম আপনাকে সাহায্য করার জন্য প্রস্তুত</p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
                {/* Direct Call Button */}
                <a 
                  href="tel:01629786168" 
                  className="flex items-center justify-center gap-2 w-full sm:w-auto bg-white border-2 border-[#ff6b00] text-[#ff6b00] hover:bg-[#ff6b00] hover:text-white py-3.5 px-6 rounded-xl text-lg font-bold shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  <i className="fas fa-phone-alt group-hover:animate-bounce"></i>
                  01629786168
                </a>
                
                {/* WhatsApp Button */}
                <a 
                  href="https://wa.me/8801725755220" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[#25D366] text-white hover:bg-[#1ebe57] py-3.5 px-6 rounded-xl text-lg font-bold shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <i className="fab fa-whatsapp text-xl"></i>
                  WhatsApp
                </a>
              </div>
            </div>
          </section>

        </div>
      </header>
    </>
  );
};

export default BookInfo;
