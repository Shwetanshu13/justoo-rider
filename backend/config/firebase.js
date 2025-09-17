import admin from "firebase-admin";

// Initialize Firebase Admin SDK
let firebaseApp;

const initializeFirebase = () => {
    if (!firebaseApp) {
        // In production, you should use a service account key file
        // For development, you can use the Firebase Admin SDK with environment variables
        const serviceAccount = {
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(
                /\\n/g,
                "\n"
            ),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url:
                "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
        };

        try {
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID,
            });
            console.log("Firebase Admin SDK initialized successfully");
        } catch (error) {
            console.error("Error initializing Firebase Admin SDK:", error);
            // In development, you might want to continue without Firebase
            // In production, you should handle this more strictly
        }
    }
    return firebaseApp;
};

// Verify Firebase ID token
export const verifyFirebaseToken = async (idToken) => {
    try {
        if (!firebaseApp) {
            initializeFirebase();
        }

        if (!firebaseApp) {
            throw new Error("Firebase not initialized");
        }

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error("Error verifying Firebase token:", error);
        throw error;
    }
};

// Get user by UID
export const getFirebaseUser = async (uid) => {
    try {
        if (!firebaseApp) {
            initializeFirebase();
        }

        if (!firebaseApp) {
            throw new Error("Firebase not initialized");
        }

        const userRecord = await admin.auth().getUser(uid);
        return userRecord;
    } catch (error) {
        console.error("Error getting Firebase user:", error);
        throw error;
    }
};

export default { initializeFirebase, verifyFirebaseToken, getFirebaseUser };
