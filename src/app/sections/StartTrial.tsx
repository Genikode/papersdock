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

        <div className="flex flex-col md:flex-row justify-center items-center gap-10 mb-12">
          <div className="flex flex-col items-center">
            <CalendarClock size={28} className="mb-2" />
            <p className="font-bold text-lg">10 Months</p>
            <p className="text-sm">Session</p>
          </div>
          <div className="flex flex-col items-center">
            <Trophy size={28} className="mb-2" />
            <p className="font-bold text-lg">Weekly</p>
            <p className="text-sm">Classes</p>
          </div>
          <div className="flex flex-col items-center">
            <HelpCircle size={28} className="mb-2" />
            <p className="font-bold text-lg">Query</p>
            <p className="text-sm">Support</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
          <Link
            href="#"
            className="bg-gradient-to-r from-[#FACC15] from-10% via-[#EAB308] via-30% to-[#F97316] to-90% text-black font-semibold px-6 py-3 rounded-md text-sm shadow hover:bg-yellow-500"
          >
            Start Free Trial Now
          </Link>
          <Link
            href="#"
            className="bg-white text-blue-600 font-medium px-6 py-3 rounded-md text-sm shadow hover:bg-blue-50"
          >
            Schedule Demo
          </Link>
        </div>

        <p className="text-sm text-white/80">
          No credit card required • Cancel anytime • Join 10,000+ successful students
        </p>
      </div>
    </section>
  );
}
