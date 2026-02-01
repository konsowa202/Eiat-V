"use client";

import { defineConfig } from "sanity";
import { deskTool } from "sanity/desk";
// import { visionTool } from "@sanity/vision"; // Optional - install @sanity/vision if needed
import { schemaTypes } from "./schemaTypes";

const projectId = "f46widyg";
const dataset = "production";

export default defineConfig({
    basePath: "/studio",
    name: "EIAT_Medical_Clinics",
    title: "EIAT Medical Clinics",

    projectId,
    dataset,

    plugins: [deskTool()], // visionTool() removed - install @sanity/vision package if needed

    schema: {
        types: schemaTypes,
    },
});
