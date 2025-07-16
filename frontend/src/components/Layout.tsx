// Layout.tsx
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";


// import { cn } from "@/lib/utils";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative flex w-full min-h-screen">
      {/* Main content */}
      <div className="flex-1 w-full">
        <div className="p-4">
          {/* Aquí va el header */}
          {children && Array.isArray(children) ? children[0] : children}
          {/* El resto del contenido */}
          {children && Array.isArray(children) ? children.slice(1) : null}
              <Toaster />
        </div>
      </div>
    </div>
  );
};

export default Layout;
