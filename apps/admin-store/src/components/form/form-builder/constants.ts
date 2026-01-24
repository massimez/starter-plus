import type { GridColumns } from "./types";

// ============================================================================
// GRID CONSTANTS
// ============================================================================

export const GRID_COL_SPAN_MAP: Record<GridColumns, string> = {
	1: "md:col-span-1",
	2: "md:col-span-2",
	3: "md:col-span-3",
	4: "md:col-span-4",
	5: "md:col-span-5",
	6: "md:col-span-6",
	7: "md:col-span-7",
	8: "md:col-span-8",
	9: "md:col-span-9",
	10: "md:col-span-10",
	11: "md:col-span-11",
	12: "md:col-span-12",
} as const;

export const DEFAULT_GRID_COLS: GridColumns = 12;
export const MAX_GRID_COLS = 12;

// ============================================================================
// STYLING CONSTANTS
// ============================================================================

export const FORM_HEIGHT_CLASSES = "h-[600px] md:h-[700px]";

export const SWITCH_CONTAINER_CLASS =
	"flex flex-row items-center justify-between rounded-lg border p-4";

export const SWITCH_LABEL_CLASS = "space-y-0.5";

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_SUBMIT_BUTTON_TEXT = "save_changes";
export const DEFAULT_SUBMITTING_TEXT = "submitting";
export const DEFAULT_NEXT_TEXT = "next";
export const DEFAULT_PREVIOUS_TEXT = "previous";

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const FOCUS_ERROR_DELAY = 100;
