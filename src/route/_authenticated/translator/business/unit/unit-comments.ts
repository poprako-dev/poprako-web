export type UnitComments = {
  // 随最终译文交付嵌字，纳入嵌字导出文本。
  translationComment: string | null;
  // 翻译与校对之间的补充交流，不纳入嵌字导出文本。
  supplementComment: string | null;
};

export type UnitCommentField = keyof UnitComments;
