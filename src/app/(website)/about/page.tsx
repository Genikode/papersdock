// app/about/page.tsx
import Image from 'next/image';
import { Heart, Users, FileText, Clock, ShieldCheck, Globe, Users2 } from 'lucide-react';
import Link from 'next/link';
import Banner from '../../sections/Banner';
import Mission from '../../sections/Mission';
import Value from '../../sections/Values';

export default function AboutPage() {
  return (
    <main className="bg-white text-gray-800">
      {/* Hero Section */}
    <Banner  title="About" title2="Us" description="Empowering A-Level Computer Science students with comprehensive resources, expert guidance, and cutting-edge tools to excel in their academic journey."/>

      {/* Mission + Stats Section */}
    
<Mission />
      {/* Values Section */}
   <Value />

      {/* CTA Section */}
      <section className="py-20 text-center bg-white">
        <h2 className="text-2xl font-bold mb-4">Ready to Start Your Journey?</h2>
        <p className="text-gray-600 max-w-xl mx-auto mb-6">
          Join thousands of students who have transformed their Computer Science studies with PapersDock.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="#"
            className="bg-blue-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Get Started Now
          </Link>
          <Link
            href="#"
            className="border border-gray-300 px-6 py-3 rounded-md text-sm font-medium hover:bg-gray-100"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}



