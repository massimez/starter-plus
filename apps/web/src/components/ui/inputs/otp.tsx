import type {
	ChangeEvent,
	ClipboardEvent,
	FocusEvent,
	KeyboardEvent,
} from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type AllowedInputTypes = "password" | "text" | "number" | "tel";

type InputProps = Required<
	Pick<
		React.InputHTMLAttributes<HTMLInputElement>,
		| "value"
		| "onChange"
		| "onFocus"
		| "onBlur"
		| "onKeyDown"
		| "onPaste"
		| "aria-label"
		| "autoComplete"
		| "style"
		| "inputMode"
		| "onInput"
		| "disabled"
	> & {
		ref: React.RefCallback<HTMLInputElement>;
		placeholder: string | undefined;
		className: string | undefined;
		type: AllowedInputTypes;
	}
>;

function FakeDash() {
	return (
		<div className="flex w-6 items-center justify-center">
			<div className="h-1 w-3 rounded-full bg-border" />
		</div>
	);
}

interface OTPInputProps {
	value?: string;
	numInputs?: number;
	onChange: (otp: string) => void;
	onComplete?: (otp: string) => void;
	onPaste?: (event: ClipboardEvent<HTMLFieldSetElement>) => void;
	renderInput: (inputProps: InputProps, index: number) => React.ReactNode;
	shouldAutoFocus?: boolean;
	placeholder?: string;
	renderSeparator?: ((index: number) => React.ReactNode) | React.ReactNode;
	containerStyle?: React.CSSProperties | string;
	inputStyle?: React.CSSProperties | string;
	inputType?: AllowedInputTypes;
	skipDefaultStyles?: boolean;
	disabled?: boolean;
	isSecure?: boolean;
	allowedCharacterSet?: "numeric" | "alphanumeric" | "alpha";
	renderMiddleSeparator?: boolean; // New prop for optional middle FakeDash
}

