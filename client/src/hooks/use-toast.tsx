import {
  Toast,
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast";
import {
  useToast as useToastOriginal,
} from "@/components/ui/use-toast";

export type ToastActionProps = React.ComponentPropsWithoutRef<typeof Toast> & {
  altText?: string;
  action?: ToastActionElement;
  title?: string;
  description?: string;
  variant?: ToastProps["variant"];
  duration?: number;
};

export { useToastOriginal as useToast };