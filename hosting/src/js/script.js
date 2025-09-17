import { getStorage, ref, connectStorageEmulator, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";
import { getFirestore, onSnapshot, runTransaction, getDoc, connectFirestoreEmulator, doc, setDoc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { getAuth, connectAuthEmulator, onAuthStateChanged, signOut } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyDytcogmq5L0UO9k59A5bamvdir23rQAJY",
  authDomain: "egokaisaesultimatetcg.firebaseapp.com",
  projectId: "egokaisaesultimatetcg",
  storageBucket: "gs://egokaisaesultimatetcg.firebasestorage.app",
  messagingSenderId: "251217603044",
  appId: "1:251217603044:web:7b655a1d68a4488f063ff1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
if (location.hostname === "localhost") {
  // Point to the Storage emulator running on localhost.
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
}

const auraAmount = document.getElementById("aura-amount")
let userDocRef;
let userMainRef; // Declare at top level
let aura;
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "http://localhost:5173/login.html";
  } else {
    userDocRef = collection(db, "users", user.uid, "inventory");
    userMainRef = doc(db, "users", user.uid);
    onSnapshot(userMainRef, (docSnap) => {
      if (docSnap.exists()) {
        aura = docSnap.data().Aura;
        console.log("User Aura:", aura);
        const data = docSnap.data();
        auraAmount.textContent = data.Aura;
      } else {
        console.log("User document not found");
      }
    });
    console.log(userDocRef); // Assign when user is authenticated
  }
});


const storageRef = ref(storage);

