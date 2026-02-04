import { sanity } from "@/lib/sanity";
import OffersView from "@/components/offers-view";
import { TextAnimate } from "@/components/magicui/text-animate";

export const revalidate = 60;

async function getOffers() {
    const query = `*[_type == "offer" && active == true] | order(_createdAt desc) {
    _id,
    title,
    description,
    discount,
    image,
    department
  }`;
    return await sanity.fetch(query);
}

export default async function OffersPage() {
    const offers = await getOffers();

    return (
        <main className="min-h-screen pt-32 pb-20 bg-gray-50">
            <div className="container mx-auto px-4 text-center mb-12">
                <TextAnimate className="section-title text-red-500 mb-4" animation="blurInUp" once>
                    باقات وعروض حصرية
                </TextAnimate>
                <TextAnimate className="section-subtitle mx-auto" animation="blurInUp" delay={0.2} once>
                    اغتنم الفرصة واستفد من عروضنا المميزة على خدمات الأسنان والبشرة والليزر لفترة محدودة.
                </TextAnimate>
            </div>

            <OffersView offers={offers} />
        </main>
    );
}
