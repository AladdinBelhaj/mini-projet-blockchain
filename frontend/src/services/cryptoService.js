export const generateKey = async () => {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

export const encryptFile = async (file, key) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const fileData = await file.arrayBuffer();

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    fileData
  );

  const combinedData = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combinedData.set(iv, 0);
  combinedData.set(new Uint8Array(encryptedBuffer), iv.length);

  return new Blob([combinedData], { type: "application/octet-stream" });
};

export const decryptFile = async (encryptedBlob, key, mimeType = "application/pdf") => {
  const combinedData = new Uint8Array(await encryptedBlob.arrayBuffer());
  const iv = combinedData.slice(0, 12);
  const encryptedBuffer = combinedData.slice(12);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encryptedBuffer
  );

  return new Blob([decryptedBuffer], { type: mimeType });
};

export const exportKey = async (key) => {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  const buf = new Uint8Array(exported);
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const importKey = async (hexString) => {
  const bytes = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  return await window.crypto.subtle.importKey(
    "raw",
    bytes,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
};

export const computeSHA256 = async (file) => {
  const fileData = await file.arrayBuffer();
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", fileData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return "0x" + hashHex;
};
