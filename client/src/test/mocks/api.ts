/**
 * Mock implementations for API calls
 * Used in tests to simulate API operations
 */

import type {
  GetTemplateResponse,
  CreateFromTemplateResponse,
  ProductStatusResponse,
} from '../../lib/types';

// Mock storage for API responses
const mockResponses: {
  templates: Map<string, GetTemplateResponse>;
  products: Map<string, ProductStatusResponse>;
} = {
  templates: new Map(),
  products: new Map(),
};

/**
 * Mock getTemplate API call
 */
export async function mockGetTemplate(id: string): Promise<GetTemplateResponse> {
  const template = mockResponses.templates.get(id);
  if (!template) {
    throw new Error(`Template ${id} not found`);
  }
  return template;
}

/**
 * Mock createFromTemplate API call
 */
export async function mockCreateFromTemplate(
  payload: unknown
): Promise<CreateFromTemplateResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const productId = `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const response: CreateFromTemplateResponse = {
    id: productId,
    previewUrl: `https://preview.example.com/${productId}`,
    adminUrl: `https://admin.example.com/${productId}`,
    status: 'created',
  };

  // Store product status
  mockResponses.products.set(productId, {
    id: productId,
    status: 'created',
    isReadyToPublish: false,
    variants: [],
  });

  return response;
}

/**
 * Mock getProductStatus API call
 */
export async function mockGetProductStatus(productId: string): Promise<ProductStatusResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 50));

  const status = mockResponses.products.get(productId);
  if (!status) {
    throw new Error(`Product ${productId} not found`);
  }

  // Simulate status progression
  if (status.status === 'created') {
    // Randomly progress to 'processing' or 'ready'
    const shouldProgress = Math.random() > 0.5;
    if (shouldProgress) {
      const updatedStatus: ProductStatusResponse = {
        ...status,
        status: 'processing',
        isReadyToPublish: false,
        variants: [],
      };
      mockResponses.products.set(productId, updatedStatus);
      return updatedStatus;
    }
  }

  return status;
}

/**
 * Set mock template response
 */
export function setMockTemplate(id: string, template: GetTemplateResponse): void {
  mockResponses.templates.set(id, template);
}

/**
 * Set mock product status
 */
export function setMockProductStatus(productId: string, status: ProductStatusResponse): void {
  mockResponses.products.set(productId, status);
}

/**
 * Clear all mock responses
 */
export function clearMockResponses(): void {
  mockResponses.templates.clear();
  mockResponses.products.clear();
}

/**
 * Setup API mocks for testing
 */
export function setupAPIMocks() {
  // These would be used to replace the actual API functions in tests
  // Example usage:
  // vi.mock('../../lib/api', () => ({
  //   getTemplate: mockGetTemplate,
  //   createFromTemplate: mockCreateFromTemplate,
  //   getProductStatus: mockGetProductStatus,
  // }));
}

