import type { Metadata } from "next";
import { Geist, Geist_Mono, Hind_Siliguri } from "next/font/google";
import "../globals.css";
import localFont from 'next/font/local'
import Script from "next/script";
import FacebookPixel from "@/components/FacebookPixel";

const myFont = localFont({
  src: '../../public/ekkushe-lalshalu.ttf',
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const hindSiliguri = Hind_Siliguri({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['bengali'],
  variable: '--font-hind-siliguri',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Profit First for F-Commerce | প্রফিট ফার্স্ট ফর এফ-কমার্স",
  description: "Profit first for f-commerce business in bangladesh book.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
         {/* FontAwesome - Loaded in head for immediate availability to prevent flickering, but widely cached */}
         <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${hindSiliguri.variable} antialiased ${myFont.className}`}
      >
        <FacebookPixel />

        {/* Microsoft Clarity Script - Added Here */}
        <Script id="microsoft-clarity-analytics" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "v3clegqg1w");
          `}
        </Script>

        {/* Smooth Scroll Script */}
        <Script id="smooth-scroll" strategy="afterInteractive">
          {`
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
              anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                  setTimeout(() => {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }
              });
            });
          `}
        </Script>
        
        {children}
   
      </body>
    </html>
  );
}