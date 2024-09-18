import { Action, ActionPanel, Clipboard, Detail, Form, openExtensionPreferences, showToast, Toast } from "@raycast/api";
import { fileFromPath } from "formdata-node/file-from-path";
import { FormData } from "formdata-node";
import { useEffect, useState } from "react";
import axios from "axios";
import fs from "fs";
import mime from "mime-types";

import { baseUrl, fetchOptions } from "./utils";
import { compressVideo } from "./ffmpeg";
import { useSelectedItem } from "./useSelectedItem";

type Values = {
  title?: string;
  filePath: string[];
  shouldCompress: boolean;
};

export default function Command() {
  const { selectedItem, setSelectedItem } = useSelectedItem();
  const [isLoading, setIsLoading] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [shouldCompress, setShouldCompress] = useState(true);
  const [ffmpegProgress, setFfmpegProgress] = useState<number>(0);

  useEffect(() => {
    if (selectedItem) {
      const fileType = mime.lookup(selectedItem);

      if (fileType && fileType?.startsWith("video/")) {
        setIsVideo(true);
      }
    }
  }, [selectedItem]);

  async function handleSubmit(values: Values) {
    setIsLoading(true);
    const originalFilePath = values.filePath[0];

    if (!mime.lookup(originalFilePath)) {
      showToast({ title: "Error", message: "Unsupported file type", style: Toast.Style.Failure });
      return;
    }

    let filePath = originalFilePath;

    console.log("shouldCompress", shouldCompress);

    if (isVideo && shouldCompress) {
      filePath = await compressVideo(originalFilePath, setFfmpegProgress);
    }

    const file = await fileFromPath(filePath);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", values.title);

    const { data } = await axios
      .postForm<{
        success: boolean;
        key?: string;
        error?: string;
      }>(`${baseUrl}/api/create`, formData, fetchOptions)
      .catch((err) => {
        return {
          data: {
            ...err.response.data,
          },
        };
      });

    if (!data.success) {
      showToast({ title: "Error", message: data.error, style: Toast.Style.Failure });
    } else {
      const url = `${baseUrl}/share/${data?.key}`;
      await Clipboard.copy(url);
      showToast({ title: "Success", message: "URL copied to clipboard" });
    }

    if (isVideo && shouldCompress) {
      fs.unlinkSync(filePath);
    }

    setIsLoading(false);
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
      <Form.FilePicker
        id="filePath"
        title="File picker"
        allowMultipleSelection={false}
        value={selectedItem ? [selectedItem] : []}
        onChange={async (newValue) => {
          const firstItem = newValue[0];
          setSelectedItem(firstItem);
        }}
      />

      <Form.TextField id="title" title="Title" info='Default is "Untilted"' />

      <Form.Checkbox
        id="_"
        label=""
        title="Compress"
        defaultValue={true}
        onChange={(v) => setShouldCompress(v)}
        info="Only relevant for videos"
      />
    </Form>
  );
}
