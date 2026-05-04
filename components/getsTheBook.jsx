
import readers1 from "@/public/got-1.png";
import readers2 from "@/public/got-2.png";
import readers3 from "@/public/got-3.png";
import readers4 from "@/public/got-4.png";
import readers5 from "@/public/got-5.png";
import readers6 from "@/public/got-6.png";
import readers7 from "@/public/got-7.png";
import readers8 from "@/public/got-8.png";
import readers9 from "@/public/got-9.png";
import Image from "next/image";
import OrderNowBtn from "./orderNowBtn";

const GetsTheBook = () => {
      const readersOne = [
    { id: 1, src: readers1, alt: "Reader 1" },
        { id: 9, src: readers9, alt: "Reader 9" },
  
        { id: 8, src: readers8, alt: "Reader 8" },
    { id: 3, src: readers3, alt: "Reader 3" },
    
    { id: 2, src: readers2, alt: "Reader 2" },
  ];
  
  const readersTwo = [
    { id: 5, src: readers5, alt: "Reader 5" },
    { id: 7, src: readers7, alt: "Reader 7" },
     { id: 4, src: readers4, alt: "Reader 4" },
    { id: 6, src: readers6, alt: "Reader 6" },
    

  ];
  return (
    <section id="getsbook">
      <div className="mt-16 container mx-auto px-4">
        <div>
          <h1 className="text-4xl text-center mb-3">বইটি যারা হাতে পেয়েছেন:</h1>
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
      </div>
    </section>
  );
};

export default GetsTheBook;
