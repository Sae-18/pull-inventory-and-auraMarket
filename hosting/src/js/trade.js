import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot,
    collection, getDocs, addDoc, connectFirestoreEmulator,
    writeBatch, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// 🔗 Connect to emulators
connectAuthEmulator(auth, "http://127.0.0.1:9099");
connectFirestoreEmulator(db, "127.0.0.1", 8080);

let currentUser = null;
let currentTradeId = null;
let selectedCards = [];

const logDebug = (msg, data = null) => {
    console.log(msg, data || "");
    const debugBox = document.getElementById("tradeDebug");
    debugBox.textContent += `\n[${new Date().toLocaleTimeString()}] ${msg} ${data ? JSON.stringify(data) : ""}`;
};

// 🔑 Login
document.getElementById("loginBtn").onclick = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
};
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        document.getElementById("userInfo").innerText =
            `Logged in as: ${user.displayName} (${user.uid})`;
        logDebug("User already logged in", { uid: user.uid });
        loadInventory(); // load user cards immediately
    } else {
        document.getElementById("userInfo").innerText = "Not logged in.";
    }
});

// 📦 Load inventory
async function loadInventory(uid = currentUser?.uid) {
    if (!uid) {
        console.warn("No UID passed to loadInventory");
        return;
    }
    const invRef = collection(db, "users", uid, "inventory");
    const snapshot = await getDocs(invRef);

    const inventoryDiv = document.getElementById("inventory");
    inventoryDiv.innerHTML = ""; // clear

    if (snapshot.empty) {
        inventoryDiv.innerHTML = `<p class="text-gray-400">No cards in inventory.</p>`;
        return;
    }

    // Tailwind grid layout
    const grid = document.createElement("div");
    grid.className = "flex flex-wrap justify-around gap-4 items-center";

    snapshot.forEach((docSnap) => {
        const card = { id: docSnap.id, ...docSnap.data() };

        // Card wrapper
        const cardEl = document.createElement("div");
        cardEl.className =
            "relative group border border-gray-700 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer";

        // Card image
        const img = document.createElement("img");
        img.src = card.imageURL;
        img.alt = card.rarity || "Card";
        img.className = "w-full h-40 object-cover";

        // Hover overlay
        const overlay = document.createElement("div");
        overlay.className =
            "absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition";
        overlay.innerHTML = `
          <span class="text-xs text-gray-200">${card.pack || ""}</span>
          <span class="text-sm font-bold text-white">Rarity: ${card.rarity || ""}</span>
        `;

        // 👉 Make card clickable to toggle selection
        cardEl.onclick = () => {
            const index = selectedCards.findIndex(c => c.id === card.id);
            if (index === -1) {
                selectedCards.push(card);
                cardEl.classList.add("ring-4", "ring-green-500"); // visual highlight
            } else {
                selectedCards.splice(index, 1);
                cardEl.classList.remove("ring-4", "ring-green-500");
            }
            logDebug("Selected cards updated", selectedCards);
        };

        cardEl.appendChild(img);
        cardEl.appendChild(overlay);
        grid.appendChild(cardEl);
    });

    inventoryDiv.appendChild(grid);
}


// 🏠 Create trade lobby
document.getElementById("createTrade").onclick = async () => {
    const tradeRef = await addDoc(collection(db, "trades"), {
        createdBy: currentUser.uid,
        status: "pending",
        players: [currentUser.uid],
        offers: {},
        confirmations: { [currentUser.uid]: false }
    });
    currentTradeId = tradeRef.id;
    listenToTrade(currentTradeId);
    logDebug("Trade lobby created", { tradeId: currentTradeId });
    alert("Trade Lobby Created. ID: " + currentTradeId);
};

// 🎮 Join trade
document.getElementById("joinTrade").onclick = async () => {
    const id = document.getElementById("tradeIdInput").value;
    const ref = doc(db, "trades", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        logDebug("Invalid trade ID", id);
        return alert("Invalid trade ID");
    }
    currentTradeId = id;

    const data = snap.data();
    if (!data.players.includes(currentUser.uid)) {
        await updateDoc(ref, {
            players: [...data.players, currentUser.uid],
            confirmations: { ...data.confirmations, [currentUser.uid]: false }
        });
        logDebug("Joined trade", { tradeId: id });
    }

    onSnapshot(ref, (docSnap) => {
        const data = docSnap.data();
        document.getElementById("tradeStatus").innerText =
            "Trade Status: " + data.status;
        logDebug("Trade updated", data);
        maybeEnableFinalize(data);

        // Render opponent’s offer
        const opponentId = data.players.find(p => p !== currentUser.uid);
        if (opponentId && data.offers?.[opponentId]) {
            renderOffer("opponentOffer", data.offers[opponentId]);
        }

        // Render your own offer from Firestore (to keep synced)
        if (data.offers?.[currentUser.uid]) {
            renderOffer("yourOffer", data.offers[currentUser.uid]);
        }
    });

    document.getElementById("confirmOffer").disabled = false;
    listenToTrade(currentTradeId);
};


