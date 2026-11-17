import Dexie, { Table } from 'dexie';
import { Customer, Product } from '../types';

export interface OfflineOrderRecord {
  id?: number;
  clientUuid: string;
  customerId: string;
  customerName: string;
  items: Array<{
    productCode: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  status: 'QUEUED' | 'SYNCED' | 'FAILED';
  createdAt: string;
  error?: string;
}

export class ZenLyftOfflineDB extends Dexie {
  cachedCustomers!: Table<Customer, string>;
  cachedProducts!: Table<Product, string>;
  offlineOrdersQueue!: Table<OfflineOrderRecord, number>;

  constructor() {
    super('ZenLyftOfflineDB');
    this.version(1).stores({
      cachedCustomers: '_id, code, name',
      cachedProducts: '_id, code, name',
      offlineOrdersQueue: '++id, clientUuid, customerId, status, createdAt'
    });
  }
}

export const offlineDb = new ZenLyftOfflineDB();

export const cacheMasterDataOffline = async (customers: Customer[], products: Product[]) => {
  await offlineDb.cachedCustomers.clear();
  await offlineDb.cachedCustomers.bulkPut(customers);
  await offlineDb.cachedProducts.clear();
  await offlineDb.cachedProducts.bulkPut(products);
};

export const queueOfflineOrder = async (order: Omit<OfflineOrderRecord, 'id' | 'status'>) => {
  return await offlineDb.offlineOrdersQueue.add({
    ...order,
    status: 'QUEUED'
  });
};

export const getPendingOfflineOrders = async () => {
  return await offlineDb.offlineOrdersQueue.where('status').equals('QUEUED').toArray();
};

export const markOfflineOrderSynced = async (id: number) => {
  return await offlineDb.offlineOrdersQueue.update(id, { status: 'SYNCED' });
};
