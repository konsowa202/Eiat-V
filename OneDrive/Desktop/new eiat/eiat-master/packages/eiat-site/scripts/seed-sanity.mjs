
import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// 1. Load Environment Variables (Manual Parse)
const envPath = path.join(projectRoot, '.env');
let sanityToken = process.env.SANITY_TOKEN;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/SANITY_TOKEN=(.*)/);
    if (match) {
        sanityToken = match[1].trim();
    }
}

if (!sanityToken) {
    console.error("❌ SANITY_TOKEN not found in .env or environment.");
    process.exit(1);
}

// 2. Sanity Client Configuration
const client = createClient({
    projectId: "f46widyg",
    dataset: "production",
    apiVersion: "2024-07-05",
    token: sanityToken,
    useCdn: false,
});

// 3. Helper: Upload Image
async function uploadImage(imagePath) {
    // Determine full path: imagePath from JSON is like "/foo.png", relative to public/
    // Remove leading slash if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const fullPath = path.join(projectRoot, 'public', cleanPath);

    if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️ Image not found: ${fullPath}`);
        return null;
    }

    try {
        const buffer = fs.readFileSync(fullPath);
        const asset = await client.assets.upload('image', buffer, {
            filename: path.basename(cleanPath)
        });
        console.log(`✅ Uploaded image: ${cleanPath}`);
        return asset;
    } catch (error) {
        console.error(`❌ Failed to upload image ${cleanPath}:`, error.message);
        return null;
    }
}

// 4. Seed Offers
async function seedOffers() {
    const offersPath = path.join(projectRoot, 'lib', 'static-offers.json');
    if (!fs.existsSync(offersPath)) return;

    const content = fs.readFileSync(offersPath, 'utf8').replace(/^\uFEFF/, '');
    const offers = JSON.parse(content);
    console.log(`\nStarting Seed: ${offers.length} Offers...`);

    for (const offer of offers) {
        const imageAsset = await uploadImage(offer.image);

        const doc = {
            _type: 'offer',
            title: offer.originalName.replace('.jpg', ''), // Use filename as title base or similar
            description: offer.originalName, // Using the descriptive text
            department: offer.category,
            active: true,
            image: imageAsset ? {
                _type: 'image',
                asset: {
                    _type: "reference",
                    _ref: imageAsset._id
                }
            } : undefined
        };

        try {
            await client.create(doc);
            console.log(`✅ Created Offer: ${offer.id}`);
        } catch (err) {
            console.error(`❌ Error creating offer ${offer.id}:`, err.message);
        }
    }
}

// 5. Seed Devices
async function seedDevices() {
    const devicesPath = path.join(projectRoot, 'lib', 'static-devices.json');
    if (!fs.existsSync(devicesPath)) return;

    const content = fs.readFileSync(devicesPath, 'utf8').replace(/^\uFEFF/, '');
    const devices = JSON.parse(content);
    console.log(`\nStarting Seed: ${devices.length} Devices...`);

    for (const device of devices) {
        const imageAsset = await uploadImage(device.image);

        const doc = {
            _type: 'device',
            name: device.name,
            category: device.category,
            description: device.description,
            image: imageAsset ? {
                _type: 'image',
                asset: {
                    _type: "reference",
                    _ref: imageAsset._id
                }
            } : undefined
        };

        try {
            await client.create(doc);
            console.log(`✅ Created Device: ${device.name}`);
        } catch (err) {
            console.error(`❌ Error creating device ${device.name}:`, err.message);
        }
    }
}

// Main Execution
(async () => {
    try {
        console.log("🚀 Starting Database Seeding...");
        await seedDevices();
        await seedOffers();
        console.log("\n🎉 Seeding Completed!");
    } catch (err) {
        console.error("FATAL ERROR:", err);
    }
})();
