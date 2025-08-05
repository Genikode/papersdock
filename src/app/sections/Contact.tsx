// app/components/ContactSection.tsx
import { Mail, PhoneCall, Clock, MapPin } from 'lucide-react';

export default function ContactSection() {
  return (
    <section className="py-16 bg-white px-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10">
        {/* Left: Contact Form */}
        <div className="bg-white border border-[#F5F5F5] rounded-xl p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-2 text-gray-900">Send us a Message</h2>
          <p className="text-sm text-gray-600 mb-6">
            Fill out the form below and we'll get back to you within 24 hours.
          </p>

          <form className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Enter your first name"
                className="w-full border rounded-md px-4 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Enter your last name"
                className="w-full border rounded-md px-4 py-2 text-sm"
              />
            </div>
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full border rounded-md px-4 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="What is this regarding?"
              className="w-full border rounded-md px-4 py-2 text-sm"
            />
            <textarea
              placeholder="Message"
              rows={4}
              className="w-full border rounded-md px-4 py-2 text-sm"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m0 0l-9 6-9-6m18 0v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8"
                />
              </svg>
              Send Message
            </button>
          </form>
        </div>

        {/* Right: Contact Info Cards */}
        <div className="space-y-4">
          <InfoCard
            icon={<Mail size={18} className="text-blue-500" />}
            title="Email Us"
            content="For general inquiries and support"
            detail="info@papersdock.com"
          />
          <InfoCard
            icon={<PhoneCall size={18} className="text-green-600" />}
            title="WhatsApp Support"
            content="Coordinator Number"
            detail="+1 (234) 567-8900"
            iconBg="bg-green-100"
          />
          <InfoCard
            icon={<MapPin size={18} className="text-purple-600" />}
            title="Zoom Meeting"
            content={`123 Education Street\nLearning District\nKnowledge City, KC 12345`}
            detail="Join via Zoom link"
            iconBg="bg-purple-100"
          />
          <InfoCard
            icon={<Clock size={18} className="text-orange-600" />}
            title="Office Hours"
            content={`Call timings: 9:00 AM - 6:00 PM\nClass Timings: 10:00 AM - 4:00 PM\nSunday: Closed\n*Online support available`}
            detail=""
            iconBg="bg-orange-100"
          />
        </div>
      </div>
    </section>
  );
}

function InfoCard({ icon, title, content, detail, iconBg = 'bg-blue-100' }: { icon: React.ReactNode; title: string; content: string; detail: string; iconBg?: string }) {
  return (
    <div className="flex gap-4 items-start p-5 border border-[#F5F5F5] rounded-xl bg-white shadow-sm">
      <div className={`w-10 h-10 flex items-center justify-center rounded-full ${iconBg}`}>{icon}</div>
      <div className="text-sm">
        <p className="font-semibold text-gray-900 mb-1">{title}</p>
        <p className="text-gray-600 whitespace-pre-line">{content}</p>
        <p className="text-sm text-blue-600 mt-1">{detail}</p>
      </div>
    </div>
  );
}
