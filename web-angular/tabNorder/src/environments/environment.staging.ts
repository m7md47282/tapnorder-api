export const environment = {
  production: false,
  staging: true,
  firebase: {
    apiKey: "your-staging-api-key",
    authDomain: "your-staging-project.firebaseapp.com",
    projectId: "your-staging-project",
    storageBucket: "your-staging-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
  },
  websocketUrl: 'wss://staging-websocket.your-domain.com',
  realtimeEnabled: true,
  demoMode: false,
  vapidKey: 'your-staging-vapid-key-here',
  apiUrl: 'https://staging-api.your-domain.com',
  enableAnalytics: false,
  enableCrashlytics: false,
  enablePerformance: false
};
