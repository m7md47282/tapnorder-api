import { IDatabaseOperations } from './types';

export interface IDatabaseClient extends IDatabaseOperations {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export abstract class DatabaseClientFactory {
  private static client: IDatabaseClient;

  static async createClient(client: IDatabaseClient): Promise<IDatabaseClient> {
    this.client = client;
    return this.client;
  }

  set client(client: IDatabaseClient) {
    this.client = client;
  }


  static getClient(): IDatabaseClient {
    return this.client;
  }


}

