import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar"; // Adjust path based on your folder structure
import "../../globals.css";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Book Order Dashboard",
  description: "Logistics management system",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get("sidebarCollapsed")?.value === "true";

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-900 text-gray-100`} suppressHydrationWarning>
        {/* FLEX CONTAINER FOR SIDEBAR + CONTENT */}
        <div className="flex h-screen overflow-hidden">
          
          {/* SIDEBAR COMPONENT */}
          <Sidebar initialCollapsed={initialCollapsed} />
          
          {/* MAIN CONTENT AREA */}
          <main className="flex-1 overflow-y-auto relative scroll-smooth">
            {/* Add padding-top on mobile so the content isn't hidden 
              behind the hamburger menu button 
            */}
            <div className="p-4 md:p-0 pt-16 md:pt-0 h-full">
              {children}
            </div>
          </main>

        </div>
      </body>
    </html>
  );
}