window.addEventListener("DOMContentLoaded", () => {

  const pulledCardUrls = [];
  // Helper for randomness
  function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function resetCards() {
    flippedCount = 0;
    cardInners.forEach(card => card.classList.remove("flipped"));
    cardFronts.forEach(front => {
      while (front.firstChild) {
        front.removeChild(front.firstChild);
      }
    });
  }

  // 🃏 Create image element
  const front = document.createElement("img");
  const cardFronts = document.querySelectorAll(".card-front");

  // Card generator functions (now return Promises)
  function getCCard(index) {
    const c = getRndInteger(1, 16);
    const imagesRef = ref(storageRef, 'Cards/C/' + c + '.png');
    return getDownloadURL(imagesRef)
      .then((url) => {
        pulledCardUrls.push(url);
        return new Promise((resolve) => {
          const img = document.createElement("img");
          img.onload = resolve;
          img.onerror = resolve; // resolve even if error, to avoid hanging
          img.setAttribute('src', url);
          img.className = "card-front absolute w-full h-full left-0 top-0 [backface-visibility:hidden] pointer-events-none select-none";
          cardFronts[index].appendChild(img);
        });
      })
      .catch((error) => {
        console.log(error)
      });
  }

  function getBCard(index) {
    const c = getRndInteger(1, 31);
    const imagesRef = ref(storageRef, 'Cards/B/' + c + '.png');
    return getDownloadURL(imagesRef)
      .then((url) => {
        pulledCardUrls.push(url);
        return new Promise((resolve) => {
          const img = document.createElement("img");
          img.onload = resolve;
          img.onerror = resolve;
          img.setAttribute('src', url);
          img.className = "card-front absolute w-full h-full left-0 top-0 [backface-visibility:hidden] pointer-events-none select-none";
          cardFronts[index].appendChild(img);
        });
      })
      .catch((error) => {
        console.log(error)
      });
  }

  function getACard(index) {
    const c = getRndInteger(1, 47);
    const imagesRef = ref(storageRef, 'Cards/A/' + c + '.png');
    return getDownloadURL(imagesRef)
      .then((url) => {
        pulledCardUrls.push(url);
        return new Promise((resolve) => {
          const img = document.createElement("img");
          img.onload = resolve;
          img.onerror = resolve;
          img.setAttribute('src', url);
          img.className = "card-front absolute w-full h-full left-0 top-0 [backface-visibility:hidden] pointer-events-none select-none";
          cardFronts[index].appendChild(img);
        });
      })
      .catch((error) => {
        console.log(error)
      });
  }
  const sCardCharacters = [
    "Aiku", "BL", "BL2", "Bachira1", "Bachira2", "Barou1", "Charles", "Chigiri1", "Chigiri2",
    "Gagamaru1", "Gagamaru2", "Gagamaru3", "Hiyori", "Isagi1", "Isagi2", "Isagi3",
    "Kaiser1", "Kaiser2", "Kaiser3", "Kaiser4", "Kunigami1", "Kunigami2", "Kunigami3", "Kunigami4",
    "Lorenzo1", "Nagi1", "Nagi2", "Nagi3", "Ness1", "Ness2", "Ness3", "Niko", "Otoya1", "Otoya2",
    "Reo1", "Reo2", "Rin1", "Rin2", "Sae", "Shidou1", "Shidou2", "Yukimiya1", "Yukimiya2", "karasu"
    // Add any new character filenames here
  ];

  function getSCard(index) {
    const characterFile = sCardCharacters[getRndInteger(0, sCardCharacters.length)];
    const imagesRef = ref(storageRef, `Cards/S/${characterFile}.png`);
    return getDownloadURL(imagesRef)
      .then((url) => {
        pulledCardUrls.push(url);
        return new Promise((resolve) => {
          const img = document.createElement("img");
          img.onload = resolve;
          img.onerror = resolve;
          img.setAttribute('src', url);
          img.className = "card-front absolute w-full h-full left-0 top-0 [backface-visibility:hidden] pointer-events-none select-none";
          cardFronts[index].appendChild(img);
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function getSSCard(index) {
    const c = getRndInteger(1, 10);
    const imagesRef = ref(storageRef, 'Cards/SS/' + c + '.png');
    return getDownloadURL(imagesRef)
      .then((url) => {
        pulledCardUrls.push(url);
        return new Promise((resolve) => {
          const img = document.createElement("img");
          img.onload = resolve;
          img.onerror = resolve;
          img.setAttribute('src', url);
          img.className = "card-front absolute w-full h-full left-0 top-0 [backface-visibility:hidden] pointer-events-none select-none";
          cardFronts[index].appendChild(img);
        });
      })
      .catch((error) => {
        console.log(error)
      });
  }

  function getSynergyCard(index) {
    const s = getRndInteger(1, 37); // adjust range later if needed
    const imagesRef = ref(storageRef, 'Cards/specialcards/greenSynergies/' + s + '.png');
    return getDownloadURL(imagesRef)
      .then((url) => {
        pulledCardUrls.push(url);
        return new Promise((resolve) => {
          console.log(url);
          const img = document.createElement("img");
          img.onload = resolve;
          img.onerror = resolve;
          img.setAttribute('src', url);
          img.className = "card-front absolute w-full h-full left-0 top-0 [backface-visibility:hidden] pointer-events-none select-none";
          cardFronts[index].appendChild(img);

        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function getRivalSynergyCard(index) {
    const r = getRndInteger(1, 30);
    const imagesRef = ref(storageRef, 'Cards/specialcards/redSynergies/' + r + '.png');
    return getDownloadURL(imagesRef)
      .then((url) => {
        pulledCardUrls.push(url);
        return new Promise((resolve) => {
          const img = document.createElement("img");
          img.onload = resolve;
          img.onerror = resolve;
          img.setAttribute('src', url);
          img.className = "card-front absolute w-full h-full left-0 top-0 [backface-visibility:hidden] pointer-events-none select-none";
          cardFronts[index].appendChild(img);
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function getEffectCard(index) {
    const e = getRndInteger(1, 25);
    const imagesRef = ref(storageRef, 'Cards/specialcards/effectCards/' + e + '.png');
    return getDownloadURL(imagesRef)
      .then((url) => {
        pulledCardUrls.push(url);
        return new Promise((resolve) => {
          const img = document.createElement("img");
          img.onload = resolve;
          img.onerror = resolve;
          img.setAttribute('src', url);
          img.className = "card-front absolute w-full h-full left-0 top-0 [backface-visibility:hidden] pointer-events-none select-none";
          cardFronts[index].appendChild(img);
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function getCharacterBoostCard(index) {
    const b = getRndInteger(1, 32);
    const imagesRef = ref(storageRef, 'Cards/specialcards/characterBoosts/' + b + '.png');
    return getDownloadURL(imagesRef)
      .then((url) => {
        pulledCardUrls.push(url);
        return new Promise((resolve) => {
          const img = document.createElement("img");
          img.onload = resolve;
          img.onerror = resolve;
          img.setAttribute('src', url);
          img.className = "card-front absolute w-full h-full left-0 top-0 [backface-visibility:hidden] pointer-events-none select-none";
          cardFronts[index].appendChild(img);
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function getPowerUpCard(index) {
    const p = getRndInteger(1, 28);
    const imagesRef = ref(storageRef, 'Cards/specialcards/powerUp/' + p + '.png');
    return getDownloadURL(imagesRef)
      .then((url) => {
        pulledCardUrls.push(url);
        return new Promise((resolve) => {
          const img = document.createElement("img");
          img.onload = resolve;
          img.onerror = resolve;
          img.setAttribute('src', url);
          img.className = "card-front absolute w-full h-full left-0 top-0 [backface-visibility:hidden] pointer-events-none select-none";
          cardFronts[index].appendChild(img);
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }


  // 🎲 Probability Definitions
  const commonPackProbabilities = [
    { tier: "C", chance: 0.60, handler: getCCard },
    { tier: "B", chance: 0.30, handler: getBCard },
    { tier: "A", chance: 0.06, handler: getACard },
    { tier: "S", chance: 0.035, handler: getSCard },
    { tier: "SS", chance: 0.005, handler: getSSCard }
  ];

  const rarePackProbabilities = [
    { tier: "C", chance: 0.19, handler: getCCard },
    { tier: "B", chance: 0.40, handler: getBCard },
    { tier: "A", chance: 0.35, handler: getACard },
    { tier: "S", chance: 0.05, handler: getSCard },
    { tier: "SS", chance: 0.01, handler: getSSCard }
  ];

  const legendaryPackProbabilities = [
    { tier: "B", chance: 0.30, handler: getBCard },
    { tier: "A", chance: 0.55, handler: getACard },
    { tier: "S", chance: 0.10, handler: getSCard },
    { tier: "SS", chance: 0.05, handler: getSSCard }
  ];
  const synergiesPackProbabilities = [
    { tier: "Synergy", chance: 1.0, handler: getSynergyCard }
  ];

  const rivalSynergiesPackProbabilities = [
    { tier: "RivalSynergy", chance: 1.0, handler: getRivalSynergyCard }
  ];

  const effectCardsPackProbabilities = [
    { tier: "Effect", chance: 1.0, handler: getEffectCard }
  ];

  const characterBoostsPackProbabilities = [
    { tier: "CharacterBoost", chance: 1.0, handler: getCharacterBoostCard }
  ];

  const powerUpsPackProbabilities = [
    { tier: "PowerUp", chance: 1.0, handler: getPowerUpCard }
  ];

  // 💥 Pull Logic
  // 💥 Pull Logic (returns a Promise)
  function pullFromPack(probabilityArray) {
    const promises = [];
    cardFronts.forEach((_, idx) => {
      const rand = Math.random();
      let cumulative = 0;
      for (let i = 0; i < probabilityArray.length; i++) {
        cumulative += probabilityArray[i].chance;
        if (rand < cumulative) {
          promises.push(probabilityArray[i].handler(idx));
          break;
        }
      }
    });
    return Promise.all(promises);
  }

  // 🧠 Dispatcher (returns a Promise)
  function fetchCard(rarity) {
    if (rarity === "BurningEgoists") {
      return pullFromPack(commonPackProbabilities);
    }
    if (rarity === "DiamondsInTheRough") {
      const promises = [];
      cardFronts.forEach((_, idx) => {
        if (idx !== cardFronts.length - 1) {
          const rand = Math.random();
          let cumulative = 0;
          for (let i = 0; i < rarePackProbabilities.length; i++) {
            cumulative += rarePackProbabilities[i].chance;
            if (rand < cumulative) {
              promises.push(rarePackProbabilities[i].handler(idx));
              break;
            }
          }
        }
      });
      // Guaranteed A rank card in the last slot
      promises.push(getACard(cardFronts.length - 1));
      return Promise.all(promises);
    }
    if (rarity === "DemonKings") {
      const promises = [];
      cardFronts.forEach((_, idx) => {
        if (idx !== cardFronts.length - 1) {
          const rand = Math.random();
          let cumulative = 0;
          for (let i = 0; i < legendaryPackProbabilities.length; i++) {
            cumulative += legendaryPackProbabilities[i].chance;
            if (rand < cumulative) {
              promises.push(legendaryPackProbabilities[i].handler(idx));
              break;
            }
          }
        }
      });
      // Guaranteed S rank card in the last slot
      promises.push(getSCard(cardFronts.length - 1));
      return Promise.all(promises);
    }
    if (rarity === "Synergies") {
      return pullFromPack(synergiesPackProbabilities);
    }
    if (rarity === "RivalSynergies") {
      return pullFromPack(rivalSynergiesPackProbabilities);
    }
    if (rarity === "EffectCards") {
      return pullFromPack(effectCardsPackProbabilities);
    }
    if (rarity === "CharacterBoosts") {
      return pullFromPack(characterBoostsPackProbabilities);
    }
    if (rarity === "PowerUps") {
      return pullFromPack(powerUpsPackProbabilities);
    }
    return Promise.resolve();
  }


  function getRarityFromUrl(url) {
    const match = url.match(/Cards%2F([A-Z]{1,2})%2F/);
    return match ? match[1] : null;
  }
  // Mock aura amount
  async function purchaseNormalPack(cost = 75, imgUrl = "") {
    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userMainRef);
        if (!userDoc.exists()) throw "User doc missing";

        const currentAura = userDoc.data().Aura;
        if (currentAura < cost) throw "Not enough Aura";

        // Deduct Aura safely
        transaction.update(userMainRef, { Aura: currentAura - cost });

        // Add a card to inventory (new doc in subcollection)
       
      });

      // Success → animation


    } catch (e) {
      console.error("Transaction failed: ", e);
    }
  }

  const getNowBtnCmn = document.getElementById("get-now-common");
  const packCostCommon = 75;
  getNowBtnCmn.addEventListener('click', () => {
    if (aura < packCostCommon) return alert("Not enough Aura!");
    aura -= packCostCommon;
    purchaseNormalPack(75);
    fetchCard("BurningEgoists").then(() => {
      // ...existing code...
      const rarities = pulledCardUrls.map(url => getRarityFromUrl(url));
      const cardInfo = pulledCardUrls.map((url, idx) => ({
        rarity: rarities[idx],
        imageURL: url
      }));

      // Store each card as a new document in the user's inventory subcollection
      cardInfo.forEach(card => {
        addDoc(userDocRef, {
          imageURL: card.imageURL,
          rarity: card.rarity,
          Aura: aura,
          timePulled: serverTimestamp(),
          pack: "burningEgoists" // If you want to store Aura per card, otherwise remove this line
        });
      });

      pulledCardUrls.length = 0;
      // ...existing code...
      gsap.from(".card", { y: 500, duration: 1, ease: "back.out", stagger: 0.2 });
      document.getElementById("pack-modal").classList.remove("hidden");
      closeModal();
      checkForSpecialCards();
    });
  });

  const getNowBtnEpc = document.getElementById("get-now-epic");
  const packCostEpic = 150;
  getNowBtnEpc.addEventListener('click', () => {
    if (aura < packCostEpic) return alert("Not enough Aura!");
    aura -= packCostEpic;
    purchaseNormalPack(150);
    fetchCard("DiamondsInTheRough").then(() => {
      // ...existing code...
      const rarities = pulledCardUrls.map(url => getRarityFromUrl(url));
      const cardInfo = pulledCardUrls.map((url, idx) => ({
        rarity: rarities[idx],
        imageURL: url
      }));

      // Store each card as a new document in the user's inventory subcollection
      cardInfo.forEach(card => {
        addDoc(userDocRef, {
          imageURL: card.imageURL,
          rarity: card.rarity,
          Aura: aura,
          timePulled: serverTimestamp(),
          pack: "diamondsInTheRough" // If you want to store Aura per card, otherwise remove this line
        });
      });

      pulledCardUrls.length = 0;
      // ...existing code...
      gsap.from(".card", { y: 500, duration: 1, ease: "back.out", stagger: 0.2 });
      document.getElementById("pack-modal").classList.remove("hidden");
      closeModal();
      checkForSpecialCards();
    });
  });

  const getNowBtnLgndry = document.getElementById("get-now-legendary");
  const packCostLegendary = 200;
  getNowBtnLgndry.addEventListener('click', () => {
    if (aura < packCostLegendary) return alert("Not enough Aura!");
    aura -= packCostLegendary;
    purchaseNormalPack(250);
    resetCards();
    fetchCard("DemonKings").then(() => {
      // ...existing code...
      const rarities = pulledCardUrls.map(url => getRarityFromUrl(url));
      const cardInfo = pulledCardUrls.map((url, idx) => ({
        rarity: rarities[idx],
        imageURL: url
      }));

      // Store each card as a new document in the user's inventory subcollection
      cardInfo.forEach(card => {
        addDoc(userDocRef, {
          imageURL: card.imageURL,
          rarity: card.rarity,
          Aura: aura,
          timePulled: serverTimestamp(),
          pack: "demonKings" // If you want to store Aura per card, otherwise remove this line
        });
      });

      pulledCardUrls.length = 0;
      // ...existing code...
      gsap.from(".card", { y: 500, duration: 1, ease: "back.out", stagger: 0.2 });
      document.getElementById("pack-modal").classList.remove("hidden");
      closeModal();
      setTimeout(checkForSpecialCards, 100);
      console.log(pulledCardUrls)
    });
  });

  // Synergies Pack
  const getNowBtnSynergies = document.getElementById("synergies");
  const packCostSynergies = 150;
  getNowBtnSynergies.addEventListener('click', () => {
    if (aura < packCostSynergies) return alert("Not enough Aura!");
    aura -= packCostSynergies;
    purchaseNormalPack(200);
    resetCards();
    fetchCard("Synergies").then(() => {
      const rarities = pulledCardUrls.map(url => getRarityFromUrl(url));
      const cardInfo = pulledCardUrls.map((url, idx) => ({
        rarity: rarities[idx],
        imageURL: url
      }));
      cardInfo.forEach(card => {
        addDoc(userDocRef, {
          imageURL: card.imageURL,
          rarity: card.rarity,
          Aura: aura,
          timePulled: serverTimestamp(),
          pack: "synergies"
        });
      });
      pulledCardUrls.length = 0;
      // ...existing code...
      gsap.from(".card", { y: 500, duration: 1, ease: "back.out", stagger: 0.2 });
      document.getElementById("pack-modal").classList.remove("hidden");
      closeModal();
      checkForSpecialCards();
    });
  });

  // Rival Synergies Pack
  const getNowBtnRival = document.getElementById("rival-synergies");
  const packCostRival = 150;
  getNowBtnRival.addEventListener('click', () => {
    if (aura < packCostRival) return alert("Not enough Aura!");
    aura -= packCostRival;
    purchaseNormalPack(200);
    resetCards();
    fetchCard("RivalSynergies").then(() => {
      const rarities = pulledCardUrls.map(url => getRarityFromUrl(url));
      const cardInfo = pulledCardUrls.map((url, idx) => ({
        rarity: rarities[idx],
        imageURL: url
      }));
      cardInfo.forEach(card => {
        addDoc(userDocRef, {
          imageURL: card.imageURL,
          rarity: card.rarity,
          Aura: aura,
          timePulled: serverTimestamp(),
          pack: "rivalSynergies"
        });
      });
      pulledCardUrls.length = 0;
      // ...existing code...
      gsap.from(".card", { y: 500, duration: 1, ease: "back.out", stagger: 0.2 });
      document.getElementById("pack-modal").classList.remove("hidden");
      closeModal();
      checkForSpecialCards();
    });
  });

  // Effect Cards Pack
  const getNowBtnEffect = document.getElementById("effect-cards");
  const packCostEffect = 100;
  getNowBtnEffect.addEventListener('click', () => {
    if (aura < packCostEffect) return alert("Not enough Aura!");
    aura -= packCostEffect;
    purchaseNormalPack(150);
    resetCards();
    fetchCard("EffectCards").then(() => {
      const rarities = pulledCardUrls.map(url => getRarityFromUrl(url));
      const cardInfo = pulledCardUrls.map((url, idx) => ({
        rarity: rarities[idx],
        imageURL: url
      }));
      cardInfo.forEach(card => {
        addDoc(userDocRef, {
          imageURL: card.imageURL,
          rarity: card.rarity,
          Aura: aura,
          timePulled: serverTimestamp(),
          pack: "effectCards"
        });
      });
      pulledCardUrls.length = 0;
      // ...existing code...
      gsap.from(".card", { y: 500, duration: 1, ease: "back.out", stagger: 0.2 });
      document.getElementById("pack-modal").classList.remove("hidden");
      closeModal();
      checkForSpecialCards();
    });
  });

  // Character Boosts Pack
  const getNowBtnBoosts = document.getElementById("character-boosts");
  const packCostBoosts = 120;
  getNowBtnBoosts.addEventListener('click', () => {
    if (aura < packCostBoosts) return alert("Not enough Aura!");
    aura -= packCostBoosts;
    purchaseNormalPack(180);
    resetCards();
    fetchCard("CharacterBoosts").then(() => {
      const rarities = pulledCardUrls.map(url => getRarityFromUrl(url));
      const cardInfo = pulledCardUrls.map((url, idx) => ({
        rarity: rarities[idx],
        imageURL: url
      }));
      cardInfo.forEach(card => {
        addDoc(userDocRef, {
          imageURL: card.imageURL,
          rarity: card.rarity,
          Aura: aura,
          timePulled: serverTimestamp(),
          pack: "characterBoosts"
        });
      });
      pulledCardUrls.length = 0;
      // ...existing code...
      gsap.from(".card", { y: 500, duration: 1, ease: "back.out", stagger: 0.2 });
      document.getElementById("pack-modal").classList.remove("hidden");
      closeModal();
      checkForSpecialCards();
    });
  });

  // Power Ups Pack
  const getNowBtnPowerUps = document.getElementById("power-ups");
  const packCostPowerUps = 130;
  getNowBtnPowerUps.addEventListener('click', () => {
    if (aura < packCostPowerUps) return alert("Not enough Aura!");
    aura -= packCostPowerUps;
    purchaseNormalPack(190);
    resetCards();
    fetchCard("PowerUps").then(() => {
      const rarities = pulledCardUrls.map(url => getRarityFromUrl(url));
      const cardInfo = pulledCardUrls.map((url, idx) => ({
        rarity: rarities[idx],
        imageURL: url
      }));
      cardInfo.forEach(card => {
        addDoc(userDocRef, {
          imageURL: card.imageURL,
          rarity: card.rarity,
          Aura: aura,
          timePulled: serverTimestamp(),
          pack: "powerUps"
        });
      });
      pulledCardUrls.length = 0;
      // ...existing code...
      gsap.from(".card", { y: 500, duration: 1, ease: "back.out", stagger: 0.2 });
      document.getElementById("pack-modal").classList.remove("hidden");
      closeModal();
      checkForSpecialCards();   
    });
  });
  function checkForSpecialCards() {
    console.log("detected");

    cardFronts.forEach((front, idx) => {
      const img = front.querySelector("img");
      console.log(`Card ${idx}:`, img, img ? img.src : "no img");
      // ...existing code...
      if (
        img &&
        img.src &&
        (img.src.includes("Cards%2FS%2F") || img.src.includes("Cards%2FSS%2F"))
      ) {
        runSpecialAnimationDamn(img.src);
      }
      // ...existing code...
    });
  }
  function getRandomColor() {
    // Full flashy range
    const colors = [
      "#0f4c81", // dominant blue
      "#e0e6ed", // cold white
      "#e50914", // blood red
      "#007a7c", // teal ice
      "#1b3b6f"  // royal blue
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }


  const sCardAnimations = {
    "Aiku": {
      quote: "“For the rebirth of Japanese football, I am the final wall!” ",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/aiku.png?raw=true"
    },
    "BL": {
      quote: "“ Luck descends equally upon only those who are truly prepared to fight” ",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Ego.png?raw=true"
    },
    "BL2": {
      quote: "Stand out. Talent is just a lump of ore... and if you don't smelt and polish it, it's nothing but trash",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Ego2.png?raw=true"
    },
    "Bachira1": {
      quote: "It's not a matter of making the right choice... I'll make it so the path I choose is the right one.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Bachira1.png?raw=true"

    }, "Bachira2": {
      quote: "In this whole wide world, i'm the only one that can save me.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Bachira2.png?raw=true"
    },
    "Barou": {
      quote: "On the field, there is already one true king.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Barou2.png?raw=true"
    }, "Charles": {
      quote: "Well, the more you tell me to do something, the less I wanna. Guess that makes me a contrarian.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Charles.png?raw=true"
    },
    "Chigiri1": {
      quote: "This is the moment I’ve been waiting for…my speed, will roar through the world!!",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/chigiri.png?raw=true"
    }, "Chigiri2": {
      quote: "Your evolution's slow, blue lockers.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Chigiri2.png?raw=true"
    },
    "Gagamaru1": {
      quote: "Are you the goalkeeper? Today's The first time I'm playing as one.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Gagamaru2.png?raw=true"
    }, "Gagamaru2": {
      quote: "It's still just a copy.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Gagamaru2.png?raw=true"
    },
    "Gagamaru3": {
      quote: "I finally get the ball again.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Gagamaru2.png?raw=true"
    }, "Hiyori": {
      quote: "Just stop. Disgusting. Don’t heap your expectations on me ever again",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/hiyori1.png?raw=true"
    },
    "Isagi": {
      quote: "How does it feel to be the clown of my story?",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/isagi 1.png?raw=true"
    }, "Isagi2": {
      quote: "Become the one that chooses, not the one that gets chosen.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/isagi 1.png?raw=true"
    },
    "Isagi3": {
      quote: "I need you to shut up genius, I'm about to get to the good part ",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/isagi 1.png?raw=true"
    }, "Kaiser1": {
      quote: "All the hope we need is in the fact that I’m around, and nothing else",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Kaiser1.png?raw=true"
    },
    "Kaiser2": {
      quote: "For me, nothing is impossible.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Kaiser2.png?raw=true"
    }, "Kaiser3": {
      quote: "Auf die Knie Blue Lock!",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Kaiser3.png?raw=true"
    },
    "Kaiser4": {
      quote: "I was and will be alone, God's own chosen emperor.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Kaiser3.png?raw=true"
    },

    "Kunigami1": {
      quote: "I follow my own way of dominance. Go bark up another tree, you parasite",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Kunigami.png?raw=true"
    },
    "Kunigami2": {
      quote: "I don't call myself that anymore, I left that childish dumbassery in hell.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Kunigami.png?raw=true"
    },
    "Kunigami3": {
      quote: "Don't forget about this dark horse.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Kunigami.png?raw=true"
    },
    "Kunigami4": {
      quote: "Egoists are all talk, huh?",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Kunigami.png?raw=true"
    }, "Lorenzo": {
      quote: "Huh? Aren't you worth absolutely zero? Can I call you Mr. Worthless?",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Lorenzo.png?raw=true"
    },
    "Nagi1": {
      quote: "Nice to meet you Japan, I am Nagi Seishiro.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Nagi1.png?raw=true"
    }, "Nagi2": {
      quote: "I don't care if i have to crush Blue Lock.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Nagi2.png?raw=true"
    },
    "Nagi3": {
      quote: "This is such a hassle.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Nagi2.png?raw=true"


    }, "Ness1": {
      quote: "It's over, bee boy; the same rhythm won't work again",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Ness.png?raw=true"
    },
    "Ness2": {
      quote: "With my ego, I want to cast a spell on your broken self.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Ness2.png?raw=true"
    }, "Ness3": {
      quote: "A violation of loyalty to Kaiser. That’s your first yellow card.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Ness2.png?raw=true"
    },
    "Niko": {
      quote: "Oh, sorry I stepped on you. I mistook you for a bug.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Niko.png?raw=true"
    }, "Otoya1": {
      quote: "It’s ‘survival ego-ego rock, paper, scissors.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Otoya.png?raw=true"
    },
    "Otoya2": {
      quote: "Oh, hell yes. Fight, fight. I love these kinds of fights. It’s like Fight Club.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Otoya.png?raw=true"
    }, "Reo1": {
      quote: "But if I pass up this opportunity, I might not get a second chance.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Reo.png?raw=true"
    },
    "Reo2": {
      quote: "It’s not so easy to decide, is it?",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Reo.png?raw=true"
    }, "Rin1": {
      quote: "You’re operating at such a low level, I might actually die of boredom.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/rin1.png?raw=true"
    },
    "Rin2": {
      quote: "You will be the closest one to me watching as I conquer the world.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Rin1.png?raw=true"
    }, "Sae": {
      quote: "I'm taking this game to the next level.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Sae2.png?raw=true"
    },
    "Shidou1": {
      quote: "Football’s not just fun and games. It’s the very act of living… an explosion of life, you could say.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Shidou.png?raw=true"
    }, "Shidou2": {
      quote: "Hey genius, is a lifeform like me not enough of a reason for you to fight?",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Shidou2.png?raw=true"
    },
    "Yukimiya1": {
      quote: "God never gives us more than we can handle.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Yukimiya.png?raw=true"
    }, "Yukimiya2": {
      quote: "No matter how far I fall, I won't hand over this ego. Not even to God himself!",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Yukimiya.png?raw=true"
    },
    "karasu": {
      quote: "All that crap about people’s expectations. Think about that later. Start with yourself. Believe in yourself.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/karasu.png?raw=true"
    },

    // Add more characters as needed
  };

  function getCharacterFromPath(cardUrl) {
    // Example: cardUrl = ".../Cards/S/Kaiser_1.png?..."
    const match = cardUrl.match(/S%2F([A-Za-z0-9]+)\.png/);
    return match ? match[1].split("_")[0] : null; // "Kaiser"
  }

  function showSCardAnimation(cardUrl) {
    const character = getCharacterFromPath(cardUrl);
    if (character && sCardAnimations[character]) {
      document.querySelector(".base-img").src = sCardAnimations[character].image;
      document.getElementById("animation-text").textContent = sCardAnimations[character].quote;
    } else {
      // fallback/default
      document.querySelector(".base-img").src = "default.png";
      document.getElementById("animation-text").textContent = "A true egoist never gives up.";
    }
  }

  function runSpecialAnimationDamn(cardUrl) {

    showSCardAnimation(cardUrl);

    // Set initial position via GSAP (optional, already done via CSS)
    gsap.set(".base-img", { y: 140, opacity: 0 });
    gsap.set(".text-img", { y: -300, opacity: 0 });
    let split = new SplitText(".animation-text", { type: "chars" });

    document.getElementById("animation-text").style.color = getRandomColor();

    gsap.set(split.chars, { opacity: 0 });


    const tl = gsap.timeline();

    // Blackout screen
    tl.to("#blackout", {
      opacity: 1,
      duration: 0.6,
      ease: "power2.inOut"
    });

    tl.call(() => {
      sfx.push.play();
    }, null, "+=-0.0"); // Delay of 1.2 seconds after previous animation



    // Drop text image


    tl.to(".animation-box", {
      opacity: 1,
    });

    tl.to(split.chars, {
      opacity: 1,
      ease: "power1.inOut",
      stagger: {
        each: 0.05,
        onStart: function () {
          sfx.type.rate(0.9 + Math.random() * 0.2); // optional pitch variety
          sfx.type.play();
        }
      }, // how fast each letter appears
      duration: 0.05,
    });




    // Drop base image AFTER text image
    tl.to(".base-img", { y: -50, opacity: 1, duration: 1, ease: "power1.out" }, "+=0.0")

    // Hold the image for a while
    tl.to([".base-img", ".animation-box"], {
      duration: 1, // <- Make this as long as you want
      opacity: 1,
      ease: "none"
    });

    // Fade out both images
    tl.to([".base-img", ".animation-box"], {
      opacity: 0,
      duration: 0.6,
      ease: "power2.inOut"
    });

    // Fade out blackout slightly later
    tl.to("#blackout", {
      opacity: 0,
      duration: 0.6,
      ease: "power2.inOut"
    }, "-=0.3"); // Overlap fade out
  }



  var sfx = {
    push: new Howl({
      src: "https://files.catbox.moe/b71v87.mp3",
      volume: 0.6
    }),
    type: new Howl({
      src: "https://files.catbox.moe/j48646.mp3",
      volume: 0.4 // adjust to your taste
    })
  }



  const cardInners = document.querySelectorAll('.card-inner');


  const cards = document.querySelectorAll('.card');
  let flippedCount = 0;
  const totalCards = 5;
  cards.forEach((card, idx) => {
    const inner = card.querySelector('.card-inner');
    const front = cardFronts[idx];
    card.addEventListener('click', () => {
      if (card.classList.contains('flipped')) return;

      const tl = gsap.timeline();

      tl.to(inner, {

        duration: 0.1,
        ease: 'power1.out'
      })
        .to(inner, {
          rotateY: 0, // <-- Flip to front
          duration: 0.6,
          ease: 'power2.inOut',
          onComplete: () => {
            card.classList.add('flipped');
            flippedCount++;

            const img = front.querySelector('img');
            if (img && (img.src.includes('/S/') || img.src.includes('/SS/'))) {
            }

            if (flippedCount === totalCards) {
              unlockEscapeClose();
            }
          }
        })
        .to(inner, {
          scale: 1,
          duration: 0.1,
          ease: 'power1.in'
        });
    });
  });





  const packModal = document.getElementById("pack-modal");

  function closePackModal() {
    packModal.classList.add("hidden");
    flippedCount = 0;

    // Reset all cards for next time
    cards.forEach(card => card.classList.remove("flipped"));

    // Remove all images from each card-front
    cardFronts.forEach(front => {
      while (front.firstChild) {
        front.removeChild(front.firstChild);
      }
    });

    // Reset transform of all card-inner elements
    cardInners.forEach(inner => {
      gsap.set(inner, { rotateY: 180, scale: 1 }); // <-- this resets the visual state
    });
  }

  function unlockEscapeClose() {
    document.addEventListener("keydown", escHandler);
    document.addEventListener("click", outsideClickHandler);
  }

  function escHandler(e) {
    if (e.key === "Escape" && !packModal.classList.contains("hidden")) {
      closePackModal();
      document.removeEventListener("keydown", escHandler);
      document.removeEventListener("click", outsideClickHandler);
    }
  }

  function outsideClickHandler(event) {
    // If modal is open and click is on the modal overlay or outside the modal content
    if (
      !packModal.classList.contains("hidden") &&
      (event.target === packModal || !packModal.contains(event.target) || event.target === overlay)
    ) {
      closePackModal();
      document.removeEventListener("keydown", escHandler);
      document.removeEventListener("click", outsideClickHandler);
    }
  }


  const modal = document.getElementsByClassName("modal-container");
  const pack = document.querySelectorAll(".pack-image");
  const overlay = document.getElementById("modal-overlay");

  pack.forEach(element => {
    element.addEventListener("click", () => {
      console.log("hmm")
      gsap.to(overlay, { opacity: 1, duration: 0.3 });
      if (element.classList.contains("common")) {
        const element = document.getElementById("team-z");
        element.classList.remove("hidden");
        gsap.to(".team-z",
          { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out", zIndex: 5 }
        );
      }
      else if (element.classList.contains("epic")) {
        const element = document.getElementById("team-v");
        element.classList.remove("hidden");
        gsap.to(".team-v",
          { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out", zIndex: 5 }
        );
      }
      else if (element.classList.contains("legendary")) {
        const element = document.getElementById("team-a");
        element.classList.remove("hidden");
        gsap.to(".team-a",
          { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out", zIndex: 5 }
        );
      }
      else if (element.classList.contains("green-cards")) {
        const element = document.getElementById("greenCards");
        element.classList.remove("hidden");
        gsap.to(".greenCards",
          { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out", zIndex: 5 }
        );
      }
      else if (element.classList.contains("red-cards")) {
        const element = document.getElementById("redCards")
        element.classList.remove("hidden");
        gsap.to(".redCards",
          { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out", zIndex: 5 }
        );
      }
      else if (element.classList.contains("power-ups")) {
        const element = document.getElementById("powerUps");
        element.classList.remove("hidden");
        gsap.to(".powerUps",
          { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out", zIndex: 5 }
        );
      }
      else if (element.classList.contains("effect-cards")) {
        const element = document.getElementById("effectCards")
        element.classList.remove("hidden");
        gsap.to(".effectCards",
          { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out", zIndex: 5 }
        );
      }
      else if (element.classList.contains("character-boosts")) {
        const element = document.getElementById("characterBoosts")
        element.classList.remove("hidden");
        gsap.to(".characterBoosts",
          { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out", zIndex: 5 }
        );
      }
    });
  });




  const close = document.querySelectorAll(".close");


  function closeModal() {
    gsap.to(modal, { opacity: 0, scale: 0.9, duration: 0.3, ease: "power2.in", zIndex: -5 });
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.3,
    });
  }
  close.forEach(element => {
    element.addEventListener("click", closeModal);
  });

});










