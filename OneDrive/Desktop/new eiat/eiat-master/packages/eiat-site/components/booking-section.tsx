"use client";

import React, { useEffect, useState } from "react";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Element } from "react-scroll";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Calendar } from "lucide-react";
import { BlurFade } from "./magicui/blur-fade";
import { TextAnimate } from "./magicui/text-animate";
import Image from "next/image";
import { toast } from "sonner";
import { useHomepageSections } from "@/hooks/useHomepageSections";

// ==============================
// Form Schema Definition (Zod)
// ==============================

const BookingSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب").trim(),
  phone: z.string().min(10, "رقم الهاتف غير صالح").trim(),
  email: z.string().email("البريد الإلكتروني غير صالح").trim(),
  date: z.string().min(1, "يرجى اختيار التاريخ"),
  department: z.string().min(1, "يرجى اختيار العيادة"),
  doctor: z.string().optional(),
  reason: z.enum(["routine-checkup", "new-patient", "specific-concern"]),
  offer: z.string().optional(),
});

type BookingData = z.infer<typeof BookingSchema>;

// ==============================
// Doctor Interface
// ==============================

interface Doctor {
  name: string;
  department?: string; // Add department to doctor interface
}

const DEPARTMENTS = [
  { id: "dental", label: "عيادة الأسنان" },
  { id: "dermatology", label: "عيادة الجلدية" },
  { id: "laser", label: "عيادة الليزر" },
];

// ==============================
// Booking Section Component
// ==============================

interface BookingSectionProps {
  doctors?: Doctor[];
}

