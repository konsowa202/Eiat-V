"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { urlFor } from "@/lib/sanityImage";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import staticDevices from "@/lib/static-devices.json";

interface Device {
    _id: string;
    name: string;
    category: string;
    image?: SanityImageSource;
    description?: string;
    specifications?: string[];
}

interface DevicesViewProps {
    devices: Device[];
}

export default function DevicesView({ devices }: DevicesViewProps) {
    const [activeTab, setActiveTab] = useState("all");

    const tabs = [
        { id: "all", label: "الكل" },
        { id: "dental", label: "الأجهزة السنية" },
        { id: "derma-laser", label: "الجلدية والليزر" },
    ];

    // Use passed devices. If empty, it means Sanity fetch failed or returned nothing.
    // We can keep a static fallback if desired, but for now let's rely on the seeded data.
    const allDevices = devices;

    const filteredDevices = activeTab === "all"
        ? allDevices
        : allDevices.filter((d) => d.category === activeTab);

    const getImageUrl = (image: Device['image']) => {
        if (!image) return "";
        // Handle "Legacy" string images if any static ones remain, otherwise use Sanity helper
        if (typeof image === 'string') return image;
        try {
            return urlFor(image).url();
        } catch (e) {
            console.error("Error generating image url:", e);
            return "";
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-12">
            {/* Tabs */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 border-2",
                            activeTab === tab.id
                                ? "bg-secondary text-white border-secondary shadow-lg scale-105"
                                : "bg-white text-gray-600 border-gray-200 hover:border-secondary/50 hover:text-secondary"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Devices Grid */}
            <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                <AnimatePresence mode="popLayout">
                    {filteredDevices.length > 0 ? (
                        filteredDevices.map((device) => (
                            <motion.div
                                key={device._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4 }}
                            >
                                <Card className="h-full overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                                    <div className="relative h-64 w-full bg-gray-100 overflow-hidden">
                                        {device.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={getImageUrl(device.image)}
                                                alt={device.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                لا توجد صورة
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300" />
                                    </div>

                                    <CardHeader>
                                        <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-secondary transition-colors">
                                            {device.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-600 mb-4 line-clamp-3">
                                            {device.description}
                                        </p>
                                        {device.specifications && device.specifications.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <h4 className="font-semibold text-sm text-gray-900 mb-2">المواصفات التقنية:</h4>
                                                <ul className="text-sm text-gray-500 space-y-1">
                                                    {device.specifications.slice(0, 3).map((spec, idx) => (
                                                        <li key={idx}>• {spec}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full text-center py-20 text-gray-500"
                        >
                            لا توجد أجهزة متاحة في هذا القسم حالياً.
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
