import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios'

export type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

export type RequestConfig = AxiosRequestConfig & {
  skipAuth?: boolean
}

export class ApiError extends Error {
  code?: number
  status?: number

  constructor(message: string, options?: { code?: number; status?: number }) {
    super(message)
    this.name = 'ApiError'
    this.code = options?.code
    this.status = options?.status
  }
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  timeout: 10000,
})

request.interceptors.request.use(
  (config) => {
    const skipAuth = (config as RequestConfig).skipAuth
    if (!skipAuth) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`)
      }
    }

    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

request.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse<unknown>

    // If backend returns { code, message, data }, unwrap data directly.
    if (
      payload &&
      typeof payload === 'object' &&
      'code' in payload &&
      'data' in payload
    ) {
      if (payload.code !== 0) {
        return Promise.reject(
          new ApiError(payload.message || 'Business error', {
            code: payload.code,
            status: response.status,
          }),
        )
      }
      return payload.data
    }

    // Fallback for plain response shape.
    return response.data
  },
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status
    const message =
      error.response?.data?.message || error.message || 'Network error'
    return Promise.reject(new ApiError(message, { status }))
  },
)

const http = {
  get<T>(url: string, config?: RequestConfig): Promise<T> {
    return request.get<T, T>(url, config)
  },
  post<T, D = unknown>(
    url: string,
    data?: D,
    config?: RequestConfig,
  ): Promise<T> {
    return request.post<T, T, D>(url, data, config)
  },
  put<T, D = unknown>(
    url: string,
    data?: D,
    config?: RequestConfig,
  ): Promise<T> {
    return request.put<T, T, D>(url, data, config)
  },
  patch<T, D = unknown>(
    url: string,
    data?: D,
    config?: RequestConfig,
  ): Promise<T> {
    return request.patch<T, T, D>(url, data, config)
  },
  delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return request.delete<T, T>(url, config)
  },
  raw: request as {
    request<T = unknown, R = AxiosResponse<T>, D = unknown>(
      config: AxiosRequestConfig<D>,
    ): Promise<R>
  },
}

export default http
