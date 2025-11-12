
'use client';

import { Auth, signInAnonymously } from "firebase/auth";

export const initiateAnonymousSignIn = (auth: Auth) => {
    signInAnonymously(auth).catch(error => {
        console.error("Anonymous sign-in failed:", error);
    });
};
