import { Star } from "lucide-react";

interface TestimonialCardProps {
	name: string;
	role: string;
	company: string;
	content: string;
	avatar: string;
}

export function TestimonialCard({
	name,
	role,
	company,
	content,
	avatar,
}: TestimonialCardProps) {
	return (
		<div className="rounded-xl border bg-background p-6 shadow-sm">
			<div className="mb-4 flex items-center gap-1">
				{Array.from({ length: 5 }, (_, i) => (
					<Star
						// biome-ignore lint/suspicious/noArrayIndexKey: <>
						key={name + i}
						className="h-4 w-4 fill-yellow-400 text-yellow-400"
					/>
				))}
			</div>

			<p className="mb-4 text-muted-foreground">&quot;{content}&quot;</p>

			<div className="flex items-center gap-3">
				<div className="text-2xl">{avatar}</div>
				<div>
					<div className="font-semibold">{name}</div>
					<div className="text-muted-foreground text-sm">
						{role} at {company}
					</div>
				</div>
			</div>
		</div>
	);
}
