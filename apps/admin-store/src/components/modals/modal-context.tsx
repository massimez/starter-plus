"use client";
import { createContext, type ReactNode, useContext, useState } from "react";

import type { ModalContextType, ModalMap, ModalType } from "./types";

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
	const [modalType, setModalType] = useState<ModalType | null>(null);
	const [modalProps, setModalProps] = useState<ModalMap[ModalType] | null>(
		null,
	);

	const openModal = <T extends ModalType>(type: T, props: ModalMap[T]) => {
		setModalType(type);
		setModalProps(props);
	};

	const closeModal = () => {
		setModalType(null);
		setModalProps(null);
	};

	return (
		<ModalContext.Provider
			value={{ modalType, modalProps, openModal, closeModal }}
		>
			{children}
		</ModalContext.Provider>
	);
};

export const useModal = () => {
	const context = useContext(ModalContext);
	if (!context) throw new Error("useModal must be used within ModalProvider");
	return context;
};
