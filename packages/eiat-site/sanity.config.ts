"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemaTypes";
import { whatsappPlugin } from "../sanity-studio/plugins/whatsapp-tool";

const projectId = "f46widyg";
const dataset = "production";

export default defineConfig({
  basePath: "/studio",
  name: "eiat-clinics",
  title: "إيات لطب الأسنان",

  projectId,
  dataset,

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("لوحة التحكم")
          .items([
            S.listItem()
              .title("🏥 الصفحة الرئيسية")
              .schemaType("homepage")
              .child(
                S.document().schemaType("homepage").documentId("homePage")
              ),

            S.listItem()
              .title("🏥 معلومات العيادة")
              .schemaType("clinicInfo")
              .child(
                S.document().schemaType("clinicInfo").documentId("clinicInfo")
              ),

            S.documentTypeListItem("doctor").title("👨‍⚕️ الأطباء"),
            S.documentTypeListItem("plan").title("📦 الخدمات والباقات"),
            S.documentTypeListItem("offer").title("🏷️ العروض والخصومات"),
            S.documentTypeListItem("testimonial").title("⭐ تقييمات المرضى"),
            S.documentTypeListItem("device").title("🔬 الأجهزة"),
            S.documentTypeListItem("beforeAfter").title("🪄 قبل وبعد"),

            S.divider(),

            S.listItem()
              .title("📱 واتساب للأعمال")
              .icon(() => "📱")
              .child(
                S.list()
                  .title("واتساب")
                  .items([
                    S.documentTypeListItem("whatsappTemplate").title(
                      "📋 قوالب الرسائل"
                    ),
                    S.documentTypeListItem("whatsappConversation").title(
                      "💬 سجل المحادثات"
                    ),
                  ])
              ),
          ]),
    }),
    whatsappPlugin(),
  ],

  schema: {
    types: schemaTypes,
  },
});