// 📡 Trade listener
function listenToTrade(tradeId) {
    const ref = doc(db, "trades", tradeId);

    onSnapshot(ref, async (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();

        // Update trade status in UI
        document.getElementById("tradeStatus").innerText =
            "Trade Status: " + data.status;

        // Disable finalize + cancel if completed/cancelled
        if (data.status === "completed" || data.status === "cancelled") {
            document.getElementById("finalizeTrade").disabled = true;
            document.getElementById("cancelTrade").disabled = true;
            return;
        }

        const players = data.players || [];
        if (players.length !== 2) return;

        const [p1, p2] = players;
        const myId = currentUser.uid;
        const oppId = players.find(p => p !== myId);

        const myConfirm = data.confirmations?.[myId] || false;
        const oppConfirm = data.confirmations?.[oppId] || false;

        // Prompt if opponent confirmed
        if (!myConfirm && oppConfirm && !window._alreadyPrompted) {
            window._alreadyPrompted = true;
            const confirmNow = confirm("Opponent confirmed the trade. Do you also want to confirm?");
            if (confirmNow) {
                document.getElementById("finalizeTrade").click();
            } else {
                document.getElementById("cancelTrade").click();
            }
        }

        // Both confirmed → finalize
        if (myConfirm && oppConfirm) {
            await executeTrade(ref, data, p1, p2);
        }
    });
}



// 📩 Confirm offer
document.getElementById("confirmOffer").onclick = async () => {
    if (!currentTradeId) return alert("Not in a trade");
    const ref = doc(db, "trades", currentTradeId);

    await updateDoc(ref, {
        [`offers.${currentUser.uid}`]: selectedCards
    });

    renderOffer("yourOffer", selectedCards); // 👈 show locally
    logDebug("Offer submitted", selectedCards);
    alert("Offer submitted");
};
// 🖱️ Finalize button → only set my confirmation
document.getElementById("finalizeTrade").onclick = async () => {
    if (!currentTradeId) return alert("Not in a trade");
    const ref = doc(db, "trades", currentTradeId);

    await updateDoc(ref, {
        [`confirmations.${currentUser.uid}`]: true
    });

    logDebug("You confirmed the trade.");
    alert("Waiting for opponent to confirm...");
};

// 🔄 Execute trade once
async function executeTrade(ref, data, p1, p2) {
    if (data.status === "completed") return; // avoid double-run

    const offer1 = data.offers[p1] || [];
    const offer2 = data.offers[p2] || [];

    const batch = writeBatch(db);

    // Player1 → Player2
    offer1.forEach(card => {
        const oldRef = doc(db, "users", p1, "inventory", card.id);
        const newRef = doc(db, "users", p2, "inventory", card.id);
        batch.delete(oldRef);
        batch.set(newRef, card);
    });

    // Player2 → Player1
    offer2.forEach(card => {
        const oldRef = doc(db, "users", p2, "inventory", card.id);
        const newRef = doc(db, "users", p1, "inventory", card.id);
        batch.delete(oldRef);
        batch.set(newRef, card);
    });

    // ✅ Mark trade complete so loop breaks
    batch.update(ref, { status: "completed" });

    await batch.commit();

    logDebug("Trade finalized", { tradeId: ref.id });
    alert("✅ Trade Completed!");
    await verifyTrade(p1, p2, offer1, offer2);
}

// ✅ Enable finalize button when both players offer
function maybeEnableFinalize(data) {
    if (data.players?.length === 2 &&
        data.offers?.[data.players[0]]?.length > 0 &&
        data.offers?.[data.players[1]]?.length > 0) {
        document.getElementById("finalizeTrade").disabled = false;
    }
}


// Fetch and log user inventory
async function checkInventory(userId) {
    const invRef = collection(db, "users", userId, "inventory");
    const snapshot = await getDocs(invRef);
    const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`Inventory of ${userId}:`, cards);
    return cards;
}

// Example: check after trade
/**
 * Verify that traded cards are in the correct users' inventories.
 * @param {string} p1 - Player1 UID
 * @param {string} p2 - Player2 UID
 * @param {Array} offer1 - Cards p1 offered
 * @param {Array} offer2 - Cards p2 offered
 */
async function verifyTrade(p1, p2, offer1, offer2) {
    console.log("=== Verifying Specific Traded Cards ===");

    // Check cards Player1 gave → should now be in Player2's inventory
    for (const card of offer1) {
        const ref = doc(db, "users", p2, "inventory", card.id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            console.log(`✅ Card ${card.id} successfully moved to ${p2}`);
        } else {
            console.warn(`❌ Card ${card.id} missing from ${p2}`);
        }
    }

    // Check cards Player2 gave → should now be in Player1's inventory
    for (const card of offer2) {
        const ref = doc(db, "users", p1, "inventory", card.id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            console.log(`✅ Card ${card.id} successfully moved to ${p1}`);
        } else {
            console.warn(`❌ Card ${card.id} missing from ${p1}`);
        }
    }

    console.log("Verification done.");
}
function renderOffer(containerId, cards) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (!cards || cards.length === 0) {
        container.innerHTML = `<p class="text-gray-400 col-span-full">No cards offered.</p>`;
        return;
    }

    cards.forEach(card => {
        const cardEl = document.createElement("div");
        cardEl.className = "border border-gray-600 rounded overflow-hidden";

        const img = document.createElement("img");
        img.src = card.imageURL;
        img.alt = card.rarity || "Card";
        img.className = "w-full h-20 object-cover";

        cardEl.appendChild(img);
        container.appendChild(cardEl);
    });
}



