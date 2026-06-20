"use client";

import { useEffect } from "react";
import { consentScriptRegistry } from "@/lib/compliance/consent";
import { useConsentChoices } from "@/components/compliance/cookie-consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const configuredScripts: Record<string, string | undefined> = {
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
  NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
  NEXT_PUBLIC_CLARITY_PROJECT_ID: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
  NEXT_PUBLIC_EMBEDDED_TOOLS_ENABLED: process.env.NEXT_PUBLIC_EMBEDDED_TOOLS_ENABLED,
};

function injectExternalScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function injectInlineScript(id: string, text: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.text = text;
  document.head.appendChild(script);
}

export function ConsentScriptLoader() {
  const choices = useConsentChoices();

  useEffect(() => {
    for (const script of consentScriptRegistry) {
      if (!choices[script.category]) continue;
      const value = configuredScripts[script.envKey];
      if (!value) continue;

      if (script.id === "google-analytics") {
        injectExternalScript("amg-ga-loader", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(value)}`);
        injectInlineScript(
          "amg-ga-init",
          `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${value}',{anonymize_ip:true});`,
        );
      }

      if (script.id === "google-tag-manager") {
        injectInlineScript(
          "amg-gtm-init",
          `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${value}');`,
        );
      }

      if (script.id === "meta-pixel") {
        injectInlineScript(
          "amg-meta-pixel",
          `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${value}');fbq('track','PageView');`,
        );
      }

      if (script.id === "microsoft-clarity") {
        injectInlineScript(
          "amg-clarity",
          `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,'clarity','script','${value}');`,
        );
      }
    }
  }, [choices]);

  return null;
}
