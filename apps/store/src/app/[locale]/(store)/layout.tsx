import { Card } from "@workspace/ui/components/card";
import { CartSidebar } from "@/components/features/cart/cart-sidebar";
import { CategorySidebarContainer } from "@/components/features/category/category-sidebar-container";
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
				<Card className="hidden w-[236px] px-4 lg:flex">
					<CategorySidebarContainer className="scrollbar-hide -mt-1.5 sticky top-20 max-h-[calc(100vh-8rem)] w-full shrink-0 flex-col overflow-y-auto" />
				</Card>
				<Card className="w-full flex-1 p-4">{children}</Card>
				<Card className="hidden px-4 xl:flex">
					<CartSidebar className="scrollbar-hide sticky top-20 flex max-h-[calc(100vh-8rem)] w-[330px] shrink-0 flex-col overflow-hidden" />
				</Card>
			</div>
			<Footer />
		</div>
	);
}
