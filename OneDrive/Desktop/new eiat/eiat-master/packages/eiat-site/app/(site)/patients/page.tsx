
import { sanity } from "@/lib/sanity";
import TestimonialsView from "./testimonials-view";

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

export default async function PatientTestimonials() {
  const testimonials = await getTestimonials();

  return <TestimonialsView testimonials={testimonials} />;
}
