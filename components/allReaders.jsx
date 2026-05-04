import Image from "next/image";

import readers1 from "@/public/readers-1.png";
// import readers2 from "@/public/readers-2.png";
// import readers3 from "@/public/readers-3.png";
// import readers4 from "@/public/readers-4.png";
import readers5 from "@/public/readers-5.png";
import readers6 from "@/public/readers-6.png";
import readers7 from "@/public/readers-7.png";
import readers8 from "@/public/readers-8.png";
// import readers9 from "@/public/readers-9.png";
import readers10 from "@/public/readers-10.png";
import readers11 from "@/public/readers-11.png";
import readers12 from "@/public/readers-12.png";
import OrderNowBtn from "./orderNowBtn";


const AllReaders = () => {
      const readersOne = [
    { id: 1, src: readers1, alt: "Reader 1" },
    { id: 6, src: readers6, alt: "Reader 6" },
    { id: 2, src: readers10, alt: "Reader 10" },
  ];

  const readersTwo = [
    { id: 5, src: readers5, alt: "Reader 5" },
    { id: 9, src: readers12, alt: "Reader 12" },
    
    // { id: 7, src: readers7, alt: "Reader 7" },
    { id: 8, src: readers8, alt: "Reader 8" },
    { id: 3, src: readers11, alt: "Reader 11" },
    // { id: 9, src: readers12, alt: "Reader 12" },
  ];

  return (
    <section id="allreaders">
           {/* Readers */}
        <div>
          <h1 className="text-4xl text-center mb-3 mt-9">আমাদের পাঠক গণ:</h1>
          <div className="grid grid-cols-2 gap-1.5">
           <div className="flex flex-col gap-1.5">
             {readersOne.map((reader) => (
              <div key={reader.id}>
                <Image src={reader.src} alt="Profit first book review" />
              </div>
            ))}
           </div>
         
         <div className="flex flex-col gap-1.5">
             {readersTwo.map((reader) => (
              <div key={reader.id}>
                <Image src={reader.src} alt="Profit first book review" />
              </div>
            ))}
         </div>
          </div>
        </div>
        <OrderNowBtn />
    </section>
  )
}

export default AllReaders