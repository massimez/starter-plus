import { Button } from "@workspace/ui/components/button";
import { Link } from "@/i18n/routing";

import { cn } from "@/lib/utils";

interface PromoBannerProps {
	className?: string;
}

export function PromoBanner({ className }: PromoBannerProps) {
	return (
		<section
			className={cn(
				"hidden rounded bg-primary/60 py-15 text-primary-foreground",
				className,
			)}
		>
			<div className="text-center">
				<h2 className="mb-4 font-bold text-3xl">Summer Sale is Here!</h2>
				<p className="mb-8 text-lg opacity-90">
					Get up to 50% off on selected items. Limited time offer.
				</p>
				<Link href="/products">
					<Button size="lg" variant="secondary" className="font-bold">
						Shop Sale
					</Button>
				</Link>
			</div>
		</section>
	);
}
