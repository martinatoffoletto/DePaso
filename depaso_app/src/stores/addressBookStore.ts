import { create } from "zustand";

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
  addAddress: (a: Omit<SavedAddress, "id">) => void;
  removeAddress: (id: string) => void;
  addContact: (c: Omit<SavedContact, "id">) => void;
  removeContact: (id: string) => void;
};

export const useAddressBookStore = create<AddressBookStore>((set) => ({
  addresses: [
    { id: "1", label: "CASA",    address: "Soler 4221, Palermo", icon: "home-outline" },
    { id: "2", label: "TRABAJO", address: "Sarmiento 824, CABA", icon: "store-outline" },
    { id: "3", label: "MAMÁ",    address: "Belgrano R, CABA",    icon: "map-marker-outline" },
  ],
  contacts: [
    { id: "1", label: "MAMÁ",    name: "Claudia García", phone: "1156781234" },
    { id: "2", label: "TRABAJO", name: "Recepción Of.",  phone: "1143219900" },
  ],
  addAddress: (a) =>
    set((s) => ({ addresses: [...s.addresses, { ...a, id: Date.now().toString() }] })),
  removeAddress: (id) =>
    set((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) })),
  addContact: (c) =>
    set((s) => ({ contacts: [...s.contacts, { ...c, id: Date.now().toString() }] })),
  removeContact: (id) =>
    set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
}));
