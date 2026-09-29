// Toast message severity; icon and tone are selected from semantic status colors.
export type ToastType = "success" | "error" | "info";

export type ToastData = {
  message: string;
  type: ToastType;
};
