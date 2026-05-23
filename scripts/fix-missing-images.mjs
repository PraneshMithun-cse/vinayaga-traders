import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../public/images/products");

// All verified working Unsplash photo IDs (confirmed from first run)
const FIXED = {
  // Vathal / dried items → use chips/dried food photo
  "onion-vathal": "photo-1621939514649-280e2ee25f60",
  "pundu-vathal": "photo-1621939514649-280e2ee25f60",
  "tomato-vathal": "photo-1621939514649-280e2ee25f60",
  "green-chilli-vathal": "photo-1598515214211-89d3c73ae83b",
  "jeera-vathal": "photo-1584305574647-0cc949a2bb9f",
  "red-chilli-vathal": "photo-1598515214211-89d3c73ae83b",
  "mor-milakai": "photo-1568901346375-23c9450c58cd",
  "arisi-vathal": "photo-1621939514649-280e2ee25f60",
  "kothavarangai-vathal": "photo-1621939514649-280e2ee25f60",

  // Pickles that failed
  "ginger-pickle": "photo-1546554137-f86b9593a222",
  "garlic-pickle": "photo-1546554137-f86b9593a222",

  // Whole spices that failed → use working spice photos
  "jeera-powder": "photo-1584305574647-0cc949a2bb9f",
  "kirambu": "photo-1517244683847-7456b63c5969",
  "marati-mokku": "photo-1517244683847-7456b63c5969",
  "sukku": "photo-1517244683847-7456b63c5969",
  "thallipu-vadagam": "photo-1517244683847-7456b63c5969",
  "karuseragam": "photo-1584305574647-0cc949a2bb9f",
  "ommam": "photo-1584305574647-0cc949a2bb9f",
  "munthiri": "photo-1567306301408-9b74779a11af",
  "kasakasa": "photo-1584305574647-0cc949a2bb9f",
  "vella-ellu": "photo-1584305574647-0cc949a2bb9f",
  "karupu-ellu": "photo-1584305574647-0cc949a2bb9f",
  "karupu-thirachai": "photo-1567306301408-9b74779a11af",
  "kal-pasi": "photo-1517244683847-7456b63c5969",
  "kasthuri-methi": "photo-1506619216599-9d16d0903dfd",
  "pattai": "photo-1517244683847-7456b63c5969",
  "jathi-pathri": "photo-1517244683847-7456b63c5969",

  // Pulses / dals that failed → use toor dal / moong dal photos
  "kadalai-parupu": "photo-1586201375761-83865001e31c",
  "vada-parupu": "photo-1586201375761-83865001e31c",
  "avarai-parupu": "photo-1586201375761-83865001e31c",
  "karupu-ulunthu": "photo-1586201375761-83865001e31c",
  "udacha-ulunthu": "photo-1586201375761-83865001e31c",
  "urutu-ulunthu": "photo-1586201375761-83865001e31c",
  "pottukadalai": "photo-1567306301408-9b74779a11af",
  "mulu-pottukadalai": "photo-1567306301408-9b74779a11af",
  "vella-mochai": "photo-1586201375761-83865001e31c",
  "sivapu-mochai": "photo-1586201375761-83865001e31c",
  "thatta-pairu": "photo-1586201375761-83865001e31c",
  "konda-kadalai": "photo-1567306301408-9b74779a11af",
  "vella-sundal": "photo-1567306301408-9b74779a11af",
  "kollu": "photo-1586201375761-83865001e31c",
  "pacha-paru": "photo-1604329760661-e71dc83f8f26",
  "vella-pattani": "photo-1586201375761-83865001e31c",
  "pacha-pattani": "photo-1604329760661-e71dc83f8f26",

  // Perungayam (asafoetida) → use spice powder photo
  "bs-perungayam": "photo-1517244683847-7456b63c5969",
  "lg-perungayam": "photo-1517244683847-7456b63c5969",
  "tt-perungayam": "photo-1517244683847-7456b63c5969",
  "katti-perungayam": "photo-1517244683847-7456b63c5969",

  // Soya → use lentils photo as fallback
  "soya-big": "photo-1586201375761-83865001e31c",
  "soya-small": "photo-1586201375761-83865001e31c",
  "idly-soya": "photo-1586201375761-83865001e31c",
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        file.close();
        fs.unlink(dest, () => {});
        return resolve(downloadFile(res.headers.location, dest));
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
      file.on("error", (e) => { fs.unlink(dest, () => {}); reject(e); });
    });
    req.on("error", (e) => { fs.unlink(dest, () => {}); reject(e); });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

async function run() {
  const entries = Object.entries(FIXED);
  let done = 0, failed = 0;

  for (let i = 0; i < entries.length; i += 5) {
    const batch = entries.slice(i, i + 5);
    await Promise.all(batch.map(async ([slug, photoId]) => {
      const dest = path.join(OUT, `${slug}.jpg`);
      const url = `https://images.unsplash.com/${photoId}?w=400&h=400&fit=crop&q=80`;
      try {
        await downloadFile(url, dest);
        done++;
        process.stdout.write(`✓ ${slug}\n`);
      } catch (e) {
        failed++;
        process.stdout.write(`✗ ${slug}: ${e.message}\n`);
      }
    }));
  }

  console.log(`\nDone: ${done}, Failed: ${failed}`);
}

run();
