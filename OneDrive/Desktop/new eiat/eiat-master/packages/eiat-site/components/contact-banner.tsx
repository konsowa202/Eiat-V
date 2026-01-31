"use client";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";
import { TextAnimate } from "./magicui/text-animate";
import { Skeleton } from "./ui/skeleton";
import Link from "next/link";
import { useClinicInfo } from "@/hooks/useClinicInfo";

/**
 * A responsive banner section displaying:
 * - Contact phone number
 * - Location address
 * - CTA button for booking
 *
 * Uses animated text (TextAnimate) and Lucide icons.
 * Designed for RTL Arabic layout.
 */
const ContactBanner = () => {
  const { clinicInfo, error, isLoading } = useClinicInfo();
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (isLoading) {
    return (
      <div className="w-full max-w-7xl bg-gray-50 py-10 px-6 sm:px-10 md:px-14 rounded-xl direction-rtl text-right">
        <div className="w-full mx-auto flex flex-col md:flex-row lg:items-center justify-between gap-8">
          {/* Hotline skeleton */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Location skeleton */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div>
              <Skeleton className="h-5 w-20 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>

          {/* CTA Button skeleton */}
          <div className="w-full md:w-auto">
            <Skeleton className="h-12 w-32 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl bg-gray-50 py-10 px-6 sm:px-10 md:px-14 rounded-xl direction-rtl text-right">
      <div className="w-full mx-auto flex flex-col md:flex-row lg:items-center justify-between gap-8">
        {/* ========= Hotline Info ========= */}
        <Link href={"/contact"}>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Phone icon circle */}
            <div className="w-12 h-12 bg-foreground rounded-full flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6 text-white" />
            </div>
            {/* Phone label & number */}
            <div>
              <TextAnimate
                className="font-semibold text-gray-900"
                animation="blurInUp"
                by="word"
                once
              >
                اتصل بنا الآن
              </TextAnimate>

              <div className="flex flex-col">
                {clinicInfo?.phones.map((phone, i) => (
                  <TextAnimate
                    className="text-gray-500"
                    animation="blurInUp"
                    by="word"
                    once
                    key={i}
                  >
                    {phone.phoneNumber}
                  </TextAnimate>
                ))}
              </div>
            </div>
          </div>
        </Link>

        {/* ========= Location Info ========= */}
        <Link href={"/contact"}>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Map icon circle */}
            <div className="w-12 h-12 bg-foreground rounded-full flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            {/* Location label & address */}
            <div>
              <TextAnimate
                className="font-semibold text-gray-900"
                animation="blurInUp"
                by="word"
                once
              >
                العنوان
              </TextAnimate>

              {clinicInfo?.address && (
                <TextAnimate
                  className="text-gray-500"
                  animation="blurInUp"
                  by="word"
                  once
                >
                  {clinicInfo.address}
                </TextAnimate>
              )}
            </div>
          </div>
        </Link>

        {/* ========= CTA Button ========= */}
        <div className="w-full md:w-auto">
          <Link href={"/#booking"}>
            <Button className="w-full md:w-auto bg-foreground hover:bg-foreground/70 text-white px-6 py-3 rounded-full flex items-center justify-center gap-2 cursor-pointer">
              احجز الآن
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ContactBanner;
