"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Service {
    _id: string;
    name: string;
    department: string;
    description?: string;
    price?: string;
    features?: string[];
    buttonText?: string;
}

interface ServicesViewProps {
    services: Service[];
}

export default function ServicesView({ services }: ServicesViewProps) {
    const [activeTab, setActiveTab] = useState("dental");

    const tabs = [
        { id: "dental", label: "الأسنان" },
        { id: "dermatology", label: "الجلدية" },
        { id: "laser", label: "الليزر" },
    ];

    const filteredServices = services.filter((s) => s.department === activeTab);

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
                                ? "bg-primary text-white border-primary shadow-lg scale-105"
                                : "bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:text-primary"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Services Grid */}
            <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                <AnimatePresence mode="popLayout">
                    {filteredServices.length > 0 ? (
                        filteredServices.map((service) => (
                            <motion.div
                                key={service._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="h-full hover:shadow-xl transition-shadow duration-300 border-t-4 border-t-primary">
                                    <CardHeader>
                                        <CardTitle className="text-xl font-bold text-primary">
                                            {service.name}
                                        </CardTitle>
                                        {service.price && (
                                            <div className="text-secondary font-bold text-lg mt-2">
                                                {service.price}
                                            </div>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-gray-600 mb-4 text-base">
                                            {service.description}
                                        </CardDescription>
                                        {service.features && service.features.length > 0 && (
                                            <ul className="space-y-2 mt-4">
                                                {service.features.map((feature, idx) => (
                                                    <li key={idx} className="flex items-center text-sm text-gray-500">
                                                        <span className="w-2 h-2 bg-secondary rounded-full ml-2" />
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
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
                            لا توجد خدمات متاحة في هذا القسم حالياً.
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
