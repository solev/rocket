import { Loader } from "lucide-react";

export function CenteredLoader() {
  return (
    <div className="flex items-center justify-center h-full w-full p-6 text-muted-foreground">
      <Loader className="size-5 animate-spin" />
    </div>
  );
}
