export type FormatResp<T> = {
  // 响应码，通常直接为 HTTP 状态码
  code: number;
  // 成功或者错误消息，如果发生错误，这个字段一定有值
  message?: string;
  // 成功时的响应数据，如果发生错误，这个字段没有值
  data?: T;
};
