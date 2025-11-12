
'use client';

import { DocumentReference, WriteBatch, doc, writeBatch, collection, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";

// Non-blocking updates for better UI/UX. These functions don't wait for Firestore's response.
// They are "fire and forget". Error handling should be done via Firestore rules and logs.

const getDb = () => {
    const { firestore } = initializeFirebase();
    return firestore;
}

export const setDocumentNonBlocking = (docRef: DocumentReference, data: any, options: { merge: boolean }) => {
    const db = getDb();
    const batch = writeBatch(db);
    batch.set(docRef, data, options);
    batch.commit().catch(error => {
        console.error("Non-blocking set failed:", error);
    });
};

export const addDocumentNonBlocking = (colRef: any, data: any) => {
    addDoc(colRef, data).catch(error => {
        console.error("Non-blocking add failed:", error);
    });
};

export const updateDocumentNonBlocking = (docRef: DocumentReference, data: any) => {
    updateDoc(docRef, data).catch(error => {
        console.error("Non-blocking update failed:", error);
    });
};

export const deleteDocumentNonBlocking = (docRef: DocumentReference) => {
    deleteDoc(docRef).catch(error => {
        console.error("Non-blocking delete failed:", error);
    });
};
