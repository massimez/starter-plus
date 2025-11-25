import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";

interface SeoPreviewProps {
	title?: string;
	description?: string;
	slug?: string;
}

export function SeoPreview({ title, description, slug }: SeoPreviewProps) {
	const displayTitle = title || "Collection Title";
	const displayDescription =
		description ||
		"This is how your collection will appear in search engine results.";
	const displayUrl = `https://store.com/collections/${slug || "collection-slug"}`;

	return (
		<Card className="bg-muted/30">
			<CardHeader className="pb-3">
				<CardTitle className="font-medium text-base">
					Search Engine Preview
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex max-w-[600px] flex-col gap-1 font-sans">
					<div className="flex items-center gap-2 text-[#202124] text-sm dark:text-[#bdc1c6]">
						<div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-600 text-xs dark:bg-gray-800 dark:text-gray-400">
							S
						</div>
						<div className="flex flex-col leading-tight">
							<span className="text-xs">Store Name</span>
							<span className="text-[#5f6368] text-xs dark:text-[#9aa0a6]">
								{displayUrl}
							</span>
						</div>
					</div>
					<h3 className="cursor-pointer truncate font-normal text-[#1a0dab] text-xl hover:underline dark:text-[#8ab4f8]">
						{displayTitle}
					</h3>
					<p className="line-clamp-2 text-[#4d5156] text-sm dark:text-[#bdc1c6]">
						{displayDescription}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
