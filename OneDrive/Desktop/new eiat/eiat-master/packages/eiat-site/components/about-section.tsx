"use client";
import React from "react";
import { TextAnimate } from "./magicui/text-animate";
import { BlurFade } from "./magicui/blur-fade";
import Image from "next/image";
import ImageWithSkeleton from "./image-with-skeleton";
import { CheckCircle2 } from "lucide-react";

const qualifications = [
  "نخبة من الاستشاريين والأطباء بخبرات عالمية",
  "أحدث ما توصلت إليه التكنولوجيا في الجلدية والليزر",
  "تقنيات طب الأسنان الرقمي والزراعة الفورية",
  "رعاية متكاملة تضمن لك أعلى معايير الجودة والأمان"
];

interface AboutSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
}

const AboutSection = ({ title, subtitle, description }: AboutSectionProps) => {
  return (
    <section id="about" className="py-24 relative overflow-hidden bg-white">
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
          {/* Content Column */}
          <div className="w-full lg:w-1/2 space-y-8 text-right">
            <div className="space-y-4">
              <TextAnimate className="text-primary font-bold tracking-wider text-xl" animation="blurInUp">
                {title || "من نحن"}
              </TextAnimate>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                {subtitle || (
                  <>
                    مجمع عيادات <span className="text-primary">إيات الطبي</span> <br />
                    رعاية بمعايير عالمية
                  </>
                )}
              </h2>
            </div>

            {/* Qualifications Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {qualifications.map((q, i) => (
                <BlurFade key={i} delay={0.1 * i} inView>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-primary/30 transition-colors group">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{q}</span>
                  </div>
                </BlurFade>
              ))}
            </div>

            {/* Description Section (Placed UNDER Qualifications as requested) */}
            <div className="pt-4">
              <p className="text-lg text-gray-600 leading-relaxed font-medium">
                {description || "نحن في مجمع عيادات إيات الطبي نلتزم بتقديم أرقى مستويات الرعاية المتكاملة، حيث نجمع بين الخبرة الطبية العريقة وأحدث ما توصلت إليه التكنولوجيا في مجالات طب الأسنان، الجلدية، والتجميل، والليزر. نسعى دائماً لتوفير تجربة علاجية استثنائية ترتكز على الجودة والراحة والأمان لكل مراجع لبناء علاقة ثقة مستدامة."}
              </p>
            </div>

            <div className="pt-6">
              <a href="#booking" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20">
                احجز استشارتك الآن
              </a>
            </div>
          </div>

          {/* Image Column */}
          <BlurFade className="w-full lg:w-1/2" direction="left" inView duration={0}>
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 rounded-[2.5rem] transform -rotate-3" />
              <div className="relative h-[400px] sm:h-[500px] rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white">
                <ImageWithSkeleton
                  src="/about-new.png"
                  alt="فريق إيات الطبي"
                  fill
                  className="object-cover"
                  skeletonClassName="bg-gray-200"
                />
              </div>
              {/* Experience Badge */}
              <div className="absolute -bottom-6 -right-6 bg-secondary text-white p-6 rounded-2xl shadow-xl">
                <div className="text-4xl font-bold mb-1">15+</div>
                <div className="text-sm font-medium">عاماً من الخبرة</div>
              </div>
            </div>
          </BlurFade>
        </div>
      </div>

      {/* Background elements removed as per user request to avoid "white background text" clutter */}
    </section>
  );
};

export default AboutSection;
