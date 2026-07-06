"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"
import { DownloadIcon, SpinnerGap } from "@phosphor-icons/react"

export default function DownloadPage() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoResult, setVideoResult] = useState<{ url: string, remaining: number } | null>(null)

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setVideoResult(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("You must be logged in to download videos.")
      }

      // Backend URL should point to Render URL in production or localhost locally
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"

      const response = await fetch(`${backendUrl}/api/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl: url,
          userId: session.user.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to download video")
      }

      setVideoResult({ url: data.videoUrl, remaining: data.remaining })
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6 max-w-4xl mx-auto w-full">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">TikTok Downloader</h1>
            <p className="text-muted-foreground">Download TikTok videos without watermarks using your plan limits.</p>
          </div>

          <Card className="mt-4">
            <form onSubmit={handleDownload}>
              <CardHeader>
                <CardTitle>Download Video</CardTitle>
                <CardDescription>Paste the TikTok URL below to start.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">TikTok Video URL</Label>
                  <Input 
                    id="url" 
                    placeholder="https://www.tiktok.com/@user/video/1234567890" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 text-red-500 rounded-md text-sm border border-red-500/20">
                    {error}
                  </div>
                )}

                {videoResult && (
                  <div className="p-4 bg-green-500/10 rounded-md border border-green-500/20 space-y-3">
                    <p className="text-green-600 font-medium text-sm">✅ Video ready! You have {videoResult.remaining} downloads remaining this month.</p>
                    <a href={videoResult.url} target="_blank" rel="noreferrer">
                      <Button type="button" variant="outline" className="w-full sm:w-auto">
                        <DownloadIcon className="mr-2 h-4 w-4" /> Open / Download Video
                      </Button>
                    </a>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loading || !url}>
                  {loading ? (
                    <>
                      <SpinnerGap className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    "Process Video"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
