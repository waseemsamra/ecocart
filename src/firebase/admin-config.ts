
import admin from 'firebase-admin';

// This is the shape of the service account key JSON file.
interface ServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

// Function to safely parse the service account key from environment variables.
const getServiceAccount = (): ServiceAccount | null => {
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env;

  const missingVars = [];
  if (!FIREBASE_PROJECT_ID) missingVars.push('FIREBASE_PROJECT_ID');
  if (!FIREBASE_CLIENT_EMAIL) missingVars.push('FIREBASE_CLIENT_EMAIL');
  if (!FIREBASE_PRIVATE_KEY) missingVars.push('FIREBASE_PRIVATE_KEY');
  
  if (missingVars.length > 0) {
     console.error(
      `Firebase Admin initialization error: The following environment variables are not set: ${missingVars.join(', ')}. Please check your .env file.`
    );
    return null;
  }
  
  // The private key from the .env file has literal '\n' characters.
  // We need to replace them with actual newline characters for the SDK.
  const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

  return {
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  };
};

function initializeAdminApp() {
  const serviceAccount = getServiceAccount();
  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error: any) {
      // We might get an error if it's already initialized, which is fine.
      if (error.code !== 'app/duplicate-app') {
        console.error('Firebase Admin initialization error:', error.message);
      }
    }
  }
}

export function getAdminDb() {
  if (!admin.apps.length) {
    initializeAdminApp();
  }
  // This can return null if initialization failed.
  // The calling functions need to handle this.
  return admin.apps.length > 0 ? admin.firestore() : null;
}
