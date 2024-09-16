import { getPreferenceValues } from "@raycast/api";

export const baseUrl = new URL(getPreferenceValues().webUrl).origin;

export const fetchOptions = {
  headers: {
    "x-admin-secret": getPreferenceValues().apiSecret,
  },
};
