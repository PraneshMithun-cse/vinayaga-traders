import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../public/images/products");
fs.mkdirSync(OUT, { recursive: true });

// Maps product slug → Unsplash photo ID or search keyword URL
// Using source.unsplash.com/featured/400x400/?keyword (follows redirect)
const PRODUCT_IMAGES = {
  // Spice Powders
  "manjal-thool": "photo-1596040033229-a9821ebd058d",
  "milakai-thool": "photo-1588315029754-2dd089d39a1a",
  "malli-thool": "photo-1506619216599-9d16d0903dfd",
  "chicken-masala": "photo-1596797038530-2c107229654b",
  "mutton-masala": "photo-1556910103-1c02745aae4d",
  "garam-masala": "photo-1601050690597-df0568f70950",
  "curry-masala": "photo-1517244683847-7456b63c5969",
  "jeera-powder": "photo-1599909631716-c06e2c6b9f7f",
  "chicken-65-masala": "photo-1604329760661-e71dc83f8f26",
  "sambar-thool": "photo-1625944525533-473f1a3d54e7",
  "rasam-thool": "photo-1589301760014-d929f3979dbc",
  "kuzhambu-thool": "photo-1575318634028-6a0cfcb60c59",
  "milagu-thool": "photo-1514190051997-0f6f39ca5cde",
  "kashmiri-chilli-thool": "photo-1598515214211-89d3c73ae83b",
  "egg-curry-masala": "photo-1565299624946-b28f40a0ae38",
  "fish-curry-masala": "photo-1631515243349-e0cb75fb8d3a",
  "fish-fry-masala": "photo-1559847844-5315695dadae",
  "nattu-kozhi-masala": "photo-1604329760661-e71dc83f8f26",
  "sombu-thool": "photo-1588315029754-2dd089d39a1a",

  // Pickles
  "lemon-pickle": "photo-1590301157890-4810ed352733",
  "mango-pickle": "photo-1601493700631-2b16ec4b4716",
  "ginger-pickle": "photo-1615485290382-441e4d049cb4",
  "garlic-pickle": "photo-1615485290382-441e4d049cb4",
  "mixed-vegetable-pickle": "photo-1590301157890-4810ed352733",
  "tomato-pickle": "photo-1546554137-f86b9593a222",

  // Dry Chips & Vathal
  "bat-chips": "photo-1621939514649-280e2ee25f60",
  "wheel-chips": "photo-1621939514649-280e2ee25f60",
  "onion-chips": "photo-1568901346375-23c9450c58cd",
  "garlic-chips": "photo-1621939514649-280e2ee25f60",
  "onion-vathal": "photo-1518977676405-7571a6f7fdb8",
  "pundu-vathal": "photo-1518977676405-7571a6f7fdb8",
  "tomato-vathal": "photo-1518977676405-7571a6f7fdb8",
  "green-chilli-vathal": "photo-1518977676405-7571a6f7fdb8",
  "jeera-vathal": "photo-1518977676405-7571a6f7fdb8",
  "red-chilli-vathal": "photo-1518977676405-7571a6f7fdb8",
  "corn-flakes": "photo-1521483451569-e33803c0330c",
  "colour-kodal": "photo-1555949258-eb67b1ef0ceb",
  "medium-kodal": "photo-1555949258-eb67b1ef0ceb",
  "small-kodal": "photo-1555949258-eb67b1ef0ceb",
  "mor-milakai": "photo-1518977676405-7571a6f7fdb8",
  "arisi-vathal": "photo-1518977676405-7571a6f7fdb8",
  "lays-vathal": "photo-1621939514649-280e2ee25f60",
  "bend-pasta": "photo-1555949258-eb67b1ef0ceb",
  "muruku-pasta": "photo-1555949258-eb67b1ef0ceb",
  "sangu-pasta": "photo-1555949258-eb67b1ef0ceb",
  "aapalam-small": "photo-1505575967455-40e256f73376",
  "aapalam-big": "photo-1505575967455-40e256f73376",
  "pani-puri": "photo-1601050690597-df0568f70950",
  "kothavarangai-vathal": "photo-1518977676405-7571a6f7fdb8",

  // Whole Spices
  "milagu": "photo-1514190051997-0f6f39ca5cde",
  "marati-mokku": "photo-1599909631716-c06e2c6b9f7f",
  "annachi-poo": "photo-1588315029754-2dd089d39a1a",
  "kirambu": "photo-1599909631716-c06e2c6b9f7f",
  "sukku": "photo-1597690819616-a4f5ea41dbde",
  "thallipu-vadagam": "photo-1599909631716-c06e2c6b9f7f",
  "elakkai": "photo-1557682250-33bd709cbe85",
  "munthiri": "photo-1509358271058-acd22cc93cff",
  "thirachai": "photo-1586201375761-83865001e31c",
  "kasakasa": "photo-1612196808214-b7b1dd2c3d83",
  "karuseragam": "photo-1599909631716-c06e2c6b9f7f",
  "ommam": "photo-1599909631716-c06e2c6b9f7f",
  "vella-ellu": "photo-1612196808214-b7b1dd2c3d83",
  "karupu-ellu": "photo-1612196808214-b7b1dd2c3d83",
  "seragam": "photo-1584305574647-0cc949a2bb9f",
  "soombu": "photo-1588315029754-2dd089d39a1a",
  "karupu-thirachai": "photo-1509358271058-acd22cc93cff",
  "biryani-leaf": "photo-1586201375761-83865001e31c",
  "kal-pasi": "photo-1599909631716-c06e2c6b9f7f",
  "kasthuri-methi": "photo-1615485290382-441e4d049cb4",
  "pattai": "photo-1597690819616-a4f5ea41dbde",
  "jathi-pathri": "photo-1599909631716-c06e2c6b9f7f",

  // Flours
  "kadalai-mavu": "photo-1574323347407-f5e1ad6d020b",
  "corn-flour": "photo-1574323347407-f5e1ad6d020b",
  "arisi-mavu": "photo-1574323347407-f5e1ad6d020b",
  "koola-mavu": "photo-1574323347407-f5e1ad6d020b",
  "maida-mavu": "photo-1574323347407-f5e1ad6d020b",
  "kothumai-mavu": "photo-1574323347407-f5e1ad6d020b",
  "ragi-mavu": "photo-1574323347407-f5e1ad6d020b",
  "rava": "photo-1574323347407-f5e1ad6d020b",
  "kothumai-rava": "photo-1574323347407-f5e1ad6d020b",
  "vella-avul": "photo-1586201375761-83865001e31c",
  "red-avul": "photo-1586201375761-83865001e31c",
  "getti-avul": "photo-1586201375761-83865001e31c",

  // Pulses & Dals
  "thuvaram-parupu": "photo-1586201375761-83865001e31c",
  "paasi-parupu": "photo-1604329760661-e71dc83f8f26",
  "kadalai-parupu": "photo-1515543904379-3d757e47f560",
  "mysore-parupu": "photo-1604329760661-e71dc83f8f26",
  "vada-parupu": "photo-1515543904379-3d757e47f560",
  "avarai-parupu": "photo-1515543904379-3d757e47f560",
  "karupu-ulunthu": "photo-1515543904379-3d757e47f560",
  "udacha-ulunthu": "photo-1515543904379-3d757e47f560",
  "urutu-ulunthu": "photo-1515543904379-3d757e47f560",
  "pottukadalai": "photo-1515543904379-3d757e47f560",
  "mulu-pottukadalai": "photo-1515543904379-3d757e47f560",
  "nilakadalai": "photo-1567306301408-9b74779a11af",
  "pacha-nilakadalai": "photo-1567306301408-9b74779a11af",
  "vella-mochai": "photo-1515543904379-3d757e47f560",
  "sivapu-mochai": "photo-1515543904379-3d757e47f560",
  "thatta-pairu": "photo-1515543904379-3d757e47f560",
  "konda-kadalai": "photo-1515543904379-3d757e47f560",
  "vella-sundal": "photo-1515543904379-3d757e47f560",
  "kollu": "photo-1515543904379-3d757e47f560",
  "pacha-paru": "photo-1515543904379-3d757e47f560",
  "vella-pattani": "photo-1515543904379-3d757e47f560",
  "pacha-pattani": "photo-1515543904379-3d757e47f560",
  "venthiyam": "photo-1584305574647-0cc949a2bb9f",
  "pulli": "photo-1546554137-f86b9593a222",
  "poondu": "photo-1540148426945-6cf22a6b2383",
  "malli-nadu-big": "photo-1506619216599-9d16d0903dfd",
  "malli-nadu-small": "photo-1506619216599-9d16d0903dfd",
  "payasa-javarisi": "photo-1574323347407-f5e1ad6d020b",
  "mavu-javarisi": "photo-1574323347407-f5e1ad6d020b",
  "payasa-semiya": "photo-1555949258-eb67b1ef0ceb",
  "vella-semiya": "photo-1555949258-eb67b1ef0ceb",
  "ragi-semiya": "photo-1555949258-eb67b1ef0ceb",
  "lemon-semiya": "photo-1555949258-eb67b1ef0ceb",
  "tomato-semiya": "photo-1555949258-eb67b1ef0ceb",
  "kambu-semiya": "photo-1555949258-eb67b1ef0ceb",
  "vara-milagai": "photo-1598515214211-89d3c73ae83b",

  // Seeds (Perungayam / Asafoetida)
  "bs-perungayam": "photo-1599909631716-c06e2c6b9f7f",
  "lg-perungayam": "photo-1599909631716-c06e2c6b9f7f",
  "tt-perungayam": "photo-1599909631716-c06e2c6b9f7f",
  "katti-perungayam": "photo-1599909631716-c06e2c6b9f7f",
  // Other seeds in the seeds category (venthiyam, pulli, poondu already covered above)

  // Oils
  "gold-winner-oil": "photo-1474979266404-7eaacbcd87c5",
  "fortune-oil": "photo-1474979266404-7eaacbcd87c5",
  "mr-gold-oil": "photo-1474979266404-7eaacbcd87c5",
  "groundnut-oil": "photo-1474979266404-7eaacbcd87c5",
  "coconut-oil": "photo-1580910051074-3eb694886505",
  "gingelly-oil": "photo-1474979266404-7eaacbcd87c5",
  "sami-oil": "photo-1474979266404-7eaacbcd87c5",
  "rice-bran-oil": "photo-1474979266404-7eaacbcd87c5",

  // Bulk Masalas (Homemade)
  "manjal-thool-bulk": "photo-1596040033229-a9821ebd058d",
  "milaga-thool-bulk": "photo-1588315029754-2dd089d39a1a",
  "malli-thool-bulk": "photo-1506619216599-9d16d0903dfd",
  "kari-masala-bulk": "photo-1596797038530-2c107229654b",
  "kulambu-thool-bulk": "photo-1575318634028-6a0cfcb60c59",
  "sambar-thool-bulk": "photo-1625944525533-473f1a3d54e7",

  // Soya
  "soya-big": "photo-1563898601-a72a7d0fbf02",
  "soya-small": "photo-1563898601-a72a7d0fbf02",
  "idly-soya": "photo-1563898601-a72a7d0fbf02",
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
        file.close();
        fs.unlink(dest, () => {});
        return resolve(downloadFile(res.headers.location, dest));
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
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
  const entries = Object.entries(PRODUCT_IMAGES);
  let done = 0, failed = 0;

  // Process in batches of 5
  for (let i = 0; i < entries.length; i += 5) {
    const batch = entries.slice(i, i + 5);
    await Promise.all(batch.map(async ([slug, photoId]) => {
      const dest = path.join(OUT, `${slug}.jpg`);
      if (fs.existsSync(dest)) {
        done++;
        return;
      }
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
