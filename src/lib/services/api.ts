import {API_URL} from '@/config';
import type {AxiosRequestConfig, AxiosResponse} from 'axios';
import axios from 'axios';

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
        withCredentials = true,
    } = options;

    // Prepare headers with default content type if not provided
    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    // Add authorization token if available in localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
    }

    // Prepare axios request config
    const requestConfig: AxiosRequestConfig = {
        method,
        url: `${API_URL}${endpoint}`,
        headers: requestHeaders,
        withCredentials,
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
            throw new Error(
                errorData.message || `API request failed with status ${error.response.status}`
            );
        }

        throw error;
    }
}
