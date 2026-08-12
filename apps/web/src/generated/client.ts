import createClient from 'openapi-fetch';
import type { paths } from './openapi';

const configuredApi = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
const baseUrl = configuredApi.replace(/\/api\/v1\/?$/, '');

/**
 * Generated-path client for new endpoint integrations. Authentication is supplied
 * by the same-origin OpenAI Sites proxy, never by client-managed tokens.
 */
export const openapiClient = createClient<paths>({
  baseUrl,
  credentials: 'include',
});
