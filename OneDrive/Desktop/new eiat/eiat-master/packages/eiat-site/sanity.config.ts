"use client";

import { defineConfig } from "sanity";
import { deskTool } from "sanity/desk";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemaTypes";

const projectId = "f46widyg";
const dataset = "production";

export default defineConfig({
    basePath: "/studio",
    name: "EIAT_Medical_Clinics",
    title: "EIAT Medical Clinics",

    projectId,
    dataset,

    plugins: [deskTool(), visionTool()],

    schema: {
        types: schemaTypes,
    },
});
