import { getSelectedFinderItems, Form, ActionPanel, Action, showToast } from "@raycast/api";
import { useEffect, useState } from "react";

type Values = {
  title: string;
  filepicker: string;
};

export default function Command() {
  const [selectedItem, setSelectedItem] = useState<string>();

  function handleSubmit(values: Values) {
    console.log(values);
    showToast({ title: "Submitted form", message: "See logs for submitted values" });
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
        id="filepicker"
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
