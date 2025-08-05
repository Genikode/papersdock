export default function AiLogicChecker() {
  return (
    <section className="bg-gradient-to-r from-[#1D2B64] to-[#4B1D60] text-white py-20 px-4 text-center relative overflow-hidden">
      <div className="max-w-2xl mx-auto">
        <div className="inline-block bg-white/10 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          🌐 AI-Powered Learning
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Meet Your AI Logic <span className="text-yellow-400">Checker</span>
        </h2>
        <p className="text-sm sm:text-base leading-relaxed text-gray-300 max-w-xl mx-auto mb-8">
          a smart tool designed to support your code evaluations.<br/>
          It helps enhance your problem-solving skills by identifying logical errors instantly.
          Improve accuracy, learn faster, and build smarter with AI-driven feedback.
        </p>

        <button className="bg-gradient-to-r from-orange-400 to-orange-600 text-white px-6 py-2.5 rounded-md font-semibold text-sm inline-flex items-center gap-2">
          ⚡ Coming Soon
        </button>

        <p className="text-[13px] text-gray-400 mt-6">
          ✨ No credit card required • 🚀 Instant setup • 🧩 Tailored for A-Level syllabus
        </p>
      </div>

      {/* Background circles */}
      <div className="absolute left-10 top-10 w-10 h-10 rounded-full bg-white/20"></div>
      <div className="absolute bottom-6 left-1/4 w-2 h-2 rounded-full bg-white/30"></div>
      <div className="absolute right-10 bottom-10 w-14 h-14 rounded-full bg-white/20"></div>
    </section>
  );
}
