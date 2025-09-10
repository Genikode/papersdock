// app/sections/Stats.tsx
import { Users, BookOpen, Trophy, Clock } from 'lucide-react';

export default function Stats() {
  return (
    <section className="bg-white dark:bg-gray-900 py-20 px-4 text-center transition-colors">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Trusted by Students Worldwide
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
          Our proven track record speaks for itself. Join the thousands of students who have achieved their A-Level Computer Science goals with PapersDock.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center bg-white/60 dark:bg-white/5 p-6 rounded-xl shadow-sm ring-1 ring-inset ring-gray-100 dark:ring-white/5">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-full mb-3">
              <Users className="text-blue-600 dark:text-blue-400" size={28} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">16k +</h3>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Students Taught</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Worldwide</p>
          </div>

          <div className="flex flex-col items-center bg-white/60 dark:bg-white/5 p-6 rounded-xl shadow-sm ring-1 ring-inset ring-gray-100 dark:ring-white/5">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-full mb-3">
              <BookOpen className="text-blue-600 dark:text-blue-400" size={28} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">5+</h3>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Years of Experience</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Compiled Resources</p>
          </div>

          <div className="flex flex-col items-center bg-white/60 dark:bg-white/5 p-6 rounded-xl shadow-sm ring-1 ring-inset ring-gray-100 dark:ring-white/5">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-full mb-3">
              <Trophy className="text-blue-600 dark:text-blue-400" size={28} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">4+</h3>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Distinction</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Around the World</p>
          </div>

          <div className="flex flex-col items-center bg-white/60 dark:bg-white/5 p-6 rounded-xl shadow-sm ring-1 ring-inset ring-gray-100 dark:ring-white/5">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-full mb-3">
              <Clock className="text-blue-600 dark:text-blue-400" size={28} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Fast</h3>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Query Support</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">When you need help</p>
          </div>
        </div>
      </div>
    </section>
  );
}
