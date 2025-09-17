import { getStorage, ref, connectStorageEmulator, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";
import { getFirestore, getDoc, connectFirestoreEmulator, doc, setDoc, updateDoc, onSnapshot, runTransaction, arrayUnion, collection, addDoc, serverTimestamp, increment } from "firebase/firestore"
import { getAuth, connectAuthEmulator, onAuthStateChanged, signOut } from "firebase/auth";
const firebaseConfig = { apiKey: "AIzaSyDytcogmq5L0UO9k59A5bamvdir23rQAJY", authDomain: "egokaisaesultimatetcg.firebaseapp.com", projectId: "egokaisaesultimatetcg", storageBucket: "gs://egokaisaesultimatetcg.firebasestorage.app", messagingSenderId: "251217603044", appId: "1:251217603044:web:7b655a1d68a4488f063ff1" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
if (location.hostname === "localhost") { // Point to the Storage emulator running on localhost. 
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
}
const docRef = doc(db, "users", "saCc4mt8I1bAcJ66blO3JxE65YEm");
const docSnap = await getDoc(docRef);
const cardRef = doc(collection(docRef, "inventory"));
// === SETUP ===
const auraAmount = document.getElementById("aura-amount");


// === REALTIME LISTENER ===
onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
        const data = docSnap.data();
        auraAmount.textContent = data.Aura; // UI updates instantly when doc changes
    }
});

// === SAFE TRANSACTION ===
async function purchaseCard(cost = 75, imgUrl = "Assets/1.png") {
    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(docRef);
            if (!userDoc.exists()) throw "User doc missing";

            const currentAura = userDoc.data().Aura;
            if (currentAura < cost) throw "Not enough Aura";

            // Deduct Aura safely
            transaction.update(docRef, { Aura: currentAura - cost });

            // Add a card to inventory (new doc in subcollection)
            const cardRef = doc(collection(docRef, "inventory"));
            transaction.set(cardRef, {
                createdAt: new Date(),
                cost: cost,
                imgUrl: imgUrl
            });
        });

        // Success → animation
        runPurchaseAnimation(imgUrl);

    } catch (e) {
        console.error("Transaction failed: ", e);
    }
}

// === BUTTON LOGIC ===
// === BUTTON LOGIC WITH CONFIRMATION ===

const cButton = document.getElementById("C");
cButton.addEventListener("click", async () => {
    const confirmed = await confirmPurchase(25); // cost of the pack
    if (confirmed) {
        purchaseCard(25);
    } else {
        console.log("Purchase cancelled.");
    }
});

const bButton = document.getElementById("B");
bButton.addEventListener("click", async () => {
    const confirmed = await confirmPurchase(35); // cost of the pack
    if (confirmed) {
        purchaseCard(35);
    } else {
        console.log("Purchase cancelled.");
    }
});

const aButton = document.getElementById("A");
aButton.addEventListener("click", async () => {
    const confirmed = await confirmPurchase(50); // cost of the pack
    if (confirmed) {
        purchaseCard(50);
    } else {
        console.log("Purchase cancelled.");
    }
});

const sButton = document.getElementById("S");
sButton.addEventListener("click", async () => {
    const confirmed = await confirmPurchase(100); // cost of the pack
    if (confirmed) {
        purchaseCard(100);
    } else {
        console.log("Purchase cancelled.");
    }
});

const ssButton = document.getElementById("SS");
ssButton.addEventListener("click", async () => {
    const confirmed = await confirmPurchase(150); // cost of the pack
    if (confirmed) {
        purchaseCard(150);
    } else {
        console.log("Purchase cancelled.");
    }
});

const powerUpButton = document.getElementById("power-up");
powerUpButton.addEventListener("click", async () => {
    const confirmed = await confirmPurchase(100); // cost of the pack
    if (confirmed) {
        purchaseCard(100);
    } else {
        console.log("Purchase cancelled.");
    }
});

const effectCardButton = document.getElementById("effect-card");
effectCardButton.addEventListener("click", async () => {
    const confirmed = await confirmPurchase(75); // cost of the pack
    if (confirmed) {
        purchaseCard(75);
    } else {
        console.log("Purchase cancelled.");
    }
});

const rivalSynergyButton = document.getElementById("rival-synergy");
rivalSynergyButton.addEventListener("click", async () => {
    const confirmed = await confirmPurchase(50); // cost of the pack
    if (confirmed) {
        purchaseCard(50);
    } else {
        console.log("Purchase cancelled.");
    }
});

const synergyButton = document.getElementById("synergy");
synergyButton.addEventListener("click", async () => {
    const confirmed = await confirmPurchase(100); // cost of the pack
    if (confirmed) {
        purchaseCard(100);
    } else {
        console.log("Purchase cancelled.");
    }
});

const characterBoostButton = document.getElementById("character-boost");
characterBoostButton.addEventListener("click", async () => {
    const confirmed = await confirmPurchase(125); // cost of the pack
    if (confirmed) {
        purchaseCard(125);
    } else {
        console.log("Purchase cancelled.");
    }
});

// === PURCHASE ANIMATION (your code stays) ===
function runPurchaseAnimation(imgUrl) {
    const modal = document.getElementById("purchase-modal");
    const modalBox = modal.querySelector("div");
    const cardImg = document.getElementById("purchased-card");

    cardImg.src = imgUrl;
    modal.classList.remove("hidden");

    setTimeout(() => {
        modalBox.classList.remove("scale-75", "opacity-0");
        modalBox.classList.add("scale-100", "opacity-100");
    }, 50);

    setTimeout(() => {
        cardImg.classList.remove("scale-0", "opacity-0");
        cardImg.classList.add("scale-100", "opacity-100");
    }, 300);

    const closeBtn = document.getElementById("close-modal");
    closeBtn.onclick = () => {
        modal.classList.add("hidden");
        modalBox.classList.add("scale-75", "opacity-0");
        modalBox.classList.remove("scale-100", "opacity-100");
        cardImg.classList.add("scale-0", "opacity-0");
        cardImg.classList.remove("scale-100", "opacity-100");
    };
}

function confirmPurchase(cost) {
    return new Promise((resolve) => {
        const modal = document.getElementById("confirm-modal");
        const costSpan = document.getElementById("confirm-cost");
        const modalBox = modal.querySelector("div");
        const yesBtn = document.getElementById("confirm-yes");
        const noBtn = document.getElementById("confirm-no");

        costSpan.textContent = cost;

        modal.classList.remove("hidden");
        setTimeout(() => {
            modalBox.classList.remove("scale-75", "opacity-0");
            modalBox.classList.add("scale-100", "opacity-100");
        }, 50);

        yesBtn.onclick = () => {
            close();
            resolve(true);
        };

        noBtn.onclick = () => {
            close();
            resolve(false);
        };

        function close() {
            modal.classList.add("hidden");
            modalBox.classList.add("scale-75", "opacity-0");
            modalBox.classList.remove("scale-100", "opacity-100");
        }
    });

}
const labels = document.querySelectorAll('#planButtons label');

function setActive(label) {
    labels.forEach(l => {
        l.classList.remove(
            'bg-purple-600',
            'scale-105',
            'shadow-xl',
            'border-2',
            'border-purple-400'
        );
        l.classList.add('bg-purple-600/40');
    });
    label.classList.remove('bg-purple-600/40');
    label.classList.add(
        'bg-purple-600',
        'scale-105',
        'shadow-xl',
        'border-2',
        'border-purple-400'
    );
}

// default: weekly
setActive(labels[0]);

// click event
labels.forEach(label => {
    label.addEventListener('click', () => setActive(label));
});
