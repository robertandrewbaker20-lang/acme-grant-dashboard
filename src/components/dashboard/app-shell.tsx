import { readAppConfig } from "@/lib/env";
import { AppShellClient } from "./app-shell-client";

export function AppShell({
  children,
}: {
  children: React.ReactNode;
  /** @deprecated path-based active state is used instead */
  activeNav?: string;
}) {
  const config = readAppConfig();

  return (
    <AppShellClient
      demo={config.ok && config.mode === "demo"}
      authRequired={config.ok && config.authRequired}
      configMessage={config.ok ? null : config.message}
    >
      {children}
    </AppShellClient>
  );
}
