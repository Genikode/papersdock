// app/components/StartTrial.tsx
import { CalendarClock, Trophy, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function StartTrial() {
  return (
    <section
      className="bg-cover bg-center py-20 px-4 text-white"
      style={{ backgroundImage: "url('/background-trial.jpeg')", backgroundSize: 'contain', backgroundPosition: 'center' } }
      
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Achieve Your A* Grade?</h2>
        <p className="text-base md:text-lg mb-10 max-w-2xl mx-auto">
          Join thousands of students who have transformed their Computer Science results. Start your journey to academic excellence today!
        </p>

   <div className="grid grid-cols-3 justify-items-center items-center gap-3 sm:gap-6 mb-12">
          <div className="flex flex-col items-center min-w-0">
            <CalendarClock className="w-5 h-5 sm:w-7 sm:h-7 mb-1 sm:mb-2" />
            <p className="font-bold text-[12px] sm:text-base leading-tight">10 Months</p>
            <p className="text-[10px] sm:text-sm opacity-90 leading-tight">Session</p>
          </div>

          <div className="flex flex-col items-center min-w-0">
            <Trophy className="w-5 h-5 sm:w-7 sm:h-7 mb-1 sm:mb-2" />
            <p className="font-bold text-[12px] sm:text-base leading-tight">Weekly</p>
            <p className="text-[10px] sm:text-sm opacity-90 leading-tight">Classes</p>
          </div>

          <div className="flex flex-col items-center min-w-0">
            <HelpCircle className="w-5 h-5 sm:w-7 sm:h-7 mb-1 sm:mb-2" />
            <p className="font-bold text-[12px] sm:text-base leading-tight">Query</p>
            <p className="text-[10px] sm:text-sm opacity-90 leading-tight">Support</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
          <Link
            href="https://docs.google.com/forms/d/e/1FAIpQLScoTIkG9tHQjF5PSfwbeH-M8qKMXLXILMWPH4aXTaVCBmdqUg/viewform"
            target="_blank"
            className="bg-gradient-to-r from-[#FACC15] from-10% via-[#EAB308] via-30% to-[#F97316] to-90% text-black font-semibold px-6 py-3 rounded-md text-sm shadow hover:bg-yellow-500"
          >
            Join Now  </Link>
          <Link
            target="_blank"
            href="https://www.youtube.com/@papersdock"
            className="bg-white text-blue-600 font-medium px-6 py-3 rounded-md text-sm shadow hover:bg-blue-50"
          >
            Youtube Channel
          </Link>
        </div>

   
      </div>
    </section>
  );
}
