"use client";

import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { TextAnimate } from "./magicui/text-animate";
import { cn } from "@/lib/utils";
import { urlFor } from "@/lib/sanityImage";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
// import staticOffersData from "@/lib/static-offers.json"; // Deprecated

const TABS = [
    { id: "all", label: "الكل" },
    { id: "dental", label: "الأسنان" },
    { id: "dermatology", label: "الجلدية" },
    { id: "laser", label: "الليزر" },
];

interface Offer {
    _id: string;
    title: string;
    description?: string;
    department?: string;
    category?: string;
    image?: SanityImageSource | string;
    discount?: string;
}

export default function FeaturedOffersSection({ offers = [] }: { offers?: Offer[] }) {
    const [activeTab, setActiveTab] = useState("all");

    // Use passed offers or empty array. Static fallback removed to encourage Sanity usage,
    // or keep as fallback if prefered, but we want to confirm seeding worked.
    const allOffers = offers;

    const filteredOffers = activeTab === "all"
        ? allOffers
        : allOffers.filter(offer => offer.department === activeTab || offer.category === activeTab); // Handle both naming conventions

    return (
        <section className="py-20 bg-gray-50 overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center mb-12 space-y-4 text-center">
                    <TextAnimate className="text-primary font-bold tracking-wider text-xl" animation="blurInUp">
                        عروضنا المميزة
                    </TextAnimate>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                        أقوى العروض <span className="text-primary">لهذا الشهر</span>
                    </h2>
                    <p className="text-gray-600 max-w-2xl">
                        اخترنا لكم أفضل الباقات العلاجية والتجميلية بأسعار تنافسية وجودة لا تضاهى.
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
                    {filteredOffers.length > 0 ? (
                        <Swiper
                            key={activeTab}
                            modules={[Autoplay, Navigation]}
                            spaceBetween={24}
                            slidesPerView={1}
                            navigation={{ nextEl: ".offers-next", prevEl: ".offers-prev" }}
                            autoplay={{ delay: 3000, disableOnInteraction: true }}
                            loop={true}
                            speed={800}
                            breakpoints={{
                                640: { slidesPerView: 2 },
                                1024: { slidesPerView: 3 },
                            }}
                            className="!pb-12 !px-2"
                        >
                            {filteredOffers.map((offer) => (
                                <SwiperSlide key={offer._id}>
                                    <div className="h-full pt-2 pb-6 px-2"> {/* Padding for hover effect */}
                                        <Card className="h-full overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary/30 group bg-white flex flex-col">
                                            {/* Increased height heavily for clear ad visibility */}
                                            <div className="relative h-[28rem] sm:h-[32rem] w-full bg-gray-50 overflow-hidden">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={typeof offer.image === 'string' ? offer.image : (offer.image ? urlFor(offer.image).url() : '')} // Handle Sanity Image or fallback string
                                                    alt={offer.title}
                                                    className="w-full h-full object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute top-4 left-4">
                                                    <Badge className="bg-red-500 text-white text-md px-3 py-1 shadow-md">
                                                        عرض خاص
                                                    </Badge>
                                                </div>
                                            </div>
                                            <CardHeader>
                                                <CardTitle className="text-lg font-bold text-gray-800 leading-tight line-clamp-2">
                                                    {offer.title}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardFooter className="mt-auto">
                                                <Link href={`/?offer=${encodeURIComponent(offer.title)}&department=${offer.department || 'dental'}#booking`} className="w-full">
                                                    <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold">
                                                        احجز الآن
                                                    </Button>
                                                </Link>
                                            </CardFooter>
                                        </Card>
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    ) : (
                        <div className="text-center py-20">
                            <h3 className="text-2xl font-bold text-gray-400">لا توجد عروض في هذا القسم حالياً.</h3>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-center gap-4 mt-6">
                        <button className="offers-next w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm">
                            <span className="text-2xl">→</span>
                        </button>
                        <button className="offers-prev w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm">
                            <span className="text-2xl">←</span>
                        </button>
                    </div>
                </div>

                <div className="flex justify-center mt-12">
                    <Link href="/offers">
                        <Button variant="outline" className="px-8 py-6 text-lg border-primary text-primary hover:bg-primary hover:text-white transition-all">
                            عرض جميع العروض
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
