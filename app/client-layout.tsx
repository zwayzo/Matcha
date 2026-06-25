"use client";
import AuthProviderWrapper from "./AuthProviderWrapper";
import { Analytics } from "@vercel/analytics/next";
import SnowfallComponent from "@/components/snowfall";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProviderWrapper>
      {children}
      <Analytics />
      <SnowfallComponent />
    </AuthProviderWrapper>
  );
}