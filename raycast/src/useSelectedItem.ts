import { useState, useEffect } from "react";
import { getSelectedFinderItems } from "@raycast/api";

export function useSelectedItem() {
  const [selectedItem, setSelectedItem] = useState<string>();

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

  return { selectedItem, setSelectedItem };
}
