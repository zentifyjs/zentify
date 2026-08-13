export interface PageData {
  component: string;
  props: Record<string, any>;
}

export let currentData: PageData | null = null;
let subscribers: ((data: PageData) => void)[] = [];

export const subscribe = (handler: (data: PageData) => void) => {
  subscribers.push(handler);
};

export const unsubscribe = (handler: (data: PageData) => void) => {
  subscribers = subscribers.filter((s) => s !== handler);
};

export const handleNavigationResponse = (data: PageData, url: string) => {
  currentData = data;
  window.history.pushState({ zentify: data }, "", url);
  subscribers.forEach((s) => s(data));
};

export const navigate = async (url: string) => {
  try {
    const response = await fetch(url, {
      headers: {
        "X-Zentify-Bridge": "true",
        "Accept": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      handleNavigationResponse(data, url);
    } else {
      console.error("Zentify Navigation Failed:", response.statusText);
      window.location.href = url;
    }
  } catch (error) {
    console.error("Zentify Navigation Error:", error);
    window.location.href = url;
  }
};