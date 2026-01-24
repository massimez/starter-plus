import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";

export function useDeleteSupplier() {
	const queryClient = useQueryClient();

	const { mutate: deleteSupplier, isPending: isDeletingSupplier } = useMutation(
		{
			mutationFn: async (supplierId: string) => {
				const res = await hc.api.store.suppliers[":id"].$delete({
					param: { id: supplierId },
				});

				return res.json();
			},
			onSuccess: () => {
				toast.success("Supplier deleted successfully!");
				queryClient.invalidateQueries({
					queryKey: ["suppliers"],
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		},
	);

	return { deleteSupplier, isDeletingSupplier };
}
