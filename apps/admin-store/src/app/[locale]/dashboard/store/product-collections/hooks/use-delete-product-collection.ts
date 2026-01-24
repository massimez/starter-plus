import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";

export function useDeleteProductCollection(selectedLanguage: string) {
	const queryClient = useQueryClient();

	const { mutate: deleteCollection, isPending: isDeletingCollection } =
		useMutation({
			mutationFn: async (collectionId: string) => {
				const res = await hc.api.store["product-collections"][":id"].$delete({
					param: { id: collectionId },
				});

				return res.json();
			},
			onSuccess: () => {
				toast.success("Product collection deleted successfully!");
				queryClient.invalidateQueries({
					queryKey: ["product-collections", selectedLanguage],
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	return { deleteCollection, isDeletingCollection };
}
