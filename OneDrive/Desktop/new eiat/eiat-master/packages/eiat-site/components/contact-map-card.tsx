import { TextAnimate } from "./magicui/text-animate";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";

/**
 * 📍 ContactMapCard Component
 *
 * Renders a styled card with an embedded Google Map showing the clinic location.
 * - Includes animated title and description.
 * - Uses a responsive iframe to display the map.
 */
export const ContactMapCard = () => (
  <Card>
    {/* ===== Header Section ===== */}
    <CardHeader>
      <CardTitle className="text-foreground">
        <TextAnimate animation="blurInUp" by="word" once>
          موقعنا على الخريطة
        </TextAnimate>
      </CardTitle>
      <CardDescription className="text-subtitle">
        <TextAnimate animation="blurInUp" by="word" once>
          نحن موجودون في قلب منطقة الأعمال في جدة، المملكة العربية السعودية.
        </TextAnimate>
      </CardDescription>
    </CardHeader>

    {/* ===== Map Embed Section ===== */}
    <CardContent className="px-4">
      <div className="w-full h-[400px] rounded-lg overflow-hidden">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1156.971173731772!2d39.1812126!3d21.5128215!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDMwJzQ0LjUiTiAzOcKwMTAnNTMuMiJF!5e0!3m2!1sar!2seg!4v1719950000000!5m2!1sar!2seg"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Office Location Map"
        />
      </div>
    </CardContent>
  </Card>
);
