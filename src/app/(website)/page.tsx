import Image from "next/image";
import Hero from "../sections/Hero";
import Stats from "../sections/Stats";
import WhyChoose from "../sections/WhyChoose";
import AssessmentOverview from "../sections/Assesment";
import Testimonials from "../sections/Testemoniaals";
import ClassTimings from "../sections/ClassTimings";
import FAQ from "../sections/Faq";
import StartTrial from "../sections/StartTrial";
import Contact from "../sections/ContactSection";

export default function Home() {
  return (
    <main className=" bg-gray-50">
      <Hero />
      <Stats/>
      <WhyChoose />
      <AssessmentOverview />
      <Testimonials/>
      <ClassTimings/> 
      <FAQ/>
      <StartTrial />
      <Contact />
      {/* Other sections can be added here */}
    </main>
  );
}
