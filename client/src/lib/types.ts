export type FitMethod = 'slice' | 'meet';

export type PlaceholderAssignment = {
  name: string;            // must match placeholder name from template
  fileUrl: string;         // tokenised PUBLIC_BASE_URL link
  fitMethod?: FitMethod;   // only if supported by the API docs
};

export type VariantAssignment = {
  templateVariantId: string;
  imagePlaceholders: PlaceholderAssignment[];
};

export type CreateFromTemplateBody = {
  templateId: string;
  title: string;
  description: string;
  isVisibleInTheOnlineStore?: boolean;
  salesChannels?: string[]; // use the exact enum from docs when implementing
  tags?: string[];
  variants: VariantAssignment[];
};

export type TemplateInfo = {
  id: string;
  name?: string;
  variants: TemplateVariant[];
};

export type TemplateVariant = {
  id: string;
  name?: string;
  placeholders: PlaceholderInfo[];
};

export type PlaceholderInfo = {
  name: string;
  size?: {
    width?: number;
    height?: number;
    unit?: string;
  };
};

export type UploadedFile = {
  fileId: string;
  publicUrl: string;
  thumbnailUrl?: string | null;
  originalName?: string;
  file?: File;
  sourceType?: 'local' | 'dropbox' | 'googledrive'; // Track where the file comes from
};

export type ProductCreationResult = {
  templateId: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  productId?: string;
  previewUrl?: string;
  adminUrl?: string;
  error?: string;
  errorDetails?: unknown;
  // Debugging info
  payloadSent?: CreateFromTemplateBody;
  responseReceived?: unknown;
  imageUrlSent?: string;
  // Timing info
  createdAt?: number; // Timestamp when product was created/uploaded
};

