(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/firebase/config.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "auth",
    ()=>auth,
    "db",
    ()=>db,
    "default",
    ()=>__TURBOPACK__default__export__,
    "realtimeDb",
    ()=>realtimeDb,
    "storage",
    ()=>storage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/app/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/app/dist/esm/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/auth/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/auth/dist/esm/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$storage$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/storage/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/storage/dist/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$database$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/database/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/database/dist/index.esm.js [app-client] (ecmascript)");
;
;
;
;
;
const firebaseConfig = {
    apiKey: ("TURBOPACK compile-time value", "AIzaSyCPm9Qp2ZHiAnXAxAYhPTljRaYLKDeczKU"),
    authDomain: ("TURBOPACK compile-time value", "algosol.firebaseapp.com"),
    projectId: ("TURBOPACK compile-time value", "algosol"),
    storageBucket: ("TURBOPACK compile-time value", "algosol.firebasestorage.app"),
    messagingSenderId: ("TURBOPACK compile-time value", "2656945822"),
    appId: ("TURBOPACK compile-time value", "1:2656945822:web:b8ba84d89cbaaf70e05d8f"),
    measurementId: ("TURBOPACK compile-time value", "G-5RYX14Z2YW"),
    databaseURL: ("TURBOPACK compile-time value", "https://algosol-default-rtdb.firebaseio.com")
};
// Initialize Firebase (prevent multiple initializations)
const app = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getApps"])().length === 0 ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["initializeApp"])(firebaseConfig) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getApps"])()[0];
const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuth"])(app);
const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getFirestore"])(app);
const storage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStorage"])(app);
const realtimeDb = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDatabase"])(app);
const __TURBOPACK__default__export__ = app;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/firebase/users.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ensureUserProfile",
    ()=>ensureUserProfile,
    "getUserProfile",
    ()=>getUserProfile,
    "updateUserRole",
    ()=>updateUserRole
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firebase/config.ts [app-client] (ecmascript)");
;
;
async function getUserProfile(uid) {
    try {
        const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], "users", uid);
        const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDoc"])(docRef);
        if (!snapshot.exists()) {
            return null;
        }
        const data = snapshot.data();
        return {
            uid: snapshot.id,
            email: data.email,
            displayName: data.displayName || data.email?.split("@")[0] || "User",
            role: data.role || "user",
            createdAt: data.createdAt?.toDate() || new Date(),
            lastLogin: data.lastLogin?.toDate() || new Date()
        };
    } catch (error) {
        console.error("Error getting user profile:", error);
        return null;
    }
}
async function ensureUserProfile(uid, email) {
    const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], "users", uid);
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDoc"])(docRef);
    if (snapshot.exists()) {
        // Update last login
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updateDoc"])(docRef, {
            lastLogin: new Date()
        });
        const data = snapshot.data();
        return {
            uid,
            email: data.email,
            displayName: data.displayName || email.split("@")[0],
            role: data.role || "user",
            createdAt: data.createdAt?.toDate() || new Date(),
            lastLogin: new Date()
        };
    } else {
        // Create new user profile
        const newProfile = {
            uid,
            email,
            displayName: email.split("@")[0],
            role: "user",
            createdAt: new Date(),
            lastLogin: new Date()
        };
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setDoc"])(docRef, {
            ...newProfile,
            createdAt: new Date(),
            lastLogin: new Date()
        });
        return newProfile;
    }
}
async function updateUserRole(uid, role) {
    const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], "users", uid);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updateDoc"])(docRef, {
        role
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/contexts/auth-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/auth/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/auth/dist/esm/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firebase/config.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firebase/users.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            const unsubscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onAuthStateChanged"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"], {
                "AuthProvider.useEffect.unsubscribe": async (firebaseUser)=>{
                    if (firebaseUser) {
                        // Get user profile with role
                        const profile = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ensureUserProfile"])(firebaseUser.uid, firebaseUser.email || "");
                        // Extend Firebase user with role
                        const extendedUser = {
                            ...firebaseUser,
                            role: profile.role,
                            displayName: profile.displayName
                        };
                        setUser(extendedUser);
                    } else {
                        setUser(null);
                    }
                    setLoading(false);
                }
            }["AuthProvider.useEffect.unsubscribe"]);
            return ({
                "AuthProvider.useEffect": ()=>unsubscribe()
            })["AuthProvider.useEffect"];
        }
    }["AuthProvider.useEffect"], []);
    const signIn = async (email, password)=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["signInWithEmailAndPassword"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"], email, password);
    };
    const signOut = async ()=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["signOut"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"]);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            loading,
            signIn,
            signOut
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/auth-context.tsx",
        lineNumber: 64,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "NiO5z6JIqzX62LS5UWDgIqbZYyY=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useAudioCapture.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAudioCapture",
    ()=>useAudioCapture
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
function useAudioCapture(options = {}) {
    _s();
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        isCapturing: false,
        isRecording: false,
        isPaused: false,
        audioLevel: 0,
        duration: 0,
        error: null
    });
    const audioContextRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mediaStreamRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const sourceNodeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const gainNodeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const analyserNodeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mediaRecorderRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const recordedChunksRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const animationFrameRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const startTimeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const durationIntervalRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const isCapturingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    // Clean up on unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAudioCapture.useEffect": ()=>{
            return ({
                "useAudioCapture.useEffect": ()=>{
                    stopCapture();
                }
            })["useAudioCapture.useEffect"];
        }
    }["useAudioCapture.useEffect"], []);
    const updateAudioLevel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAudioCapture.useCallback[updateAudioLevel]": ()=>{
            if (!analyserNodeRef.current || !isCapturingRef.current) {
                return;
            }
            const analyser = analyserNodeRef.current;
            // Try both frequency and time domain data
            const freqData = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(freqData);
            const timeData = new Uint8Array(analyser.fftSize);
            analyser.getByteTimeDomainData(timeData);
            // Calculate average from frequency data
            const freqAverage = freqData.reduce({
                "useAudioCapture.useCallback[updateAudioLevel]": (a, b)=>a + b
            }["useAudioCapture.useCallback[updateAudioLevel]"], 0) / freqData.length;
            const freqLevel = Math.round(freqAverage / 255 * 100);
            // Calculate RMS from time domain data
            let sum = 0;
            for(let i = 0; i < timeData.length; i++){
                const normalized = (timeData[i] - 128) / 128;
                sum += normalized * normalized;
            }
            const rms = Math.sqrt(sum / timeData.length);
            const timeLevel = Math.round(rms * 100);
            // Use the higher of the two
            const level = Math.max(freqLevel, timeLevel);
            // Optional: Uncomment for debugging
            // if (Math.random() < 0.01) {
            //   console.log("Audio level:", level);
            // }
            setState({
                "useAudioCapture.useCallback[updateAudioLevel]": (prev)=>({
                        ...prev,
                        audioLevel: level
                    })
            }["useAudioCapture.useCallback[updateAudioLevel]"]);
            animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
    }["useAudioCapture.useCallback[updateAudioLevel]"], []); // No dependencies - use refs instead
    const startCapture = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAudioCapture.useCallback[startCapture]": async (deviceId)=>{
            try {
                setState({
                    "useAudioCapture.useCallback[startCapture]": (prev)=>({
                            ...prev,
                            error: null
                        })
                }["useAudioCapture.useCallback[startCapture]"]);
                // Request microphone/line-in access
                const audioConstraints = {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                };
                // If a specific device is requested, use it
                if (deviceId) {
                    audioConstraints.deviceId = {
                        exact: deviceId
                    };
                }
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: audioConstraints,
                    video: false
                });
                // DEBUG: Log information about the captured stream
                const audioTracks = stream.getAudioTracks();
                if (audioTracks.length > 0) {
                    const track = audioTracks[0];
                    console.log('[AudioCapture] 🎤 Started monitoring:');
                    console.log('  - Device Label:', track.label);
                    console.log('  - Device ID:', track.getSettings().deviceId);
                    console.log('  - Sample Rate:', track.getSettings().sampleRate);
                    console.log('  - Channel Count:', track.getSettings().channelCount);
                }
                mediaStreamRef.current = stream;
                // Create audio context
                const audioContext = new AudioContext();
                audioContextRef.current = audioContext;
                // Create nodes
                const sourceNode = audioContext.createMediaStreamSource(stream);
                sourceNodeRef.current = sourceNode;
                const gainNode = audioContext.createGain();
                gainNodeRef.current = gainNode;
                const analyserNode = audioContext.createAnalyser();
                analyserNode.fftSize = 256;
                analyserNodeRef.current = analyserNode;
                // Connect nodes: source -> gain -> analyser
                sourceNode.connect(gainNode);
                gainNode.connect(analyserNode);
                // Set capturing flag BEFORE starting animation frame
                isCapturingRef.current = true;
                setState({
                    "useAudioCapture.useCallback[startCapture]": (prev)=>({
                            ...prev,
                            isCapturing: true
                        })
                }["useAudioCapture.useCallback[startCapture]"]);
                // Start level monitoring
                animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to access audio input";
                setState({
                    "useAudioCapture.useCallback[startCapture]": (prev)=>({
                            ...prev,
                            error: errorMessage
                        })
                }["useAudioCapture.useCallback[startCapture]"]);
                console.error("Audio capture error:", error);
            }
        }
    }["useAudioCapture.useCallback[startCapture]"], [
        updateAudioLevel
    ]);
    const stopCapture = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAudioCapture.useCallback[stopCapture]": ()=>{
            // Stop capturing flag first
            isCapturingRef.current = false;
            // Stop animation frame
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            // Stop duration interval
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }
            // Stop media recorder
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
            mediaRecorderRef.current = null;
            // Stop all tracks
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach({
                    "useAudioCapture.useCallback[stopCapture]": (track)=>track.stop()
                }["useAudioCapture.useCallback[stopCapture]"]);
                mediaStreamRef.current = null;
            }
            // Close audio context
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            // Clear refs
            sourceNodeRef.current = null;
            gainNodeRef.current = null;
            analyserNodeRef.current = null;
            recordedChunksRef.current = [];
            setState({
                isCapturing: false,
                isRecording: false,
                isPaused: false,
                audioLevel: 0,
                duration: 0,
                error: null
            });
        }
    }["useAudioCapture.useCallback[stopCapture]"], []);
    const setVolume = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAudioCapture.useCallback[setVolume]": (volume)=>{
            if (gainNodeRef.current) {
                // Convert 0-100 to 0-2 (allowing boost up to 2x)
                gainNodeRef.current.gain.value = volume / 50;
            }
        }
    }["useAudioCapture.useCallback[setVolume]"], []);
    const startRecording = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAudioCapture.useCallback[startRecording]": ()=>{
            if (!mediaStreamRef.current || state.isRecording) return;
            recordedChunksRef.current = [];
            const mediaRecorder = new MediaRecorder(mediaStreamRef.current, {
                mimeType: "audio/webm;codecs=opus"
            });
            mediaRecorder.ondataavailable = ({
                "useAudioCapture.useCallback[startRecording]": (event)=>{
                    if (event.data.size > 0) {
                        recordedChunksRef.current.push(event.data);
                    }
                }
            })["useAudioCapture.useCallback[startRecording]"];
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(100); // Collect data every 100ms
            startTimeRef.current = Date.now();
            durationIntervalRef.current = setInterval({
                "useAudioCapture.useCallback[startRecording]": ()=>{
                    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                    setState({
                        "useAudioCapture.useCallback[startRecording]": (prev)=>({
                                ...prev,
                                duration: elapsed
                            })
                    }["useAudioCapture.useCallback[startRecording]"]);
                }
            }["useAudioCapture.useCallback[startRecording]"], 1000);
            setState({
                "useAudioCapture.useCallback[startRecording]": (prev)=>({
                        ...prev,
                        isRecording: true,
                        duration: 0
                    })
            }["useAudioCapture.useCallback[startRecording]"]);
        }
    }["useAudioCapture.useCallback[startRecording]"], [
        state.isRecording
    ]);
    const stopRecording = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAudioCapture.useCallback[stopRecording]": async ()=>{
            return new Promise({
                "useAudioCapture.useCallback[stopRecording]": (resolve)=>{
                    if (!mediaRecorderRef.current || !state.isRecording) {
                        resolve(null);
                        return;
                    }
                    if (durationIntervalRef.current) {
                        clearInterval(durationIntervalRef.current);
                        durationIntervalRef.current = null;
                    }
                    const mediaRecorder = mediaRecorderRef.current;
                    mediaRecorder.onstop = ({
                        "useAudioCapture.useCallback[stopRecording]": ()=>{
                            const blob = new Blob(recordedChunksRef.current, {
                                type: "audio/webm"
                            });
                            recordedChunksRef.current = [];
                            setState({
                                "useAudioCapture.useCallback[stopRecording]": (prev)=>({
                                        ...prev,
                                        isRecording: false
                                    })
                            }["useAudioCapture.useCallback[stopRecording]"]);
                            resolve(blob);
                        }
                    })["useAudioCapture.useCallback[stopRecording]"];
                    mediaRecorder.stop();
                }
            }["useAudioCapture.useCallback[stopRecording]"]);
        }
    }["useAudioCapture.useCallback[stopRecording]"], [
        state.isRecording
    ]);
    const pauseRecording = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAudioCapture.useCallback[pauseRecording]": ()=>{
            if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
                mediaRecorderRef.current.pause();
                if (durationIntervalRef.current) {
                    clearInterval(durationIntervalRef.current);
                }
                setState({
                    "useAudioCapture.useCallback[pauseRecording]": (prev)=>({
                            ...prev,
                            isPaused: true
                        })
                }["useAudioCapture.useCallback[pauseRecording]"]);
            }
        }
    }["useAudioCapture.useCallback[pauseRecording]"], [
        state.isRecording,
        state.isPaused
    ]);
    const resumeRecording = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAudioCapture.useCallback[resumeRecording]": ()=>{
            if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
                mediaRecorderRef.current.resume();
                durationIntervalRef.current = setInterval({
                    "useAudioCapture.useCallback[resumeRecording]": ()=>{
                        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                        setState({
                            "useAudioCapture.useCallback[resumeRecording]": (prev)=>({
                                    ...prev,
                                    duration: elapsed
                                })
                        }["useAudioCapture.useCallback[resumeRecording]"]);
                    }
                }["useAudioCapture.useCallback[resumeRecording]"], 1000);
                setState({
                    "useAudioCapture.useCallback[resumeRecording]": (prev)=>({
                            ...prev,
                            isPaused: false
                        })
                }["useAudioCapture.useCallback[resumeRecording]"]);
            }
        }
    }["useAudioCapture.useCallback[resumeRecording]"], [
        state.isRecording,
        state.isPaused
    ]);
    const getInputDevices = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAudioCapture.useCallback[getInputDevices]": async ()=>{
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                return devices.filter({
                    "useAudioCapture.useCallback[getInputDevices]": (device)=>device.kind === "audioinput"
                }["useAudioCapture.useCallback[getInputDevices]"]);
            } catch (error) {
                console.error("Failed to enumerate devices:", error);
                return [];
            }
        }
    }["useAudioCapture.useCallback[getInputDevices]"], []);
    return {
        ...state,
        startCapture,
        stopCapture,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        setVolume,
        getInputDevices,
        mediaStream: mediaStreamRef.current
    };
}
_s(useAudioCapture, "wVwZgwcyOkk7T9KZEfzeGR39vpQ=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/settings.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Utility functions for getting app settings from localStorage
 */ /**
 * Get the configured idle volume level for speakers
 * @returns The idle volume in dB (default: -45)
 */ __turbopack_context__.s([
    "getAlwaysKeepPagingOn",
    ()=>getAlwaysKeepPagingOn,
    "getDefaultVolume",
    ()=>getDefaultVolume,
    "getIdleVolume",
    ()=>getIdleVolume,
    "getIdleVolumeString",
    ()=>getIdleVolumeString
]);
function getIdleVolume() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const saved = localStorage.getItem("algoapp-idle-volume");
    if (saved) {
        const parsed = parseInt(saved);
        // Validate range
        if (parsed >= -60 && parsed <= 0) {
            return parsed;
        }
    }
    return -45; // Default
}
function getIdleVolumeString() {
    return `${getIdleVolume()}dB`;
}
function getDefaultVolume() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const saved = localStorage.getItem("algoapp-default-volume");
    if (saved) {
        const parsed = parseInt(saved);
        // Validate range
        if (parsed >= 0 && parsed <= 100) {
            return parsed;
        }
    }
    return 50; // Default
}
function getAlwaysKeepPagingOn() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const saved = localStorage.getItem("algoapp-always-keep-paging-on");
    return saved === "true";
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/contexts/audio-monitoring-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AudioMonitoringProvider",
    ()=>AudioMonitoringProvider,
    "useAudioMonitoring",
    ()=>useAudioMonitoring
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAudioCapture$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useAudioCapture.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firebase/config.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$storage$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/storage/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/storage/dist/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/auth-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/settings.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
// Debug mode - set to false for production to reduce console noise
const DEBUG_MODE = ("TURBOPACK compile-time value", "development") === 'development';
// Debug logging helper - only logs in development
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debugLog = (...args)=>{
    if ("TURBOPACK compile-time truthy", 1) {
        console.log(...args);
    }
};
// Web Worker for MP3 encoding
let mp3Worker = null;
const AudioMonitoringContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
// Helper function to convert audio blob to MP3 using Web Worker
async function convertToMp3(audioBlob) {
    console.log('[MP3 Convert] Starting conversion, blob size:', audioBlob.size, 'type:', audioBlob.type);
    // Decode the audio blob to an AudioBuffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    console.log('[MP3 Convert] ArrayBuffer size:', arrayBuffer.byteLength);
    const audioContext = new AudioContext();
    console.log('[MP3 Convert] AudioContext created, decoding...');
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log('[MP3 Convert] Decoded - channels:', audioBuffer.numberOfChannels, 'sampleRate:', audioBuffer.sampleRate, 'duration:', audioBuffer.duration);
    // Get audio data as Float32Arrays
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const audioData = [];
    for(let i = 0; i < numberOfChannels; i++){
        audioData.push(audioBuffer.getChannelData(i));
    }
    // Close the audio context
    await audioContext.close();
    // Initialize Web Worker if not already done
    if (!mp3Worker) {
        console.log('[MP3 Convert] Creating Web Worker...');
        mp3Worker = new Worker('/mp3-encoder-worker.js');
    }
    // Encode using Web Worker
    return new Promise((resolve, reject)=>{
        if (!mp3Worker) {
            reject(new Error('Web Worker not available'));
            return;
        }
        const timeoutId = setTimeout(()=>{
            reject(new Error('MP3 encoding timeout'));
        }, 30000); // 30 second timeout
        mp3Worker.onmessage = (e)=>{
            clearTimeout(timeoutId);
            if (e.data.error) {
                console.error('[MP3 Convert] Worker error:', e.data.error);
                reject(new Error(e.data.error));
                return;
            }
            if (e.data.progress !== undefined) {
                // Progress update - ignore for now
                return;
            }
            if (e.data.success && e.data.mp3Data) {
                console.log('[MP3 Convert] Worker success, output size:', e.data.mp3Data.byteLength);
                const mp3Blob = new Blob([
                    e.data.mp3Data
                ], {
                    type: 'audio/mp3'
                });
                resolve(mp3Blob);
            }
        };
        mp3Worker.onerror = (error)=>{
            clearTimeout(timeoutId);
            console.error('[MP3 Convert] Worker error:', error);
            reject(new Error('MP3 Worker error: ' + error.message));
        };
        // Send audio data to worker
        console.log('[MP3 Convert] Sending to worker...');
        mp3Worker.postMessage({
            cmd: 'encode',
            audioData: audioData,
            sampleRate: sampleRate,
            bitRate: 128
        });
    });
}
// LocalStorage keys
const STORAGE_KEYS = {
    IS_MONITORING: 'algo_live_is_monitoring',
    SELECTED_DEVICES: 'algo_live_selected_devices',
    SELECTED_INPUT: 'algo_live_selected_input',
    TARGET_VOLUME: 'algo_live_target_volume',
    INPUT_GAIN: 'algo_live_input_gain',
    AUDIO_THRESHOLD: 'algo_live_audio_threshold',
    USE_GLOBAL_VOLUME: 'algo_use_global_volume',
    RAMP_ENABLED: 'algo_live_ramp_enabled',
    RAMP_DURATION: 'algo_live_ramp_duration',
    DAY_NIGHT_MODE: 'algo_live_day_night_mode',
    DAY_START_HOUR: 'algo_live_day_start_hour',
    DAY_END_HOUR: 'algo_live_day_end_hour',
    NIGHT_RAMP_DURATION: 'algo_live_night_ramp_duration',
    SUSTAIN_DURATION: 'algo_live_sustain_duration',
    DISABLE_DELAY: 'algo_live_disable_delay',
    LOGGING_ENABLED: 'algo_live_logging_enabled',
    RECORDING_ENABLED: 'algo_live_recording_enabled'
};
function AudioMonitoringProvider({ children }) {
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [selectedInputDevice, setSelectedInputDeviceState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [volume, setVolumeState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(50);
    const [targetVolume, setTargetVolumeState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(100);
    const [audioThreshold, setAudioThresholdState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(5); // 5% default
    const [selectedDevices, setSelectedDevicesState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [devices, setDevices] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [poeDevices, setPoeDevices] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [audioDetected, setAudioDetected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [speakersEnabled, setSpeakersEnabled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Logging
    const [logs, setLogs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loggingEnabled, setLoggingEnabledState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true); // enabled by default
    const [recordingEnabled, setRecordingEnabledState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false); // disabled by default to save storage
    // Volume mode
    const [useGlobalVolume, setUseGlobalVolumeState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Speaker status tracking
    const [speakerStatuses, setSpeakerStatuses] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    // Ramp settings
    const [rampEnabled, setRampEnabledState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [rampDuration, setRampDurationState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(15); // 15 seconds default
    const [dayNightMode, setDayNightModeState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [dayStartHour, setDayStartHourState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(6); // 6 AM
    const [dayEndHour, setDayEndHourState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(18); // 6 PM
    const [nightRampDuration, setNightRampDurationState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(10); // 10 seconds for night
    const [sustainDuration, setSustainDurationState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1000); // 1 second default (in ms)
    const [disableDelay, setDisableDelayState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(3000); // 3 seconds default (in ms)
    const audioDetectionTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const controllingSpakersRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const volumeRampIntervalRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const currentVolumeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const hasRestoredStateRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const isInitializedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const previousDayModeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const dayNightCheckIntervalRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Sustained audio tracking
    const sustainedAudioStartRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const sustainCheckIntervalRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const speakersEnabledTimeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Recording
    const mediaRecorderRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const recordedChunksRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const recordingStartTimeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { isCapturing, audioLevel, startCapture, stopCapture, setVolume: setGainVolume, mediaStream: monitoringStream } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAudioCapture$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAudioCapture"])();
    // Helper to add log entry
    const addLog = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[addLog]": (entry)=>{
            // Always log to console for debugging
            const logEntry = {
                ...entry,
                timestamp: new Date().toISOString()
            };
            debugLog(`[AudioLog] ${logEntry.message}`, logEntry);
            // Only add to UI logs if logging is enabled
            if (!loggingEnabled) return;
            setLogs({
                "AudioMonitoringProvider.useCallback[addLog]": (prev)=>{
                    const newLogs = [
                        ...prev,
                        logEntry
                    ];
                    // Keep only last 500 entries to prevent memory issues
                    if (newLogs.length > 500) {
                        return newLogs.slice(-500);
                    }
                    return newLogs;
                }
            }["AudioMonitoringProvider.useCallback[addLog]"]);
        }
    }["AudioMonitoringProvider.useCallback[addLog]"], [
        loggingEnabled
    ]);
    // Get best supported audio mimeType
    const getBestAudioMimeType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[getBestAudioMimeType]": ()=>{
            const types = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/ogg;codecs=opus',
                'audio/mp4'
            ];
            for (const type of types){
                if (MediaRecorder.isTypeSupported(type)) {
                    console.log('[Recording] Using mimeType:', type);
                    return type;
                }
            }
            console.warn('[Recording] No preferred mimeType supported, using default');
            return '';
        }
    }["AudioMonitoringProvider.useCallback[getBestAudioMimeType]"], []);
    // Start recording audio
    const startRecording = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[startRecording]": async ()=>{
            try {
                if (!recordingEnabled) {
                    debugLog('[Recording] Recording is disabled, skipping');
                    return;
                }
                if (!user) {
                    console.warn('[Recording] No user authenticated, skipping recording');
                    return;
                }
                // REUSE the monitoring stream instead of creating a new one
                if (!monitoringStream) {
                    console.warn('[Recording] No monitoring stream available, skipping recording');
                    return;
                }
                // DEBUG: Log information about the monitoring stream
                const audioTracks = monitoringStream.getAudioTracks();
                if (audioTracks.length > 0) {
                    const track = audioTracks[0];
                    console.log('[Recording] 🎙️ Recording from monitoring stream:');
                    console.log('  - Device Label:', track.label);
                    console.log('  - Device ID:', track.getSettings().deviceId);
                    console.log('  - Sample Rate:', track.getSettings().sampleRate);
                    console.log('  - Channel Count:', track.getSettings().channelCount);
                } else {
                    console.warn('[Recording] ⚠️ No audio tracks in monitoring stream!');
                }
                // Get best supported mimeType
                const mimeType = getBestAudioMimeType();
                // Create media recorder with best supported format
                const options = {};
                if (mimeType) {
                    options.mimeType = mimeType;
                }
                const mediaRecorder = new MediaRecorder(monitoringStream, options);
                recordedChunksRef.current = [];
                recordingStartTimeRef.current = new Date().toISOString();
                mediaRecorder.ondataavailable = ({
                    "AudioMonitoringProvider.useCallback[startRecording]": (event)=>{
                        if (event.data.size > 0) {
                            recordedChunksRef.current.push(event.data);
                        }
                    }
                })["AudioMonitoringProvider.useCallback[startRecording]"];
                mediaRecorder.start(100); // Collect data every 100ms
                mediaRecorderRef.current = mediaRecorder;
                debugLog('[Recording] Started recording audio from monitoring stream with mimeType:', mimeType || 'default');
            } catch (error) {
                console.error('[Recording] Failed to start recording:', error);
            }
        }
    }["AudioMonitoringProvider.useCallback[startRecording]"], [
        recordingEnabled,
        user,
        monitoringStream,
        getBestAudioMimeType
    ]);
    // Stop recording and upload to Firebase
    const stopRecordingAndUpload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[stopRecordingAndUpload]": async ()=>{
            return new Promise({
                "AudioMonitoringProvider.useCallback[stopRecordingAndUpload]": (resolve)=>{
                    try {
                        const mediaRecorder = mediaRecorderRef.current;
                        if (!mediaRecorder || !user || !recordingStartTimeRef.current) {
                            resolve(null);
                            return;
                        }
                        mediaRecorder.onstop = ({
                            "AudioMonitoringProvider.useCallback[stopRecordingAndUpload]": async ()=>{
                                try {
                                    // Get the mimeType that was actually used
                                    const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
                                    // Create blob from recorded chunks
                                    const audioBlob = new Blob(recordedChunksRef.current, {
                                        type: actualMimeType
                                    });
                                    if (audioBlob.size === 0) {
                                        console.warn('[Recording] No audio data recorded');
                                        resolve(null);
                                        return;
                                    }
                                    // Determine file extension from mimeType
                                    let fileExtension = 'webm';
                                    if (actualMimeType.includes('opus')) {
                                        fileExtension = 'opus';
                                    } else if (actualMimeType.includes('ogg')) {
                                        fileExtension = 'ogg';
                                    } else if (actualMimeType.includes('mp4')) {
                                        fileExtension = 'm4a';
                                    }
                                    console.log(`[Recording] Saving ${audioBlob.size} bytes as ${fileExtension} (${actualMimeType})`);
                                    // Generate filename with timestamp
                                    const timestamp = recordingStartTimeRef.current.replace(/[:.]/g, '-');
                                    const filename = `recording-${timestamp}.${fileExtension}`;
                                    const filePath = `audio-recordings/${user.uid}/${filename}`;
                                    // Upload to Firebase Storage
                                    debugLog(`[Recording] Uploading ${fileExtension.toUpperCase()} to ${filePath}`);
                                    const fileRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"], filePath);
                                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uploadBytes"])(fileRef, audioBlob);
                                    // Get download URL
                                    const downloadUrl = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDownloadURL"])(fileRef);
                                    debugLog('[Recording] Upload successful:', downloadUrl);
                                    // Clean up
                                    recordedChunksRef.current = [];
                                    recordingStartTimeRef.current = null;
                                    mediaRecorderRef.current = null;
                                    // DON'T stop the stream tracks - we're reusing the monitoring stream!
                                    // The monitoring stream should only be stopped when stopMonitoring() is called
                                    resolve(downloadUrl);
                                } catch (error) {
                                    console.error('[Recording] Upload failed:', error);
                                    resolve(null);
                                }
                            }
                        })["AudioMonitoringProvider.useCallback[stopRecordingAndUpload]"];
                        mediaRecorder.stop();
                    } catch (error) {
                        console.error('[Recording] Stop failed:', error);
                        resolve(null);
                    }
                }
            }["AudioMonitoringProvider.useCallback[stopRecordingAndUpload]"]);
        }
    }["AudioMonitoringProvider.useCallback[stopRecordingAndUpload]"], [
        user
    ]);
    // Update gain when volume changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            setGainVolume(volume);
        }
    }["AudioMonitoringProvider.useEffect"], [
        volume,
        setGainVolume
    ]);
    // Initialize and restore state from localStorage on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (isInitializedRef.current) return;
            isInitializedRef.current = true;
            debugLog('[AudioMonitoring] Initializing and restoring state...');
            try {
                const savedDevices = localStorage.getItem(STORAGE_KEYS.SELECTED_DEVICES);
                const savedInput = localStorage.getItem(STORAGE_KEYS.SELECTED_INPUT);
                const savedTargetVolume = localStorage.getItem(STORAGE_KEYS.TARGET_VOLUME);
                const savedInputGain = localStorage.getItem(STORAGE_KEYS.INPUT_GAIN);
                const savedAudioThreshold = localStorage.getItem(STORAGE_KEYS.AUDIO_THRESHOLD);
                const savedRampEnabled = localStorage.getItem(STORAGE_KEYS.RAMP_ENABLED);
                const savedRampDuration = localStorage.getItem(STORAGE_KEYS.RAMP_DURATION);
                const savedDayNightMode = localStorage.getItem(STORAGE_KEYS.DAY_NIGHT_MODE);
                const savedDayStartHour = localStorage.getItem(STORAGE_KEYS.DAY_START_HOUR);
                const savedDayEndHour = localStorage.getItem(STORAGE_KEYS.DAY_END_HOUR);
                const savedNightRampDuration = localStorage.getItem(STORAGE_KEYS.NIGHT_RAMP_DURATION);
                const savedSustainDuration = localStorage.getItem(STORAGE_KEYS.SUSTAIN_DURATION);
                const savedDisableDelay = localStorage.getItem(STORAGE_KEYS.DISABLE_DELAY);
                const savedLoggingEnabled = localStorage.getItem(STORAGE_KEYS.LOGGING_ENABLED);
                const savedRecordingEnabled = localStorage.getItem(STORAGE_KEYS.RECORDING_ENABLED);
                const savedUseGlobalVolume = localStorage.getItem(STORAGE_KEYS.USE_GLOBAL_VOLUME);
                const wasMonitoring = localStorage.getItem(STORAGE_KEYS.IS_MONITORING) === 'true';
                debugLog('[AudioMonitoring] Saved state:', {
                    devices: savedDevices,
                    input: savedInput,
                    targetVolume: savedTargetVolume,
                    inputGain: savedInputGain,
                    audioThreshold: savedAudioThreshold,
                    rampEnabled: savedRampEnabled,
                    rampDuration: savedRampDuration,
                    dayNightMode: savedDayNightMode,
                    dayStartHour: savedDayStartHour,
                    dayEndHour: savedDayEndHour,
                    nightRampDuration: savedNightRampDuration,
                    wasMonitoring
                });
                if (savedDevices && savedDevices !== 'undefined') {
                    try {
                        const deviceIds = JSON.parse(savedDevices);
                        debugLog('[AudioMonitoring] Restoring selected devices:', deviceIds);
                        setSelectedDevicesState(deviceIds);
                    } catch (error) {
                        console.error('[AudioMonitoring] Failed to parse saved devices:', error);
                        setSelectedDevicesState([]);
                    }
                }
                if (savedInput) {
                    debugLog('[AudioMonitoring] Restoring input device:', savedInput);
                    setSelectedInputDeviceState(savedInput);
                }
                if (savedTargetVolume) {
                    setTargetVolumeState(parseInt(savedTargetVolume));
                }
                if (savedInputGain) {
                    setVolumeState(parseInt(savedInputGain));
                }
                if (savedAudioThreshold) {
                    setAudioThresholdState(parseInt(savedAudioThreshold));
                }
                if (savedRampEnabled !== null) {
                    setRampEnabledState(savedRampEnabled === 'true');
                }
                if (savedRampDuration) {
                    setRampDurationState(parseInt(savedRampDuration));
                }
                if (savedDayNightMode !== null) {
                    setDayNightModeState(savedDayNightMode === 'true');
                }
                if (savedDayStartHour) {
                    setDayStartHourState(parseInt(savedDayStartHour));
                }
                if (savedDayEndHour) {
                    setDayEndHourState(parseInt(savedDayEndHour));
                }
                if (savedNightRampDuration) {
                    setNightRampDurationState(parseInt(savedNightRampDuration));
                }
                if (savedSustainDuration) {
                    setSustainDurationState(parseInt(savedSustainDuration));
                }
                if (savedDisableDelay) {
                    setDisableDelayState(parseInt(savedDisableDelay));
                }
                if (savedLoggingEnabled !== null) {
                    setLoggingEnabledState(savedLoggingEnabled === 'true');
                }
                if (savedRecordingEnabled !== null) {
                    setRecordingEnabledState(savedRecordingEnabled === 'true');
                }
                if (savedUseGlobalVolume !== null) {
                    setUseGlobalVolumeState(savedUseGlobalVolume === 'true');
                }
                // Mark as restored
                setTimeout({
                    "AudioMonitoringProvider.useEffect": ()=>{
                        hasRestoredStateRef.current = true;
                        debugLog('[AudioMonitoring] State restoration complete');
                    }
                }["AudioMonitoringProvider.useEffect"], 100);
                // Auto-start monitoring if it was active before
                if (wasMonitoring) {
                    debugLog('[AudioMonitoring] Auto-resuming monitoring from previous session');
                    setTimeout({
                        "AudioMonitoringProvider.useEffect": ()=>{
                            startCapture(savedInput || undefined);
                        }
                    }["AudioMonitoringProvider.useEffect"], 500);
                }
            } catch (error) {
                console.error('[AudioMonitoring] Failed to restore state:', error);
                hasRestoredStateRef.current = true;
            }
        }
    }["AudioMonitoringProvider.useEffect"], [
        startCapture
    ]);
    // Persist state changes to localStorage
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            debugLog('[AudioMonitoring] Saving selected devices:', selectedDevices);
            localStorage.setItem(STORAGE_KEYS.SELECTED_DEVICES, JSON.stringify(selectedDevices));
        }
    }["AudioMonitoringProvider.useEffect"], [
        selectedDevices
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            debugLog('[AudioMonitoring] Saving input device:', selectedInputDevice);
            localStorage.setItem(STORAGE_KEYS.SELECTED_INPUT, selectedInputDevice);
        }
    }["AudioMonitoringProvider.useEffect"], [
        selectedInputDevice
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            debugLog('[AudioMonitoring] Saving target volume:', targetVolume);
            localStorage.setItem(STORAGE_KEYS.TARGET_VOLUME, targetVolume.toString());
        }
    }["AudioMonitoringProvider.useEffect"], [
        targetVolume
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            debugLog('[AudioMonitoring] Saving input gain:', volume);
            localStorage.setItem(STORAGE_KEYS.INPUT_GAIN, volume.toString());
        }
    }["AudioMonitoringProvider.useEffect"], [
        volume
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            debugLog('[AudioMonitoring] Saving monitoring state:', isCapturing);
            localStorage.setItem(STORAGE_KEYS.IS_MONITORING, isCapturing.toString());
        }
    }["AudioMonitoringProvider.useEffect"], [
        isCapturing
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            debugLog('[AudioMonitoring] Saving audio threshold:', audioThreshold);
            localStorage.setItem(STORAGE_KEYS.AUDIO_THRESHOLD, audioThreshold.toString());
        }
    }["AudioMonitoringProvider.useEffect"], [
        audioThreshold
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            debugLog('[AudioMonitoring] Saving ramp enabled:', rampEnabled);
            localStorage.setItem(STORAGE_KEYS.RAMP_ENABLED, rampEnabled.toString());
        }
    }["AudioMonitoringProvider.useEffect"], [
        rampEnabled
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            debugLog('[AudioMonitoring] Saving ramp duration:', rampDuration);
            localStorage.setItem(STORAGE_KEYS.RAMP_DURATION, rampDuration.toString());
        }
    }["AudioMonitoringProvider.useEffect"], [
        rampDuration
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            debugLog('[AudioMonitoring] Saving day/night mode:', dayNightMode);
            localStorage.setItem(STORAGE_KEYS.DAY_NIGHT_MODE, dayNightMode.toString());
        }
    }["AudioMonitoringProvider.useEffect"], [
        dayNightMode
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            debugLog('[AudioMonitoring] Saving day start hour:', dayStartHour);
            localStorage.setItem(STORAGE_KEYS.DAY_START_HOUR, dayStartHour.toString());
        }
    }["AudioMonitoringProvider.useEffect"], [
        dayStartHour
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            debugLog('[AudioMonitoring] Saving day end hour:', dayEndHour);
            localStorage.setItem(STORAGE_KEYS.DAY_END_HOUR, dayEndHour.toString());
        }
    }["AudioMonitoringProvider.useEffect"], [
        dayEndHour
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            debugLog('[AudioMonitoring] Saving night ramp duration:', nightRampDuration);
            localStorage.setItem(STORAGE_KEYS.NIGHT_RAMP_DURATION, nightRampDuration.toString());
        }
    }["AudioMonitoringProvider.useEffect"], [
        nightRampDuration
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            debugLog('[AudioMonitoring] Saving sustain duration:', sustainDuration);
            localStorage.setItem(STORAGE_KEYS.SUSTAIN_DURATION, sustainDuration.toString());
        }
    }["AudioMonitoringProvider.useEffect"], [
        sustainDuration
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            debugLog('[AudioMonitoring] Saving disable delay:', disableDelay);
            localStorage.setItem(STORAGE_KEYS.DISABLE_DELAY, disableDelay.toString());
        }
    }["AudioMonitoringProvider.useEffect"], [
        disableDelay
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            debugLog('[AudioMonitoring] Saving logging enabled:', loggingEnabled);
            localStorage.setItem(STORAGE_KEYS.LOGGING_ENABLED, loggingEnabled.toString());
        }
    }["AudioMonitoringProvider.useEffect"], [
        loggingEnabled
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            debugLog('[AudioMonitoring] Saving recording enabled:', recordingEnabled);
            localStorage.setItem(STORAGE_KEYS.RECORDING_ENABLED, recordingEnabled.toString());
        }
    }["AudioMonitoringProvider.useEffect"], [
        recordingEnabled
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            debugLog('[AudioMonitoring] Saving global volume mode:', useGlobalVolume);
            localStorage.setItem(STORAGE_KEYS.USE_GLOBAL_VOLUME, useGlobalVolume.toString());
        }
    }["AudioMonitoringProvider.useEffect"], [
        useGlobalVolume
    ]);
    // Watch for target volume changes - restart ramp if speakers are enabled
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!hasRestoredStateRef.current) return;
            // Only restart ramp if:
            // 1. Speakers are currently enabled
            // 2. Not currently controlling speakers
            // 3. Speakers were ALREADY enabled (don't trigger on initial enable)
            if (speakersEnabled && !controllingSpakersRef.current) {
                // Check if this is the initial enable (currentVolume should still be 0)
                const currentVolume = currentVolumeRef.current;
                // Don't start ramp on initial monitoring start - wait for audio detection
                // Only start ramp when targetVolume changes while already monitoring
                if (currentVolume > 0 || audioDetected) {
                    debugLog(`[AudioMonitoring] Target volume changed, restarting ramp from ${currentVolume}% to ${targetVolume}%`);
                    startVolumeRamp(currentVolume);
                } else {
                    debugLog(`[AudioMonitoring] Speakers enabled but waiting for audio detection before ramping`);
                }
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["AudioMonitoringProvider.useEffect"], [
        targetVolume,
        speakersEnabled
    ]);
    // Set volume on all linked speakers (8180s)
    // volumePercent is the "ramp percentage" (0-100)
    // If useGlobalVolume=true: all speakers use volumePercent directly
    // If useGlobalVolume=false: volumePercent is scaled by each speaker's maxVolume
    const setDevicesVolume = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setDevicesVolume]": async (volumePercent)=>{
            const linkedSpeakerIds = new Set();
            // Safety check: ensure selectedDevices is iterable
            const safeSelectedDevices = selectedDevices || [];
            for (const deviceId of safeSelectedDevices){
                const device = devices.find({
                    "AudioMonitoringProvider.useCallback[setDevicesVolume].device": (d)=>d.id === deviceId
                }["AudioMonitoringProvider.useCallback[setDevicesVolume].device"]);
                if (!device) continue;
                if (device.type === "8301" && device.linkedSpeakerIds) {
                    device.linkedSpeakerIds.forEach({
                        "AudioMonitoringProvider.useCallback[setDevicesVolume]": (id)=>linkedSpeakerIds.add(id)
                    }["AudioMonitoringProvider.useCallback[setDevicesVolume]"]);
                }
            }
            debugLog(`[AudioMonitoring] setDevicesVolume(${volumePercent}%) - processing ${linkedSpeakerIds.size} speakers`);
            const volumePromises = Array.from(linkedSpeakerIds).map({
                "AudioMonitoringProvider.useCallback[setDevicesVolume].volumePromises": async (speakerId)=>{
                    const speaker = devices.find({
                        "AudioMonitoringProvider.useCallback[setDevicesVolume].volumePromises.speaker": (d)=>d.id === speakerId
                    }["AudioMonitoringProvider.useCallback[setDevicesVolume].volumePromises.speaker"]);
                    if (!speaker) {
                        debugLog(`[AudioMonitoring] Speaker ${speakerId} not found in devices array`);
                        return;
                    }
                    // Skip speakers without proper credentials
                    if (!speaker.ipAddress || !speaker.apiPassword) {
                        console.warn(`[AudioMonitoring] Skipping ${speaker.name || speakerId}: missing IP or password`);
                        return;
                    }
                    // Calculate actual volume based on mode
                    let actualVolume;
                    if (useGlobalVolume) {
                        // Global mode: all speakers use targetVolume (with ramping if enabled)
                        // volumePercent comes from the ramp (0-100% of targetVolume)
                        actualVolume = volumePercent;
                        debugLog(`[AudioMonitoring] GLOBAL MODE - Setting ${speaker.name} to ${actualVolume.toFixed(0)}%`);
                    } else {
                        // Individual mode: each speaker ramps to its own maxVolume
                        // volumePercent represents the ramp progress (0-100%)
                        // At 0%: speaker is at 0%, at 100%: speaker is at its maxVolume
                        const speakerMaxVolume = speaker.maxVolume ?? 100;
                        actualVolume = volumePercent / 100 * speakerMaxVolume;
                        debugLog(`[AudioMonitoring] INDIVIDUAL MODE - Setting ${speaker.name} to ${volumePercent.toFixed(0)}% of its max ${speakerMaxVolume}% = ${actualVolume.toFixed(0)}% (Level ${Math.round(actualVolume / 10)})`);
                    }
                    // Convert 0-100% to dB
                    // SPECIAL CASE: 0% = idle volume (IDLE state - quietest before needing multicast control)
                    // Normal range: Algo expects 1=-27dB, 2=-24dB, ... 10=0dB
                    // Formula: dB = (level - 10) * 3
                    let volumeDbString;
                    if (actualVolume === 0) {
                        volumeDbString = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIdleVolumeString"])(); // IDLE state - level -5 (quietest volume)
                    } else {
                        const volumeScale = Math.round(actualVolume / 100 * 10);
                        const volumeDb = (volumeScale - 10) * 3;
                        volumeDbString = volumeDb === 0 ? "0dB" : `${volumeDb}dB`;
                    }
                    debugLog(`[AudioMonitoring] ${speaker.name} final: ${actualVolume.toFixed(0)}% → ${volumeDbString}`);
                    try {
                        const response = await fetch("/api/algo/settings", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                ipAddress: speaker.ipAddress,
                                password: speaker.apiPassword,
                                authMethod: speaker.authMethod || "standard",
                                settings: {
                                    "audio.page.vol": volumeDbString
                                }
                            })
                        });
                        if (!response.ok) {
                            // Only log as warning (not error) - offline speakers are expected
                            const errorText = await response.text().catch({
                                "AudioMonitoringProvider.useCallback[setDevicesVolume].volumePromises": ()=>'Unknown error'
                            }["AudioMonitoringProvider.useCallback[setDevicesVolume].volumePromises"]);
                            debugLog(`[AudioMonitoring] ❌ Failed to set ${speaker.name} volume: ${errorText}`);
                        } else {
                            debugLog(`[AudioMonitoring] ✓ Successfully set ${speaker.name} to ${volumeDbString}`);
                        }
                    } catch (error) {
                        // Network error - speaker might be offline, just skip silently
                        debugLog(`[AudioMonitoring] ❌ Network error setting ${speaker.name} volume`);
                    }
                }
            }["AudioMonitoringProvider.useCallback[setDevicesVolume].volumePromises"]);
            // Use allSettled to continue even if some speakers fail
            await Promise.allSettled(volumePromises);
            debugLog(`[AudioMonitoring] setDevicesVolume(${volumePercent}%) - completed`);
        }
    }["AudioMonitoringProvider.useCallback[setDevicesVolume]"], [
        selectedDevices,
        devices,
        useGlobalVolume
    ]);
    // Helper function to determine if it's currently daytime
    const isDaytime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[isDaytime]": ()=>{
            const now = new Date();
            const currentHour = now.getHours();
            return currentHour >= dayStartHour && currentHour < dayEndHour;
        }
    }["AudioMonitoringProvider.useCallback[isDaytime]"], [
        dayStartHour,
        dayEndHour
    ]);
    // Get the effective ramp duration based on settings
    const getEffectiveRampDuration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[getEffectiveRampDuration]": ()=>{
            // If ramp is disabled, return 0 (instant)
            if (!rampEnabled) {
                debugLog('[AudioMonitoring] Ramp disabled - instant volume');
                return 0;
            }
            // If day/night mode is enabled, check time of day
            if (dayNightMode) {
                if (isDaytime()) {
                    debugLog('[AudioMonitoring] Daytime detected - instant volume');
                    return 0; // Instant during day
                } else {
                    debugLog(`[AudioMonitoring] Nighttime detected - ${nightRampDuration}s ramp`);
                    return nightRampDuration * 1000; // Night ramp duration in ms
                }
            }
            // Otherwise use the manual ramp duration setting
            debugLog(`[AudioMonitoring] Manual mode - ${rampDuration}s ramp`);
            return rampDuration * 1000;
        }
    }["AudioMonitoringProvider.useCallback[getEffectiveRampDuration]"], [
        rampEnabled,
        dayNightMode,
        isDaytime,
        rampDuration,
        nightRampDuration
    ]);
    // Set all speakers to getIdleVolumeString() (idle state - quietest volume before needing multicast control)
    const setDevicesVolumeToIdle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setDevicesVolumeToIdle]": async ()=>{
            const linkedSpeakerIds = new Set();
            for (const deviceId of selectedDevices){
                const device = devices.find({
                    "AudioMonitoringProvider.useCallback[setDevicesVolumeToIdle].device": (d)=>d.id === deviceId
                }["AudioMonitoringProvider.useCallback[setDevicesVolumeToIdle].device"]);
                if (!device) continue;
                if (device.type === "8301" && device.linkedSpeakerIds) {
                    device.linkedSpeakerIds.forEach({
                        "AudioMonitoringProvider.useCallback[setDevicesVolumeToIdle]": (id)=>linkedSpeakerIds.add(id)
                    }["AudioMonitoringProvider.useCallback[setDevicesVolumeToIdle]"]);
                }
            }
            debugLog(`[AudioMonitoring] Setting ${linkedSpeakerIds.size} speakers to IDLE (${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIdleVolumeString"])()})`);
            const volumePromises = Array.from(linkedSpeakerIds).map({
                "AudioMonitoringProvider.useCallback[setDevicesVolumeToIdle].volumePromises": async (speakerId)=>{
                    const speaker = devices.find({
                        "AudioMonitoringProvider.useCallback[setDevicesVolumeToIdle].volumePromises.speaker": (d)=>d.id === speakerId
                    }["AudioMonitoringProvider.useCallback[setDevicesVolumeToIdle].volumePromises.speaker"]);
                    if (!speaker || !speaker.ipAddress || !speaker.apiPassword) return;
                    try {
                        await fetch("/api/algo/settings", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                ipAddress: speaker.ipAddress,
                                password: speaker.apiPassword,
                                authMethod: speaker.authMethod || "standard",
                                settings: {
                                    "audio.page.vol": (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIdleVolumeString"])()
                                }
                            })
                        });
                        debugLog(`[AudioMonitoring] ✓ Set ${speaker.name} to IDLE (${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIdleVolumeString"])()})`);
                    } catch (error) {
                        debugLog(`[AudioMonitoring] ❌ Failed to set ${speaker.name} to idle`);
                    }
                }
            }["AudioMonitoringProvider.useCallback[setDevicesVolumeToIdle].volumePromises"]);
            await Promise.allSettled(volumePromises);
        }
    }["AudioMonitoringProvider.useCallback[setDevicesVolumeToIdle]"], [
        selectedDevices,
        devices
    ]);
    // Ramp volume from startFrom to target
    // IMPORTANT: Ramp now starts at 10% (level 1), NOT 0%, to skip inaudible negative dB levels
    const startVolumeRamp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[startVolumeRamp]": (startFrom = 0)=>{
            if (volumeRampIntervalRef.current) {
                clearInterval(volumeRampIntervalRef.current);
            }
            const effectiveRampDuration = getEffectiveRampDuration();
            // Individual mode: Ramp to 100% (each speaker will scale to its maxVolume)
            // Global mode: Ramp to targetVolume (all speakers use same volume)
            const rampTarget = useGlobalVolume ? targetVolume : 100;
            // If ramp duration is 0 (instant), jump directly from idle volume to target volume
            if (effectiveRampDuration === 0) {
                if (useGlobalVolume) {
                    debugLog(`[AudioMonitoring] GLOBAL MODE - Instant jump: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIdleVolumeString"])()} → ${targetVolume}%`);
                } else {
                    debugLog(`[AudioMonitoring] INDIVIDUAL MODE - Instant jump: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIdleVolumeString"])()} → each speaker to its max`);
                }
                currentVolumeRef.current = rampTarget;
                setDevicesVolume(rampTarget);
                return;
            }
            // OPTIMIZATION: Start ramp at level 1 (10%), NOT 0%
            // This skips all the inaudible negative dB levels (getIdleVolumeString(), -30dB, -27dB, etc.)
            // Ramp: getIdleVolumeString() (static) → 10% (audible) → 20% → ... → target (much faster!)
            const rampStart = 10; // Level 1 (10%) = -27dB (first audible level)
            currentVolumeRef.current = rampStart;
            const stepInterval = 500;
            const steps = effectiveRampDuration / stepInterval;
            const volumeDiff = rampTarget - rampStart;
            const volumeIncrement = volumeDiff / steps;
            if (useGlobalVolume) {
                debugLog(`[AudioMonitoring] GLOBAL MODE - Optimized ramp: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIdleVolumeString"])()} → ${rampStart}% → ${targetVolume}% over ${effectiveRampDuration / 1000}s`);
            } else {
                debugLog(`[AudioMonitoring] INDIVIDUAL MODE - Optimized ramp: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIdleVolumeString"])()} → ${rampStart}% → 100% (each speaker to its max) over ${effectiveRampDuration / 1000}s`);
            }
            // Set initial volume to level 1 (10%) - skip inaudible levels!
            setDevicesVolume(rampStart);
            volumeRampIntervalRef.current = setInterval({
                "AudioMonitoringProvider.useCallback[startVolumeRamp]": ()=>{
                    currentVolumeRef.current += volumeIncrement;
                    if (volumeIncrement > 0 && currentVolumeRef.current >= rampTarget) {
                        // Ramping up
                        currentVolumeRef.current = rampTarget;
                        setDevicesVolume(rampTarget);
                        if (volumeRampIntervalRef.current) {
                            clearInterval(volumeRampIntervalRef.current);
                            volumeRampIntervalRef.current = null;
                        }
                        debugLog(`[AudioMonitoring] Volume ramp complete at ${rampTarget}%`);
                    } else if (volumeIncrement < 0 && currentVolumeRef.current <= rampTarget) {
                        // Ramping down
                        currentVolumeRef.current = rampTarget;
                        setDevicesVolume(rampTarget);
                        if (volumeRampIntervalRef.current) {
                            clearInterval(volumeRampIntervalRef.current);
                            volumeRampIntervalRef.current = null;
                        }
                        debugLog(`[AudioMonitoring] Volume ramp complete at ${rampTarget}%`);
                    } else {
                        setDevicesVolume(currentVolumeRef.current);
                    }
                }
            }["AudioMonitoringProvider.useCallback[startVolumeRamp]"], stepInterval);
        }
    }["AudioMonitoringProvider.useCallback[startVolumeRamp]"], [
        targetVolume,
        useGlobalVolume,
        setDevicesVolume,
        getEffectiveRampDuration
    ]);
    const stopVolumeRamp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[stopVolumeRamp]": ()=>{
            if (volumeRampIntervalRef.current) {
                clearInterval(volumeRampIntervalRef.current);
                volumeRampIntervalRef.current = null;
            }
            currentVolumeRef.current = 0;
            // Set all speakers to getIdleVolumeString() (quietest volume - still has static at this level)
            setDevicesVolumeToIdle();
        }
    }["AudioMonitoringProvider.useCallback[stopVolumeRamp]"], []);
    // Auto-detect day/night mode changes while monitoring (24/7 operation)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            // Clear any existing interval first to prevent memory leaks
            if (dayNightCheckIntervalRef.current) {
                clearInterval(dayNightCheckIntervalRef.current);
                dayNightCheckIntervalRef.current = null;
            }
            // Only run if day/night mode is enabled
            if (!dayNightMode) {
                previousDayModeRef.current = null;
                return;
            }
            // Check every minute for day/night transitions
            dayNightCheckIntervalRef.current = setInterval({
                "AudioMonitoringProvider.useEffect": ()=>{
                    // Calculate current day/night status directly to avoid function dependency
                    const now = new Date();
                    const currentHour = now.getHours();
                    const currentIsDaytime = currentHour >= dayStartHour && currentHour < dayEndHour;
                    // Initialize on first run
                    if (previousDayModeRef.current === null) {
                        previousDayModeRef.current = currentIsDaytime;
                        debugLog(`[AudioMonitoring] Day/night monitor initialized: ${currentIsDaytime ? 'DAY' : 'NIGHT'}`);
                        return;
                    }
                    // Check if day/night mode changed
                    if (previousDayModeRef.current !== currentIsDaytime) {
                        debugLog(`[AudioMonitoring] ⏰ Day/night mode changed: ${previousDayModeRef.current ? 'DAY' : 'NIGHT'} → ${currentIsDaytime ? 'DAY' : 'NIGHT'}`);
                        previousDayModeRef.current = currentIsDaytime;
                        // If speakers are currently enabled, restart the ramp with new settings
                        // Use refs to check current state without adding to dependencies
                        if (speakersEnabled && !controllingSpakersRef.current) {
                            const currentVolume = currentVolumeRef.current;
                            debugLog(`[AudioMonitoring] Restarting volume ramp due to day/night change from ${currentVolume}%`);
                            startVolumeRamp(currentVolume);
                        }
                    }
                }
            }["AudioMonitoringProvider.useEffect"], 60000); // Check every 60 seconds
            debugLog(`[AudioMonitoring] Day/night checker started (enabled: ${dayNightMode})`);
            return ({
                "AudioMonitoringProvider.useEffect": ()=>{
                    if (dayNightCheckIntervalRef.current) {
                        debugLog(`[AudioMonitoring] Day/night checker stopped (cleanup)`);
                        clearInterval(dayNightCheckIntervalRef.current);
                        dayNightCheckIntervalRef.current = null;
                    }
                }
            })["AudioMonitoringProvider.useEffect"];
        // Only depend on stable values - not functions
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["AudioMonitoringProvider.useEffect"], [
        dayNightMode,
        dayStartHour,
        dayEndHour
    ]);
    // Set paging device multicast mode (0=disabled, 1=transmitter, 2=receiver)
    const setPagingMulticast = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setPagingMulticast]": async (mode)=>{
            const pagingDevices = devices.filter({
                "AudioMonitoringProvider.useCallback[setPagingMulticast].pagingDevices": (d)=>d.type === "8301"
            }["AudioMonitoringProvider.useCallback[setPagingMulticast].pagingDevices"]);
            if (pagingDevices.length === 0) {
                debugLog('[AudioMonitoring] No paging devices found');
                return;
            }
            debugLog(`[AudioMonitoring] Setting ${pagingDevices.length} paging device(s) to multicast mode ${mode}`);
            await Promise.allSettled(pagingDevices.map({
                "AudioMonitoringProvider.useCallback[setPagingMulticast]": async (paging)=>{
                    try {
                        await fetch("/api/algo/speakers/mcast", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                speakers: [
                                    {
                                        ipAddress: paging.ipAddress,
                                        password: paging.apiPassword,
                                        authMethod: paging.authMethod
                                    }
                                ],
                                mode
                            })
                        });
                        debugLog(`[AudioMonitoring] ✓ Set ${paging.name} to mode ${mode}`);
                    } catch (error) {
                        console.error(`Failed to set ${paging.name} multicast mode:`, error);
                    }
                }
            }["AudioMonitoringProvider.useCallback[setPagingMulticast]"]));
        }
    }["AudioMonitoringProvider.useCallback[setPagingMulticast]"], [
        devices
    ]);
    // Set all speakers multicast mode (0=disabled, 1=transmitter, 2=receiver)
    const setSpeakersMulticast = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setSpeakersMulticast]": async (mode)=>{
            const linkedSpeakerIds = new Set();
            for (const deviceId of selectedDevices){
                const device = devices.find({
                    "AudioMonitoringProvider.useCallback[setSpeakersMulticast].device": (d)=>d.id === deviceId
                }["AudioMonitoringProvider.useCallback[setSpeakersMulticast].device"]);
                if (!device) continue;
                if (device.type === "8301" && device.linkedSpeakerIds) {
                    device.linkedSpeakerIds.forEach({
                        "AudioMonitoringProvider.useCallback[setSpeakersMulticast]": (id)=>linkedSpeakerIds.add(id)
                    }["AudioMonitoringProvider.useCallback[setSpeakersMulticast]"]);
                }
            }
            const speakers = Array.from(linkedSpeakerIds).map({
                "AudioMonitoringProvider.useCallback[setSpeakersMulticast].speakers": (id)=>devices.find({
                        "AudioMonitoringProvider.useCallback[setSpeakersMulticast].speakers": (d)=>d.id === id
                    }["AudioMonitoringProvider.useCallback[setSpeakersMulticast].speakers"])
            }["AudioMonitoringProvider.useCallback[setSpeakersMulticast].speakers"]).filter({
                "AudioMonitoringProvider.useCallback[setSpeakersMulticast].speakers": (s)=>!!s
            }["AudioMonitoringProvider.useCallback[setSpeakersMulticast].speakers"]);
            if (speakers.length === 0) {
                debugLog('[AudioMonitoring] No speakers to control');
                return;
            }
            debugLog(`[AudioMonitoring] Setting ${speakers.length} speakers to multicast mode ${mode}`);
            await Promise.allSettled(speakers.map({
                "AudioMonitoringProvider.useCallback[setSpeakersMulticast]": async (speaker)=>{
                    try {
                        await fetch("/api/algo/speakers/mcast", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                speakers: [
                                    {
                                        ipAddress: speaker.ipAddress,
                                        password: speaker.apiPassword,
                                        authMethod: speaker.authMethod
                                    }
                                ],
                                mode
                            })
                        });
                        debugLog(`[AudioMonitoring] ✓ Set ${speaker.name} to mode ${mode}`);
                    } catch (error) {
                        console.error(`Failed to set ${speaker.name} multicast mode:`, error);
                    }
                }
            }["AudioMonitoringProvider.useCallback[setSpeakersMulticast]"]));
        }
    }["AudioMonitoringProvider.useCallback[setSpeakersMulticast]"], [
        selectedDevices,
        devices
    ]);
    // Enable/disable speakers (LEGACY - kept for backward compatibility)
    const controlSpeakers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[controlSpeakers]": async (enable)=>{
            const allSpeakerPromises = [];
            for (const deviceId of selectedDevices){
                const device = devices.find({
                    "AudioMonitoringProvider.useCallback[controlSpeakers].device": (d)=>d.id === deviceId
                }["AudioMonitoringProvider.useCallback[controlSpeakers].device"]);
                if (!device) continue;
                if (device.type === "8301" && device.linkedSpeakerIds && device.linkedSpeakerIds.length > 0) {
                    const linkedSpeakers = devices.filter({
                        "AudioMonitoringProvider.useCallback[controlSpeakers].linkedSpeakers": (d)=>device.linkedSpeakerIds?.includes(d.id)
                    }["AudioMonitoringProvider.useCallback[controlSpeakers].linkedSpeakers"]);
                    debugLog(`[AudioMonitoring] ${enable ? 'Enabling' : 'Disabling'} ${linkedSpeakers.length} speakers for ${device.name}`);
                    // Control each speaker individually for better error resilience
                    linkedSpeakers.forEach({
                        "AudioMonitoringProvider.useCallback[controlSpeakers]": (speaker)=>{
                            const promise = ({
                                "AudioMonitoringProvider.useCallback[controlSpeakers].promise": async ()=>{
                                    try {
                                        const response = await fetch("/api/algo/speakers/mcast", {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json"
                                            },
                                            body: JSON.stringify({
                                                speakers: [
                                                    {
                                                        ipAddress: speaker.ipAddress,
                                                        password: speaker.apiPassword,
                                                        authMethod: speaker.authMethod
                                                    }
                                                ],
                                                enable
                                            })
                                        });
                                        if (!response.ok) {
                                            console.error(`Failed to ${enable ? 'enable' : 'disable'} speaker ${speaker.name}: HTTP ${response.status}`);
                                        } else {
                                            debugLog(`[AudioMonitoring] Successfully ${enable ? 'enabled' : 'disabled'} ${speaker.name}`);
                                        }
                                    } catch (error) {
                                        console.error(`Failed to control speaker ${speaker.name}:`, error);
                                    // Continue with other speakers - don't throw
                                    }
                                }
                            })["AudioMonitoringProvider.useCallback[controlSpeakers].promise"]();
                            allSpeakerPromises.push(promise);
                        }
                    }["AudioMonitoringProvider.useCallback[controlSpeakers]"]);
                }
            }
            // Wait for all speakers to complete (parallel execution)
            // Individual failures won't crash the system
            await Promise.allSettled(allSpeakerPromises);
        }
    }["AudioMonitoringProvider.useCallback[controlSpeakers]"], [
        selectedDevices,
        devices
    ]);
    // PoE Device Controls
    const controlPoEDevices = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[controlPoEDevices]": async (enable)=>{
            debugLog(`[PoE Control] Total PoE devices: ${poeDevices.length}`);
            // Get PoE devices in auto mode
            const autoPoEDevices = poeDevices.filter({
                "AudioMonitoringProvider.useCallback[controlPoEDevices].autoPoEDevices": (d)=>d.mode === "auto"
            }["AudioMonitoringProvider.useCallback[controlPoEDevices].autoPoEDevices"]);
            debugLog(`[PoE Control] Auto mode PoE devices: ${autoPoEDevices.length}`);
            if (autoPoEDevices.length === 0) {
                debugLog('[PoE Control] No PoE devices in auto mode');
                return;
            }
            // Get active paging devices (8301) from selected devices
            const activePagingDeviceIds = selectedDevices.filter({
                "AudioMonitoringProvider.useCallback[controlPoEDevices].activePagingDeviceIds": (deviceId)=>{
                    const device = devices.find({
                        "AudioMonitoringProvider.useCallback[controlPoEDevices].activePagingDeviceIds.device": (d)=>d.id === deviceId
                    }["AudioMonitoringProvider.useCallback[controlPoEDevices].activePagingDeviceIds.device"]);
                    return device && device.type === "8301";
                }
            }["AudioMonitoringProvider.useCallback[controlPoEDevices].activePagingDeviceIds"]);
            debugLog(`[PoE Control] Selected devices: ${selectedDevices.length}, Active paging devices (8301): ${activePagingDeviceIds.length}`, activePagingDeviceIds);
            // Filter PoE devices:
            // - Only control devices that are linked to at least one active paging device
            // - If device has no linkedPagingDeviceIds, DON'T auto-control (user manages it manually or it's always on)
            const eligiblePoEDevices = autoPoEDevices.filter({
                "AudioMonitoringProvider.useCallback[controlPoEDevices].eligiblePoEDevices": (poeDevice)=>{
                    // If no paging devices are linked, DON'T auto-control this device
                    if (!poeDevice.linkedPagingDeviceIds || poeDevice.linkedPagingDeviceIds.length === 0) {
                        debugLog(`[PoE Control] Device "${poeDevice.name}" has no linked paging devices - skipping`);
                        return false;
                    }
                    // If paging devices are linked, check if any of them are active
                    const hasActivePagingDevice = poeDevice.linkedPagingDeviceIds.some({
                        "AudioMonitoringProvider.useCallback[controlPoEDevices].eligiblePoEDevices.hasActivePagingDevice": (linkedId)=>activePagingDeviceIds.includes(linkedId)
                    }["AudioMonitoringProvider.useCallback[controlPoEDevices].eligiblePoEDevices.hasActivePagingDevice"]);
                    if (!hasActivePagingDevice) {
                        debugLog(`[PoE Control] Device "${poeDevice.name}" linked paging devices not active - skipping. Linked: ${poeDevice.linkedPagingDeviceIds.join(',')}, Active: ${activePagingDeviceIds.join(',')}`);
                    } else {
                        debugLog(`[PoE Control] Device "${poeDevice.name}" is eligible (linked paging device is active)`);
                    }
                    return hasActivePagingDevice;
                }
            }["AudioMonitoringProvider.useCallback[controlPoEDevices].eligiblePoEDevices"]);
            if (eligiblePoEDevices.length === 0) {
                debugLog(`[PoE Control] No eligible PoE devices to ${enable ? 'enable' : 'disable'} (no linked paging devices active)`);
                return;
            }
            debugLog(`[PoE Control] ${enable ? 'Enabling' : 'Disabling'} ${eligiblePoEDevices.length} PoE devices (${activePagingDeviceIds.length} paging devices active)`);
            // Log PoE control action
            addLog({
                type: enable ? "speakers_enabled" : "speakers_disabled",
                message: `PoE: ${enable ? 'ON' : 'OFF'} - ${eligiblePoEDevices.map({
                    "AudioMonitoringProvider.useCallback[controlPoEDevices]": (d)=>d.name
                }["AudioMonitoringProvider.useCallback[controlPoEDevices]"]).join(', ')}`
            });
            const promises = eligiblePoEDevices.map({
                "AudioMonitoringProvider.useCallback[controlPoEDevices].promises": async (device)=>{
                    try {
                        const response = await fetch("/api/poe/toggle", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                deviceId: device.id,
                                enabled: enable
                            })
                        });
                        if (!response.ok) {
                            console.error(`Failed to ${enable ? 'enable' : 'disable'} PoE device ${device.name}: HTTP ${response.status}`);
                            addLog({
                                type: enable ? "speakers_enabled" : "speakers_disabled",
                                message: `⚠️ PoE ${device.name} failed: HTTP ${response.status}`
                            });
                        } else {
                            debugLog(`[PoE Control] Successfully ${enable ? 'enabled' : 'disabled'} ${device.name}`);
                        }
                    } catch (error) {
                        console.error(`Failed to control PoE device ${device.name}:`, error);
                        addLog({
                            type: enable ? "speakers_enabled" : "speakers_disabled",
                            message: `⚠️ PoE ${device.name} error: ${error instanceof Error ? error.message : 'Unknown error'}`
                        });
                    }
                }
            }["AudioMonitoringProvider.useCallback[controlPoEDevices].promises"]);
            await Promise.allSettled(promises);
        }
    }["AudioMonitoringProvider.useCallback[controlPoEDevices]"], [
        poeDevices,
        selectedDevices,
        devices,
        addLog
    ]);
    // Emergency Controls
    const emergencyKillAll = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[emergencyKillAll]": async ()=>{
            debugLog('[AudioMonitoring] EMERGENCY: Killing all speakers');
            addLog({
                type: "speakers_disabled",
                message: "EMERGENCY KILL: Shutting down paging and all speakers IMMEDIATELY"
            });
            // NEW FLOW: Emergency shutdown
            // 1. Mute all speakers to getIdleVolumeString()
            await setDevicesVolume(0);
            // 2. Disable paging transmitter (INSTANT silence - no more audio broadcast!)
            await setPagingMulticast(0);
            // 3. Disable all speaker receivers
            await setSpeakersMulticast(0);
            // Reset state
            setSpeakersEnabled(false);
            setAudioDetected(false);
            currentVolumeRef.current = 0;
            if (volumeRampIntervalRef.current) {
                clearInterval(volumeRampIntervalRef.current);
                volumeRampIntervalRef.current = null;
            }
            debugLog(`[AudioMonitoring] ✓ EMERGENCY KILL COMPLETE: All devices mode 0, volume ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIdleVolumeString"])()}`);
        }
    }["AudioMonitoringProvider.useCallback[emergencyKillAll]"], [
        setDevicesVolume,
        setPagingMulticast,
        setSpeakersMulticast,
        addLog
    ]);
    const emergencyEnableAll = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[emergencyEnableAll]": async ()=>{
            debugLog('[AudioMonitoring] EMERGENCY: Enabling all speakers');
            addLog({
                type: "speakers_enabled",
                message: "EMERGENCY ENABLE: Activating paging and all speakers at target volume"
            });
            // NEW FLOW: Emergency enable
            // 1. Set speakers to mode 2 (receivers)
            await setSpeakersMulticast(2);
            // 2. Enable paging transmitter (mode 1 - START broadcasting!)
            await setPagingMulticast(1);
            // 3. Set to target volume (instant - no ramp in emergency)
            await setDevicesVolume(targetVolume);
            setSpeakersEnabled(true);
            currentVolumeRef.current = targetVolume;
            debugLog('[AudioMonitoring] ✓ EMERGENCY ENABLE COMPLETE: Paging ON, Speakers listening, Volume set');
        }
    }["AudioMonitoringProvider.useCallback[emergencyEnableAll]"], [
        setSpeakersMulticast,
        setPagingMulticast,
        setDevicesVolume,
        targetVolume,
        addLog
    ]);
    const controlSingleSpeaker = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[controlSingleSpeaker]": async (speakerId, enable)=>{
            const speaker = devices.find({
                "AudioMonitoringProvider.useCallback[controlSingleSpeaker].speaker": (d)=>d.id === speakerId
            }["AudioMonitoringProvider.useCallback[controlSingleSpeaker].speaker"]);
            if (!speaker) {
                console.error(`Speaker ${speakerId} not found`);
                return;
            }
            debugLog(`[AudioMonitoring] ${enable ? 'Enabling' : 'Disabling'} single speaker: ${speaker.name}`);
            addLog({
                type: enable ? "speakers_enabled" : "speakers_disabled",
                message: `${enable ? 'Enabled' : 'Disabled'} speaker: ${speaker.name}`
            });
            try {
                // Control multicast
                await fetch("/api/algo/speakers/mcast", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        speakers: [
                            {
                                ipAddress: speaker.ipAddress,
                                password: speaker.apiPassword,
                                authMethod: speaker.authMethod
                            }
                        ],
                        enable
                    })
                });
                // If disabling, also mute
                if (!enable) {
                    await fetch("/api/algo/settings", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            ipAddress: speaker.ipAddress,
                            password: speaker.apiPassword,
                            authMethod: speaker.authMethod,
                            settings: {
                                "audio.page.vol": (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIdleVolumeString"])()
                            }
                        })
                    });
                }
            } catch (error) {
                console.error(`Failed to control speaker ${speaker.name}:`, error);
            }
        }
    }["AudioMonitoringProvider.useCallback[controlSingleSpeaker]"], [
        devices,
        addLog
    ]);
    // Check connectivity of all linked speakers
    const checkSpeakerConnectivity = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[checkSpeakerConnectivity]": async ()=>{
            const linkedSpeakerIds = new Set();
            // Safety check: ensure selectedDevices is iterable
            const safeSelectedDevices = selectedDevices || [];
            // Get all linked speakers from selected paging devices
            for (const deviceId of safeSelectedDevices){
                const device = devices.find({
                    "AudioMonitoringProvider.useCallback[checkSpeakerConnectivity].device": (d)=>d.id === deviceId
                }["AudioMonitoringProvider.useCallback[checkSpeakerConnectivity].device"]);
                if (!device) continue;
                if (device.type === "8301" && device.linkedSpeakerIds) {
                    device.linkedSpeakerIds.forEach({
                        "AudioMonitoringProvider.useCallback[checkSpeakerConnectivity]": (id)=>linkedSpeakerIds.add(id)
                    }["AudioMonitoringProvider.useCallback[checkSpeakerConnectivity]"]);
                }
            }
            if (linkedSpeakerIds.size === 0) {
                setSpeakerStatuses([]);
                return;
            }
            // Build device list for health check API
            const speakersToCheck = Array.from(linkedSpeakerIds).map({
                "AudioMonitoringProvider.useCallback[checkSpeakerConnectivity].speakersToCheck": (id)=>devices.find({
                        "AudioMonitoringProvider.useCallback[checkSpeakerConnectivity].speakersToCheck": (d)=>d.id === id
                    }["AudioMonitoringProvider.useCallback[checkSpeakerConnectivity].speakersToCheck"])
            }["AudioMonitoringProvider.useCallback[checkSpeakerConnectivity].speakersToCheck"]).filter({
                "AudioMonitoringProvider.useCallback[checkSpeakerConnectivity].speakersToCheck": (s)=>!!s && !!s.ipAddress && !!s.apiPassword
            }["AudioMonitoringProvider.useCallback[checkSpeakerConnectivity].speakersToCheck"]);
            if (speakersToCheck.length === 0) {
                setSpeakerStatuses([]);
                return;
            }
            debugLog(`[AudioMonitoring] Checking connectivity for ${speakersToCheck.length} speakers...`);
            try {
                const response = await fetch("/api/algo/health", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        devices: speakersToCheck.map({
                            "AudioMonitoringProvider.useCallback[checkSpeakerConnectivity]": (s)=>({
                                    id: s.id,
                                    ipAddress: s.ipAddress,
                                    apiPassword: s.apiPassword,
                                    authMethod: s.authMethod || "standard"
                                })
                        }["AudioMonitoringProvider.useCallback[checkSpeakerConnectivity]"]),
                        timeout: 3000
                    })
                });
                if (!response.ok) {
                    throw new Error(`Health check failed: ${response.status}`);
                }
                const result = await response.json();
                // Convert API response to SpeakerStatus array
                const statuses = result.devices.map({
                    "AudioMonitoringProvider.useCallback[checkSpeakerConnectivity].statuses": (d)=>{
                        const speaker = devices.find({
                            "AudioMonitoringProvider.useCallback[checkSpeakerConnectivity].statuses.speaker": (s)=>s.id === d.id
                        }["AudioMonitoringProvider.useCallback[checkSpeakerConnectivity].statuses.speaker"]);
                        return {
                            speakerId: d.id,
                            speakerName: speaker?.name || 'Unknown',
                            ipAddress: d.ipAddress,
                            isOnline: d.isOnline,
                            lastChecked: new Date(),
                            errorMessage: d.error
                        };
                    }
                }["AudioMonitoringProvider.useCallback[checkSpeakerConnectivity].statuses"]);
                setSpeakerStatuses(statuses);
                const onlineCount = statuses.filter({
                    "AudioMonitoringProvider.useCallback[checkSpeakerConnectivity]": (s)=>s.isOnline
                }["AudioMonitoringProvider.useCallback[checkSpeakerConnectivity]"]).length;
                const offlineCount = statuses.filter({
                    "AudioMonitoringProvider.useCallback[checkSpeakerConnectivity]": (s)=>!s.isOnline
                }["AudioMonitoringProvider.useCallback[checkSpeakerConnectivity]"]).length;
                addLog({
                    type: offlineCount > 0 ? "speakers_disabled" : "speakers_enabled",
                    message: `Connectivity check: ${onlineCount} online, ${offlineCount} offline`
                });
                debugLog(`[AudioMonitoring] Connectivity check complete: ${onlineCount} online, ${offlineCount} offline`);
            } catch (error) {
                console.error('[AudioMonitoring] Connectivity check failed:', error);
                // Set all as unknown status on error
                const statuses = speakersToCheck.map({
                    "AudioMonitoringProvider.useCallback[checkSpeakerConnectivity].statuses": (s)=>({
                            speakerId: s.id,
                            speakerName: s.name || 'Unknown',
                            ipAddress: s.ipAddress || 'Unknown',
                            isOnline: false,
                            lastChecked: new Date(),
                            errorMessage: 'Check failed'
                        })
                }["AudioMonitoringProvider.useCallback[checkSpeakerConnectivity].statuses"]);
                setSpeakerStatuses(statuses);
            }
        }
    }["AudioMonitoringProvider.useCallback[checkSpeakerConnectivity]"], [
        selectedDevices,
        devices,
        addLog
    ]);
    // Audio activity detection with sustained audio requirement
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioMonitoringProvider.useEffect": ()=>{
            if (!isCapturing) {
                // Clean up sustained audio tracking when not capturing
                if (sustainedAudioStartRef.current) {
                    sustainedAudioStartRef.current = null;
                }
                return;
            }
            // Use configurable disable delay (default 3 seconds)
            if (audioLevel > audioThreshold) {
                // Audio is above threshold
                // Start tracking sustained audio if not already tracking
                // Note: speakersEnabled is always true during monitoring, use audioDetected instead
                if (!sustainedAudioStartRef.current && !audioDetected) {
                    sustainedAudioStartRef.current = Date.now();
                    debugLog(`[AudioMonitoring] Audio above threshold (${audioLevel.toFixed(1)}%), starting ${sustainDuration}ms sustain timer`);
                }
                // Check if audio has been sustained long enough
                // Note: speakersEnabled is always true during monitoring (always-on mode)
                // We use audioDetected to track if we're actively playing audio
                if (sustainedAudioStartRef.current && !audioDetected && !controllingSpakersRef.current) {
                    const sustainedFor = Date.now() - sustainedAudioStartRef.current;
                    if (sustainedFor >= sustainDuration) {
                        // Audio has been sustained - ramp volume up!
                        // CRITICAL: Speakers are already listening (multicast enabled at start)
                        // We only need to ramp up volume - this is INSTANT compared to enabling multicast
                        sustainedAudioStartRef.current = null;
                        setAudioDetected(true);
                        controllingSpakersRef.current = true;
                        speakersEnabledTimeRef.current = Date.now(); // Track when audio started playing
                        addLog({
                            type: "audio_detected",
                            audioLevel,
                            audioThreshold,
                            message: rampEnabled ? `Audio sustained ${sustainDuration}ms at ${audioLevel.toFixed(1)}% - ramping volume (speakers already listening)` : `Audio sustained ${sustainDuration}ms at ${audioLevel.toFixed(1)}% (speakers already listening)`
                        });
                        if (rampEnabled) {
                            addLog({
                                type: "volume_change",
                                audioLevel,
                                speakersEnabled: true,
                                volume: targetVolume,
                                message: `Volume ramping to ${targetVolume}% (paging mode 1 → speakers receive audio)`
                            });
                        } else {
                            addLog({
                                type: "volume_change",
                                audioLevel,
                                speakersEnabled: true,
                                volume: targetVolume,
                                message: `Speakers at operating volume ${targetVolume}% (paging mode 1 → speakers receive audio)`
                            });
                        }
                        ({
                            "AudioMonitoringProvider.useEffect": async ()=>{
                                // Start recording the audio
                                await startRecording();
                                // Enable PoE devices (lights, etc.) in auto mode
                                await controlPoEDevices(true);
                                // NEW FLOW: Enable paging transmitter (mode 1) - INSTANT audio!
                                // Speakers are already in mode 2 (listening), so they'll receive immediately
                                const alwaysKeepPagingOn = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAlwaysKeepPagingOn"])();
                                if (!alwaysKeepPagingOn) {
                                    // Only toggle paging if not always on
                                    debugLog('[AudioMonitoring] AUDIO DETECTED - Setting paging to mode 1 (transmitter)');
                                    await setPagingMulticast(1);
                                } else {
                                    debugLog('[AudioMonitoring] AUDIO DETECTED - Paging already at mode 1 (always on)');
                                }
                                // Then ramp the volume (only if ramp enabled)
                                if (rampEnabled) {
                                    debugLog('[AudioMonitoring] Ramp ENABLED - Starting volume ramp');
                                    startVolumeRamp();
                                } else {
                                    debugLog('[AudioMonitoring] Ramp DISABLED - Speakers already at operating volume, no ramp needed');
                                }
                                controllingSpakersRef.current = false;
                            }
                        })["AudioMonitoringProvider.useEffect"]();
                    }
                }
                // Clear disable timeout if audio is detected again
                if (audioDetectionTimeoutRef.current) {
                    clearTimeout(audioDetectionTimeoutRef.current);
                    audioDetectionTimeoutRef.current = null;
                }
            } else {
                // Audio is below threshold
                // Reset sustained audio timer if it was tracking
                if (sustainedAudioStartRef.current) {
                    debugLog(`[AudioMonitoring] Audio dropped below threshold before sustain duration`);
                    sustainedAudioStartRef.current = null;
                }
                // Start mute countdown if audio was playing
                // Note: We DON'T disable multicast - speakers stay listening (always-on mode)
                // We only mute the volume so speakers are ready for the next audio burst
                if (audioDetected) {
                    if (!audioDetectionTimeoutRef.current) {
                        addLog({
                            type: "audio_silent",
                            audioLevel,
                            audioThreshold,
                            message: `Audio below threshold: ${audioLevel.toFixed(1)}% - starting ${disableDelay / 1000}s mute countdown`
                        });
                        audioDetectionTimeoutRef.current = setTimeout({
                            "AudioMonitoringProvider.useEffect": ()=>{
                                if (!controllingSpakersRef.current) {
                                    controllingSpakersRef.current = true;
                                    // DON'T disable speakers - keep them listening!
                                    // setSpeakersEnabled(false); // REMOVED - speakers stay on
                                    setAudioDetected(false); // Just mark audio as not active
                                    // Calculate how long audio was playing
                                    const duration = speakersEnabledTimeRef.current ? ((Date.now() - speakersEnabledTimeRef.current) / 1000).toFixed(1) : '?';
                                    speakersEnabledTimeRef.current = null;
                                    ({
                                        "AudioMonitoringProvider.useEffect": async ()=>{
                                            // Stop recording and upload
                                            const recordingUrl = await stopRecordingAndUpload();
                                            // Disable PoE devices (lights, etc.) in auto mode
                                            await controlPoEDevices(false);
                                            // NEW FLOW: Disable paging transmitter (mode 0) - NO MORE AUDIO!
                                            // Speakers stay in mode 2 (listening), ready for next audio
                                            const alwaysKeepPagingOn = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAlwaysKeepPagingOn"])();
                                            if (!alwaysKeepPagingOn) {
                                                // Only toggle paging if not always on
                                                debugLog('[AudioMonitoring] AUDIO ENDED - Setting paging to mode 0 (disabled)');
                                                await setPagingMulticast(0);
                                            } else {
                                                debugLog('[AudioMonitoring] AUDIO ENDED - Keeping paging at mode 1 (always on)');
                                            }
                                            // Ramp down or keep at operating volume
                                            if (rampEnabled) {
                                                debugLog('[AudioMonitoring] Ramp ENABLED - Ramping volume down to idle');
                                                stopVolumeRamp();
                                                await setDevicesVolume(0);
                                            } else {
                                                debugLog('[AudioMonitoring] Ramp DISABLED - Keeping speakers at operating volume');
                                            // Speakers stay at operating volume - no change needed
                                            }
                                            // Log with recording URL if available
                                            addLog({
                                                type: "volume_change",
                                                speakersEnabled: true,
                                                volume: rampEnabled ? 0 : targetVolume,
                                                message: rampEnabled ? `Paging OFF after ${disableDelay / 1000}s silence (duration: ${duration}s) - NO STATIC!${recordingUrl ? ' 🎙️ Recording saved' : ''}` : `Paging OFF after ${disableDelay / 1000}s silence (duration: ${duration}s) - Speakers stay at operating volume${recordingUrl ? ' 🎙️ Recording saved' : ''}`,
                                                recordingUrl: recordingUrl || undefined
                                            });
                                            controllingSpakersRef.current = false;
                                        }
                                    })["AudioMonitoringProvider.useEffect"]();
                                }
                                audioDetectionTimeoutRef.current = null;
                            }
                        }["AudioMonitoringProvider.useEffect"], disableDelay);
                    }
                }
            }
        }
    }["AudioMonitoringProvider.useEffect"], [
        audioLevel,
        isCapturing,
        audioDetected,
        speakersEnabled,
        audioThreshold,
        sustainDuration,
        disableDelay,
        controlSpeakers,
        setDevicesVolume,
        startVolumeRamp,
        stopVolumeRamp,
        targetVolume,
        addLog,
        startRecording,
        stopRecordingAndUpload,
        setPagingMulticast,
        controlPoEDevices
    ]);
    const startMonitoring = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[startMonitoring]": async (inputDevice)=>{
            debugLog('[AudioMonitoring] Starting monitoring', inputDevice);
            addLog({
                type: "audio_detected",
                audioThreshold,
                message: `Monitoring started with threshold: ${audioThreshold}%`
            });
            // Start audio capture IMMEDIATELY - don't wait for speaker setup
            // This ensures the UI responds instantly and audio is being captured
            startCapture(inputDevice);
            // Check speaker connectivity first (in background)
            checkSpeakerConnectivity();
            // NEW FLOW: Set up devices for instant response with NO STATIC
            debugLog(`[AudioMonitoring] NEW FLOW: Setting up paging and speakers (mode 2)`);
            // Run speaker setup in background - offline speakers shouldn't block monitoring
            ({
                "AudioMonitoringProvider.useCallback[startMonitoring]": async ()=>{
                    try {
                        // Step 1: Set speakers to starting volume (depends on ramp setting)
                        if (rampEnabled) {
                            // Ramp enabled: Start at idle volume, will ramp up when audio detected
                            debugLog(`[AudioMonitoring] Step 1: Ramp ENABLED - Setting speakers to idle volume ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIdleVolumeString"])()}`);
                            await setDevicesVolume(0); // 0% = idle volume
                        } else {
                            // Ramp disabled: Start at operating volume, stay there
                            debugLog(`[AudioMonitoring] Step 1: Ramp DISABLED - Setting speakers to operating volume`);
                            await setDevicesVolume(100); // 100% scales to each speaker's maxVolume (operating volume)
                        }
                        // Wait briefly to ensure volume command is fully processed
                        await new Promise({
                            "AudioMonitoringProvider.useCallback[startMonitoring]": (resolve)=>setTimeout(resolve, 200)
                        }["AudioMonitoringProvider.useCallback[startMonitoring]"]);
                        // Step 2: Set paging device mode (check settings)
                        const alwaysKeepPagingOn = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAlwaysKeepPagingOn"])();
                        if (alwaysKeepPagingOn) {
                            debugLog('[AudioMonitoring] Step 2: Setting paging device to mode 1 (ALWAYS ON - transmitter)');
                            await setPagingMulticast(1);
                        } else {
                            debugLog('[AudioMonitoring] Step 2: Setting paging device to mode 0 (disabled - will toggle on audio)');
                            await setPagingMulticast(0);
                        }
                        // Step 3: Set all speakers to mode 2 (receiver - ready to listen)
                        debugLog('[AudioMonitoring] Step 3: Setting speakers to mode 2 (receiver)');
                        await setSpeakersMulticast(2);
                        setSpeakersEnabled(true); // Mark as ready
                        const volumeMsg = rampEnabled ? `Idle Volume=${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIdleVolumeString"])()} (will ramp when audio detected)` : `Operating Volume (ramp disabled)`;
                        addLog({
                            type: "speakers_enabled",
                            speakersEnabled: true,
                            volume: rampEnabled ? 0 : 100,
                            message: alwaysKeepPagingOn ? `Monitoring ready: Paging=ALWAYS ON (Mode 1), Speakers=LISTENING, ${volumeMsg}` : `Monitoring ready: Paging=OFF, Speakers=LISTENING, ${volumeMsg}`
                        });
                        debugLog(`[AudioMonitoring] ✓ Setup complete: Paging mode ${alwaysKeepPagingOn ? 1 : 0}, Speakers mode 2, ${volumeMsg}`);
                    } catch (error) {
                        console.error('[AudioMonitoring] Error during speaker setup:', error);
                        // Continue anyway - audio capture is already running
                        setSpeakersEnabled(true);
                    }
                }
            })["AudioMonitoringProvider.useCallback[startMonitoring]"]();
        }
    }["AudioMonitoringProvider.useCallback[startMonitoring]"], [
        startCapture,
        audioThreshold,
        addLog,
        setDevicesVolume,
        setPagingMulticast,
        setSpeakersMulticast,
        checkSpeakerConnectivity
    ]);
    const stopMonitoring = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[stopMonitoring]": async ()=>{
            debugLog('[AudioMonitoring] Stopping monitoring');
            // Calculate duration if audio was playing
            const duration = speakersEnabledTimeRef.current ? ((Date.now() - speakersEnabledTimeRef.current) / 1000).toFixed(1) : null;
            speakersEnabledTimeRef.current = null;
            addLog({
                type: "speakers_disabled",
                message: duration ? `Monitoring stopped (audio was playing for ${duration}s)` : 'Monitoring stopped - shutting down all devices'
            });
            stopCapture();
            stopVolumeRamp();
            // Clear any pending audio detection timeout
            if (audioDetectionTimeoutRef.current) {
                clearTimeout(audioDetectionTimeoutRef.current);
                audioDetectionTimeoutRef.current = null;
            }
            // NEW FLOW: Clean shutdown - set everything to mode 0 and getIdleVolumeString()
            if (!controllingSpakersRef.current) {
                controllingSpakersRef.current = true;
                setSpeakersEnabled(false);
                setAudioDetected(false);
                debugLog(`[AudioMonitoring] STOP: Shutting down paging and speakers to mode 0, volume ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIdleVolumeString"])()}`);
                // Step 1: Set speakers to idle volume
                await setDevicesVolume(0);
                // Step 2: Set paging device to mode 0 (disabled)
                await setPagingMulticast(0);
                // Step 3: Set all speakers to mode 0 (disabled)
                await setSpeakersMulticast(0);
                controllingSpakersRef.current = false;
                debugLog(`[AudioMonitoring] ✓ Clean shutdown complete: All devices mode 0, speakers ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIdleVolumeString"])()}`);
            }
        }
    }["AudioMonitoringProvider.useCallback[stopMonitoring]"], [
        stopCapture,
        stopVolumeRamp,
        setDevicesVolume,
        setPagingMulticast,
        setSpeakersMulticast,
        addLog
    ]);
    const setVolume = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setVolume]": (vol)=>{
            setVolumeState(vol);
        }
    }["AudioMonitoringProvider.useCallback[setVolume]"], []);
    const setInputDevice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setInputDevice]": (deviceId)=>{
            setSelectedInputDeviceState(deviceId);
        }
    }["AudioMonitoringProvider.useCallback[setInputDevice]"], []);
    const setSelectedDevices = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setSelectedDevices]": (devs)=>{
            setSelectedDevicesState(devs);
        }
    }["AudioMonitoringProvider.useCallback[setSelectedDevices]"], []);
    const setTargetVolume = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setTargetVolume]": (vol)=>{
            setTargetVolumeState(vol);
        }
    }["AudioMonitoringProvider.useCallback[setTargetVolume]"], []);
    const setAudioThreshold = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setAudioThreshold]": (threshold)=>{
            setAudioThresholdState(threshold);
        }
    }["AudioMonitoringProvider.useCallback[setAudioThreshold]"], []);
    const setRampEnabled = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setRampEnabled]": (enabled)=>{
            setRampEnabledState(enabled);
        }
    }["AudioMonitoringProvider.useCallback[setRampEnabled]"], []);
    const setRampDuration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setRampDuration]": (duration)=>{
            setRampDurationState(duration);
        }
    }["AudioMonitoringProvider.useCallback[setRampDuration]"], []);
    const setDayNightMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setDayNightMode]": (enabled)=>{
            setDayNightModeState(enabled);
        }
    }["AudioMonitoringProvider.useCallback[setDayNightMode]"], []);
    const setDayStartHour = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setDayStartHour]": (hour)=>{
            setDayStartHourState(hour);
        }
    }["AudioMonitoringProvider.useCallback[setDayStartHour]"], []);
    const setDayEndHour = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setDayEndHour]": (hour)=>{
            setDayEndHourState(hour);
        }
    }["AudioMonitoringProvider.useCallback[setDayEndHour]"], []);
    const setNightRampDuration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setNightRampDuration]": (duration)=>{
            setNightRampDurationState(duration);
        }
    }["AudioMonitoringProvider.useCallback[setNightRampDuration]"], []);
    const setSustainDuration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setSustainDuration]": (duration)=>{
            setSustainDurationState(duration);
        }
    }["AudioMonitoringProvider.useCallback[setSustainDuration]"], []);
    const setDisableDelay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setDisableDelay]": (delay)=>{
            setDisableDelayState(delay);
        }
    }["AudioMonitoringProvider.useCallback[setDisableDelay]"], []);
    const setLoggingEnabled = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setLoggingEnabled]": (enabled)=>{
            setLoggingEnabledState(enabled);
        }
    }["AudioMonitoringProvider.useCallback[setLoggingEnabled]"], []);
    const setRecordingEnabled = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setRecordingEnabled]": (enabled)=>{
            setRecordingEnabledState(enabled);
        }
    }["AudioMonitoringProvider.useCallback[setRecordingEnabled]"], []);
    const clearLogs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[clearLogs]": ()=>{
            setLogs([]);
            debugLog('[AudioLog] Logs cleared');
        }
    }["AudioMonitoringProvider.useCallback[clearLogs]"], []);
    const exportLogs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[exportLogs]": ()=>{
            const header = "Timestamp,Type,Audio Level,Threshold,Speakers,Volume,Message\n";
            const rows = logs.map({
                "AudioMonitoringProvider.useCallback[exportLogs].rows": (log)=>{
                    const timestamp = new Date(log.timestamp).toLocaleString();
                    return `"${timestamp}","${log.type}","${log.audioLevel ?? ''}","${log.audioThreshold ?? ''}","${log.speakersEnabled ?? ''}","${log.volume ?? ''}","${log.message}"`;
                }
            }["AudioMonitoringProvider.useCallback[exportLogs].rows"]).join("\n");
            return header + rows;
        }
    }["AudioMonitoringProvider.useCallback[exportLogs]"], [
        logs
    ]);
    const setUseGlobalVolume = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioMonitoringProvider.useCallback[setUseGlobalVolume]": (useGlobal)=>{
            setUseGlobalVolumeState(useGlobal);
            debugLog(`[AudioMonitoring] Volume mode changed to: ${useGlobal ? 'GLOBAL' : 'INDIVIDUAL'}`);
        }
    }["AudioMonitoringProvider.useCallback[setUseGlobalVolume]"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AudioMonitoringContext.Provider, {
        value: {
            isCapturing,
            audioLevel,
            selectedInputDevice,
            volume,
            targetVolume,
            audioThreshold,
            audioDetected,
            speakersEnabled,
            useGlobalVolume,
            setUseGlobalVolume,
            rampEnabled,
            rampDuration,
            dayNightMode,
            dayStartHour,
            dayEndHour,
            nightRampDuration,
            sustainDuration,
            disableDelay,
            setRampEnabled,
            setRampDuration,
            setDayNightMode,
            setDayStartHour,
            setDayEndHour,
            setNightRampDuration,
            setSustainDuration,
            setDisableDelay,
            selectedDevices,
            setSelectedDevices,
            startMonitoring,
            stopMonitoring,
            setInputDevice,
            setVolume,
            setTargetVolume,
            setAudioThreshold,
            devices,
            setDevices,
            poeDevices,
            setPoeDevices,
            logs,
            clearLogs,
            exportLogs,
            loggingEnabled,
            setLoggingEnabled,
            recordingEnabled,
            setRecordingEnabled,
            emergencyKillAll,
            emergencyEnableAll,
            controlSingleSpeaker,
            speakerStatuses,
            checkSpeakerConnectivity
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/audio-monitoring-context.tsx",
        lineNumber: 1818,
        columnNumber: 5
    }, this);
}
_s(AudioMonitoringProvider, "Hj4U05Z7BvZsKmZTugq8f42gk2Q=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAudioCapture$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAudioCapture"]
    ];
});
_c = AudioMonitoringProvider;
function useAudioMonitoring() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AudioMonitoringContext);
    if (!context) {
        throw new Error("useAudioMonitoring must be used within AudioMonitoringProvider");
    }
    return context;
}
_s1(useAudioMonitoring, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AudioMonitoringProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/contexts/realtime-sync-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RealtimeSyncProvider",
    ()=>RealtimeSyncProvider,
    "useRealtimeSync",
    ()=>useRealtimeSync
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/auth-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firebase/config.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$database$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/database/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/database/dist/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
const RealtimeSyncContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
// Color palette for user cursors
const CURSOR_COLORS = [
    "#4a9eff",
    "#a855f7",
    "#ff5c5c",
    "#4aff9f",
    "#ffaa4a",
    "#ff69b4",
    "#00d9ff",
    "#ffd700"
];
function RealtimeSyncProvider({ children }) {
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [onlineUsers, setOnlineUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [myPresence, setMyPresence] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [cursors, setCursors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [sessionState, setSessionState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isBeingControlled, setIsBeingControlled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [controllersInfo, setControllersInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [viewingAsUserId, setViewingAsUserId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "RealtimeSyncProvider.useState": ()=>{
            // Restore from sessionStorage on mount
            if ("TURBOPACK compile-time truthy", 1) {
                return sessionStorage.getItem('adminViewingUserId');
            }
            //TURBOPACK unreachable
            ;
        }
    }["RealtimeSyncProvider.useState"]);
    const [viewingAsUserEmail, setViewingAsUserEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "RealtimeSyncProvider.useState": ()=>{
            // Restore from sessionStorage on mount
            if ("TURBOPACK compile-time truthy", 1) {
                return sessionStorage.getItem('adminViewingUserEmail');
            }
            //TURBOPACK unreachable
            ;
        }
    }["RealtimeSyncProvider.useState"]);
    const cursorColorRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(CURSOR_COLORS[0]);
    const isAdminRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const navigationLockRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false); // Prevent navigation loops
    // Assign color based on user ID
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RealtimeSyncProvider.useEffect": ()=>{
            if (user) {
                const hash = user.uid.split('').reduce({
                    "RealtimeSyncProvider.useEffect.hash": (acc, char)=>acc + char.charCodeAt(0)
                }["RealtimeSyncProvider.useEffect.hash"], 0);
                cursorColorRef.current = CURSOR_COLORS[hash % CURSOR_COLORS.length];
            }
        }
    }["RealtimeSyncProvider.useEffect"], [
        user
    ]);
    // Set up presence system
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RealtimeSyncProvider.useEffect": ()=>{
            if (!user) return;
            const presenceRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["realtimeDb"], `presence/${user.uid}`);
            const myPresenceData = {
                uid: user.uid,
                email: user.email || "",
                displayName: user.displayName || user.email || "User",
                role: user.role || "user",
                currentPage: pathname || "/",
                isOnline: true,
                lastSeen: Date.now(),
                controlledBy: []
            };
            isAdminRef.current = myPresenceData.role === "admin";
            // Set presence
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["set"])(presenceRef, myPresenceData);
            setMyPresence(myPresenceData);
            // Set up disconnect handler
            const disconnectRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onDisconnect"])(presenceRef);
            disconnectRef.set({
                ...myPresenceData,
                isOnline: false,
                lastSeen: Date.now()
            });
            // Update page when pathname changes
            const updatePage = {
                "RealtimeSyncProvider.useEffect.updatePage": async ()=>{
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["set"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["realtimeDb"], `presence/${user.uid}/currentPage`), pathname);
                }
            }["RealtimeSyncProvider.useEffect.updatePage"];
            updatePage();
            return ({
                "RealtimeSyncProvider.useEffect": ()=>{
                    // Clean up on unmount
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["set"])(presenceRef, {
                        ...myPresenceData,
                        isOnline: false,
                        lastSeen: Date.now()
                    });
                }
            })["RealtimeSyncProvider.useEffect"];
        }
    }["RealtimeSyncProvider.useEffect"], [
        user,
        pathname
    ]);
    // Listen to all users' presence
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RealtimeSyncProvider.useEffect": ()=>{
            if (!user) return;
            const presenceRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["realtimeDb"], "presence");
            const unsubscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onValue"])(presenceRef, {
                "RealtimeSyncProvider.useEffect.unsubscribe": (snapshot)=>{
                    const users = [];
                    snapshot.forEach({
                        "RealtimeSyncProvider.useEffect.unsubscribe": (childSnapshot)=>{
                            const presence = childSnapshot.val();
                            if (presence && presence.uid !== user.uid) {
                                users.push(presence);
                            }
                            // Check if I'm being controlled
                            if (presence && presence.uid === user.uid) {
                                if (presence.controlledBy && presence.controlledBy.length > 0) {
                                    setIsBeingControlled(true);
                                    // Get controller info
                                    const controllers = presence.controlledBy.map({
                                        "RealtimeSyncProvider.useEffect.unsubscribe.controllers": (controllerUid, index)=>{
                                            const controller = users.find({
                                                "RealtimeSyncProvider.useEffect.unsubscribe.controllers.controller": (u)=>u.uid === controllerUid
                                            }["RealtimeSyncProvider.useEffect.unsubscribe.controllers.controller"]);
                                            return {
                                                uid: controllerUid,
                                                name: controller?.displayName || "Admin",
                                                color: CURSOR_COLORS[index % CURSOR_COLORS.length]
                                            };
                                        }
                                    }["RealtimeSyncProvider.useEffect.unsubscribe.controllers"]);
                                    setControllersInfo(controllers);
                                } else {
                                    // Not being controlled - clear state
                                    setIsBeingControlled(false);
                                    setControllersInfo([]);
                                }
                            }
                        }
                    }["RealtimeSyncProvider.useEffect.unsubscribe"]);
                    setOnlineUsers(users);
                }
            }["RealtimeSyncProvider.useEffect.unsubscribe"]);
            return ({
                "RealtimeSyncProvider.useEffect": ()=>unsubscribe()
            })["RealtimeSyncProvider.useEffect"];
        }
    }["RealtimeSyncProvider.useEffect"], [
        user
    ]);
    // Listen to session state (for users being controlled or admins watching)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RealtimeSyncProvider.useEffect": ()=>{
            if (!user) return;
            // If admin is viewing as another user, listen to their session instead
            const targetUserId = viewingAsUserId || user.uid;
            const sessionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["realtimeDb"], `sessions/${targetUserId}`);
            const unsubscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onValue"])(sessionRef, {
                "RealtimeSyncProvider.useEffect.unsubscribe": (snapshot)=>{
                    const state = snapshot.val();
                    // For admins viewing other users, always apply the state
                    // For regular users, only apply if someone else updated it
                    if (state && (viewingAsUserId || state.lastUpdatedBy !== user.uid)) {
                        setSessionState(state);
                        // Navigate if page changed
                        // ADMINS: Follow the user's page navigation (viewingAsUserId = true)
                        // USERS: Follow admin's navigation commands (!viewingAsUserId = true, but someone else updated)
                        const shouldNavigate = state.currentPage && state.currentPage !== pathname && !navigationLockRef.current;
                        if (shouldNavigate) {
                            console.log('[RealtimeSync] Navigating to:', state.currentPage, viewingAsUserId ? '(following user)' : '(following admin)');
                            navigationLockRef.current = true;
                            router.push(state.currentPage);
                            setTimeout({
                                "RealtimeSyncProvider.useEffect.unsubscribe": ()=>{
                                    navigationLockRef.current = false;
                                }
                            }["RealtimeSyncProvider.useEffect.unsubscribe"], 500);
                        }
                    }
                }
            }["RealtimeSyncProvider.useEffect.unsubscribe"]);
            return ({
                "RealtimeSyncProvider.useEffect": ()=>unsubscribe()
            })["RealtimeSyncProvider.useEffect"];
        }
    }["RealtimeSyncProvider.useEffect"], [
        user,
        pathname,
        router,
        viewingAsUserId
    ]);
    // Continuously sync current page to Firebase when pathname changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RealtimeSyncProvider.useEffect": ()=>{
            if (!user) return;
            const syncPage = {
                "RealtimeSyncProvider.useEffect.syncPage": async ()=>{
                    // If admin is viewing a user, sync admin's page to the user's session
                    if (isAdminRef.current && viewingAsUserId) {
                        console.log('[RealtimeSync] Admin syncing page to user session:', pathname);
                        const sessionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["realtimeDb"], `sessions/${viewingAsUserId}`);
                        const currentState = (await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["get"])(sessionRef)).val() || {};
                        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["set"])(sessionRef, {
                            ...currentState,
                            currentPage: pathname,
                            lastUpdatedBy: user.uid,
                            lastUpdatedAt: Date.now()
                        });
                    } else if (!viewingAsUserId) {
                        console.log('[RealtimeSync] User syncing page to own session:', pathname);
                        const sessionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["realtimeDb"], `sessions/${user.uid}`);
                        const currentState = (await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["get"])(sessionRef)).val() || {};
                        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["set"])(sessionRef, {
                            ...currentState,
                            currentPage: pathname,
                            lastUpdatedBy: user.uid,
                            lastUpdatedAt: Date.now()
                        });
                    }
                }
            }["RealtimeSyncProvider.useEffect.syncPage"];
            syncPage();
        }
    }["RealtimeSyncProvider.useEffect"], [
        user,
        pathname,
        viewingAsUserId
    ]);
    // Polling mechanism - admin checks user's state every 3 seconds
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RealtimeSyncProvider.useEffect": ()=>{
            if (!user || !isAdminRef.current || !viewingAsUserId) return;
            console.log('[RealtimeSync] Starting polling for user state:', viewingAsUserId);
            const pollInterval = setInterval({
                "RealtimeSyncProvider.useEffect.pollInterval": async ()=>{
                    const sessionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["realtimeDb"], `sessions/${viewingAsUserId}`);
                    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["get"])(sessionRef);
                    const state = snapshot.val();
                    if (state) {
                        console.log('[RealtimeSync] Polling - user current page:', state.currentPage, 'admin current page:', pathname);
                        setSessionState(state);
                        // If pages don't match, navigate to user's page
                        if (state.currentPage && state.currentPage !== pathname && !navigationLockRef.current) {
                            console.log('[RealtimeSync] Polling detected page mismatch - navigating to:', state.currentPage);
                            navigationLockRef.current = true;
                            router.push(state.currentPage);
                            setTimeout({
                                "RealtimeSyncProvider.useEffect.pollInterval": ()=>{
                                    navigationLockRef.current = false;
                                }
                            }["RealtimeSyncProvider.useEffect.pollInterval"], 500);
                        }
                    }
                }
            }["RealtimeSyncProvider.useEffect.pollInterval"], 3000); // Poll every 3 seconds
            return ({
                "RealtimeSyncProvider.useEffect": ()=>{
                    console.log('[RealtimeSync] Stopping polling');
                    clearInterval(pollInterval);
                }
            })["RealtimeSyncProvider.useEffect"];
        }
    }["RealtimeSyncProvider.useEffect"], [
        user,
        viewingAsUserId,
        pathname,
        router
    ]);
    // Track and sync scroll position
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RealtimeSyncProvider.useEffect": ()=>{
            if (!user) return;
            let scrollTimeout = null;
            const isApplyingScroll = {
                current: false
            };
            const handleScroll = {
                "RealtimeSyncProvider.useEffect.handleScroll": ()=>{
                    if (isApplyingScroll.current) return;
                    // Debounce scroll updates
                    if (scrollTimeout) clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout({
                        "RealtimeSyncProvider.useEffect.handleScroll": async ()=>{
                            const scrollX = window.scrollX;
                            const scrollY = window.scrollY;
                            // Sync scroll position to Firebase
                            if (isAdminRef.current && viewingAsUserId) {
                                // Admin scrolling - sync to user's session
                                const sessionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["realtimeDb"], `sessions/${viewingAsUserId}`);
                                const currentState = (await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["get"])(sessionRef)).val() || {};
                                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["set"])(sessionRef, {
                                    ...currentState,
                                    scrollX,
                                    scrollY,
                                    lastUpdatedBy: user.uid,
                                    lastUpdatedAt: Date.now()
                                });
                            } else if (!viewingAsUserId) {
                                // User scrolling - sync to own session
                                const sessionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["realtimeDb"], `sessions/${user.uid}`);
                                const currentState = (await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["get"])(sessionRef)).val() || {};
                                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["set"])(sessionRef, {
                                    ...currentState,
                                    scrollX,
                                    scrollY,
                                    lastUpdatedBy: user.uid,
                                    lastUpdatedAt: Date.now()
                                });
                            }
                        }
                    }["RealtimeSyncProvider.useEffect.handleScroll"], 300); // Debounce 300ms
                }
            }["RealtimeSyncProvider.useEffect.handleScroll"];
            // Apply scroll from sessionState
            const applyScroll = {
                "RealtimeSyncProvider.useEffect.applyScroll": ()=>{
                    if (!sessionState) return;
                    const scrollX = sessionState.scrollX;
                    const scrollY = sessionState.scrollY;
                    if (scrollX !== undefined && scrollY !== undefined) {
                        // Check if we need to scroll
                        if (Math.abs(window.scrollX - scrollX) > 10 || Math.abs(window.scrollY - scrollY) > 10) {
                            isApplyingScroll.current = true;
                            window.scrollTo({
                                left: scrollX,
                                top: scrollY,
                                behavior: 'smooth'
                            });
                            setTimeout({
                                "RealtimeSyncProvider.useEffect.applyScroll": ()=>{
                                    isApplyingScroll.current = false;
                                }
                            }["RealtimeSyncProvider.useEffect.applyScroll"], 500);
                        }
                    }
                }
            }["RealtimeSyncProvider.useEffect.applyScroll"];
            // Listen for scroll events
            window.addEventListener('scroll', handleScroll, {
                passive: true
            });
            // Apply scroll when sessionState changes (for following user/admin)
            applyScroll();
            return ({
                "RealtimeSyncProvider.useEffect": ()=>{
                    window.removeEventListener('scroll', handleScroll);
                    if (scrollTimeout) clearTimeout(scrollTimeout);
                }
            })["RealtimeSyncProvider.useEffect"];
        }
    }["RealtimeSyncProvider.useEffect"], [
        user,
        viewingAsUserId,
        sessionState
    ]);
    // Sync session state
    const syncSessionState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "RealtimeSyncProvider.useCallback[syncSessionState]": async (state)=>{
            if (!user) return;
            // Filter out undefined values to prevent Firebase errors
            const filteredState = {};
            Object.keys(state).forEach({
                "RealtimeSyncProvider.useCallback[syncSessionState]": (key)=>{
                    const value = state[key];
                    if (value !== undefined) {
                        filteredState[key] = value;
                    }
                }
            }["RealtimeSyncProvider.useCallback[syncSessionState]"]);
            // If admin is viewing a user, sync to that user's session
            if (isAdminRef.current && viewingAsUserId) {
                const sessionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["realtimeDb"], `sessions/${viewingAsUserId}`);
                const currentState = (await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["get"])(sessionRef)).val() || {};
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["set"])(sessionRef, {
                    ...currentState,
                    ...filteredState,
                    currentPage: pathname,
                    lastUpdatedBy: user.uid,
                    lastUpdatedAt: Date.now()
                });
                return; // Don't write to admin's own session
            }
            // Regular user or admin not controlling anyone - write to own session
            const sessionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["realtimeDb"], `sessions/${user.uid}`);
            const currentState = (await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["get"])(sessionRef)).val() || {};
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["set"])(sessionRef, {
                ...currentState,
                ...filteredState,
                currentPage: pathname,
                lastUpdatedBy: user.uid,
                lastUpdatedAt: Date.now()
            });
        }
    }["RealtimeSyncProvider.useCallback[syncSessionState]"], [
        user,
        pathname,
        viewingAsUserId
    ]);
    // Update cursor position
    const updateMyCursor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "RealtimeSyncProvider.useCallback[updateMyCursor]": (x, y, isClicking = false)=>{
            if (!user || !myPresence) return;
            // For admins: update cursor for the user they're viewing
            if (isAdminRef.current && viewingAsUserId) {
                // Convert pixel coordinates to percentages for cross-resolution support
                const xPercent = x / window.innerWidth * 100;
                const yPercent = y / window.innerHeight * 100;
                const cursorRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["realtimeDb"], `cursors/${viewingAsUserId}/${user.uid}`);
                // Set cursor position (as percentages)
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["set"])(cursorRef, {
                    x: xPercent,
                    y: yPercent,
                    userId: user.uid,
                    userName: myPresence.displayName,
                    userRole: myPresence.role,
                    color: cursorColorRef.current,
                    isClicking,
                    timestamp: Date.now()
                });
                // Set up auto-cleanup on disconnect
                const disconnectRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onDisconnect"])(cursorRef);
                disconnectRef.remove();
            }
        }
    }["RealtimeSyncProvider.useCallback[updateMyCursor]"], [
        user,
        myPresence,
        viewingAsUserId
    ]);
    // Listen to cursors on my screen
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RealtimeSyncProvider.useEffect": ()=>{
            if (!user) return;
            const cursorsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["realtimeDb"], `cursors/${user.uid}`);
            const unsubscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onValue"])(cursorsRef, {
                "RealtimeSyncProvider.useEffect.unsubscribe": (snapshot)=>{
                    const cursorsData = [];
                    const now = Date.now();
                    const CURSOR_TIMEOUT = 10000; // 10 seconds
                    if (!snapshot.exists()) {
                        // No cursors - clear the state
                        console.log('[RealtimeSync] No cursors in Firebase, clearing cursor state');
                        setCursors([]);
                        return;
                    }
                    snapshot.forEach({
                        "RealtimeSyncProvider.useEffect.unsubscribe": (childSnapshot)=>{
                            const cursor = childSnapshot.val();
                            if (cursor) {
                                // Filter out stale cursors (admin disconnected)
                                if (now - cursor.timestamp < CURSOR_TIMEOUT) {
                                    cursorsData.push(cursor);
                                } else {
                                    // Remove stale cursor
                                    console.log('[RealtimeSync] Removing stale cursor from', cursor.userName);
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["remove"])(childSnapshot.ref);
                                }
                            }
                        }
                    }["RealtimeSyncProvider.useEffect.unsubscribe"]);
                    console.log('[RealtimeSync] Updated cursors, count:', cursorsData.length);
                    setCursors(cursorsData);
                }
            }["RealtimeSyncProvider.useEffect.unsubscribe"]);
            return ({
                "RealtimeSyncProvider.useEffect": ()=>unsubscribe()
            })["RealtimeSyncProvider.useEffect"];
        }
    }["RealtimeSyncProvider.useEffect"], [
        user
    ]);
    // Start controlling a user (admin only)
    const startControlling = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "RealtimeSyncProvider.useCallback[startControlling]": async (targetUserId)=>{
            if (!user || !isAdminRef.current) return;
            const targetPresenceRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["realtimeDb"], `presence/${targetUserId}/controlledBy`);
            const currentControllers = (await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["get"])(targetPresenceRef)).val() || [];
            if (!currentControllers.includes(user.uid)) {
                const updatedControllers = [
                    ...currentControllers,
                    user.uid
                ];
                // Set up auto-cleanup BEFORE adding ourselves
                // When we disconnect, remove ourselves from the array
                const disconnectRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onDisconnect"])(targetPresenceRef);
                if (currentControllers.length === 0) {
                    // If we're the only controller, remove the whole array on disconnect
                    await disconnectRef.remove();
                } else {
                    // If there are other controllers, restore to just them (without us)
                    await disconnectRef.set(currentControllers);
                }
                // Now add ourselves to the controlledBy array
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["set"])(targetPresenceRef, updatedControllers);
            }
        }
    }["RealtimeSyncProvider.useCallback[startControlling]"], [
        user
    ]);
    // Stop controlling a user (admin only)
    const stopControlling = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "RealtimeSyncProvider.useCallback[stopControlling]": async (targetUserId)=>{
            if (!user || !isAdminRef.current) return;
            const targetPresenceRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["realtimeDb"], `presence/${targetUserId}/controlledBy`);
            const currentControllers = (await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["get"])(targetPresenceRef)).val() || [];
            const updatedControllers = currentControllers.filter({
                "RealtimeSyncProvider.useCallback[stopControlling].updatedControllers": (uid)=>uid !== user.uid
            }["RealtimeSyncProvider.useCallback[stopControlling].updatedControllers"]);
            // Always remove cursor when stopping control
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["remove"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["realtimeDb"], `cursors/${targetUserId}/${user.uid}`));
            // Update or remove controlledBy array
            if (updatedControllers.length === 0) {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["remove"])(targetPresenceRef);
            } else {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["set"])(targetPresenceRef, updatedControllers);
            }
            // Cancel the onDisconnect handler since we're manually releasing
            const disconnectRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onDisconnect"])(targetPresenceRef);
            await disconnectRef.cancel();
            // Clear viewing as user if this was the user being viewed
            if (viewingAsUserId === targetUserId) {
                setViewingAsUserId(null);
                setViewingAsUserEmail(null);
                // Clear from sessionStorage
                if ("TURBOPACK compile-time truthy", 1) {
                    sessionStorage.removeItem('adminViewingUserId');
                    sessionStorage.removeItem('adminViewingUserEmail');
                }
            }
            console.log('[RealtimeSync] Released control of user:', targetUserId);
        }
    }["RealtimeSyncProvider.useCallback[stopControlling]"], [
        user,
        viewingAsUserId
    ]);
    // Set which user the admin is viewing as
    const setViewingAsUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "RealtimeSyncProvider.useCallback[setViewingAsUser]": (userId)=>{
            if (!isAdminRef.current) return; // Only admins can view as other users
            setViewingAsUserId(userId);
            // Save to sessionStorage for persistence across navigation
            if ("TURBOPACK compile-time truthy", 1) {
                if (userId) {
                    sessionStorage.setItem('adminViewingUserId', userId);
                } else {
                    sessionStorage.removeItem('adminViewingUserId');
                }
            }
            // Update email when user changes
            if (userId) {
                const targetUser = onlineUsers.find({
                    "RealtimeSyncProvider.useCallback[setViewingAsUser].targetUser": (u)=>u.uid === userId
                }["RealtimeSyncProvider.useCallback[setViewingAsUser].targetUser"]);
                if (targetUser?.email) {
                    setViewingAsUserEmail(targetUser.email);
                    // Save email to sessionStorage too
                    if ("TURBOPACK compile-time truthy", 1) {
                        sessionStorage.setItem('adminViewingUserEmail', targetUser.email);
                    }
                }
            } else {
                setViewingAsUserEmail(null);
                if ("TURBOPACK compile-time truthy", 1) {
                    sessionStorage.removeItem('adminViewingUserEmail');
                }
            }
        }
    }["RealtimeSyncProvider.useCallback[setViewingAsUser]"], [
        onlineUsers
    ]);
    // Update viewing email when online users update (preserve viewing state)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RealtimeSyncProvider.useEffect": ()=>{
            if (viewingAsUserId && isAdminRef.current) {
                const targetUser = onlineUsers.find({
                    "RealtimeSyncProvider.useEffect.targetUser": (u)=>u.uid === viewingAsUserId
                }["RealtimeSyncProvider.useEffect.targetUser"]);
                if (targetUser?.email && targetUser.email !== viewingAsUserEmail) {
                    setViewingAsUserEmail(targetUser.email);
                    // Update sessionStorage
                    if ("TURBOPACK compile-time truthy", 1) {
                        sessionStorage.setItem('adminViewingUserEmail', targetUser.email);
                    }
                }
            }
        }
    }["RealtimeSyncProvider.useEffect"], [
        onlineUsers,
        viewingAsUserId,
        viewingAsUserEmail
    ]);
    // Restore control state on mount/navigation (admin persistence)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RealtimeSyncProvider.useEffect": ()=>{
            if (!user || !isAdminRef.current) return;
            const storedUserId = ("TURBOPACK compile-time truthy", 1) ? sessionStorage.getItem('adminViewingUserId') : "TURBOPACK unreachable";
            if (storedUserId && !viewingAsUserId) {
                // Admin was controlling someone - restore the state
                console.log('[RealtimeSync] Restoring admin control state for user:', storedUserId);
                setViewingAsUserId(storedUserId);
                // Try to restore email from storage or online users
                const storedEmail = ("TURBOPACK compile-time truthy", 1) ? sessionStorage.getItem('adminViewingUserEmail') : "TURBOPACK unreachable";
                if (storedEmail) {
                    setViewingAsUserEmail(storedEmail);
                } else {
                    const targetUser = onlineUsers.find({
                        "RealtimeSyncProvider.useEffect.targetUser": (u)=>u.uid === storedUserId
                    }["RealtimeSyncProvider.useEffect.targetUser"]);
                    if (targetUser?.email) {
                        setViewingAsUserEmail(targetUser.email);
                    }
                }
            }
        }
    }["RealtimeSyncProvider.useEffect"], [
        user,
        onlineUsers,
        viewingAsUserId
    ]);
    const value = {
        onlineUsers,
        myPresence,
        isBeingControlled,
        controllersInfo,
        startControlling,
        stopControlling,
        viewingAsUserId,
        viewingAsUserEmail,
        setViewingAsUser,
        cursors,
        updateMyCursor,
        syncSessionState,
        sessionState
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RealtimeSyncContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/realtime-sync-context.tsx",
        lineNumber: 694,
        columnNumber: 5
    }, this);
}
_s(RealtimeSyncProvider, "RU2l2TuOBR7Gq8+RwLN5bGmjNQ0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = RealtimeSyncProvider;
function useRealtimeSync() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(RealtimeSyncContext);
    if (!context) {
        throw new Error("useRealtimeSync must be used within RealtimeSyncProvider");
    }
    return context;
}
_s1(useRealtimeSync, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "RealtimeSyncProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/contexts/session-manager-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SessionManagerProvider",
    ()=>SessionManagerProvider,
    "useSessionManager",
    ()=>useSessionManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/auth-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firebase/config.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$database$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/database/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/database/dist/index.esm.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
// Generate unique session ID for this browser/tab
function generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
const SessionManagerContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function SessionManagerProvider({ children }) {
    _s();
    const { user, signOut } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const sessionIdRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(generateSessionId());
    const isLoggingOutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SessionManagerProvider.useEffect": ()=>{
            if (!user) return;
            const userSessionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["realtimeDb"], `activeSessions/${user.uid}`);
            const mySessionId = sessionIdRef.current;
            // Claim this session as active
            console.log(`[Session] Claiming session for user ${user.email}: ${mySessionId}`);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["set"])(userSessionRef, {
                sessionId: mySessionId,
                email: user.email,
                timestamp: Date.now()
            });
            // Listen for session changes
            const unsubscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onValue"])(userSessionRef, {
                "SessionManagerProvider.useEffect.unsubscribe": (snapshot)=>{
                    const data = snapshot.val();
                    if (!data) return;
                    // If session ID changed and it's not mine, someone else logged in
                    if (data.sessionId !== mySessionId && !isLoggingOutRef.current) {
                        console.log(`[Session] Another device logged in. Logging out this session.`);
                        isLoggingOutRef.current = true;
                        // Show alert
                        alert("You have been logged out because your account was accessed from another device.");
                        // Force logout
                        signOut();
                    }
                }
            }["SessionManagerProvider.useEffect.unsubscribe"]);
            return ({
                "SessionManagerProvider.useEffect": ()=>{
                    unsubscribe();
                }
            })["SessionManagerProvider.useEffect"];
        }
    }["SessionManagerProvider.useEffect"], [
        user,
        signOut
    ]);
    const value = {
        currentSessionId: sessionIdRef.current
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SessionManagerContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/session-manager-context.tsx",
        lineNumber: 67,
        columnNumber: 5
    }, this);
}
_s(SessionManagerProvider, "2bkbO+mJfZziPIH34gLrEjvjiMY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = SessionManagerProvider;
function useSessionManager() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(SessionManagerContext);
    if (!context) {
        throw new Error("useSessionManager must be used within SessionManagerProvider");
    }
    return context;
}
_s1(useSessionManager, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "SessionManagerProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/providers.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Providers",
    ()=>Providers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/auth-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$audio$2d$monitoring$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/audio-monitoring-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$realtime$2d$sync$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/realtime-sync-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$session$2d$manager$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/session-manager-context.tsx [app-client] (ecmascript)");
"use client";
;
;
;
;
;
function Providers({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthProvider"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$session$2d$manager$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SessionManagerProvider"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$realtime$2d$sync$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RealtimeSyncProvider"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$audio$2d$monitoring$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AudioMonitoringProvider"], {
                    children: children
                }, void 0, false, {
                    fileName: "[project]/src/app/providers.tsx",
                    lineNumber: 14,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/providers.tsx",
                lineNumber: 13,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/providers.tsx",
            lineNumber: 12,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/providers.tsx",
        lineNumber: 11,
        columnNumber: 5
    }, this);
}
_c = Providers;
var _c;
__turbopack_context__.k.register(_c, "Providers");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_e2cb587b._.js.map