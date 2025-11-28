export class FirebaseConfig {
  static getWebApiKey(): string {
    const apiKey = process.env.GOOGLE_FIREBASE_WEB_API_KEY;
    if (!apiKey) {
      throw new Error('Missing Firebase Web API Key. Set FIREBASE_WEB_API_KEY in environment variables.');
    }
    return apiKey;
  }
}

