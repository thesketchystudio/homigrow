// types/google-identity.d.ts
// Minimal ambient types for the subset of Google Identity Services'
// window.google.accounts.id API this app actually calls. Not an
// exhaustive port of Google's own types — extend as more of the API
// surface is used.

type GoogleCredentialResponse = {
  credential: string;
};

type GoogleIdConfiguration = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
};

type GoogleButtonOptions = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  width?: number;
  shape?: "rectangular" | "pill" | "circle" | "square";
};

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: GoogleIdConfiguration) => void;
        renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
      };
    };
  };
}
