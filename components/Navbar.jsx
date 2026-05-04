'use client';

import { Link } from 'react-scroll';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-white shadow z-50 h-16"> {/* Note the height */}
      <div className="container mx-auto flex justify-between items-center p-4">
        <div className="text-xl font-bold">Your Logo</div>
        
        <div className="flex gap-6">
          <Link
            to="order"
            smooth={true}
            duration={500}
            offset={-50}  // Negative offset = navbar height + some padding
            spy={true}
            activeClass="text-blue-600 font-bold"
            className="cursor-pointer hover:text-blue-600"
          >
            Home
          </Link>
          
          <Link
            to="features"
            smooth={true}
            duration={500}
            offset={-80}  // Adjust this based on your navbar height
            spy={true}
            activeClass="text-blue-600 font-bold"
            className="cursor-pointer hover:text-blue-600"
          >
            Features
          </Link>
          
          <Link
            to="pricing"
            smooth={true}
            duration={500}
            offset={-80}
            spy={true}
            activeClass="text-blue-600 font-bold"
            className="cursor-pointer hover:text-blue-600"
          >
            Pricing
          </Link>
        </div>
      </div>
    </nav>
  );
}