const OTPInput = ({
	value = "",
	numInputs = 4,
	onChange,
	onComplete,
	onPaste,
	renderInput,
	shouldAutoFocus = false,
	inputType = "text",
	renderSeparator,
	placeholder,
	containerStyle,
	inputStyle,
	disabled = false,
	isSecure = false,
	allowedCharacterSet = "numeric",
	renderMiddleSeparator = false, // Default to false
}: OTPInputProps) => {
	const [activeInput, setActiveInput] = useState(0);
	const [internalValue, setInternalValue] = useState(value);
	const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

	// Sync internal value with external value prop
	useEffect(() => {
		setInternalValue(value);
	}, [value]);

	useEffect(() => {
		inputRefs.current = inputRefs.current.slice(0, numInputs);
	}, [numInputs]);

	useEffect(() => {
		if (shouldAutoFocus && !disabled) {
			const timer = setTimeout(() => {
				inputRefs.current[0]?.focus();
			}, 0);
			return () => clearTimeout(timer);
		}
	}, [shouldAutoFocus, disabled]);

	// Call onComplete when OTP is fully entered
	useEffect(() => {
		if (internalValue.length === numInputs && onComplete) {
			onComplete(internalValue);
		}
	}, [internalValue, numInputs, onComplete]);

	const getOTPValue = useCallback(() => {
		return internalValue ? internalValue.toString().split("") : [];
	}, [internalValue]);

	const getPlaceholderValue = useCallback(() => {
		if (typeof placeholder === "string" && placeholder.length === numInputs) {
			return placeholder;
		}
		if (placeholder && placeholder.length !== numInputs) {
			console.warn(
				"Length of the placeholder should be equal to the number of inputs.",
			);
		}
		return undefined;
	}, [placeholder, numInputs]);

	const isInputValueValid = useCallback(
		(valueCurr: string) => {
			if (valueCurr.trim().length !== 1) return false;

			switch (allowedCharacterSet) {
				case "numeric":
					return !Number.isNaN(Number(valueCurr)) && /^\d$/.test(valueCurr);
				case "alpha":
					return /^[a-zA-Z]$/.test(valueCurr);
				case "alphanumeric":
					return /^[a-zA-Z0-9]$/.test(valueCurr);
				default:
					return false;
			}
		},
		[allowedCharacterSet],
	);

	const focusInput = useCallback(
		(index: number) => {
			const activeInputIndex = Math.max(Math.min(numInputs - 1, index), 0);

			if (inputRefs.current[activeInputIndex] && !disabled) {
				requestAnimationFrame(() => {
					inputRefs.current[activeInputIndex]?.focus();
					inputRefs.current[activeInputIndex]?.select();
					setActiveInput(activeInputIndex);
				});
			}
		},
		[numInputs, disabled],
	);

	const updateOTP = useCallback(
		(newOtp: string) => {
			const sanitizedOtp = newOtp.slice(0, numInputs);
			setInternalValue(sanitizedOtp);
			onChange(sanitizedOtp);
		},
		[numInputs, onChange],
	);

	const handleChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			if (disabled) return;

			const { value: inputValue } = event.target;

			if (inputValue && isInputValueValid(inputValue)) {
				const otp = getOTPValue();
				otp[activeInput] = inputValue;
				const newOtp = otp.join("");
				updateOTP(newOtp);

				// Move to next input if not at the end
				if (activeInput < numInputs - 1) {
					focusInput(activeInput + 1);
				}
			}
		},
		[
			disabled,
			isInputValueValid,
			getOTPValue,
			activeInput,
			updateOTP,
			numInputs,
			focusInput,
		],
	);

	const handleInputChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			if (disabled) return;

			const { value: valueCur } = event.target;

			// Handle paste of multiple characters
			if (valueCur.length > 1) {
				const validChars = valueCur
					.split("")
					.filter((char) => isInputValueValid(char))
					.slice(0, numInputs - activeInput);

				if (validChars.length > 0) {
					const otp = getOTPValue();
					validChars.forEach((char, index) => {
						const position = activeInput + index;
						if (position < numInputs) {
							otp[position] = char;
						}
					});
					const newOtp = otp.join("");
					updateOTP(newOtp);

					// Focus next empty input or last filled input
					const nextFocusIndex = Math.min(
						activeInput + validChars.length,
						numInputs - 1,
					);
					focusInput(nextFocusIndex);
				}

				// Clear the input to prevent display of multiple characters
				event.target.value = "";
				return;
			}

			// Handle backspace/delete
			const nativeEvent = event.nativeEvent as InputEvent;
			if (
				nativeEvent.inputType === "deleteContentBackward" ||
				nativeEvent.inputType === "deleteContentForward"
			) {
				event.preventDefault();

				const otp = getOTPValue();
				if (otp[activeInput]) {
					// Clear current input if it has value
					otp[activeInput] = "";
					updateOTP(otp.join(""));
				} else if (
					activeInput > 0 &&
					nativeEvent.inputType === "deleteContentBackward"
				) {
					// Move to previous input and clear it if current is empty
					otp[activeInput - 1] = "";
					updateOTP(otp.join(""));
					focusInput(activeInput - 1);
				}
			}

			// Clear invalid input
			if (valueCur && !isInputValueValid(valueCur)) {
				event.target.value = "";
			}
		},
		[
			disabled,
			isInputValueValid,
			numInputs,
			activeInput,
			getOTPValue,
			updateOTP,
			focusInput,
		],
	);

	const handleFocus = useCallback(
		(event: FocusEvent<HTMLInputElement>, index: number) => {
			if (disabled) return;

			setActiveInput(index);
			event.target.select();
		},
		[disabled],
	);

	const handleBlur = useCallback(() => {
		// Keep active input state, don't change it on blur
	}, []);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLInputElement>) => {
			if (disabled) return;

			const { key } = event;
			const otp = getOTPValue();

			switch (key) {
				case "Backspace":
				case "Delete":
					event.preventDefault();
					if (otp[activeInput]) {
						// Clear current input
						otp[activeInput] = "";
						updateOTP(otp.join(""));
					} else if (activeInput > 0 && key === "Backspace") {
						// Move to previous and clear
						otp[activeInput - 1] = "";
						updateOTP(otp.join(""));
						focusInput(activeInput - 1);
					}
					break;

				case "ArrowLeft":
					event.preventDefault();
					focusInput(activeInput - 1);
					break;

				case "ArrowRight":
					event.preventDefault();
					focusInput(activeInput + 1);
					break;

				case "Home":
					event.preventDefault();
					focusInput(0);
					break;

				case "End":
					event.preventDefault();
					focusInput(numInputs - 1);
					break;

				// Handle direct character input
				default:
					if (key.length === 1 && isInputValueValid(key)) {
						event.preventDefault();
						otp[activeInput] = key;
						updateOTP(otp.join(""));
						if (activeInput < numInputs - 1) {
							focusInput(activeInput + 1);
						}
					}
					break;
			}
		},
		[
			disabled,
			getOTPValue,
			activeInput,
			updateOTP,
			focusInput,
			numInputs,
			isInputValueValid,
		],
	);

	const handlePaste = useCallback(
		(event: ClipboardEvent<HTMLInputElement>) => {
			if (disabled) return;

			event.preventDefault();

			const pastedData = event.clipboardData
				.getData("text/plain")
				.replace(/\s/g, "") // Remove whitespace
				.split("")
				.filter((char) => isInputValueValid(char))
				.slice(0, numInputs);

			if (pastedData.length > 0) {
				const newOtp = pastedData
					.join("")
					.padEnd(numInputs, "")
					.slice(0, numInputs);
				updateOTP(newOtp);

				// Focus the next empty input or the last input
				const nextFocusIndex = Math.min(pastedData.length, numInputs - 1);
				focusInput(nextFocusIndex);
			}
		},
		[disabled, isInputValueValid, numInputs, updateOTP, focusInput],
	);

	return (
		<fieldset
			style={{ ...(typeof containerStyle === "object" && containerStyle) }}
			className={cn(
				"flex items-center",
				typeof containerStyle === "string" && containerStyle,
				disabled && "pointer-events-none opacity-50",
			)}
			onPaste={onPaste}
			aria-label="OTP Input"
		>
			{Array.from({ length: numInputs }, (_, index) => index).map((index) => (
				<React.Fragment key={index}>
					{renderInput(
						{
							value:
								isSecure && getOTPValue()[index]
									? "•"
									: (getOTPValue()[index] ?? ""),
							placeholder: getPlaceholderValue()?.[index] ?? undefined,
							ref: (element) => {
								if (element !== null) {
									inputRefs.current[index] = element;
								}
							},
							onChange: handleChange,
							onFocus: (event) => handleFocus(event, index),
							onBlur: handleBlur,
							onKeyDown: handleKeyDown,
							onPaste: handlePaste,
							autoComplete: "off",
							"aria-label": `OTP input ${index + 1} of ${numInputs}`,
							style: {
								textAlign: "center",
								...(typeof inputStyle === "object" && inputStyle),
							},
							className: cn(
								typeof inputStyle === "string" ? inputStyle : undefined,
								disabled && "cursor-not-allowed",
							),
							type: inputType,
							inputMode:
								allowedCharacterSet === "numeric" ||
								inputType === "number" ||
								inputType === "tel"
									? "numeric"
									: allowedCharacterSet === "alpha"
										? "text"
										: "text",
							onInput: handleInputChange,
							disabled,
						},
						index,
					)}
					{index < numInputs - 1 &&
						(renderMiddleSeparator && index === Math.floor(numInputs / 2) - 1
							? FakeDash()
							: typeof renderSeparator === "function"
								? renderSeparator(index)
								: renderSeparator)}
				</React.Fragment>
			))}
		</fieldset>
	);
};

export type { AllowedInputTypes, InputProps, OTPInputProps };
export default OTPInput;
