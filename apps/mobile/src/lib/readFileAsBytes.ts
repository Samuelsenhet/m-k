import * as FileSystem from "expo-file-system/legacy";

export function base64ToBytes(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function readFileAsBase64(uri: string): Promise<string> {
  // iOS ImagePicker may return ph:// or assets-library:// URIs that
  // readAsStringAsync silently returns "" for. Copy to cache first.
  let readUri = uri;
  if (!uri.startsWith("file://")) {
    const dest = `${FileSystem.cacheDirectory}upload-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    readUri = dest;
  }
  return await FileSystem.readAsStringAsync(readUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export async function readFileAsBytes(uri: string): Promise<Uint8Array> {
  return base64ToBytes(await readFileAsBase64(uri));
}
