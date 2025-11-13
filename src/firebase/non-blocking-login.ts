
'use client';

import { Auth, signInAnonymously, signInWithEmailAndPassword } from "firebase/auth";

export const initiateAnonymousSignIn = (auth: Auth) => {
    signInAnonymously(auth).catch(error => {
        console.error("Anonymous sign-in failed:", error);
    });
};

export const initiateEmailSignIn = (auth: Auth, email: string, password: string) => {
    signInWithEmailAndPassword(auth, email, password).catch(error => {
        // Errors will be caught by the UI form, but we can log them here too.
        console.error("Email sign-in failed:", error.code, error.message);
        // Re-throw to allow form to catch it for UI feedback
        throw error;
    });
};
