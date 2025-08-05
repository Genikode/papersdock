// app/components/Banner.tsx
export default function Banner({
  title,
  title2,
  description,
}: {
  title: string;
  title2: string;
  description: string;
}) {
  return (
    <section className="bg-gradient-to-r from-[#EFF6FF] from-25% to-[#E0E7FF] to-50% py-20 px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">
        {title}
        <span className="text-blue-600"> {title2}</span>
      </h1>
      <p className="max-w-3xl mx-auto text-gray-600">{description}</p>
    </section>
  );
}
