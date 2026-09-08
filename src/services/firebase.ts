import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { AppData } from '../types';

const firebaseConfig = {
  projectId: 'mom-n-bebe-app',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

const HOUSEHOLD_DOC = 'household';
const COLLECTION_NAME = 'care_data';

export const getHouseholdDocRef = () => doc(db, COLLECTION_NAME, HOUSEHOLD_DOC);

export const subscribeToHouseholdData = (
  onData: (data: AppData) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const docRef = getHouseholdDocRef();
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const remoteData = snapshot.data() as AppData;
        onData(remoteData);
      }
    },
    (err) => {
      console.warn('Firestore subscription warning:', err);
      if (onError) onError(err);
    }
  );
};

export const fetchHouseholdData = async (): Promise<AppData | null> => {
  try {
    const docRef = getHouseholdDocRef();
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as AppData;
    }
    return null;
  } catch (err) {
    console.warn('Failed to fetch remote household data:', err);
    return null;
  }
};

export const saveHouseholdData = async (data: AppData): Promise<boolean> => {
  try {
    const docRef = getHouseholdDocRef();
    await setDoc(docRef, {
      ...data,
      exportedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to save to Firestore:', err);
    return false;
  }
};
