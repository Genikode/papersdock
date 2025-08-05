// app/components/ClassTimings.tsx
import Link from 'next/link';

const timings = [
  {
    title: 'AS Classes',
    subtitle: 'Paper 1 and Paper 2',
    time: '6:00 PM till 7:30 PM',
    days: '3 Classes Per Week (Thursday, Friday, Saturday)',
    price: '5000 PKR per month',
    note: 'For composite you would have to Take AS and A2 session both',
    border: 'border-blue-500',
  },
  {
    title: 'A2 Classes',
    subtitle: 'Paper 3 and Paper 4',
    time: '8:00 PM till 9:30 PM',
    days: '3 Classes Per Week (Thursday, Friday, Saturday)',
    price: '5000 PKR per month',
    note: 'For composite you would have to Take AS and A2 session both',
    border: 'border-purple-500',
  },
];

export default function ClassTimings() {
  return (
    <section className="bg-[#F9FAFB] py-20 px-4 text-center">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Class Timings</h2>
        <p className="text-gray-500 mb-12">Stay updated with your scheduled class hours</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {timings.map((item, index) => (
            <div
              key={index}
              className={`rounded-xl border ${item.border} bg-white p-6 text-left shadow-sm`}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{item.subtitle}</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{item.time}</p>
              <p className="text-sm text-gray-600 mb-4">{item.days}</p>
              <hr className="my-4 border-gray-200" />
              <p className="text-sm font-semibold text-gray-900 mb-1">{item.price}</p>
              <p className="text-xs text-gray-500">{item.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <p className="text-sm text-gray-500 mb-3">Need custom timmings?</p>
          <Link
            href="#"
            className="inline-block border border-gray-300 bg-white px-5 py-2 rounded-md text-sm font-medium text-gray-800 hover:shadow"
          >
            Contact Coordinator
          </Link>
        </div>
      </div>
    </section>
  );
}
