import * as v2 from "firebase-functions/v2";
import * as v1 from "firebase-functions/v1";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";


initializeApp();

export const helloWorld = v1.auth.user().onCreate(async (user) => {

  return getFirestore().collection("Users").doc(user.uid).set({
    email: user.email,
    aura: 0,
    ownedCards: [],
    pullHistory: [],
    payments: [],
    createdAt: new Date().toISOString(),
  });
});


export const addInventory = v1.firestore.document('users/')

