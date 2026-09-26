import type { InitUploadResponse } from "@wisdomstream/shared";
import { apiFetch } from "./api";

export interface UploadHandle {
  videoId: string;
  cancel: () => void;
}

/**
 * PUTs the file straight to Mux's signed upload URL. Uses XMLHttpRequest
 * instead of fetch because fetch has no upload-progress event.
 */
export function uploadVideoFile(
  channelId: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadHandle> {
  return new Promise((resolve, reject) => {
    apiFetch<InitUploadResponse>("/videos/init", {
      method: "POST",
      body: JSON.stringify({ channelId }),
    }).then((initRes) => {
      if (initRes.error || !initRes.data) {
        reject(new Error(initRes.error?.message ?? "Failed to start upload"));
        return;
      }

      const { videoId, uploadUrl } = initRes.data;
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(file);

      resolve({ videoId, cancel: () => xhr.abort() });
    });
  });
}
