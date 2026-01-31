"use client";
import React from "react";
import { BlurFade } from "./magicui/blur-fade";
import { TextAnimate } from "./magicui/text-animate";
import Image from "next/image";
import ImageWithSkeleton from "./image-with-skeleton";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { urlFor } from "@/lib/sanityImage";
import staticDevices from "@/lib/static-devices.json";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

interface Device {
  _id: string;
  name: string;
  category: string;
  image?: SanityImageSource | string;
  description?: string;
}

interface GallerySectionProps {
  devices?: Device[];
}

const GallerySection = ({ devices = [] }: GallerySectionProps) => {
  const { sections, error } = useHomepageSections();

  // Merge Sanity devices with static devices (fallback or combined)
  // If we have Sanity devices, maybe we prioritize them, or show both?
  // The user said "remove existing... upload diverse... client can remove".
  // Best approach: If Sanity has content, show it. If not, show static as placeholder.
  // Actually, mixing is safer to ensure layout looks full initially.

  const displayDevices = devices.length > 0 ? devices : staticDevices.map(d => ({
    _id: d.id,
    name: d.name,
    category: d.category,
    image: d.image,
    description: d.description
  }));

  // Limit to 6 items for the homepage gallery
  const limitedDevices = displayDevices.slice(0, 6);

  if (error) {
    return <p className="text-red-500 text-sm">{error.message}</p>;
  }
  const section = sections?.find((s) => s.sectionCategory === "معرض الصور"); // We can keep the section name internally or change it

  return (
    <BlurFade inView>
      <section id="gallery" className="relative px-6 py-20 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col items-center mb-12 space-y-4 text-center">
            <TextAnimate className="text-primary font-bold tracking-wider text-xl" animation="blurInUp">
              تجهيزاتنا
            </TextAnimate>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              أحدث <span className="text-primary">الأجهزة والتقنيات</span>
            </h2>
            <p className="text-gray-600 max-w-2xl">
              نفخر بتجهيز عياداتنا بأحدث ما توصلت إليه التكنولوجيا الطبية لضمان أفضل النتائج وراحتكم.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {limitedDevices.map((device, idx) => (
              <BlurFade key={device._id} delay={0.1 * idx} inView>
                <Card className="group overflow-hidden border-2 border-gray-100 hover:border-primary/50 transition-all duration-300 hover:shadow-xl bg-white h-full flex flex-col">
                  <div className="relative h-64 overflow-hidden bg-gray-50">
                    {device.image ? (
                      <ImageWithSkeleton
                        src={typeof device.image === 'string' ? device.image : urlFor(device.image).url()}
                        alt={device.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        skeletonClassName="bg-gray-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                        No Image
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className={`
                                        ${device.category === 'dental' ? 'bg-blue-500' : 'bg-pink-500'}
                                        text-white shadow-md border-0
                                     `}>
                        {device.category === 'dental' ? 'أسنان' : 'جلدية وليزر'}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                        {device.name}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                        {device.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </BlurFade>
            ))}
          </div>

          {limitedDevices.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400">سيتم إضافة الأجهزة قريباً</p>
            </div>
          )}
        </div>
      </section>
    </BlurFade>
  );
};

export default GallerySection;
