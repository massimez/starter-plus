import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StoreSettingsState {
	currency: string;
	setCurrency: (currency: string) => void;
}

export const useStoreSettings = create<StoreSettingsState>()(
	persist(
		(set) => ({
			currency: "USD",
			setCurrency: (currency) => set({ currency }),
		}),
		{
			name: "store-settings",
		},
	),
);
