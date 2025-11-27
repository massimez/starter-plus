import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "./pagination";

export interface PaginationController {
	page: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	nextPage: () => void;
	previousPage: () => void;
	goToPage: (page: number) => void;
}

export interface PaginationControlsProps {
	pagination: PaginationController;
	className?: string;
}

export function PaginationControls({
	pagination,
	className,
}: PaginationControlsProps) {
	if (pagination.totalPages <= 1) {
		return null;
	}

	return (
		<Pagination className={className}>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						href="#"
						onClick={(e) => {
							e.preventDefault();
							pagination.previousPage();
						}}
						aria-disabled={!pagination.hasPreviousPage}
						className={
							!pagination.hasPreviousPage
								? "pointer-events-none opacity-50"
								: undefined
						}
					/>
				</PaginationItem>
				{Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
					(p) => (
						<PaginationItem key={p}>
							<PaginationLink
								href="#"
								isActive={pagination.page === p}
								onClick={(e) => {
									e.preventDefault();
									pagination.goToPage(p);
								}}
							>
								{p}
							</PaginationLink>
						</PaginationItem>
					),
				)}
				<PaginationItem>
					<PaginationNext
						href="#"
						onClick={(e) => {
							e.preventDefault();
							pagination.nextPage();
						}}
						aria-disabled={!pagination.hasNextPage}
						className={
							!pagination.hasNextPage
								? "pointer-events-none opacity-50"
								: undefined
						}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
