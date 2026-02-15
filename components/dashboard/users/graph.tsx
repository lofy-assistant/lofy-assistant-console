"use client"

import { Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface Onboarding {
  question1?: string
  question2?: string
}

interface UserMetadata {
  onboarding?: Onboarding
}

type ChartDatum = { name: string; value: number; fill: string }

export const description = "Onboarding breakdown pie charts (question1 & question2)"

const q1Options = [
  "student",
  "full-time",
  "part-time",
  "self-employed",
  "neet",
]

const q2Options = [
  "social-media",
  "search-engine",
  "friend-colleague",
  "online-advertisement",
  "article-blog",
]

const optionColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
]

const chartConfig = {
  q1: { label: "Question 1" },
  q2: { label: "Question 2" },
  student: { label: "Student", color: optionColors[0] },
  "full-time": { label: "Full-time", color: optionColors[1] },
  "part-time": { label: "Part-time", color: optionColors[2] },
  "self-employed": { label: "Self-employed", color: optionColors[3] },
  neet: { label: "NEET", color: optionColors[4] },
  other: { label: "Other", color: optionColors[5] },
  "social-media": { label: "Social media", color: optionColors[0] },
  "search-engine": { label: "Search engine", color: optionColors[1] },
  "friend-colleague": { label: "Friend / colleague", color: optionColors[2] },
  "online-advertisement": { label: "Online ad", color: optionColors[3] },
  "article-blog": { label: "Article / blog", color: optionColors[4] },
} satisfies ChartConfig

function countOptions(metadatas: UserMetadata[] | undefined, key: keyof Onboarding, options: string[]): ChartDatum[] {
  const counts: Record<string, number> = {}
  for (const opt of options) counts[opt] = 0
  for (const meta of metadatas || []) {
    const val = meta?.onboarding?.[key]
    if (val && options.includes(val)) counts[val] = (counts[val] ?? 0) + 1
    else if (val) counts.other = (counts.other ?? 0) + 1
  }
  return options.map((opt, i) => ({ name: opt, value: counts[opt] ?? 0, fill: optionColors[i % optionColors.length] }))
}

export function UserGraph({ q1Data, q2Data }: { q1Data?: { name: string; value: number }[]; q2Data?: { name: string; value: number }[] }) {
  // Sample data for fallback when no real data is available
  const sampleQ1 = countOptions([
    { onboarding: { question1: "student", question2: "search-engine" } },
    { onboarding: { question1: "full-time", question2: "social-media" } },
    { onboarding: { question1: "full-time", question2: "search-engine" } },
    { onboarding: { question1: "part-time", question2: "friend-colleague" } },
  ], "question1", q1Options)
  
  const sampleQ2 = countOptions([
    { onboarding: { question1: "student", question2: "search-engine" } },
    { onboarding: { question1: "full-time", question2: "social-media" } },
    { onboarding: { question1: "full-time", question2: "search-engine" } },
    { onboarding: { question1: "part-time", question2: "friend-colleague" } },
  ], "question2", q2Options)

  const dataQ1Final = q1Data ? q1Data.map((d, i) => ({ ...d, fill: optionColors[i % optionColors.length] })) : sampleQ1
  const dataQ2Final = q2Data ? q2Data.map((d, i) => ({ ...d, fill: optionColors[i % optionColors.length] })) : sampleQ2

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>What is your professional background?</CardTitle>
          <CardDescription>Onboarding question 1</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-4">
          <div className="w-full min-h-[300px]">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
              <PieChart>
                <Pie 
                  data={dataQ1Final} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={30} 
                  outerRadius={80}
                />
                <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2 flex-wrap gap-2 *:basis-1/2 *:justify-center" />
              </PieChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Where did you know Lofy from?</CardTitle>
          <CardDescription>Onboarding question 2</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-4">
          <div className="w-full min-h-[300px]">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
              <PieChart>
                <Pie 
                  data={dataQ2Final} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={30} 
                  outerRadius={80}
                />
                <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2 flex-wrap gap-2 *:basis-1/2 *:justify-center" />
              </PieChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
