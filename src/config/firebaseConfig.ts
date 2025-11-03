// // src/config/firebaseConfig.ts

// import { initializeApp, getApps, getApp } from "firebase/app";

// const firebaseConfig = {
//     apiKey: "AIzaSyCOtHcIckfALLPzM4QaUY28vIpACFoS6us",
//     authDomain: "ali-academy-fa671.firebaseapp.com",
//     projectId: "ali-academy-fa671",
//     storageBucket: "ali-academy-fa671.firebasestorage.app",
//     messagingSenderId: "1083905787983",
//     appId: "1:1083905787983:android:c21a1dd25b6a66aa53023a",
// };

// let app;

// // 🔒 Ensure only one Firebase instance is created
// if (!getApps().length) {
//     app = initializeApp(firebaseConfig);
// } else {
//     app = getApp();
// }

// export default app;

// src/config/firebaseConfig.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyCOtHcIckfALLPzM4QaUY28vIpACFoS6us",
    authDomain: "ali-academy-fa671.firebaseapp.com",
    projectId: "ali-academy-fa671",
    storageBucket: "ali-academy-fa671.firebasestorage.app",
    messagingSenderId: "1083905787983",
    appId: "1:1083905787983:android:c21a1dd25b6a66aa53023a",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export default app;
