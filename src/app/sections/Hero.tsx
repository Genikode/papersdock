// app/components/Hero.tsx
import { CheckCircle, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="bg-[url('/background.png')] bg-cover bg-center py-20 px-4">

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 ">
        {/* Left Content */}
        <div className="max-w-xl order-1">
          <div className="inline-block px-4 py-1 mb-4 bg-blue-100  text-blue-700 rounded-full text-sm font-medium">
            🚀 A-Level Computer Science Platform
          </div>

          <div className="mb-4">
            <div className="relative">
              <h1 className="text-[40px] md:text-[56px] font-bold leading-[1.2] text-gray-900">
                <div>Master</div>
                <div className="text-transparent bg-clip-text  bg-gradient-to-r from-[#4F46E5] from-10% via-[#9333EA] via-30% to-[#2563EB] to-90%  ">Computer</div>
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] from-10% via-[#9333EA] via-30% to-[#2563EB] to-90%">Science</div>
              </h1>
              <p className="md:flex xl:absolute left-[38%] top-[78%] xl:ml-0 md:ml-4 text-[20px] text-black whitespace-nowrap font-bold">
                Like Never Before
              </p>
            </div>
          </div>

          <p className="text-gray-600 text-lg mb-6">
            Join 10,000+ students achieving A* grades with our revolutionary learning platform. Interactive coding challenges,
            expert mentorship, and AI-powered feedback.
          </p>

          {/* Ratings */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                  <Star key={i} fill="currentColor" stroke="currentColor" size={18} />
                ))}
            </div>
            <span className="text-gray-600 font-medium text-sm">4.9/5 from 2,847 reviews</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <Link
              href="#"
              className="px-5 py-3 bg-gradient-to-r from-[#4F46E5] from-10% via-[#9333EA] via-30% to-[#2563EB] to-90% text-white rounded-md shadow text-sm font-semibold"
            >
              Syllabus Overview →
            </Link>
            <Link
              href="#"
              className="px-5 py-3 border border-gray-300 bg-white rounded-md shadow text-sm font-semibold flex items-center gap-2"
            >
              <Image src="/icons/youtube.png" alt="YouTube" width={20} height={20} />
              YouTube Channel
            </Link>
          </div>

          {/* Features */}
          <div className="flex gap-8 flex-wrap text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500" size={18} />
              Experienced Teacher
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500" size={18} />
              Query Support
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500" size={18} />
              Affordable
            </div>
          </div>
        </div>

        {/* Right Side Card */}
        <div className="w-full max-w-xs md:max-w-[400px] bg-gradient-to-br from-[#E0E7FF] to-[#E0E7FF] rounded-3xl p-4 md:p-6 relative shadow-xl order-2">
          <div className="absolute top-0 right-0 w-3 h-3 bg-orange-400 rounded-full z-50"></div>
          {/* Decorative dots */}
          <div className="absolute bottom-0 left-0 w-3 h-3 bg-green-400 rounded-full"></div>
          <div className="absolute right-0 top-1/2 w-3 h-3 bg-pink-400 rounded-full"></div>

          {/* Top Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:mb-6">
            <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Image src="/icons/icon2.png" alt="Practice" width={36} height={20} className="md:w-[44px] md:h-[24px]" />
                <h4 className="font-semibold text-xs md:text-sm text-black">Interactive Practice</h4>
              </div>
              <p className="text-xs md:text-sm text-gray-500">
                Learn by doing with real coding excurses and instant feedback.
              </p>
            </div>
            <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Image src="/icons/icon1.png" alt="Practice" width={36} height={20} className="md:w-[44px] md:h-[24px]" />
                <h4 className="font-semibold text-xs md:text-sm text-black">Exam-Ready Content</h4>
              </div>
              <p className="text-xs md:text-sm text-gray-500">
                Study materials and mock content aligned with your goals.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 md:gap-4 text-center mb-3 md:mb-4">
            <div className="bg-white p-2 rounded-lg shadow">
              <div className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-tl from-[#2563EB] to-[#16A34A]">
                4+
              </div>
              <p className="text-xs md:text-sm text-gray-500">Distinction</p>
            </div>
            <div className="bg-white p-2 rounded-lg shadow">
              <div className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-tl from-[#DB2777] to-[#9333EA]">
                500+
              </div>
              <p className="text-xs md:text-sm text-gray-500">Learning Resources</p>
            </div>
          </div>

          {/* Why Learn */}
          <div className="bg-white rounded-lg p-2 md:p-3 text-xs md:text-sm text-gray-700 flex items-start gap-2 shadow-sm">
            <div className="w-2 h-2 mt-1 bg-green-500 rounded-full"></div>
            <p>
              <strong>Why Learn with Us?</strong> <br />
              Your success is at the core of everything.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
