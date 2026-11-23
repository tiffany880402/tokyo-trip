import { initializeApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut,
} from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, collection, query, where, orderBy, limit, onSnapshot, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc,
} from 'firebase/firestore';

// 和露營日誌共用同一個 Firebase 專案（camping-log-7d4a6）。
// 東京行程存成 trips/{id} 底下的一個行程，沿用同一份 firestore.rules：只有成員能讀寫。
const config = window.FIREBASE_CONFIG || {};
export const configured = !!config.apiKey && !String(config.apiKey).startsWith('PASTE_');

let auth, fs;
if (configured) {
  const app = initializeApp(config);
  auth = getAuth(app);
  auth.languageCode = 'zh-TW';
  const opts = { ignoreUndefinedProperties: true };
  try {
    fs = initializeFirestore(app, { ...opts, localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch (e) {
    fs = initializeFirestore(app, opts);
  }
}

/* ---------- 登入 ---------- */
export function watchAuth(cb) {
  if (!configured) { cb(null); return () => {}; }
  getRedirectResult(auth).catch((e) => console.warn('redirect sign-in', e));
  return onAuthStateChanged(auth, cb);
}
// 跟露營日誌一樣用彈出視窗登入：iPhone 加到主畫面時，跳轉登入常常回不來。
export async function signInGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    return await signInWithPopup(auth, provider);
  } catch (e) {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (!standalone && e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) {
      return signInWithRedirect(auth, provider);
    }
    throw e;
  }
}
export const logOut = () => signOut(auth);

/* ---------- 行程：建立、加入、找回 ---------- */
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
const myTripRef = (uid) => doc(fs, `data/users/${uid}/tokyo`);
const memberData = (u) => ({ joinedAt: Date.now(), name: u.displayName || '', photo: u.photoURL || '' });

export async function findMyTrip(u) {
  const s = await getDoc(myTripRef(u.uid)).catch(() => null);
  const id = s && s.exists() ? s.data().tripId : '';
  if (!id) return null;
  try {
    const t = await getDoc(doc(fs, 'trips', id));
    if (!t.exists()) return null;
    // 每次登入順便更新自己的名字和頭像。
    setDoc(doc(fs, `trips/${id}/members/${u.uid}`), { name: u.displayName || '', photo: u.photoURL || '' }, { merge: true }).catch(() => {});
    return { id, ...t.data() };
  } catch (e) { return null; }
}
export async function createTrip(u) {
  const ref = doc(collection(fs, 'trips'));
  let code = newCode();
  for (let i = 0; i < 3; i++) {
    const q = await getDocs(query(collection(fs, 'trips'), where('code', '==', code), limit(1))).catch(() => null);
    if (!q || q.empty) break;
    code = newCode();
  }
  const data = { name: '2026 年末東京自由行', app: 'tokyo', ownerId: u.uid, code, mates: [], rate: 0.21, createdAt: Date.now() };
  await setDoc(ref, data);
  await setDoc(doc(fs, `trips/${ref.id}/members/${u.uid}`), memberData(u));
  await setDoc(myTripRef(u.uid), { tripId: ref.id });
  return { id: ref.id, ...data };
}
export async function joinTrip(u, code) {
  code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 6) throw new Error('bad-code');
  const q = await getDocs(query(collection(fs, 'trips'), where('code', '==', code), limit(1)));
  if (q.empty) throw new Error('not-found');
  const t = q.docs[0];
  await setDoc(doc(fs, `trips/${t.id}/members/${u.uid}`), memberData(u), { merge: true });
  await setDoc(myTripRef(u.uid), { tripId: t.id });
  return { id: t.id, ...t.data() };
}
export async function leaveTrip(u, tripId) {
  await setDoc(myTripRef(u.uid), { tripId: '' });
  await deleteDoc(doc(fs, `trips/${tripId}/members/${u.uid}`)).catch(() => {});
}

/* ---------- 給畫面用的資料層：和原本 claude.ai 版一樣的寫法 ---------- */
const wrapSnap = (s) => ({ id: s.id, exists: s.exists(), data: () => s.data(), metadata: { fromCache: s.metadata.fromCache, hasPendingWrites: s.metadata.hasPendingWrites } });
const wrapQS = (s) => ({ empty: s.empty, size: s.size, metadata: { fromCache: s.metadata.fromCache, hasPendingWrites: s.metadata.hasPendingWrites },
  docs: s.docs.map((d) => ({ id: d.id, exists: true, data: () => d.data() })) });
function wrapDoc(ref) {
  return {
    id: ref.id, path: ref.path,
    get: () => getDoc(ref).then(wrapSnap),
    set: (d) => setDoc(ref, d),
    update: (d) => updateDoc(ref, d),
    delete: () => deleteDoc(ref),
    onSnapshot: (next, err) => onSnapshot(ref, { includeMetadataChanges: true }, (s) => next(wrapSnap(s)), err),
  };
}
function wrapColl(colRef, q) {
  q = q || colRef;
  return {
    orderBy: (f, dir) => wrapColl(colRef, query(q, orderBy(f, dir || 'asc'))),
    where: (f, op, v) => wrapColl(colRef, query(q, where(f, op, v))),
    limit: (n) => wrapColl(colRef, query(q, limit(n))),
    get: () => getDocs(q).then(wrapQS),
    onSnapshot: (next, err) => onSnapshot(q, { includeMetadataChanges: true }, (s) => next(wrapQS(s)), err),
    doc: (id) => wrapDoc(id ? doc(colRef, id) : doc(colRef)),
    add: (d) => addDoc(colRef, d).then((r) => wrapDoc(r)),
  };
}
const SUB = { expenses: 'expenses', shop: 'shopping', members: 'members' };

// 原本程式用的路徑 → 這個行程底下的路徑
export function tripDB(tripId) {
  const base = `trips/${tripId}`;
  return {
    collection: (name) => wrapColl(collection(fs, `${base}/${SUB[name] || name}`)),
    doc: (path) => {
      if (path === 'trip/settings') {
        const ref = doc(fs, base);
        return { ...wrapDoc(ref), set: (d) => updateDoc(ref, d) };
      }
      const [col, id] = path.split('/');
      return wrapDoc(doc(fs, `${base}/${SUB[col] || col}/${id}`));
    },
  };
}
