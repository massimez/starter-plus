import { Card } from "@workspace/ui/components/card";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export default function LayoutStore({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="container mx-auto flex flex-col gap-2.5">
			<Navbar />
			<div className="flex min-h-[calc(100vh-5rem)] gap-2.5">
				<Card className="w-full flex-1 p-4">{children}</Card>
			</div>
			<Footer />
		</div>
	);
}
