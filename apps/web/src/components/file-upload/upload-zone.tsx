"use client";

import { LoaderIcon, UploadIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { useFileUpload } from "@/hooks/use-file-upload";

type UploadZoneProps = {
	state: ReturnType<typeof useFileUpload>[0];
	actions: ReturnType<typeof useFileUpload>[1];
	isUploading?: boolean;
};

export function UploadZone({ state, actions }: UploadZoneProps) {
	const hasUploadingFiles = state.files.some((file) => file.isUploading);

	return (
		<div className="space-y-4">
			{/* Dropzone */}
			{/** biome-ignore lint/a11y/noStaticElementInteractions: <> */}
			{/** biome-ignore lint/a11y/useKeyWithClickEvents: <> */}
			<div
				onDragEnter={actions.handleDragEnter}
				onDragLeave={actions.handleDragLeave}
				onDragOver={actions.handleDragOver}
				onDrop={actions.handleDrop}
				className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition ${state.isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30"} ${hasUploadingFiles ? "pointer-events-none opacity-50" : ""}`}
				onClick={hasUploadingFiles ? undefined : actions.openFileDialog}
			>
				<input {...actions.getInputProps({ className: "hidden" })} />
				{hasUploadingFiles ? (
					<>
						<LoaderIcon className="mb-2 h-8 w-8 animate-spin text-muted-foreground" />
						<p className="text-muted-foreground text-sm">Uploading images...</p>
					</>
				) : (
					<>
						<UploadIcon className="mb-2 h-8 w-8 text-muted-foreground" />
						<p className="text-muted-foreground text-sm">
							Drag & drop files here, or click to upload
						</p>
					</>
				)}
			</div>

			{/* Errors */}
			{state.errors.length > 0 && (
				<Alert variant="destructive">
					<AlertDescription>
						<ul className="list-disc space-y-1 pl-5">
							{state.errors.map((err) => (
								<li key={err}>{err}</li>
							))}
						</ul>
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
