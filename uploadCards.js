import fs from "fs";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Init Admin SDK with fake projectId for emulator
initializeApp({ projectId: "egokaisaesultimatetcg" });

const db = getFirestore();
db.settings({
  host: "127.0.0.1:8080",
  ssl: false
});

// Load your JSON file
const cards = JSON.parse(fs.readFileSync("cards.json", "utf8"));

async function uploadCards() {
  for (const card of cards) {
    console.log("Uploading:", card.cardId, card.name);
    const cardRef = db.collection("cards").doc(card.cardId);
    await cardRef.set(card);
  }
  console.log("✅ All cards uploaded to Firestore Emulator!");
}

uploadCards().catch(console.error);
