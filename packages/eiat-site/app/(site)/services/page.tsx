import { sanity } from "@/lib/sanity";
import ServicesView from "@/components/services-view";
import { TextAnimate } from "@/components/magicui/text-animate";

export const revalidate = 60; // Revalidate every minute

async function getServices() {
    const query = `*[_type == "plan"] | order(department asc) {
    _id,
    name,
    department,
    description,
    price,
    features,
    buttonText
  }`;
    return await sanity.fetch(query);
}

export default async function ServicesPage() {
    const services = await getServices();

    return (
        <main className="min-h-screen pt-32 pb-20 bg-gray-50">
            <div className="container mx-auto px-4 text-center mb-12">
                <TextAnimate className="section-title text-primary mb-4" animation="blurInUp" once>
                    خدماتنا الطبية
                </TextAnimate>
                <TextAnimate className="section-subtitle mx-auto" animation="blurInUp" delay={0.2} once>
                    نقدم مجموعة شاملة من الخدمات الطبية في مجالات الأسنان، الجلدية، والليزر بأعلى معايير الجودة.
                </TextAnimate>
            </div>

            <ServicesView services={services} />
        </main>
    );
}
