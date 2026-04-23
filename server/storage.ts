import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = "de4d1d9a67355d3a2dc3ad1cd826e9e4";
const R2_BUCKET_NAME = process.env.S3_BUCKET || "alkabinet-photos";
const R2_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "2d32833c085b3030bd2c17732a9236b8";
const R2_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "69ee059b58249a0cf21ea5f0a9a04ae04d6ee1a073b8d2ba2f7dab0790982b92";
const R2_ENDPOINT = process.env.AWS_ENDPOINT_URL_S3 || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const R2_PUBLIC_URL = process.env.VITE_STORAGE_PUBLIC_URL || `https://pub-a9452736b83a420abee94627805d881a.r2.dev`;

const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

export async function storagePut(relKey: string, data: Buffer, contentType: string): Promise<{ key: string; url: string }> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: relKey,
    Body: data,
    ContentType: contentType,
  });
  await s3Client.send(command);
  const url = `${R2_PUBLIC_URL}/${relKey}`;
  return { key: relKey, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  return { key: relKey, url: `${R2_PUBLIC_URL}/${relKey}` };
}