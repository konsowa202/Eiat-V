import { sanity } from "@/lib/sanity";
import DoctorsSection from "@/components/doctors-section";
import { TextAnimate } from "@/components/magicui/text-animate";

export const revalidate = 60;

async function getDoctors() {
    const query = `*[_type == "doctor"] | order(name asc) {
    _id,
    name,
    specialty,
    department,
    image,
    about,
    experience
  }`;
    return await sanity.fetch(query);
}

export default async function DoctorsPage() {
    const doctors = await getDoctors();

    return (
        <main className="min-h-screen pt-32 pb-20 bg-gray-50">
            <div className="container mx-auto px-4 text-center mb-12">
                <TextAnimate className="section-title text-primary mb-4" animation="blurInUp" once>
                    فريقنا الطبي
                </TextAnimate>
                <TextAnimate className="section-subtitle mx-auto" animation="blurInUp" delay={0.2} once>
                    نخبة من أفضل الأطباء والاستشاريين لتقديم رعاية طبية متكاملة.
                </TextAnimate>
            </div>

            {/* Reusing existing DoctorsSection or creating a similar grid view if needed. 
          For now, I'll assume DoctorsSection can accept a 'doctors' prop or I'll implement a grid here directly 
          to be safe and ensure the layout matches the new requirements. 
      */}

            <div className="container mx-auto px-4">
                {/* We can reuse the DoctorCard component logic here for a full grid page */}
                <DoctorsSection explicitDoctors={doctors} />
            </div>
        </main>
    );
}
