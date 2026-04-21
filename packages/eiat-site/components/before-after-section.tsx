"use client";

import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextAnimate } from "./magicui/text-animate";
import { cn } from "@/lib/utils";
import { isSanityImageSource, urlFor } from "@/lib/sanityImage";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

const TABS = [
  { id: "all", label: "الكل" },
  { id: "dental", label: "الأسنان" },
  { id: "skin", label: "البشرة" },
  { id: "laser", label: "الليزر" },
  { id: "cosmetics", label: "التجميل" },
];

interface Case {
  _id: string;
  title: string;
  category: string;
  /** صورة واحدة: قبل وبعد في نفس التصميم (مُفضّل من التصميم) */
  caseImage?: SanityImageSource | null;
  beforeImage: SanityImageSource | null;
  afterImage: SanityImageSource | null;
  description?: string;
  treatmentDuration?: string;
}

type CaseWithImages = Case & (
  | { caseImage: SanityImageSource; beforeImage?: null; afterImage?: null }
  | { beforeImage: SanityImageSource; afterImage: SanityImageSource }
);

function caseHasDisplayableImages(c: Case): c is CaseWithImages {
  if (isSanityImageSource(c.caseImage)) return true;
  return isSanityImageSource(c.beforeImage) && isSanityImageSource(c.afterImage);
}

export default function BeforeAfterSection({ cases = [] }: { cases?: Case[] }) {
  const [activeTab, setActiveTab] = useState("all");

  const casesWithImages = (cases ?? []).filter(caseHasDisplayableImages);

  // If no cases with both images exist, don't show the section
  if (casesWithImages.length === 0) {
    return null;
  }

  const filteredCases =
    activeTab === "all"
      ? casesWithImages
      : casesWithImages.filter((item) => item.category === activeTab);

  return (
    <section className="py-20 bg-white overflow-hidden" id="before-after">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-12 space-y-4 text-center">
          <TextAnimate
            className="text-primary font-bold tracking-wider text-xl"
            animation="blurInUp"
          >
            نتائج نعتز بها
          </TextAnimate>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            حالات <span className="text-primary">قبل وبعد</span>
          </h2>
          <p className="text-gray-600 max-w-2xl">
            شاهد نتائج التحول لمرضانا بفضل الله ثم بفضل أحدث التقنيات وأمهر
            الأطباء في عيادة إيات.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center flex-wrap gap-4 mb-10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-6 py-2 rounded-full text-lg font-medium transition-all duration-300 border",
                activeTab === tab.id
                  ? "bg-primary text-white border-primary shadow-lg scale-105"
                  : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Carousel */}
        <div className="relative max-w-7xl mx-auto">
          {filteredCases.length > 0 ? (
            <Swiper
              key={activeTab}
              modules={[Autoplay, Navigation]}
              spaceBetween={24}
              slidesPerView={1}
              navigation={{ nextEl: ".ba-next", prevEl: ".ba-prev" }}
              autoplay={{ delay: 4000, disableOnInteraction: true }}
              loop={filteredCases.length > 1}
              speed={800}
              breakpoints={{
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="!pb-12 !px-2"
            >
              {filteredCases.map((item) => (
                <SwiperSlide key={item._id}>
                  <Card className="h-full overflow-hidden border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-bold text-center text-gray-800">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col gap-4">
                      {isSanityImageSource(item.caseImage) ? (
                        <div className="relative w-full overflow-hidden rounded-xl bg-gray-50 group">
                          <img
                            src={urlFor(item.caseImage).width(1400).url()}
                            alt={item.title ? `قبل وبعد — ${item.title}` : "قبل وبعد"}
                            className="w-full h-auto object-contain object-center transition-transform duration-500 group-hover:scale-[1.02]"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 aspect-square relative">
                          <div className="relative overflow-hidden rounded-lg group">
                            <img
                              src={urlFor(item.beforeImage).width(600).height(600).url()}
                              alt="قبل"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md font-bold">
                              قبل
                            </div>
                          </div>
                          <div className="relative overflow-hidden rounded-lg group">
                            <img
                              src={urlFor(item.afterImage).width(600).height(600).url()}
                              alt="بعد"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-md font-bold">
                              بعد
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {item.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 text-center mt-2">
                          {item.description}
                        </p>
                      )}
                      
                      {item.treatmentDuration && (
                        <div className="flex justify-center mt-auto">
                          <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                            مدة العلاج: {item.treatmentDuration}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-2xl">
              <h3 className="text-2xl font-bold text-gray-400">
                لا توجد حالات معروضة في هذا القسم حالياً.
              </h3>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <button className="ba-next w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm">
              <span className="text-2xl">→</span>
            </button>
            <button className="ba-prev w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm">
              <span className="text-2xl">←</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
