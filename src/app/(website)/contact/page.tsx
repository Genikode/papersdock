// app/about/page.tsx
import Image from 'next/image';
import { Heart, Users, FileText, Clock, ShieldCheck, Globe, Users2 } from 'lucide-react';
import Banner from '../../sections/Banner';
import ContactSection from '../../sections/Contact';
import FaqCardGrid from '../../sections/FaqCardGrid';

export default function ContactPage() {
  return (

    <main className="bg-white text-gray-800">
    <Banner  title="Contact" title2="Us" description="Have questions about our courses or need help with your studies? We're here to support you every step of the way"/>
<ContactSection />

    </main>
  );
}



