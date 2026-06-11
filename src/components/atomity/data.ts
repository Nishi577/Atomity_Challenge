import { useQuery } from "@tanstack/react-query";

export type ProviderKey = "aws" | "azure" | "gcp" | "onprem";

export interface ProviderIntel {
  key: ProviderKey;
  name: string;
  region: string;
  monthlyCost: number;
  utilization: number;
  waste: number;
  instances: number;
  cards: IntelCard[];
}

export interface IntelCard {
  id: string;
  title: string;
  metric: string;
  status: "Healthy" | "Recoverable" | "Saturated" | "Optimizing";
  spark: number[];
}

export interface ResourceBarMetric {
  key: string;
  utilization: number;
  cost: number;
  savings: number;
}

export interface SummaryMetricItem {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
}

// Static resource bars (used for the unified view panel)
export const RESOURCE_BARS: ResourceBarMetric[] = [
  { key: "CPU", utilization: 72, cost: 28400, savings: 6200 },
  { key: "GPU", utilization: 58, cost: 21200, savings: 4600 },
  { key: "RAM", utilization: 81, cost: 10400, savings: 2800 },
  { key: "Storage", utilization: 44, cost: 14200, savings: 3800 },
  { key: "Network", utilization: 67, cost: 9600, savings: 2100 },
  { key: "Compute", utilization: 76, cost: 11500, savings: 2500 },
];

// Static summary metrics (shown in the bottom strip)
export const SUMMARY_METRICS: SummaryMetricItem[] = [
  { label: "Total Spend", value: 98700, prefix: "$", suffix: "/mo" },
  { label: "Waste Identified", value: 34, suffix: "%" },
  { label: "Recoverable Spend", value: 33500, prefix: "$", suffix: "/mo" },
  { label: "Providers Unified", value: 4 },
  { label: "Visibility Coverage", value: 96, suffix: "%" },
];


const PROVIDER_META: Array<{ key: ProviderKey; name: string; region: string }> = [
  { key: "aws", name: "AWS", region: "us-east-1 · eu-west-2" },
  { key: "azure", name: "Azure", region: "westeurope · eastus2" },
  { key: "gcp", name: "GCP", region: "us-central1 · asia-south1" },
  { key: "onprem", name: "On-Premise", region: "fra-dc1 · sfo-dc2" },
];

const CARD_TITLES = [
  "CPU Utilization",
  "GPU Allocation",
  "Storage Waste",
  "Network Throughput",
  "Idle Resources",
  "Reserved Capacity",
];

const STATUSES: IntelCard["status"][] = ["Healthy", "Recoverable", "Saturated", "Optimizing"];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function transform(products: Array<{ id: number; price: number; stock: number; rating: number; title: string }>): ProviderIntel[] {
  // Transform underlying provider matrix – now returns only the providers array
  const providers: ProviderIntel[] = PROVIDER_META.map((meta, pi) => {
    const slice = products.slice(pi * 8, pi * 8 + 8);
    const monthlyCost = Math.round(slice.reduce((s, p) => s + p.price * 120, 0));
    const utilization = Math.round(
      slice.reduce((s, p) => s + (p.rating / 5) * 100, 0) / Math.max(slice.length, 1),
    );
    const waste = Math.round((100 - utilization) * 0.42);
    const instances = slice.reduce((s, p) => s + p.stock, 0);
    const rand = mulberry32(pi * 97 + 13);

    const cards: IntelCard[] = CARD_TITLES.map((title, i) => {
      const base = 30 + rand() * 65;
      const isPct = !title.includes("Throughput") && !title.includes("Density");
      const value = Math.round(base);
      return {
        id: `${meta.key}-${i}`,
        title,
        metric: isPct ? `${value}%` : title.includes("Throughput") ? `${value} Gb/s` : `${value} pods`,
        status: STATUSES[Math.floor(rand() * STATUSES.length)],
        spark: Array.from({ length: 12 }, () => Math.round(20 + rand() * 80)),
      };
    });
    return { ...meta, monthlyCost, utilization, waste, instances, cards };
  });

  return providers;
}

async function fetchProviders(): Promise<ProviderIntel[]> {
  const res = await fetch("https://dummyjson.com/products?limit=40&select=id,title,price,stock,rating");
  if (!res.ok) throw new Error("Failed to load infrastructure intelligence");
  const json = await res.json();
  return transform(json.products);
}

// ------------------------------------------------------------------
// React Query hook – used by Stage.tsx
// ------------------------------------------------------------------

export function useProviders() {
  return useQuery({
    queryKey: ["atomity", "providers"],
    queryFn: fetchProviders,
    staleTime: 5 * 60 * 1000,
  });
}