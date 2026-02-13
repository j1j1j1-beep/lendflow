import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

if (!process.env.AWS_ACCESS_KEY_ID) {
  throw new Error("AWS_ACCESS_KEY_ID environment variable is required");
}
if (!process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error("AWS_SECRET_ACCESS_KEY environment variable is required");
}
if (!process.env.AWS_S3_BUCKET) {
  throw new Error("AWS_S3_BUCKET environment variable is required");
}

if (!process.env.AWS_REGION) {
  console.warn("AWS_REGION not set — defaulting to us-east-1. Set AWS_REGION to avoid unexpected region routing.");
}

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET;

/**
 * Upload a buffer to S3
 */
export async function uploadToS3(
  key: string,
  buffer: Buffer,
  contentType: string = "application/pdf"
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ServerSideEncryption: "AES256",
    })
  );
}

/**
 * Download an object from S3 as a Buffer
 */
export async function getS3Buffer(key: string): Promise<Buffer> {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );

  const stream = response.Body;
  if (!stream) throw new Error(`Empty response from S3 for key: ${key}`);

  const byteArray = await stream.transformToByteArray();
  const buffer = Buffer.from(byteArray);
  if (buffer.length === 0) {
    throw new Error(`Zero-byte file from S3 for key: ${key}`);
  }
  return buffer;
}

/**
 * Generate a presigned URL for downloading a file
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn }
  );
}

/**
 * Delete an object from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * Generate a presigned URL for uploading a file directly from the client
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string = "application/pdf",
  expiresIn: number = 600
): Promise<string> {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn }
  );
}
