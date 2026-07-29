import { useState, useEffect } from "react";
import { getSelectedFinderItems } from "@raycast/api";

type SelectionSource = "finder" | "picker";

export function useSelectedItem() {
  const [selectedItem, setSelectedItemState] = useState<string>();
  const [selectionSource, setSelectionSource] = useState<SelectionSource>();

  async function init() {
    const firstSelectedItem = await getSelectedFinderItems()
      .then((items) => items[0].path)
      .catch(() => {
        return undefined;
      });

    setSelectedItemState(firstSelectedItem);
    setSelectionSource(firstSelectedItem ? "finder" : undefined);
  }

  useEffect(() => {
    init();
  }, []);

  function setSelectedItem(item: string | undefined) {
    setSelectedItemState(item);
    setSelectionSource(item ? "picker" : undefined);
  }

  return { selectedItem, selectionSource, setSelectedItem };
}
