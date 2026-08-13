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
      currentData = data;
      // Push state
      window.history.pushState({ zentify: data }, "", url);
      // Notify subscribers
      subscribers.forEach((s) => s(data));
    } else {
      console.error("Zentify Navigation Failed:", response.statusText);
      // Fallback to normal navigation
      window.location.href = url;
    }
  } catch (error) {
    console.error("Zentify Navigation Error:", error);
    window.location.href = url;
  }
};