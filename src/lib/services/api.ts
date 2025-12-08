import {API_URL} from '@/config';
import type {AxiosRequestConfig, AxiosResponse} from 'axios';
import axios from 'axios';
// Ensure i18n is initialized and import the singleton instance
import '@/lib/i18n';
import i18n from 'i18next';

/**
 * Interface for the options to be passed to the fetchApi function
 */
interface ApiOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    withCredentials?: boolean;
}

/**
 * Generic API function to handle API requests using axios
 * @param endpoint - The API endpoint to call (without the base URL)
 * @param options - The request options (method, headers, body, etc.)
 * @returns A promise that resolves to the parsed response data
 */
export async function fetchApi<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const {
        method = 'GET',
        headers = {},
        body,
    } = options;

    // Prepare headers with default content type if not provided
    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    // If body is FormData, let the browser/axios set the correct Content-Type with boundary
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    if (isFormData) {
        delete requestHeaders['Content-Type'];
    }

    // Add authorization token if available in localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
    }

    // Prepare axios request config
    const requestConfig: AxiosRequestConfig = {
        method,
        url: `${API_URL}${endpoint}`,
        headers: requestHeaders
    };

    // Add data if provided
    if (body) {
        requestConfig.data = body;
    }

    try {
        // Make the API call with axios
        const response: AxiosResponse<T> = await axios(requestConfig);

        // For empty responses (like 204 No Content), return an empty object
        if (response.status === 204) {
            return {} as T;
        }

        // Axios automatically parses JSON and returns data
        return response.data;
    } catch (error) {
        console.error('API request error:', error);

        // Handle axios errors
        if (axios.isAxiosError(error) && error.response) {
            const errorData = error.response.data || {};

            // Detect specific email-related errors and attach a translated message to the thrown error
            // so that callers can decide if/when to show a single toast.
            let derivedUserMessage: string | undefined;
            try {
                const errCode = (errorData.error || errorData.code || '').toString();
                const reason = (errorData.reason || '').toString();
                if (errCode === 'invalid_email') {
                    let translationKey: string | null = null;
                    if (reason === 'suppressed') {
                        translationKey = 'errors.invalid_email.suppressed';
                    } else if (reason === 'disposable-domain' || reason === 'disposable_domain') {
                        translationKey = 'errors.invalid_email.disposable_domain';
                    }
                    if (translationKey) {
                        derivedUserMessage = i18n.t(translationKey);
                    }
                }
            } catch (_) {
                // no-op; do not block throwing of the original error
            }

            const errObj: any = new Error(
                errorData.message || `API request failed with status ${error.response.status}`
            );
            if (errorData.code) errObj.code = errorData.code;
            if (error.response.status) errObj.status = error.response.status;
            if (errorData.error) errObj.error = errorData.error;
            if (errorData.reason) errObj.reason = errorData.reason;
            if (derivedUserMessage) errObj.translatedMessage = derivedUserMessage;
            throw errObj;
        }

        throw error;
    }
}
