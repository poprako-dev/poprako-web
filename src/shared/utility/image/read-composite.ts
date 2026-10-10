// Keep PSD decoding in ag-psd, but omit sections that online previews never use.
// Slice the original file so layer pixels are neither read nor copied into JS memory.
export async function readCompositeFile(file: File): Promise<ArrayBuffer> {
  const header = await file.slice(0, 26).arrayBuffer();
  const view = new DataView(header);
  if (header.byteLength !== 26 || view.getUint32(0) !== 0x38425053) {
    throw new Error("PSD 文件头无效");
  }
  const version = view.getUint16(4);
  if (version !== 1 && version !== 2) throw new Error("不支持的 PSD 版本");
  let offset = 26;
  async function skipSection(bytes: 4 | 8): Promise<number> {
    const length = await file.slice(offset, offset + bytes).arrayBuffer();
    if (length.byteLength !== bytes) throw new Error("PSD 文件不完整");
    const data = new DataView(length);
    const size = bytes === 4 ? data.getUint32(0) : Number(data.getBigUint64(0));
    const next = offset + bytes + size;
    if (!Number.isSafeInteger(next) || next > file.size) throw new Error("PSD 文件不完整");
    offset = next;
    return next;
  }
  const colorEnd = await skipSection(4);
  await skipSection(4);
  const layerLengthBytes = version === 2 ? 8 : 4;
  await skipSection(layerLengthBytes);
  if (offset + 2 > file.size) throw new Error("PSD 中没有合成图像");
  return new Blob([
    header,
    file.slice(26, colorEnd),
    new Uint8Array(4 + layerLengthBytes),
    file.slice(offset),
  ]).arrayBuffer();
}
