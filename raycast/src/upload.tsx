import {
  Action,
  ActionPanel,
  Clipboard,
  Detail,
  Form,
  open,
  openExtensionPreferences,
  showToast,
  Toast,
} from "@raycast/api";
import { fileFromPath } from "formdata-node/file-from-path";
import { FormData } from "formdata-node";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import fs from "fs";
import mime from "mime-types";
import path from "path";

import { baseUrl, fetchOptions } from "./utils";
import { compressVideo } from "./ffmpeg";
import { useSelectedItem } from "./useSelectedItem";

type Values = {
  title?: string;
  filePath: string[];
  shouldCompress: boolean;
};

const FILES_AND_FOLDERS_SETTINGS = "x-apple.systempreferences:com.apple.preference.security?Privacy_FilesAndFolders";

function isFilePermissionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const code = "code" in error ? String(error.code) : "";
  return code === "EPERM" || code === "EACCES" || /\b(?:EPERM|EACCES)\b/.test(error.message);
}

async function showFilePermissionError(filePath: string) {
  const protectedFolder = filePath.includes(`${path.sep}Desktop${path.sep}`)
    ? "Desktop Folder"
    : filePath.includes(`${path.sep}Documents${path.sep}`)
      ? "Documents Folder"
      : filePath.includes(`${path.sep}Downloads${path.sep}`)
        ? "Downloads Folder"
        : "Files and Folders";

  await showToast({
    style: Toast.Style.Failure,
    title: "Raycast can’t access this file",
    message: `Allow ${protectedFolder} access for Raycast, then try again.`,
    primaryAction: {
      title: "Open Privacy Settings",
      onAction: () => {
        void open(FILES_AND_FOLDERS_SETTINGS);
      },
    },
  });
}

export default function Command() {
  const { selectedItem, selectionSource, setSelectedItem } = useSelectedItem();
  const [isLoading, setIsLoading] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [shouldCompress, setShouldCompress] = useState(true);
  const [ffmpegProgress, setFfmpegProgress] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [fileError, setFileError] = useState<string>();
  const filePickerRef = useRef<Form.FilePicker>(null);

  useEffect(() => {
    const fileType = selectedItem ? mime.lookup(selectedItem) : false;
    setIsVideo(Boolean(fileType && fileType.startsWith("video/")));

    if (selectedItem) {
      setTitle(path.basename(selectedItem, path.extname(selectedItem)));
    }
  }, [selectedItem]);

  async function handleSubmit(values: Values) {
    setIsLoading(true);
    const originalFilePath = values.filePath[0];

    if (!originalFilePath || !mime.lookup(originalFilePath)) {
      showToast({ title: "Error", message: "Unsupported file type", style: Toast.Style.Failure });
      setIsLoading(false);
      return;
    }

    let filePath = originalFilePath;

    try {
      await fs.promises.access(originalFilePath, fs.constants.R_OK);

      if (isVideo && shouldCompress) {
        filePath = await compressVideo(originalFilePath, setFfmpegProgress);
      }

      const file = await fileFromPath(filePath);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", values.title ?? "");

      const { data } = await axios.postForm<{
        success: boolean;
        key?: string;
        error?: string;
        contentType?: string;
      }>(`${baseUrl}/api/create`, formData, fetchOptions);

      if (!data.success || !data.key) {
        showToast({ title: "Error", message: data.error, style: Toast.Style.Failure });
      } else {
        const url = `${baseUrl}/share/${data.key}`;
        await Clipboard.copy(url);
        const typeLabel =
          data.contentType === "application/pdf"
            ? "PDF"
            : data.contentType === "application/json"
              ? "JSON"
              : data.contentType === "text/csv"
                ? "CSV"
                : data.contentType?.startsWith("audio/")
                  ? "Audio"
                  : "File";
        showToast({
          title: `${typeLabel} shared`,
          message: "Link copied to clipboard",
        });
      }
    } catch (error) {
      if (isFilePermissionError(error)) {
        if (selectionSource === "finder") {
          setSelectedItem(undefined);
          setFileError("Choose this file through the picker to grant Raycast access.");
          await showToast({
            style: Toast.Style.Failure,
            title: "Re-select this file",
            message: "The Finder selection did not grant file access.",
            primaryAction: {
              title: "Choose File",
              onAction: () => filePickerRef.current?.focus(),
            },
          });
        } else {
          await showFilePermissionError(originalFilePath);
        }
      } else {
        const message = axios.isAxiosError(error) ? error.response?.data?.error || error.message : "Upload failed";
        await showToast({ title: "Upload failed", message, style: Toast.Style.Failure });
      }
    } finally {
      if (filePath !== originalFilePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      setIsLoading(false);
    }
  }

  if (isLoading && isVideo && shouldCompress) {
    return <Detail markdown={`Compressing video file: ${ffmpegProgress.toFixed(2)}%`} />;
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Upload" onSubmit={handleSubmit} />
          <Action title="Open Preferences" onAction={openExtensionPreferences} />
        </ActionPanel>
      }
    >
      <Form.Description text="Share images, audio, videos, HTML, PDF, JSON, and CSV files." />

      <Form.FilePicker
        ref={filePickerRef}
        id="filePath"
        title="File picker"
        allowMultipleSelection={false}
        value={selectedItem ? [selectedItem] : []}
        error={fileError}
        info="Finder selections may need to be re-selected here to grant file access."
        onChange={async (newValue) => {
          const firstItem = newValue[0];
          setFileError(undefined);
          setSelectedItem(firstItem);
        }}
      />

      <Form.TextField id="title" title="Title" placeholder="Name this file" value={title} onChange={setTitle} />

      {isVideo && (
        <Form.Checkbox
          id="_"
          label="Compress before uploading"
          title="Video"
          defaultValue={true}
          onChange={(v) => setShouldCompress(v)}
        />
      )}
    </Form>
  );
}
