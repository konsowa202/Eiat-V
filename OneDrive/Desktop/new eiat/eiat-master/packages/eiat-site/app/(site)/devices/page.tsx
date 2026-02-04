import { sanity } from "@/lib/sanity";
import DevicesView from "@/components/devices-view";
import { TextAnimate } from "@/components/magicui/text-animate";

export const revalidate = 60;

async function getDevices() {
    const query = `*[_type == "device"] | order(name asc) {
    _id,
    name,
    category,
    image,
    description,
    specifications
  }`;
    return await sanity.fetch(query);
}

export default async function DevicesPage() {
    const devices = await getDevices();

    return (
        <main className="min-h-screen pt-32 pb-20 bg-gray-50">
            <div className="container mx-auto px-4 text-center mb-12">
                <TextAnimate className="section-title text-secondary mb-4" animation="blurInUp" once>
                    أحدث التقنيات والأجهزة
                </TextAnimate>
                <TextAnimate className="section-subtitle mx-auto" animation="blurInUp" delay={0.2} once>
                    نستخدم في مجمع إيات أحدث ما توصلت إليه التكنولوجيا لضمان أفضل النتائج لمرضانا.
                </TextAnimate>
            </div>

            <DevicesView devices={devices} />
        </main>
    );
}
