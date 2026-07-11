import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const KEY = "depaso_address_book";

export type SavedAddress = {
  id: string;
  label: string;
  address: string;
  icon: "home-outline" | "store-outline" | "map-marker-outline";
};

export type SavedContact = {
  id: string;
  label: string;
  name: string;
  phone: string;
};

type AddressBookStore = {
  addresses: SavedAddress[];
  contacts: SavedContact[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addAddress: (a: Omit<SavedAddress, "id">) => void;
  removeAddress: (id: string) => void;
  addContact: (c: Omit<SavedContact, "id">) => void;
  removeContact: (id: string) => void;
};

function persist() {
  const { addresses, contacts } = useAddressBookStore.getState();
  SecureStore.setItemAsync(KEY, JSON.stringify({ addresses, contacts })).catch(() => {});
}

/**
 * Direcciones y personas guardadas del usuario, persistidas en el dispositivo.
 * Empieza VACÍO: los datos de ejemplo hardcodeados aparecían como atajos
 * reales en el flujo de envío (y todo se perdía al reiniciar la app).
 */
export const useAddressBookStore = create<AddressBookStore>((set) => ({
  addresses: [],
  contacts: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (raw) {
        const data = JSON.parse(raw) as { addresses?: SavedAddress[]; contacts?: SavedContact[] };
        set({ addresses: data.addresses ?? [], contacts: data.contacts ?? [] });
      }
    } catch {
      // datos corruptos/ausentes: arranca vacío
    }
    set({ hydrated: true });
  },

  addAddress: (a) => {
    set((s) => ({ addresses: [...s.addresses, { ...a, id: Date.now().toString() }] }));
    persist();
  },
  removeAddress: (id) => {
    set((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) }));
    persist();
  },
  addContact: (c) => {
    set((s) => ({ contacts: [...s.contacts, { ...c, id: Date.now().toString() }] }));
    persist();
  },
  removeContact: (id) => {
    set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) }));
    persist();
  },
}));
