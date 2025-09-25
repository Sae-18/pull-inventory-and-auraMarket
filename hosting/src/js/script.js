import { getStorage, ref, connectStorageEmulator, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";
import { getFirestore, onSnapshot, runTransaction, getDoc, connectFirestoreEmulator, doc, setDoc, updateDoc, arrayUnion, writeBatch, collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore"
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


let masterCardsCache = null;

async function fetchMasterCards() {
  if (masterCardsCache) return masterCardsCache;

  const snapshot = await getDocs(collection(db, "cards"));
  masterCardsCache = snapshot.docs.map(doc => doc.data());
  return masterCardsCache;
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

  // --- PROBABILITY TABLES ---
  const rarityProbTables = {
    Burning: {  // Burning Egoists
      C: 0.60,
      B: 0.30,
      A: 0.09,
      S: 0.009,
      SS: 0.001,
    },
    Diamonds: { // Diamonds in the Rough
      C: 0.45,
      B: 0.35,
      A: 0.15,
      S: 0.049,
      SS: 0.001
    },
    Demons: {   // Demon Kings
      C: 0.20,
      B: 0.40,
      A: 0.30,
      S: 0.099,
      SS: 0.001
    }
  };


  function randomRarity(probTable) {
    const r = Math.random();
    let cumulative = 0;

    for (const [rarity, probability] of Object.entries(probTable)) {
      cumulative += probability;
      if (r <= cumulative) return rarity;
    }

    return "C"; // fallback
  }

  function pickCardByRarity(masterCards, rarity) {
    const filtered = masterCards.filter(c => c.rarity === rarity);
    if (filtered.length === 0) return undefined; // Defensive: no cards of this rarity
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  function renderCard(card, index) {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      img.onload = resolve;
      img.onerror = resolve;
      img.setAttribute("src", `/cards/${card.rarity}/${card.cardId}.png`);
      img.className =
        "card-front absolute w-full h-full left-0 top-0 [backface-visibility:hidden] pointer-events-none select-none";
      cardFronts[index].appendChild(img);
    });
  }

  // --- MAIN PULL FUNCTION ---
  async function pullCards(packType) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not logged in");

    const masterCards = await fetchMasterCards();
    const batch = writeBatch(db);
    const pulledCards = [];

    const probTable = rarityProbTables[packType];
    if (!probTable) throw new Error("Invalid pack type");

    // Default pulls
    for (let i = 0; i < cardFronts.length; i++) {
      const rarity = randomRarity(probTable);
      const card = pickCardByRarity(masterCards, rarity);

      const cardData = {
        ...card,
        imagePath: `hosting/public/cards/${card.rarity}/${card.cardId}.png`,
        timePulled: Date.now()
      };

      pulledCards.push(cardData);
      const cardRef = doc(collection(db, "users", user.uid, "inventory"));
      batch.set(cardRef, cardData);

      await renderCard(card, i);
    }

    // Guarantees
    if (packType === "Diamonds") {
      if (!pulledCards.some(c => ["A", "S", "SS"].includes(c.rarity))) {
        const guaranteed = pickCardByRarity(masterCards, "A");
        pulledCards[0] = guaranteed;
        const guaranteedRef = doc(collection(db, "users", user.uid, "inventory"));
        batch.set(guaranteedRef, guaranteed);
        while (cardFronts[0].firstChild) {
          cardFronts[0].removeChild(cardFronts[0].firstChild);
        }
        await renderCard(guaranteed, 0);
      }
    }

    if (packType === "Demons") {
      if (!pulledCards.some(c => ["S", "SS"].includes(c.rarity))) {
        const guaranteed = pickCardByRarity(masterCards, "S");
        pulledCards[0] = guaranteed;
        const guaranteedRef = doc(collection(db, "users", user.uid, "inventory"));
        batch.set(guaranteedRef, guaranteed);
        while (cardFronts[0].firstChild) {
          cardFronts[0].removeChild(cardFronts[0].firstChild);
        }
        await renderCard(guaranteed, 0);
      }
    }

    await batch.commit();
    return pulledCards;
  }

  // Usage
  // pullCards("Burning");   // Burning Egoists
  // pullCards("Diamonds");  // Diamonds in the Rough
  // pullCards("Demons");    // Demon Kings

  // Mock aura amount
  async function purchasePack(cost = 75, imgUrl = "") {
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
      throw e;
    }
  }

  let userDocRef;

  onAuthStateChanged(auth, (user) => {
    if (user) {
      userDocRef = collection(db, "users", user.uid, "inventory");
      // ...other user-dependent logic...
    }
  });

  const getNowBtnCmn = document.querySelectorAll(".get-now-common");
  const packCostCommon = 75;

  getNowBtnCmn.forEach(button => {
    button.addEventListener("click", async () => {
      try {
        // Use Firestore transaction to check and deduct Aura
        await purchasePack(packCostCommon);

        // Pull cards from Firestore (this already writes to Firestore)
        const pulledCards = await pullCards("Burning");

        // GSAP animation
        gsap.from(".card", {
          y: 500,
          duration: 1,
          ease: "back.out",
          stagger: 0.2
        });

        // Open modal
        document.getElementById("pack-modal").classList.remove("hidden");

        // Close modal & run checks
        closeModal();
        checkForSpecialCards();

      } catch (err) {
        alert("Not enough Aura!");
        console.error("Pull failed:", err);
      }
    });
  });

  const getNowBtnEpc = document.querySelectorAll(".get-now-epic");
  const packCostEpic = 150;
  getNowBtnEpc.forEach(button => {
    button.addEventListener("click", async () => {
      try {
        // Use Firestore transaction to check and deduct Aura
        await purchasePack(packCostEpic);

        // Pull cards from Firestore (this already writes to Firestore)
        const pulledCards = await pullCards("Diamonds");

        // GSAP animation
        gsap.from(".card", {
          y: 500,
          duration: 1,
          ease: "back.out",
          stagger: 0.2
        });

        // Open modal
        document.getElementById("pack-modal").classList.remove("hidden");

        // Close modal & run checks
        closeModal();
        checkForSpecialCards();

      } catch (err) {
        alert("Not enough Aura!");
        console.error("Pull failed:", err);
      }
    });
  });


  const getNowBtnLgndry = document.querySelectorAll(".get-now-legendary");
  const packCostLegendary = 200;
  getNowBtnLgndry.forEach(button => {
    button.addEventListener("click", async () => {
      try {
        // Use Firestore transaction to check and deduct Aura
        await purchasePack(packCostLegendary);

        // Pull cards from Firestore (this already writes to Firestore)
        const pulledCards = await pullCards("Demons");

        // GSAP animation
        gsap.from(".card", {
          y: 500,
          duration: 1,
          ease: "back.out",
          stagger: 0.2
        });

        // Open modal
        document.getElementById("pack-modal").classList.remove("hidden");

        // Close modal & run checks
        closeModal();
        checkForSpecialCards();

      } catch (err) {
        alert("Not enough Aura!");
        console.error("Pull failed:", err);
      }
    });
  });

  function showComingSoon() {
    const modal = document.getElementById("coming-soon-modal");
    modal.classList.remove("hidden");

    // Trap focus and close on click
    function closeModal() {
      modal.classList.add("hidden");
      document.removeEventListener("keydown", escHandler);
    }
    function escHandler(e) {
      if (e.key === "Escape") closeModal();
    }

    document.getElementById("close-coming-soon").onclick = closeModal;
    document.getElementById("close-coming-soon-x").onclick = closeModal;
    document.addEventListener("keydown", escHandler);

    // Optional: close when clicking outside the modal box
    modal.onclick = function (e) {
      if (e.target === modal) closeModal();
    };
  }



  // Synergies Pack
  const getNowBtnSynergies = document.querySelectorAll(".synergies");
  const packCostSynergies = 150;
  getNowBtnSynergies.forEach(button => {
    button.addEventListener('click', () => {
      showComingSoon();
    });
  });


  // Rival Synergies Pack
  const getNowBtnRival = document.querySelectorAll(".rival-synergies");
  const packCostRival = 150;
  getNowBtnRival.forEach(button => {
    button.addEventListener('click', () => {
      showComingSoon();
    });
  });


  // Effect Cards Pack
  const getNowBtnEffect = document.querySelectorAll(".effect-card");
  const packCostEffect = 100;
  getNowBtnEffect.forEach(button => {
    button.addEventListener('click', () => {
      showComingSoon();
    });
  });


  // Character Boosts Pack
  const getNowBtnBoosts = document.querySelectorAll(".character-boost");
  const packCostBoosts = 120;
  getNowBtnBoosts.forEach(button => {
    button.addEventListener('click', () => {
      showComingSoon();
    });
  });



  // Power Ups Pack
  const getNowBtnPowerUps = document.querySelectorAll(".power-up");
  const packCostPowerUps = 130;
  getNowBtnPowerUps.forEach(button => {
    button.addEventListener('click', () => {
      showComingSoon();

    });
  });



  function checkForSpecialCards() {
    console.log("detected");

    cardFronts.forEach((front, idx) => {
      const img = front.querySelector("img");
      // ...existing code...
      if (
        img &&
        img.src &&
        (img.src.includes("/cards/S/") || img.src.includes("/cards/SS/"))
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
    "S23": {
      quote: "“For the rebirth of Japanese football, I am the final wall!” ",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/aiku.png?raw=true"
    },
    "S19": {
      quote: "“ Luck descends equally upon only those who are truly prepared to fight” ",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Ego.png?raw=true"
    },
    "S27": {
      quote: "Stand out. Talent is just a lump of ore... and if you don't smelt and polish it, it's nothing but trash",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Ego2.png?raw=true"
    },
    "S08": {
      quote: "It's not a matter of making the right choice... I'll make it so the path I choose is the right one.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Bachira1.png?raw=true"

    }, "S41": {
      quote: "In this whole wide world, i'm the only one that can save me.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Bachira2.png?raw=true"
    },
    "S20": {
      quote: "On the field, there is already one true king.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Barou2.png?raw=true"
    }, "S30": {
      quote: "Well, the more you tell me to do something, the less I wanna. Guess that makes me a contrarian.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Charles.png?raw=true"
    },
    "S12": {
      quote: "This is the moment I’ve been waiting for…my speed, will roar through the world!!",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/chigiri.png?raw=true"
    }, "S44": {
      quote: "Your evolution's slow, blue lockers.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Chigiri2.png?raw=true"
    },
    "S18": {
      quote: "Are you the goalkeeper? Today's The first time I'm playing as one.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Gagamaru2.png?raw=true"
    }, "S26": {
      quote: "It's still just a copy.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Gagamaru2.png?raw=true"
    },
    "S36": {
      quote: "I finally get the ball again.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Gagamaru2.png?raw=true"
    }, "S38": {
      quote: "Just stop. Disgusting. Don’t heap your expectations on me ever again",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/hiyori1.png?raw=true"
    },
    "S15": {
      quote: "How does it feel to be the clown of my story?",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/isagi 1.png?raw=true"
    }, "S24": {
      quote: "Become the one that chooses, not the one that gets chosen.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/isagi 1.png?raw=true"
    },
    "S35": {
      quote: "I need you to shut up genius, I'm about to get to the good part ",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/isagi 1.png?raw=true"
    }, "S06": {
      quote: "All the hope we need is in the fact that I’m around, and nothing else",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Kaiser1.png?raw=true"
    },
    "S13": {
      quote: "For me, nothing is impossible.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Kaiser2.png?raw=true"
    }, "S29": {
      quote: "Auf die Knie Blue Lock!",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Kaiser3.png?raw=true"
    },
    "S34": {
      quote: "I was and will be alone, God's own chosen emperor.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Kaiser3.png?raw=true"
    },

    "S05": {
      quote: "I follow my own way of dominance. Go bark up another tree, you parasite",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Kunigami.png?raw=true"
    },
    "S16": {
      quote: "I don't call myself that anymore, I left that childish dumbassery in hell.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Kunigami.png?raw=true"
    },
    "S25": {
      quote: "Don't forget about this dark horse.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Kunigami.png?raw=true"
    },
    "S39": {
      quote: "Egoists are all talk, huh?",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Kunigami.png?raw=true"
    }, "S21": {
      quote: "Huh? Aren't you worth absolutely zero? Can I call you Mr. Worthless?",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Lorenzo.png?raw=true"
    },
    "S01": {
      quote: "Nice to meet you Japan, I am Nagi Seishiro.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Nagi1.png?raw=true"
    }, "S10": {
      quote: "I don't care if i have to crush Blue Lock.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Nagi2.png?raw=true"
    },
    "S42": {
      quote: "This is such a hassle.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Nagi2.png?raw=true"


    }, "S07": {
      quote: "It's over, bee boy; the same rhythm won't work again",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Ness.png?raw=true"
    },
    "S14": {
      quote: "With my ego, I want to cast a spell on your broken self.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Ness2.png?raw=true"
    }, "S28": {
      quote: "A violation of loyalty to Kaiser. That’s your first yellow card.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Ness2.png?raw=true"
    },
    "S22": {
      quote: "Oh, sorry I stepped on you. I mistook you for a bug.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Niko.png?raw=true"
    }, "S09": {
      quote: "It’s ‘survival ego-ego rock, paper, scissors.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Otoya.png?raw=true"
    },
    "S40": {
      quote: "Oh, hell yes. Fight, fight. I love these kinds of fights. It’s like Fight Club.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Otoya.png?raw=true"
    }, "S11": {
      quote: "But if I pass up this opportunity, I might not get a second chance.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Reo.png?raw=true"
    },
    "S43": {
      quote: "It’s not so easy to decide, is it?",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Reo.png?raw=true"
    }, "S04": {
      quote: "You’re operating at such a low level, I might actually die of boredom.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/rin1.png?raw=true"
    },
    "S31": {
      quote: "You will be the closest one to me watching as I conquer the world.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Rin1.png?raw=true"
    }, "S03": {
      quote: "I'm taking this game to the next level.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Sae2.png?raw=true"
    },
    "S02": {
      quote: "Football’s not just fun and games. It’s the very act of living… an explosion of life, you could say.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Shidou.png?raw=true"
    }, "S33": {
      quote: "Hey genius, is a lifeform like me not enough of a reason for you to fight?",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Shidou2.png?raw=true"
    },
    "S17": {
      quote: "God never gives us more than we can handle.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Yukimiya.png?raw=true"
    }, "S37": {
      quote: "No matter how far I fall, I won't hand over this ego. Not even to God himself!",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/Yukimiya.png?raw=true"
    },
    "S32": {
      quote: "All that crap about people’s expectations. Think about that later. Start with yourself. Believe in yourself.",
      image: "https://github.com/Sae-18/assets-for-tcg/blob/main/animationImages/karasu.png?raw=true"
    },

    // Add more characters as needed
  };

  function getCharacterFromPath(cardUrl) {
    // Example: cardUrl = ".../cards/S/S01.png"
    const match = cardUrl.match(/\/cards\/[A-Z]+\/([A-Z0-9]+)\.png/);
    return match ? match[1] : null; // "S01"
  }

  let split;
  let currentTL;

  function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  function showSCardAnimation(cardUrl) {
    const character = getCharacterFromPath(cardUrl);
    const baseImg = document.querySelector(".base-img");
    const textEl = document.getElementById("animation-text");

    if (character && sCardAnimations[character]) {
      baseImg.src = sCardAnimations[character].image;
      textEl.textContent = sCardAnimations[character].quote;
    } else {
      baseImg.src = "default.png";
      textEl.textContent = "A true egoist never gives up.";
    }

    // adjust font size dynamically for mobile
    textEl.style.fontSize = isMobile() ? "14px" : "24px";
    textEl.style.lineHeight = isMobile() ? "1.3" : "1.6";
    textEl.style.wordWrap = "break-word";
    textEl.style.whiteSpace = "normal"; // prevent overflow
    textEl.style.textAlign = "center";  // keep it neat
  }

  function runSpecialAnimationDamn(cardUrl) {
    // Kill old timeline + split to avoid ghosts
    if (currentTL) currentTL.kill();
    if (split) split.revert();

    // Inject the new animation assets
    showSCardAnimation(cardUrl);

    const baseImg = document.querySelector(".base-img");
    const textEl = document.getElementById("animation-text");

    // Reset positions before anim

    gsap.set(baseImg, { y: isMobile() ? 80 : 140, opacity: 0 });
    gsap.set(".text-img", { y: isMobile() ? -150 : -300, opacity: 0 });

    // Proper wrapping: split into words + chars
    split = new SplitText(textEl, { type: "words,chars" });

    // Give text a fresh color
    textEl.style.color = getRandomColor();

    gsap.set(split.chars, { opacity: 0 });

    // Build timeline
    const tl = gsap.timeline();
    currentTL = tl;

    // Blackout screen
    tl.to("#blackout", {
      opacity: 1,
      duration: 0.6,
      ease: "power2.inOut"
    });

    // Play SFX
    tl.call(() => sfx.push.play());

    // Fade in text box
    tl.to(".animation-box", { opacity: 1 });

    // Typewriter (character by character)
    tl.to(split.chars, {
      opacity: 1,
      ease: "power1.inOut",
      stagger: {
        each: 0.05,
        onStart: () => {
          sfx.type.rate(0.9 + Math.random() * 0.2);
          sfx.type.play();
        }
      },
      duration: 0.05
    });

    // Drop base image AFTER text
    tl.to(baseImg, {
      y: isMobile() ? -300 : -50,
      opacity: 1,
      duration: isMobile() ? 0.8 : 1,
      ease: "power1.out"
    }, "+=0.2");

    // Hold
    tl.to([baseImg, ".animation-box"], {
      duration: isMobile() ? 0.8 : 1,
      opacity: 1,
      ease: "none"
    });

    // Fade out everything
    tl.to([baseImg, ".animation-box"], {
      opacity: 0,
      duration: 0.6,
      ease: "power2.inOut"
    });

    // Fade out blackout
    tl.to("#blackout", {
      opacity: 0,
      duration: 0.6,
      ease: "power2.inOut"
    }, "-=0.3");

    // Cleanup after animation
    tl.call(() => {
      if (split) split.revert();
    });
  }





  var sfx = {
    push: new Howl({
      src: "Assets/sAnimationAudio.mp3",
      volume: 0.6
    }),
    type: new Howl({
      src: "https://files.catbox.moe/j48646.mp3",
      volume: 0.6 // adjust to your taste
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

  // Helper function to open modal with GSAP
  function openModal(id, className) {
    const element = document.getElementById(id);
    element.classList.remove("hidden");
    gsap.to("." + className, {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      ease: "power2.out",
      zIndex: 5
    });
  }

  pack.forEach(element => {
    element.addEventListener("click", () => {
      console.log("Pack clicked");
      gsap.to(overlay, { opacity: 1, duration: 0.3 });

      // Desktop or mobile?
      const isMobile = window.innerWidth < 768;

      if (element.classList.contains("common")) {
        if (isMobile) {
          openModal("team-z-mobile", "team-z"); // mobile modal
        } else {
          openModal("team-z", "team-z"); // desktop modal
        }
      }
      else if (element.classList.contains("epic")) {
        if (isMobile) {
          openModal("team-v-mobile", "team-v"); // mobile modal
        } else {
          openModal("team-v", "team-v"); // desktop modal
        }
      }
      else if (element.classList.contains("legendary")) {
        if (isMobile) {
          openModal("team-a-mobile", "team-a"); // mobile modal
        } else {
          openModal("team-a", "team-a"); // desktop modal
        }
      }
      else if (element.classList.contains("green-cards")) {
        if (isMobile) {
          openModal("greenCards-mobile", "greenCards-mobile"); // mobile modal
        } else {
          openModal("greenCards", "greenCards"); // desktop modal
        }
      }
      else if (element.classList.contains("red-cards")) {
        if (isMobile) {
          openModal("redCards-mobile", "redCards-mobile"); // mobile modal
        } else {
          openModal("redCards", "redCards"); // desktop modal
        }
      }
      else if (element.classList.contains("power-ups")) {
        if (isMobile) {
          openModal("powerUps-mobile", "powerUps-mobile"); // mobile modal
        } else {
          openModal("powerUps", "powerUps"); // desktop modal
        }
      }
      else if (element.classList.contains("effect-cards")) {
        if (isMobile) {
          openModal("effectCards-mobile", "effectCards-mobile"); // mobile modal
        } else {
          openModal("effectCards", "effectCards"); // desktop modal
        }
      }
      else if (element.classList.contains("character-boosts")) {
        if (isMobile) {
          openModal("characterBoosts-mobile", "characterBoosts-mobile"); // mobile modal
        } else {
          openModal("characterBoosts", "characterBoosts"); // desktop modal
        }
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










