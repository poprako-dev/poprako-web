// 弹窗的三种类型，其中 success 为绿、error 为红、info 为蓝
// info 类型不常用
export type ToastType = "success" | "error" | "info";

export type ToastData = {
  message: string;
  type: ToastType;
};
