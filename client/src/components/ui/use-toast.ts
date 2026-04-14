import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

type ToastData = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type ToastState = {
  toasts: ToastData[];
};

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: { type: "add"; toast: ToastData } | { type: "dismiss"; id?: string }) {
  switch (action.type) {
    case "add": {
      memoryState = {
        toasts: [action.toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
      };
      break;
    }
    case "dismiss": {
      const id = action.id;
      memoryState = {
        toasts: memoryState.toasts.map((toast) =>
          toast.id === id || !id
            ? {
                ...toast,
                open: false,
              }
            : toast
        ),
      };
      break;
    }
  }

  listeners.forEach((listener) => listener(memoryState));
}

function toast(props: Omit<ToastData, "id">) {
  const id = Math.random().toString(36).slice(2);

  const update = (next: ToastData) =>
    dispatch({ type: "add", toast: { ...next, id } });

  const dismiss = () => dispatch({ type: "dismiss", id });

  update({
    ...props,
    id,
    open: true,
    onOpenChange: (open) => {
      if (!open) dismiss();
    },
  });

  setTimeout(() => {
    dismiss();
  }, TOAST_REMOVE_DELAY);

  return { id, dismiss, update };
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (id?: string) => dispatch({ type: "dismiss", id }),
  };
}

export { useToast, toast };
