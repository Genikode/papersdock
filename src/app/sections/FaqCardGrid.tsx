// app/components/FaqCardGrid.tsx

export default function FaqCardGrid() {
  const faqs = [
    {
      question: 'How do I access course materials?',
      answer:
        "Once enrolled, you'll receive login credentials to access our comprehensive learning platform with all course materials.",
    },
    {
      question: 'What if I need help outside office hours?',
      answer:
        'Our AI-powered study assistant is available 24/7, and our community forum provides peer support around the clock.',
    },
    {
      question: "Can I get a refund if I'm not satisfied?",
      answer:
        "Yes! We offer a 30-day money-back guarantee if you're not completely satisfied with our services.",
    },
    {
      question: 'Do you offer group discounts?',
      answer:
        'Absolutely! We provide special pricing for schools, study groups, and bulk enrollments. Contact us for details.',
    },
  ];

  return (
    <section className="bg-[#F3F4F6] py-16 px-4">
      <div className="max-w-5xl mx-auto text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Find answers to common questions before reaching out to us.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg p-6 shadow-sm text-left border border-gray-200"
          >
            <h4 className="text-gray-900 font-semibold text-base mb-1">
              {faq.question}
            </h4>
            <p className="text-sm text-gray-600">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
