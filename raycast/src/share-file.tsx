import {
  Action,
  ActionPanel,
  Clipboard,
  Form,
  getPreferenceValues,
  openExtensionPreferences,
  showToast,
  Toast,
} from "@raycast/api";
import axios from "axios";
import fs from "fs";

import { useSelectedItem } from "./useSelectedItem";
import { useState } from "react";

type Values = {
  title: string;
  filePath: string[];
};

export default function Command() {
  const { selectedItem, setSelectedItem } = useSelectedItem();
  const [isLoading, setIsLoading] = useState(false);
  const baseUrl = new URL(getPreferenceValues().webUrl).origin;

  async function handleSubmit(values: Values) {
    setIsLoading(true);
    const file = fs.readFileSync(values.filePath[0]);

    // TODO: Compress file with ffmpeg
    const compressedFile = file;

    const { data } = await axios
      .post<{ success: boolean; key?: string; error?: string }>(
        `${baseUrl}/api/create`,
        {
          title: values.title,
          file: compressedFile,
        },
        {
          headers: {
            "x-admin-secret": getPreferenceValues().apiSecret,
          },
        },
      )
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
