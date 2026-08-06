"use client";

import dynamic from "next/dynamic";

const ServiceDiscovery = dynamic(() => import("@/components/ServiceDiscovery"), {
  ssr: false,
});

export default function ServiceDiscoveryPage() {
  return <ServiceDiscovery />;
}
