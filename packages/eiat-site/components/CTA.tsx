import Image from "next/image";
import React from "react";
import { TextAnimate } from "./magicui/text-animate";

/**
 * 📣 CTA (Call to Action) Section
 * 
 * Rebranded for multi-specialty (Dental, Derma, Laser)
 */
const CTA = () => {
  return (
    <section className="px-4 relative mt-30 lg:mt-15 h-[30rem] md:h-[35rem] lg:h-[450px]">
      <div className="w-full max-w-7xl h-full mx-auto relative group">
        {/* === Background Image === */}
        <div className="absolute w-full h-full rounded-3xl overflow-hidden shadow-2xl">
          <Image
            src="/cta-new.png"
            alt="Eiat Medical Center"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent lg:from-black/70 lg:via-black/50" />
        </div>

        {/* === Text Content === */}
        <div className="relative h-full flex flex-col justify-center items-center lg:items-end px-10">
          <div className="text-center lg:text-right space-y-6 max-w-2xl">
            {/* Heading */}
            <TextAnimate
              className="font-bold leading-tight text-[clamp(2.2rem,5vw,4rem)] text-white"
              animation="blurInUp"
              by="word"
              once
            >
              جمالك وثقتك تبدأ من مجمع إيات
            </TextAnimate>

            {/* Subheading */}
            <TextAnimate
              className="font-medium leading-relaxed text-[clamp(1.1rem,2.5vw,1.6rem)] text-gray-100/90"
              animation="blurInUp"
              by="word"
              delay={0.2}
              once
            >
              احجز موعدك الآن مع نخبة من الأطباء المتخصصين في طب الأسنان، الجلدية، والليزر، واستمتع بأعلى معايير الرعاية الطبية والجمالية.
            </TextAnimate>

            {/* CTA Button */}
            <div className="pt-4">
              <a
                href="#booking"
                className="inline-block px-10 py-4 bg-primary text-white text-lg font-bold rounded-full hover:bg-primary/90 transition-all shadow-xl hover:shadow-primary/20 hover:-translate-y-1"
              >
                احجز استشارتك الآن
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
