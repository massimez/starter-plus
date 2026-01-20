"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Address } from "@/lib/storefront-types";

interface AddressManagerProps {
	addresses: Address[];
	onUpdate: (addresses: Address[]) => Promise<unknown>;
	updating: boolean;
}

export function AddressManager({
	addresses,
	onUpdate,
	updating,
}: AddressManagerProps) {
	const t = useTranslations("Profile.addresses");
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [formData, setFormData] = useState<Address>({
		type: "shipping",
		street: "",
		city: "",
		state: "",
		postalCode: "",
		country: "",
		isDefault: false,
	});
	const [error, setError] = useState<string | null>(null);

	const handleAdd = () => {
		setEditingIndex(-1);
		setFormData({
			type: "shipping",
			street: "",
			city: "",
			state: "",
			postalCode: "",
			country: "",
			isDefault: addresses.length === 0,
		});
	};

	const handleEdit = (index: number) => {
		setEditingIndex(index);
		const address = addresses[index];
		if (address) {
			setFormData(address);
		}
	};

	const handleDelete = async (index: number) => {
		if (confirm(t("deleteConfirm"))) {
			const newAddresses = addresses.filter((_, i) => i !== index);
			try {
				await onUpdate(newAddresses);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to delete address",
				);
			}
		}
	};

	const handleSave = async () => {
		if (
			!formData.street ||
			!formData.city ||
			!formData.postalCode ||
			!formData.country
		) {
			setError("Please fill in all required fields");
			return;
		}

		try {
			let newAddresses: Address[];
			if (editingIndex === -1) {
				// Adding new address
				newAddresses = [...addresses, formData];
			} else if (editingIndex !== null) {
				// Editing existing address
				newAddresses = addresses.map((addr, i) =>
					i === editingIndex ? formData : addr,
				);
			} else {
				return;
			}

			// If setting as default, unset others
			if (formData.isDefault) {
				newAddresses = newAddresses.map((addr, i) => ({
					...addr,
					isDefault:
						editingIndex === -1
							? i === newAddresses.length - 1
							: i === editingIndex,
				}));
			}

			await onUpdate(newAddresses);
			setEditingIndex(null);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save address");
		}
	};

	const handleCancel = () => {
		setEditingIndex(null);
		setError(null);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-xl">{t("title")}</h2>

				{editingIndex === null && (
					<button
						onClick={handleAdd}
						className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
						disabled={updating}
					>
						{t("add")}
					</button>
				)}
			</div>

			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-3">
					<p className="text-red-600 text-sm">{error}</p>
				</div>
			)}

			{/* Address Form */}
			{editingIndex !== null && (
				<div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<h3 className="mb-4 font-medium text-lg">
						{editingIndex === -1 ? t("addNew") : t("edit")}
					</h3>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label
								htmlFor="address-type"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								{t("type")}
							</label>
							<select
								id="address-type"
								value={formData.type}
								onChange={(e) =>
									setFormData({
										...formData,
										type: e.target.value as "billing" | "shipping",
									})
								}
								className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="shipping">{t("shipping")}</option>
								<option value="billing">{t("billing")}</option>
							</select>
						</div>

						<div className="md:col-span-2">
							<label
								htmlFor="address-street"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								{t("street")} *
							</label>
							<input
								id="address-street"
								type="text"
								value={formData.street}
								onChange={(e) =>
									setFormData({ ...formData, street: e.target.value })
								}
								className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
								required
							/>
						</div>

						<div>
							<label
								htmlFor="address-city"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								{t("city")} *
							</label>
							<input
								id="address-city"
								type="text"
								value={formData.city}
								onChange={(e) =>
									setFormData({ ...formData, city: e.target.value })
								}
								className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
								required
							/>
						</div>

						<div>
							<label
								htmlFor="address-state"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								{t("state")}
							</label>
							<input
								id="address-state"
								type="text"
								value={formData.state || ""}
								onChange={(e) =>
									setFormData({ ...formData, state: e.target.value })
								}
								className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label
								htmlFor="address-postal"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								{t("postalCode")} *
							</label>
							<input
								id="address-postal"
								type="text"
								value={formData.postalCode}
								onChange={(e) =>
									setFormData({ ...formData, postalCode: e.target.value })
								}
								className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
								required
							/>
						</div>

						<div>
							<label
								htmlFor="address-country"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								{t("country")} *
							</label>
							<input
								id="address-country"
								type="text"
								value={formData.country}
								onChange={(e) =>
									setFormData({ ...formData, country: e.target.value })
								}
								className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
								required
							/>
						</div>

						<div className="md:col-span-2">
							<label className="flex items-center">
								<input
									type="checkbox"
									checked={formData.isDefault || false}
									onChange={(e) =>
										setFormData({ ...formData, isDefault: e.target.checked })
									}
									className="mr-2"
								/>
								<span className="text-gray-700 text-sm">{t("default")}</span>
							</label>
						</div>
					</div>

					<div className="mt-4 flex justify-end space-x-3">
						<button
							type="button"
							onClick={handleCancel}
							className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
						>
							{t("cancel")}
						</button>
						<button
							type="button"
							onClick={handleSave}
							className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
							disabled={updating}
						>
							{updating ? t("saving") : t("save")}
						</button>
					</div>
				</div>
			)}

			{/* Address List */}
			{addresses.length === 0 && editingIndex === null ? (
				<div className="py-8 text-center text-gray-500">
					<p>{t("empty")}</p>
					<p className="mt-2 text-sm">{t("emptyAction")}</p>
				</div>
			) : (
				<div className="space-y-4">
					{addresses.map((address, index) => (
						<div
							key={`${address.street}-${address.city}-${index}`}
							className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300"
						>
							<div className="flex items-start justify-between">
								<div>
									<div className="mb-2 flex items-center gap-2">
										<span className="inline-block rounded bg-gray-100 px-2 py-1 text-gray-700 text-xs">
											{address.type}
										</span>
										{address.isDefault && (
											<span className="inline-block rounded bg-blue-100 px-2 py-1 text-blue-700 text-xs">
												{t("default")}
											</span>
										)}
									</div>
									<p className="text-gray-900">{address.street}</p>
									<p className="text-gray-600">
										{address.city}
										{address.state && `, ${address.state}`} {address.postalCode}
									</p>
									<p className="text-gray-600">{address.country}</p>
								</div>
								<div className="flex space-x-2">
									<button
										onClick={() => handleEdit(index)}
										className="text-blue-600 text-sm hover:text-blue-700"
										disabled={updating || editingIndex !== null}
									>
										{t("editAction")}
									</button>
									<button
										onClick={() => handleDelete(index)}
										className="text-red-600 text-sm hover:text-red-700"
										disabled={updating || editingIndex !== null}
									>
										{t("deleteAction")}
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
