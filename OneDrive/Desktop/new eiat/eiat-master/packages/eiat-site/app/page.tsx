import CTA from "@/components/CTA";
import MedicalDepartments from "@/components/services";
import DoctorsSection from "@/components/doctors-section";
import BookingSection from "@/components/booking-section";
import ContactBanner from "@/components/contact-banner";
import { BlurFade } from "@/components/magicui/blur-fade";
import { TextAnimate } from "@/components/magicui/text-animate";
import FeaturedSuccessStories from "@/components/featured-stories-section";
import GallerySection from "@/components/gallery-section";
import AboutSection from "@/components/about-section";
import FeaturedOffersSection from "@/components/featured-offers-section";
import HeroImage from "@/components/hero-image";
import HashScrollHandler from "@/components/hash-scroll-handler";
import Link from "next/link";
import { sanity } from "@/lib/sanity";

// Force this page to be dynamic so it always fetches fresh data from Sanity
export const dynamic = "force-dynamic";

async function getDevices() {
  const query = `*[_type == "device"] | order(_createdAt desc) [0..5] {
    _id,
    name,
    category,
    image,
    description
  }`;
  return await sanity.fetch(query);
}

async function getOffers() {
  const query = `*[_type == "offer" && active == true] | order(_createdAt desc) [0..9] {
    _id,
    title,
    description,
    department,
    discount,
    image
  }`;
  return await sanity.fetch(query);
}

async function getTestimonials() {
  const query = `*[_type == "testimonial"] {
    _id,
    name,
    age,
    treatment,
    rating,
    date,
    location,
    image,
    quote,
    beforeImage,
    afterImage,
    featured,
  }`;
  return await sanity.fetch(query);
}

async function getDoctors() {
  // Fetch full doctor objects for the section and booking
  const query = `*[_type == "doctor"]{
    _id,
    name,
    image,
    department,
    about,
    category
  }`;
  return await sanity.fetch(query);
}

async function getAbout() {
  const query = `*[_type == "homepage" && sectionCategory == "نبذة عنا"][0]{
    sectionTitle,
    sectionSubtitle,
    sectionDesc
  }`;
  return await sanity.fetch(query);
}

export default async function Home() {
  const devices = await getDevices();
  const offers = await getOffers();
  const testimonials = await getTestimonials();
  const doctors = await getDoctors();
  const aboutData = await getAbout();
  return (
    <main className="min-h-[100dvh] flex flex-col space-y-20 lg:space-y-40 overflow-clip relative">
      <HashScrollHandler />
      {/* Hero Section */}
      {/* Hero Section */}
      <section id="hero" className="relative flex flex-col items-center px-6 min-h-[90vh] justify-center bg-gradient-to-b from-[#f8fcfd] to-white overflow-hidden">
        {/* Abstract Medical Gradient Background */}
        <div className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#CAA966]/20 rounded-full blur-3xl mix-blend-multiply filter" />
          <div className="absolute top-40 -left-40 w-[600px] h-[600px] bg-[#6DB6AF]/20 rounded-full blur-3xl mix-blend-multiply filter" />
        </div>

        <div className="w-full max-w-7xl mx-auto pt-32 pb-20 lg:py-32 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="w-full lg:w-1/2 space-y-8 text-center lg:text-right">
              <div className="space-y-4">
                <TextAnimate
                  className="text-4xl lg:text-7xl font-bold text-gray-900 leading-tight"
                  animation="blurInUp"
                  by="word"
                  once
                >
                  مجمع عيادات إيات الطبي
                </TextAnimate>
                <TextAnimate
                  className="text-xl lg:text-2xl text-gray-600 leading-relaxed font-medium"
                  animation="blurInUp"
                  by="word"
                  delay={0.2}
                  once
                >
                  رعاية متكاملة لابتسامتك وجمالك.. بأحدث تقنيات طب الأسنان، الجلدية، والليزر
                </TextAnimate>
              </div>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <a href="#booking" className="px-8 py-4 bg-primary text-white text-lg font-bold rounded-full hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                  احجز موعدك الآن
                </a>
                <Link href="/offers" className="px-8 py-4 bg-white text-gray-800 border-2 border-gray-100 text-lg font-bold rounded-full hover:border-primary/50 hover:text-primary transition-all shadow-sm hover:shadow-md">
                  اكتشف عروضنا
                </Link>
              </div>
            </div>

            <div className="w-full lg:w-1/2 relative lg:h-[650px] flex justify-center items-center">
              <HeroImage />
            </div>
          </div>
        </div>

        {/* Floating Metrics or Contact Banner */}
        <div className="w-full relative mt-12 lg:absolute lg:bottom-0 lg:mt-0">
          <ContactBanner />
        </div>
      </section>

      {/* Featured Offers */}
      <BlurFade>
        <FeaturedOffersSection offers={offers} />
      </BlurFade>

      {/* About Section */}
      <AboutSection
        title={aboutData?.sectionTitle}
        subtitle={aboutData?.sectionSubtitle}
        description={aboutData?.sectionDesc}
      />

      {/* Dental Services */}
      <BlurFade>
        <MedicalDepartments />
      </BlurFade>



      {/* Call To Action */}
      <BlurFade>
        <CTA />
      </BlurFade>

      {/* Gallery Section - Now Featured Devices */}
      <GallerySection devices={devices} />

      {/* Testimonials */}
      <FeaturedSuccessStories testimonials={testimonials} />

      {/* Doctors */}
      <DoctorsSection explicitDoctors={doctors} />

      {/* Booking */}
      <BookingSection doctors={doctors} />
    </main>
  );
}
