import { expect, test, vi } from "vitest";
import { readPsd } from "ag-psd";
import { readCompositeFile } from "./read-composite";

function makePsd(version = 1): File {
  const header = new Uint8Array(26);
  const data = new DataView(header.buffer);
  data.setUint32(0, 0x38425053);
  data.setUint16(4, version);
  data.setUint16(12, 4);
  data.setUint32(14, 1);
  data.setUint32(18, 1);
  data.setUint16(22, 8);
  data.setUint16(24, 3);
  const resources = new Uint8Array(1024 * 1024);
  const resourceLength = new Uint8Array(4);
  new DataView(resourceLength.buffer).setUint32(0, resources.length);
  const layers = new Uint8Array(2 * 1024 * 1024);
  const layerLength = new Uint8Array(version === 2 ? 8 : 4);
  const layerView = new DataView(layerLength.buffer);
  if (version === 2) layerView.setBigUint64(0, BigInt(layers.length));
  else layerView.setUint32(0, layers.length);
  return new File(
    [
      header,
      new Uint8Array(4),
      resourceLength,
      resources,
      layerLength,
      layers,
      new Uint8Array([0, 0, 255, 0, 0, 255]),
    ],
    "page.psd",
  );
}

test.each([1, 2])(
  "reads the composite without reading the complete PSD (version %s)",
  async (version) => {
    const file = makePsd(version);
    const fullRead = vi.spyOn(file, "arrayBuffer").mockRejectedValue(new Error("whole PSD read"));
    const bytes = await readCompositeFile(file);
    expect(fullRead).not.toHaveBeenCalled();
    expect(bytes.byteLength).toBe(version === 2 ? 48 : 44);
    const psd = readPsd(bytes, { useRawData: true, skipLayerImageData: true });
    expect(psd.width).toBe(1);
    expect(psd.height).toBe(1);
    expect([...(psd.rawCompositeData ?? [])]).toEqual([0, 0, 255, 0, 0, 255]);
  },
);

test("rejects corrupt section lengths instead of reading an incorrect composite", async () => {
  const bytes = new Uint8Array(await makePsd().arrayBuffer());
  new DataView(bytes.buffer).setUint32(30, 0xffffffff);
  await expect(readCompositeFile(new File([bytes], "bad.psd"))).rejects.toThrow("不完整");
});
