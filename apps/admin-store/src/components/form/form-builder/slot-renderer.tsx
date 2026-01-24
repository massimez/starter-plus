"use client";

import React from "react";
import type { FieldValues, UseFormSetValue } from "react-hook-form";
import type { SlotComponent, SlotRendererProps } from "./types";

// ============================================================================
// SLOT NOT FOUND COMPONENT
// ============================================================================

const SlotNotFound: React.FC<{ slotId: string }> = ({ slotId }) => (
	<div className="text-muted-foreground text-sm">Slot not found: {slotId}</div>
);

// ============================================================================
// SLOT RENDERER COMPONENT
// ============================================================================

export const SlotRenderer = React.memo(
	<T extends FieldValues>({
		slot,
		globalSlots,
		formValues,
		setValue,
		t,
	}: SlotRendererProps<T>) => {
		// Early return for conditional rendering
		if (slot.conditionalRender && !slot.conditionalRender(formValues)) {
			return null;
		}

		const renderSlot = () => {
			// React node - render directly
			if (React.isValidElement(slot.component)) {
				return slot.component;
			}

			// Function component - render with props
			if (typeof slot.component === "function") {
				const Component = slot.component as SlotComponent<T>;
				return (
					<Component
						slotId={slot.slotId}
						formValues={formValues}
						t={t}
						setValue={setValue}
						{...(slot.props || {})}
					/>
				);
			}

			// String reference to global slots registry
			if (typeof slot.component === "string" && globalSlots?.[slot.component]) {
				// biome-ignore lint/style/noNonNullAssertion: <>
				const Component = globalSlots[slot.component]!;
				return (
					<Component
						slotId={slot.slotId}
						formValues={formValues}
						setValue={setValue as UseFormSetValue<FieldValues>}
						t={t}
						{...(slot.props || {})}
					/>
				);
			}

			// Fallback for unresolved slots
			return <SlotNotFound slotId={slot.slotId} />;
		};

		return <div className={slot.className}>{renderSlot()}</div>;
	},
);

SlotRenderer.displayName = "SlotRenderer";
