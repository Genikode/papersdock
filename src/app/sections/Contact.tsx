// app/components/ContactSection.tsx
import { Mail, PhoneCall, Clock, MapPin } from 'lucide-react';

export default function ContactSection() {
  return (
    <section className="py-16 px-4 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10">
        {/* Left: Contact Form */}
        <div className="rounded-xl p-8 shadow-sm border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">
            Send us a Message
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Fill out the form below and we'll get back to you within 24 hours.
          </p>

          <form className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="sr-only" htmlFor="firstName">First name</label>
              <input
                id="firstName"
                type="text"
                placeholder="Enter your first name"
                className="w-full rounded-md px-4 py-2 text-sm
                           border border-slate-200 bg-white text-slate-900 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500/60
                           dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:border-slate-800"
              />
              <label className="sr-only" htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                type="text"
                placeholder="Enter your last name"
                className="w-full rounded-md px-4 py-2 text-sm
                           border border-slate-200 bg-white text-slate-900 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500/60
                           dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:border-slate-800"
              />
            </div>

            <label className="sr-only" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              className="w-full rounded-md px-4 py-2 text-sm
                         border border-slate-200 bg-white text-slate-900 placeholder-slate-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500/60
                         dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:border-slate-800"
            />

            <label className="sr-only" htmlFor="subject">Subject</label>
            <input
              id="subject"
              type="text"
              placeholder="What is this regarding?"
              className="w-full rounded-md px-4 py-2 text-sm
                         border border-slate-200 bg-white text-slate-900 placeholder-slate-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500/60
                         dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:border-slate-800"
            />

            <label className="sr-only" htmlFor="message">Message</label>
            <textarea
              id="message"
              placeholder="Message"
              rows={4}
              className="w-full rounded-md px-4 py-2 text-sm resize-y
                         border border-slate-200 bg-white text-slate-900 placeholder-slate-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500/60
                         dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:border-slate-800"
            />

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-2 text-sm font-medium
                         rounded-md text-white bg-gradient-to-r from-blue-600 to-indigo-600
                         hover:from-blue-700 hover:to-indigo-700
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                         dark:focus-visible:ring-offset-slate-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
                aria-hidden="true"
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
            icon={<Mail size={18} className="text-blue-600 dark:text-blue-400" />}
            title="Email Us"
            content="For general inquiries and support"
            detail="papersdockcoordinator@gmail.com "
          />
          <InfoCard
            icon={<PhoneCall size={18} className="text-green-600 dark:text-green-400" />}
            title="WhatsApp Support"
            content="Coordinator Number"
            detail="+92 318 2248924"
            iconBg="bg-green-100 dark:bg-green-900/20"
          />
          <InfoCard
            icon={<MapPin size={18} className="text-purple-600 dark:text-purple-400" />}
            title="Zoom Meeting"
            content={`Zoom link will be provided in portal`}
            detail="Join via Zoom link"
            iconBg="bg-purple-100 dark:bg-purple-900/20"
          />
          <InfoCard
            icon={<Clock size={18} className="text-orange-600 dark:text-orange-400" />}
            title="Office Hours"
            content={`Call timings: 12:00 PM - 6:00 PM\nOnline support available`}
            detail=""
            iconBg="bg-orange-100 dark:bg-orange-900/20"
          />
        </div>
      </div>
    </section>
  );
}

function InfoCard({
  icon,
  title,
  content,
  detail,
  iconBg = 'bg-blue-100 dark:bg-blue-900/20',
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
  detail: string;
  iconBg?: string;
}) {
  return (
    <div className="flex gap-4 items-start p-5 rounded-xl shadow-sm
                    border border-slate-200 bg-white
                    dark:border-slate-800 dark:bg-slate-900">
      <div className={`w-10 h-10 flex items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </div>
      <div className="text-sm">
        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</p>
        <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">{content}</p>
        {detail ? (
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}
