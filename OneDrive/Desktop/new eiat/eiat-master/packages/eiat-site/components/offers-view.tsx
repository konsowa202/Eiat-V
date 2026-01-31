"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { urlFor } from "@/lib/sanityImage";
import Link from "next/link";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { useState } from "react";
import { cn } from "@/lib/utils";
import staticOffersData from "@/lib/static-offers.json";

interface Offer {
    _id: string;
    title: string;
    description?: string;
    discount?: string;
    image?: SanityImageSource | string;
    department?: string;
}

interface OffersViewProps {
    offers: Offer[];
}

const TABS = [
    { id: "all", label: "الكل" },
    { id: "dental", label: "الأسنان" },
    { id: "dermatology", label: "الجلدية" },
    { id: "laser", label: "الليزر" },
];

export default function OffersView({ offers }: OffersViewProps) {
    const [activeTab, setActiveTab] = useState("all");

    // Merge Sanity offers with static offers
    const allOffers: Offer[] = [
        ...offers,
        ...staticOffersData.map((offer: { id: string; originalName: string; image: string; category: string }) => ({
            _id: offer.id,
            title: offer.originalName.split(".")[0], // Use filename as title approximation
            description: "", // Description implicit in image
            discount: "",
            image: offer.image,
            department: offer.category
        }))
    ];

    const filteredOffers = activeTab === "all"
        ? allOffers
        : allOffers.filter(offer => offer.department === activeTab);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-12 space-y-12">

            {/* Tabs */}
            <div className="flex justify-center flex-wrap gap-4">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-6 py-3 rounded-full text-lg font-medium transition-all duration-300",
                            activeTab === tab.id
                                ? "bg-primary text-white shadow-lg scale-105"
                                : "bg-white text-gray-600 hover:bg-gray-100 hover:text-primary"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredOffers.map((offer) => (
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        key={offer._id}
                    >
                        <Card className="h-full overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-primary/10 hover:border-primary/30 group bg-white flex flex-col">
                            <div className="relative h-96 w-full bg-gray-50 overflow-hidden">
                                {offer.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={typeof offer.image === 'string' ? offer.image : urlFor(offer.image).url()}
                                        alt={offer.title}
                                        className="w-full h-full object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                        <span className="text-4xl">🎁</span>
                                    </div>
                                )}
                                {offer.discount && (
                                    <div className="absolute top-4 left-4">
                                        <Badge className="bg-red-500 hover:bg-red-600 text-white text-lg px-3 py-1 shadow-md">
                                            {offer.discount}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-gray-800 leading-tight line-clamp-2">
                                    {offer.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-gray-600 leading-relaxed line-clamp-3">
                                    {offer.description}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Link
                                    href={`/?offer=${encodeURIComponent(offer.title)}&department=${offer.department || 'dental'}#booking`}
                                    className="w-full"
                                >
                                    <Button className="w-full bg-primary hover:bg-primary/90 text-white text-lg font-bold py-6 shadow-lg active:scale-95 transition-transform duration-200">
                                        احجز العرض الآن
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}

                {filteredOffers.length === 0 && (
                    <div className="col-span-full text-center py-20">
                        <h3 className="text-2xl font-bold text-gray-400">لا توجد عروض في هذا القسم حالياً.</h3>
                    </div>
                )}
            </div>
        </div>
    );
}
