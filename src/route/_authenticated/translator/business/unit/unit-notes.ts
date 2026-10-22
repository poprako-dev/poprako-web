export type UnitNotes = {
  // 随最终译文交付嵌字，纳入嵌字导出文本。
  typographyNote: string | null;
  // 翻译与校对之间的补充交流，不纳入嵌字导出文本。
  translationNote: string | null;
};

export type UnitNoteField = keyof UnitNotes;
