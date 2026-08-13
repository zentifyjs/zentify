import { useState, useCallback } from "react";
import { handleNavigationResponse } from "../utils/navigate";

type FormErrors<T> = Partial<Record<keyof T, string>>;

export interface UseFormOptions<T> {
  onSuccess?: () => void;
  onError?: (errors: FormErrors<T>) => void;
}

export function useForm<T extends Record<string, any>>(initialValues: T) {
  const [data, setDataState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [processing, setProcessing] = useState(false);
  const [recentlySuccessful, setRecentlySuccessful] = useState(false);

  const setData = useCallback(
    (keyOrData: keyof T | ((prev: T) => T) | Partial<T>, value?: any) => {
      if (typeof keyOrData === "string" || typeof keyOrData === "number" || typeof keyOrData === "symbol") {
        setDataState((prev) => ({ ...prev, [keyOrData as keyof T]: value }));
      } else if (typeof keyOrData === "function") {
        setDataState(keyOrData as (prev: T) => T);
      } else {
        setDataState((prev) => ({ ...prev, ...(keyOrData as any) }));
      }
    },
    []
  );

  const setValues = useCallback((values: T) => {
    setDataState(values);
  }, []);

  const clearErrors = useCallback((...keys: (keyof T)[]) => {
    if (keys.length === 0) {
      setErrors({});
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        keys.forEach((key) => delete newErrors[key]);
        return newErrors;
      });
    }
  }, []);

  const hasFiles = (obj: any): boolean => {
    if (!obj || typeof obj !== "object") return false;
    if (obj instanceof File || obj instanceof Blob || (typeof FileList !== 'undefined' && obj instanceof FileList)) return true;
    return Object.values(obj).some(hasFiles);
  };

  const submit = useCallback(
    async (method: string, url: string, options?: UseFormOptions<T>) => {
      setProcessing(true);
      setErrors({});
      setRecentlySuccessful(false);

      try {
        const isMultipart = hasFiles(data);
        let body: BodyInit;
        let headers: Record<string, string> = {
          Accept: "application/json",
          "X-Zentify-Bridge": "true",
        };

        if (isMultipart) {
          const formData = new FormData();
          Object.entries(data).forEach(([key, value]) => {
            if (typeof FileList !== 'undefined' && value instanceof FileList) {
              Array.from(value).forEach((file) => formData.append(key, file));
            } else if (value instanceof File || value instanceof Blob) {
              formData.append(key, value);
            } else if (value !== null && value !== undefined) {
              formData.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
            }
          });
          body = formData;
        } else {
          headers["Content-Type"] = "application/json";
          body = JSON.stringify(data);
        }

        const response = await fetch(url, {
          method,
          headers,
          body,
        });

        let responseData: any = null;
        try {
          responseData = await response.json();
        } catch (e) {
          // not json
        }

        if (!response.ok) {
          if (response.status === 422 && responseData?.details) {
            const newErrors: FormErrors<T> = {};
            responseData.details.forEach((issue: any) => {
              const key = issue.path?.[0]?.key;
              if (key) {
                newErrors[key as keyof T] = issue.message;
              }
            });
            setErrors(newErrors);
            options?.onError?.(newErrors);
          } else {
            console.error("Zentify useForm Error:", response.statusText, responseData);
          }
        } else {
          setRecentlySuccessful(true);
          setTimeout(() => setRecentlySuccessful(false), 2000);

          if (responseData && typeof responseData === 'object' && 'component' in responseData) {
            // This is a Zentify View payload, navigate gracefully!
            handleNavigationResponse(responseData, response.url);
          }

          options?.onSuccess?.();
        }
      } catch (error) {
        console.error("Zentify useForm Submission Error:", error);
      } finally {
        setProcessing(false);
      }
    },
    [data]
  );

  return {
    data,
    setData,
    setValues,
    errors,
    clearErrors,
    processing,
    recentlySuccessful,
    post: (url: string, options?: UseFormOptions<T>) => submit("POST", url, options),
    put: (url: string, options?: UseFormOptions<T>) => submit("PUT", url, options),
    patch: (url: string, options?: UseFormOptions<T>) => submit("PATCH", url, options),
    delete: (url: string, options?: UseFormOptions<T>) => submit("DELETE", url, options),
  };
}
