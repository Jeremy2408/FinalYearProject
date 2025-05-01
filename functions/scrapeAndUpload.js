const puppeteer = require("puppeteer");
const admin = require("firebase-admin");
const fs = require("fs");

if (!process.env.FIREBASE_CREDENTIALS) {
    throw new Error(" FIREBASE_CREDENTIALS not set in environment!");
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
  
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const inputDate = process.argv[2] || new Date().toISOString().split("T")[0];
const inputLid = process.argv[3] || "3086";

async function fetchLibraryAvailability(date = inputDate, lid = inputLid) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const url = `https://tudublin.libcal.com/spaces?lid=${lid}&gid=0&date=${date}`;
  await page.goto(url, { waitUntil: "networkidle2" });

  console.log(` Checking availability for ${date} on campus lid=${lid}`);

  let found = false;
  try {
    await page.waitForSelector("a.s-lc-eq-avail", { timeout: 8000 });
    found = true;
  } catch {
    console.log(`  No availability found for ${date}`);
  }

  let availability = [];

  if (found) {
    availability = await page.evaluate(() => {
      const blocks = document.querySelectorAll("a.s-lc-eq-avail");
      const results = [];

      blocks.forEach((block) => {
        const title = block.getAttribute("title") || "";
        const match = title.match(/^(.*?) - (.*?) - Available$/);

        if (match) {
          const [_, time, room] = match;
          results.push({ room, time });
        }
      });

      return results;
    });
  }

  await browser.close();

  console.log(" Scraped data:", availability.length, "slots");

  if (availability.length > 0) {
    const grouped = {};

    availability.forEach(({ room, time }) => {
      if (!grouped[room]) grouped[room] = [];
      grouped[room].push(time);
    });

    const payload = {
      lid,
      date,
      rooms: Object.entries(grouped).map(([room, times]) => ({
        room,
        times,
      })),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db
      .collection("libraryAvailability")
      .doc(`${lid}_${date}`)
      .set(payload);

    console.log(" Uploaded to Firestore:", `libraryAvailability/${lid}_${date}`);
  } else {
    console.log(" Nothing to upload");
  }
}

fetchLibraryAvailability();
