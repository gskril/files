import { Action, ActionPanel, Clipboard, Form, openExtensionPreferences, showToast, Toast } from "@raycast/api";
import { fileFromPath } from "formdata-node/file-from-path";
import { FormData } from "formdata-node";
import { useState } from "react";
import axios from "axios";

import { useSelectedItem } from "./useSelectedItem";
import { baseUrl, fetchOptions } from "./utils";

type Values = {
  title: string;
  filePath: string[];
};

export default function Command() {
  const { selectedItem, setSelectedItem } = useSelectedItem();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: Values) {
    setIsLoading(true);
    const file = await fileFromPath(values.filePath[0]);

    // TODO: Compress file with ffmpeg
    const compressedFile = file;

    const formData = new FormData();
    formData.append("file", compressedFile);
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

    setIsLoading(false);
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
      <Form.TextField id="title" title="Title" placeholder="Enter title" />
    </Form>
  );
}
