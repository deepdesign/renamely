// Global type definitions for third-party APIs

export interface DropboxChooserFile {
  link: string;
  name: string;
  bytes: number;
  icon: string;
  thumbnailLink?: string;
}

interface DropboxChooserOptions {
  success: (files: DropboxChooserFile[]) => void;
  cancel?: () => void;
  linkType?: 'preview' | 'direct';
  multiselect?: boolean;
  extensions?: string[];
  folderselect?: boolean;
}

interface DropboxStatic {
  choose: (options: DropboxChooserOptions) => void;
}

declare global {
  interface Window {
    Dropbox?: DropboxStatic;
    gapi?: {
      load: (api: string, options?: { callback?: () => void }) => void;
      picker?: {
        PickerBuilder: new () => {
          enableFeature(feature: number): this;
          addView(view: number): this;
          setOAuthToken(token: string): this;
          setCallback(callback: (data: GooglePickerResponse) => void): this;
          build(): GooglePicker;
          setVisible(visible: boolean): void;
        };
        Feature: {
          MULTISELECT_ENABLED: number;
        };
        ViewId: {
          DOCS_IMAGES: number;
        };
        Action: {
          PICKED: string;
          CANCEL: string;
        };
      };
      auth2?: {
        init: (config: { client_id: string }) => Promise<void>;
      };
    };
  }
}

interface GooglePickerDoc {
  id: string;
  name: string;
  url?: string;
  mimeType?: string;
}

interface GooglePickerResponse {
  action: string;
  docs: GooglePickerDoc[];
}

interface GooglePicker {
  setVisible: (visible: boolean) => void;
}

export {};

