type HashRequest = {
  id: number;
  file: File;
};

type HashResponse = { id: number; imageHash: string } | { id: number; error: string };

function toBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }

  return btoa(binary);
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
addEventListener("message", async (event: MessageEvent<HashRequest>) => {
  const { id, file } = event.data;

  try {
    const bytes = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const response: HashResponse = {
      id,
      imageHash: toBase64(new Uint8Array(digest)),
    };

    postMessage(response);
  } catch (error) {
    const response: HashResponse = {
      id,
      error: error instanceof Error ? error.message : "计算图片哈希失败",
    };

    postMessage(response);
  }
});
