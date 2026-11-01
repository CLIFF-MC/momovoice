// Contacts permission and retrieval service conforming to expo-contacts interface
import { FREQUENT_CONTACTS } from '../data/mockData';
import { Contact } from '../types/momo';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface PermissionResponse {
  status: PermissionStatus;
  granted: boolean;
  canAskAgain: boolean;
  expires: 'never';
}

class ContactsService {
  private permissionStatus: PermissionStatus = 'undetermined';
  private canAskAgain = true;
  private permissionRequestListeners: Array<(pendingRequest: { resolve: (res: PermissionResponse) => void }) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('momo_contacts_permission_status');
      if (stored === 'granted' || stored === 'denied' || stored === 'undetermined') {
        this.permissionStatus = stored;
      }
      const canAsk = localStorage.getItem('momo_contacts_can_ask_again');
      if (canAsk !== null) {
        this.canAskAgain = canAsk === 'true';
      }
    }
  }

  public onPermissionRequested(listener: (pendingRequest: { resolve: (res: PermissionResponse) => void }) => void) {
    this.permissionRequestListeners.push(listener);
    return () => {
      this.permissionRequestListeners = this.permissionRequestListeners.filter((l) => l !== listener);
    };
  }

  public getSyncStatus(): PermissionStatus {
    return this.permissionStatus;
  }

  public async getPermissionsAsync(): Promise<PermissionResponse> {
    return {
      status: this.permissionStatus,
      granted: this.permissionStatus === 'granted',
      canAskAgain: this.canAskAgain,
      expires: 'never',
    };
  }

  public async requestPermissionsAsync(): Promise<PermissionResponse> {
    if (!this.canAskAgain && this.permissionStatus === 'denied') {
      return {
        status: 'denied',
        granted: false,
        canAskAgain: false,
        expires: 'never',
      };
    }

    // Trigger permission dialog in the UI
    return new Promise<PermissionResponse>((resolve) => {
      if (this.permissionRequestListeners.length === 0) {
        // Fallback default: granted
        this.setPermission('granted', true);
        resolve({
          status: 'granted',
          granted: true,
          canAskAgain: true,
          expires: 'never',
        });
        return;
      }

      this.permissionRequestListeners.forEach((listener) => {
        listener({
          resolve: (res) => {
            this.setPermission(res.status, res.canAskAgain);
            resolve(res);
          },
        });
      });
    });
  }

  public setPermission(status: PermissionStatus, canAskAgain = true) {
    this.permissionStatus = status;
    this.canAskAgain = canAskAgain;
    if (typeof window !== 'undefined') {
      localStorage.setItem('momo_contacts_permission_status', status);
      localStorage.setItem('momo_contacts_can_ask_again', String(canAskAgain));
    }
  }

  public resetPermissions() {
    this.permissionStatus = 'undetermined';
    this.canAskAgain = true;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('momo_contacts_permission_status');
      localStorage.removeItem('momo_contacts_can_ask_again');
    }
  }

  /**
   * Searches local device contacts by name without sending the contacts list to any server.
   */
  public async getContactsByName(name: string): Promise<Contact[]> {
    const q = name.trim().toLowerCase();
    if (!q) return [];

    return FREQUENT_CONTACTS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.verifiedName.toLowerCase().includes(q)
    );
  }
}

export const contactsService = new ContactsService();
