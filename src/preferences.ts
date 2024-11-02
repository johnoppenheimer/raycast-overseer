import { getPreferenceValues } from "@raycast/api";

export type Preferences = {
  serverUrl: string;
  token: string;
};

export const getPreferences = getPreferenceValues<Preferences>;
