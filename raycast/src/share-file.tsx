import { getSelectedFinderItems, Clipboard, Form, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import fs from "fs";
import axios from "axios";

type Values = {
  title: string;
  filePath: string[];
};

export default function Command() {
  const [selectedItem, setSelectedItem] = useState<string>();

  async function handleSubmit(values: Values) {
    const file = fs.readFileSync(values.filePath[0]);

    // TODO: Compress file with ffmpeg
    const compressedFile = file;

    const { data } = await axios
      .post<{ success: boolean; key?: string; error?: string }>(
        "https://files.gregskril.com/api/create",
        {
          title: values.title,
          file: compressedFile,
        },
        {
          headers: {
            // TODO: Read this from Raycast Storage https://developers.raycast.com/api-reference/storage
            "x-admin-secret": "xxxxxxxx",
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
      await Clipboard.copy(`https://files.gregskril.com/share/${data?.key}`);
      showToast({ title: "Success", message: "File uploaded" });
    }
  }

  async function init() {
    const firstSelectedItem = await getSelectedFinderItems()
      .then((items) => items[0].path)
      .catch(() => {
        return undefined;
      });

    setSelectedItem(firstSelectedItem);
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
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
          console.log(firstItem);
          setSelectedItem(firstItem);
        }}
      />
      <Form.TextField id="title" title="Title" placeholder="Enter title" />
    </Form>
  );
}
