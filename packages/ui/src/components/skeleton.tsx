import { cn } from "@workspace/ui/lib/utils";

function SkeletonUi({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={cn("animate-pulse rounded-md bg-accent", className)}
			{...props}
		/>
	);
}

export function Skeleton({
	children,
	isLoading = true,
	className,
	style,
}: {
	children?: React.ReactNode;
	isLoading?: boolean;
	className?: string;
	style?: React.CSSProperties;
}) {
	if (isLoading) {
		return <SkeletonUi className={className} style={style} />;
	}

	return <>{children}</>;
}
