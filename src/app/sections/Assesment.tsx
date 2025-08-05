// app/components/AssessmentOverview.tsx
import { BookOpenCheck, Code2, FileText, MonitorPlay } from 'lucide-react';
import Link from 'next/link';

const papers = [
  {
    title: 'Paper 1',
    subtitle: 'Theory Fundamentals',
    duration: '1 hour 30 minutes',
    marks: '75 marks',
    points: [
      'Section 1 to 8 of the syllabus content',
      'Written paper',
      '50% of the AS Level',
      '25% of the A Level',
    ],
    icon: <BookOpenCheck size={20} />,
    color: 'border-blue-200 bg-blue-50',
  },
  {
    title: 'Paper 2',
    subtitle: 'Fundamental Problem-solving & Programming Skills',
    duration: '2 hours',
    marks: '75 marks',
    points: [
      'Section 9 to 12 of the syllabus content',
      'Written paper',
      '50% of the AS Level',
      '25% of the A Level',
    ],
    icon: <MonitorPlay size={20} />,
    color: 'border-purple-200 bg-purple-50',
  },
  {
    title: 'Paper 3',
    subtitle: 'Advanced Theory',
    duration: '1 hour 30 minutes',
    marks: '75 marks',
    points: [
      'Section 13 to 20 of the syllabus content',
      'Written paper',
      'Externally assessed.',
      '25% of the AS Level',
    ],
    icon: <Code2 size={20} />,
    color: 'border-green-200 bg-green-50',
  },
  {
    title: 'Paper 4',
    subtitle: 'Practical',
    duration: '2 hour 30 minutes',
    marks: '75 marks',
    points: [
      'Sections 19–20 of the syllabus content',
      'Submit code and testing evidence.',
      'Use Java, Visual Basic®, or Python.',
      'No internet/email, all on computer.',
    ],
    icon: <FileText size={20} />,
    color: 'border-yellow-200 bg-yellow-50',
  },
];

export default function AssessmentOverview() {
  return (
    <section className="bg-[#F9FAFB] py-20 px-4">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Assessment Overview</h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Our comprehensive learning resources are designed to help you master every aspect of A-Level Computer Science,
          from basic concepts to advanced programming.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-16">
        {papers.map((paper, index) => (
          <div
            key={index}
            className={`rounded-xl border ${paper.color} p-6 text-left`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-900 font-semibold">
                {paper.icon}
                <span>{paper.title}</span>
              </div>
              <div className="text-sm text-gray-700 text-right">
                <p>{paper.duration}</p>
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 text-sm mb-1">{paper.subtitle}</h3>
            <p className="text-xs text-gray-500 mb-2">{paper.marks}</p>

            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              {paper.points.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-[5px] h-[6px] w-[6px] rounded-full bg-gray-400 inline-block"></span>
                  {point}
                </li>
              ))}
            </ul>

            <button className="mt-auto bg-gray-900 text-white px-4 py-2 rounded-md text-sm w-full">
              View Details
            </button>
          </div>
        ))}
      </div>

      <div className="text-center">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-xl px-8 py-10 max-w-xl mx-auto">
          <h3 className="text-xl font-semibold mb-2">Ready to Start Your Journey?</h3>
          <p className="text-sm mb-4">Get full access to all modules, exercises, and expert support</p>
          <Link
            href="#"
            className="inline-block bg-white text-blue-600 font-semibold px-6 py-2 rounded-md text-sm"
          >
            Registration Form
          </Link>
        </div>
      </div>
    </section>
  );
}