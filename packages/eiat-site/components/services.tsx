"use client";


import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import {
  Smile,
  Sparkles,
  Zap,
  ArrowRight
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TextAnimate } from "./magicui/text-animate";
import Link from "next/link";
import { Button } from "./ui/button";

export default function MedicalDepartments() {
  const departments = [
    {
      icon: <Smile className="w-12 h-12" />,
      title: "طب الأسنان",
      description: "رعاية متكاملة لابتسامتك تشمل الزراعة، التقويم، والتجميل بأحدث التقنيات.",
      color: "bg-blue-100 text-blue-600",
      link: "/services?tab=dental"
    },
    {
      icon: <Sparkles className="w-12 h-12" />,
      title: "الجلدية والتجميل",
      description: "استعيدي نضارة بشرتك وجمالك مع نخبة من أطباء الجلدية والتجميل.",
      color: "bg-purple-100 text-purple-600",
      link: "/services?tab=dermatology"
    },
    {
      icon: <Zap className="w-12 h-12" />,
      title: "الليزر",
      description: "أحدث أجهزة الليزر لإزالة الشعر وعلاج مشاكل البشرة بفعالية وأمان.",
      color: "bg-teal-100 text-teal-600",
      link: "/services?tab=laser"
    }
  ];



  return (
    <section id="departments" className="px-4 py-20 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <TextAnimate className="text-4xl font-bold text-gray-900" animation="blurInUp" once>
            أقسامنا الطبية
          </TextAnimate>
          <TextAnimate className="text-xl text-gray-500 max-w-2xl mx-auto" animation="blurInUp" delay={0.1} once>
            نقدم رعاية صحية شاملة في تخصصات متعددة لضمان صحتك وجمالك
          </TextAnimate>
        </div>

        {/* Desktop View */}
        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {departments.map((dept, index) => (
            <Link href={dept.link} key={index} className="block h-full">
              <Card className="group h-full relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white">
                {/* Gradient Decoration */}
                <div className={`absolute top-0 w-full h-2 bg-gradient-to-r ${index === 0 ? 'from-blue-400 to-blue-600' : index === 1 ? 'from-purple-400 to-purple-600' : 'from-teal-400 to-teal-600'}`} />

                <CardHeader className="text-center pb-2 pt-10 relative z-10">
                  <div className={`w-24 h-24 rounded-full ${dept.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-md`}>
                    {dept.icon}
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {dept.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="text-center pb-10 px-6">
                  <CardDescription className="text-gray-600 text-lg leading-relaxed mb-6">
                    {dept.description}
                  </CardDescription>
                  <Button variant="ghost" className="group-hover:text-primary group-hover:bg-primary/5 transition-colors">
                    اكتشف المزيد <ArrowRight className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={20}
            slidesPerView={1.1} // Show snippet of next slide
            centeredSlides={true}
            loop={true}
            autoplay={{ delay: 3000 }}
            className="pb-10 !overflow-visible"
          >
            {departments.map((dept, index) => (
              <SwiperSlide key={index}>
                <Link href={dept.link} className="block h-full">
                  <Card className="h-full border-0 shadow-lg bg-white overflow-hidden">
                    <div className={`absolute top-0 w-full h-2 bg-gradient-to-r ${index === 0 ? 'from-blue-400 to-blue-600' : index === 1 ? 'from-purple-400 to-purple-600' : 'from-teal-400 to-teal-600'}`} />
                    <CardHeader className="text-center pt-8">
                      <div className={`w-20 h-20 rounded-full ${dept.color} flex items-center justify-center mx-auto mb-4`}>
                        {dept.icon}
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        {dept.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center pb-8">
                      <CardDescription className="text-gray-600">
                        {dept.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
