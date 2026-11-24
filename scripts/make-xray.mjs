import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const imageBuffer = fs.readFileSync('/home/z/my-project/public/portrait.png');
const base64Image = imageBuffer.toString('base64');
const dataUrl = `data:image/png;base64,${base64Image}`;

const prompt = `Keep the person's actual face, skin, eyes, nose, mouth, hair, and expression COMPLETELY UNCHANGED — they must remain fully recognizable as the same person in the original photo. Only add a SUBTLE, semi-transparent digital overlay on top of the existing face: thin warm-bronze wireframe contour lines tracing the jaw, cheekbones, and brow; faint horizontal holographic scan lines crossing the face; a delicate grid of geometric measurement marks at key facial landmarks; and soft volumetric rim light from the upper-left. The face remains a real photographic portrait — the X-ray effect is a translucent UI layer over it, NOT a replacement of the face with a skull or skeleton. Background: deep charcoal black. Mood: editorial, premium, futuristic medical scan UI. Do NOT remove skin. Do NOT replace the face. Do NOT show bones or skull.`;

const zai = await ZAI.create();

const response = await zai.images.generations.edit({
  prompt,
  images: [{ url: dataUrl }],
  size: '768x1344',
});

const imageBase64 = response.data[0].base64;
const buffer = Buffer.from(imageBase64, 'base64');
fs.writeFileSync('/home/z/my-project/public/portrait-xray.jpg', buffer);
console.log(`X-ray portrait saved. Size: ${buffer.length} bytes`);