const BookingSection = ({ doctors = [] }: BookingSectionProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BookingData>({
    resolver: zodResolver(BookingSchema),
  });

  // setDoctors is no longer needed as we use props
  // We keep filteredDoctors state
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);

  // Initialize doctors list if needed, but since it's passed as prop, we can just use it directly
  // However, we need to handle the filtering logic.

  // Read URL params
  const searchParams = useSearchParams();
  const paramDoctor = searchParams.get("doctor");
  const paramDepartment = searchParams.get("department"); // dental, dermatology, laser
  const paramOffer = searchParams.get("offer");

  // No fetchDoctors useEffect anymore


  // Handle URL Params & Initial State
  useEffect(() => {
    if (paramDepartment) {
      setValue("department", paramDepartment);
    }
    if (paramDoctor) {
      // If a doctor is passed, we try to find their department first if not passed
      if (!paramDepartment && doctors.length > 0) {
        const doc = doctors.find(d => d.name === paramDoctor);
        if (doc && doc.department) {
          setValue("department", doc.department);
        }
      }
      setValue("doctor", `dr-${paramDoctor}`);
    }
    if (paramOffer) {
      setValue("offer", paramOffer);
    }
    
    // Scroll to booking section if URL has booking params
    if (paramDoctor || paramOffer || paramDepartment) {
      // Wait for form to be ready, then scroll
      setTimeout(() => {
        const bookingElement = document.getElementById("booking");
        if (bookingElement) {
          const elementPosition = bookingElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - 100;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      }, 300);
    }
  }, [paramDepartment, paramDoctor, paramOffer, setValue, doctors]);


  const { sections, error } = useHomepageSections();

  // Filter doctors when department changes
  const selectedDepartment = useWatch({ control, name: "department" });
  const selectedDoctor = useWatch({ control, name: "doctor" });
  
  useEffect(() => {
    if (selectedDepartment) {
      setFilteredDoctors(doctors.filter(d => (d.department || 'dental') === selectedDepartment));
    } else {
      setFilteredDoctors(doctors);
    }
  }, [selectedDepartment, doctors]);

  // Handle form submission
  const onSubmit = async (data: BookingData) => {
    try {
      // Transform BookingData to match /api/send-email expectations
      const payload = {
        name: data.name,
        email: data.email,
        message: `Booking Details:
          Name: ${data.name}
          Phone: ${data.phone}
          Email: ${data.email}
          Date: ${data.date}
          Department: ${data.department}
          Doctor: ${data.doctor || "Any"}
          Reason: ${data.reason === "routine-checkup"
            ? "فحص دوري"
            : data.reason === "new-patient"
              ? "زيارة أولى"
              : "حالة طبية خاصة"
          }
          Offer (if any): ${data.offer || "None"}`,
      };

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "حدث خطأ أثناء إرسال البيانات");
      }

      toast.success("تم حجز الموعد بنجاح!", {
        duration: 180000,
        closeButton: true,
      });
      reset();
      
      // Navigate to booking section after successful booking
      // First ensure we're on the homepage
      if (window.location.pathname !== '/') {
        window.location.href = '/#booking';
        return;
      }
      
      // If already on homepage, scroll to booking section
      // Use multiple methods to ensure it works
      const scrollToBooking = () => {
        // Method 1: Use hash navigation
        window.location.hash = 'booking';
        
        // Method 2: Direct scroll after a short delay
        setTimeout(() => {
          const bookingElement = document.getElementById("booking");
          if (bookingElement) {
            // Scroll to element with offset for better visibility
            const elementPosition = bookingElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - 100; // 100px offset
            
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
          } else {
            // Fallback: scroll to top if element not found
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }, 100);
      };
      
      // Execute scroll
      scrollToBooking();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "فشل في إرسال النموذج. حاول مرة أخرى."
      );
    }
  };
  if (error) {
    return <p className="text-red-500 text-sm">{error.message}</p>;
  }
  const section = sections?.find((s) => s.sectionCategory === "الحجز");

  return (
    <BlurFade inView>
      <Element name="booking">
        <section id="booking" className="px-6 flex justify-center">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-col-reverse lg:flex-row gap-10 items-center justify-between">
              {/* ==============================
                  Booking Form
              ============================== */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="w-full lg:w-2/3 space-y-10"
              >
                {/* Heading */}
                <div>
                  {section?.sectionTitle && (
                    <TextAnimate
                      className="text-[clamp(1.25rem,3vw,2rem)] font-bold text-gray-500"
                      animation="slideLeft"
                      by="word"
                      once
                    >
                      {section.sectionTitle}
                    </TextAnimate>
                  )}

                  {section?.sectionSubtitle && (
                    <TextAnimate
                      className="text-[clamp(2rem,6vw,3.5rem)] font-bold"
                      animation="slideLeft"
                      by="word"
                      once
                    >
                      {section.sectionSubtitle}
                    </TextAnimate>
                  )}

                  {section?.sectionDesc && (
                    <TextAnimate
                      className="section-desc"
                      animation="slideLeft"
                      by="word"
                      once
                    >
                      {section.sectionDesc}
                    </TextAnimate>
                  )}
                </div>

                {/* Context Banner */}
                {paramOffer && (
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <div className="bg-primary text-white p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm text-primary font-bold">أنت تحجز عرض:</p>
                      <p className="text-gray-700 font-medium">{paramOffer}</p>
                    </div>
                    <input type="hidden" {...register("offer")} />
                  </div>
                )}


                {/* Full Name + Phone + Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700 font-semibold">الاسم الكامل</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      className="bg-gray-50 border-gray-200 focus:bg-white focus:border-primary/50 transition-all h-12 rounded-xl"
                      placeholder="الاسم الثلاثي"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700 font-semibold">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      {...register("phone")}
                      className="bg-gray-50 border-gray-200 focus:bg-white focus:border-primary/50 transition-all h-12 rounded-xl text-right"
                      placeholder="05xxxxxxxx"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email" className="text-gray-700 font-semibold">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      className="bg-gray-50 border-gray-200 focus:bg-white focus:border-primary/50 transition-all h-12 rounded-xl"
                      placeholder="example@mail.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Department + Doctor + Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Department */}
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-gray-700 font-semibold">العيادة / القسم</Label>
                    <Select onValueChange={(val) => {
                      setValue("department", val);
                      setValue("doctor", ""); // Reset doctor when department changes
                    }} value={selectedDepartment}>
                      <SelectTrigger className="bg-gray-50 border-gray-200 h-12 rounded-xl text-right">
                        <SelectValue placeholder="اختار العيادة" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.department && (
                      <p className="text-red-500 text-sm">
                        {errors.department.message}
                      </p>
                    )}
                  </div>

                  {/* Date Picker */}
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-gray-700 font-semibold">التاريخ المفضل</Label>
                    <div className="relative">
                      <Input
                        type="date"
                        id="date"
                        {...register("date")}
                        className="pl-10 bg-gray-50 border-gray-200 h-12 rounded-xl"
                      />
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    {errors.date && (
                      <p className="text-red-500 text-sm">
                        {errors.date.message}
                      </p>
                    )}
                  </div>

                  {/* Doctor Dropdown */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="doctor" className="text-gray-700 font-semibold">الطبيب المعالج (اختياري)</Label>
                    <Select onValueChange={(val) => setValue("doctor", val)} value={selectedDoctor}>
                      <SelectTrigger className="bg-gray-50 border-gray-200 h-12 rounded-xl text-right">
                        <SelectValue placeholder="اختر الطبيب المناسب" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.length === 0 ? (
                          <div className="px-3 py-2 text-gray-500 text-right">
                            جاري التحميل...
                          </div>
                        ) : filteredDoctors.length === 0 ? (
                          <div className="px-3 py-2 text-gray-500 text-right">
                            {selectedDepartment ? "لا يوجد أطباء في هذا القسم حالياً" : "يرجى اختيار العيادة أولاً"}
                          </div>
                        ) : (
                          filteredDoctors.map((doctor, i) => (
                            <SelectItem key={i} value={`dr-${doctor.name}`} className="text-right">
                              د. {doctor.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.doctor && (
                      <p className="text-red-500 text-sm">
                        {errors.doctor.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Reason for Visit */}
                <div className="space-y-3 ">
                  <Label>سبب الزيارة</Label>
                  <RadioGroup
                    className=" flex flex-col items-end"
                    onValueChange={(val) =>
                      setValue("reason", val as BookingData["reason"])
                    }
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="routine-checkup"
                        id="routine-checkup"
                      />
                      <Label htmlFor="routine-checkup">فحص دوري</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="new-patient" id="new-patient" />
                      <Label htmlFor="new-patient">زيارة أولى</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="specific-concern"
                        id="specific-concern"
                      />
                      <Label htmlFor="specific-concern">حالة طبية خاصة</Label>
                    </div>
                  </RadioGroup>
                  {errors.reason && (
                    <p className="text-red-500 text-sm">
                      {errors.reason.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 bg-gradient-to-r from-[#307BC4] to-[#396A90] text-white rounded-lg font-medium"
                  >
                    {isSubmitting ? "جاري الحجز..." : "تأكيد الحجز"}
                  </Button>
                </div>
              </form>

              {/* ==============================
                  Image (right side)
              ============================== */}
              <div className="rounded-2xl overflow-hidden h-full w-full lg:max-w-lg shadow-md hidden lg:block">
                <Image
                  src="/clinic-1.webp"
                  width={800}
                  height={800}
                  alt="صورة توضيحية"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </Element>
    </BlurFade>
  );
};

export default BookingSection;
