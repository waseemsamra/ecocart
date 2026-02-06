
import admin from 'firebase-admin';

// This is the shape of the service account key JSON file.
interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// Function to safely parse the service account key from environment variables.
const getServiceAccount = (): ServiceAccount | null => {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
  if (!serviceAccountJson) {
    console.error(
      'Firebase Admin initialization error: The FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set. Please create a service account in your Firebase project settings and add the JSON key to your .env file.'
    );
    return null;
  }
  try {
    const parsedJson = JSON.parse(serviceAccountJson);
    parsedJson.private_key = parsedJson.private_key.replace(/\\n/g, '\n');
    return parsedJson;
  } catch (error) {
    console.error(
      'Firebase Admin initialization error: Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_JSON. Please ensure it is a valid, single-line JSON string in your .env file.',
      error
    );
    return null;
  }
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
