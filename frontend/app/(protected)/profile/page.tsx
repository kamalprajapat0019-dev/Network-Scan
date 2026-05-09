"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { User, Shield, Lock, CheckCircle2, ArrowLeft, RefreshCw } from "lucide-react"

export default function ProfilePage() {
  const { user, checkAuth } = useAuth()
  const router = useRouter()
  
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Form fields
  const [name, setName] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true)
      try {
        const res = await fetch("/api/users/profile")
        const data = await res.json()
        if (data.success) {
          setProfile(data.data)
          setName(data.data.name)
        } else {
          setError(data.error || "Failed to load profile details")
        }
      } catch (err) {
        setError("Failed to load profile details")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (user) {
      fetchProfile()
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccess("")

    // Validate if password is being changed
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        setError("Current password is required to set a new password")
        setIsSubmitting(false)
        return
      }
      if (!newPassword) {
        setError("New password is required")
        setIsSubmitting(false)
        return
      }
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters")
        setIsSubmitting(false)
        return
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match")
        setIsSubmitting(false)
        return
      }
    }

    try {
      const payload: any = { name }
      if (currentPassword && newPassword) {
        payload.currentPassword = currentPassword
        payload.newPassword = newPassword
      }

      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (data.success) {
        setSuccess("Profile updated successfully!")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        // Refresh session auth state so the name updates in real-time in header/sidebar
        await checkAuth()
      } else {
        setError(data.error || "Failed to update profile")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Back Link */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Card: Profile overview */}
        <Card className="border-none shadow-sm md:col-span-1 rounded-xl overflow-hidden bg-white">
          <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 relative" />
          <CardContent className="pt-0 pb-6 relative text-center flex flex-col items-center">
            {/* Avatar positioning */}
            <div className="-mt-12 mb-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-primary text-white text-3xl font-extrabold shadow-md uppercase">
                {profile?.name ? profile.name.charAt(0) : user?.name?.charAt(0) || "U"}
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 leading-tight">{profile?.name || user?.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">@{profile?.username || user?.username}</p>
            
            <div className="mt-4">
              <Badge className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none">
                {profile?.role === "admin" ? (
                  <Shield className="h-3 w-3 mr-1 inline" />
                ) : (
                  <User className="h-3 w-3 mr-1 inline" />
                )}
                {profile?.role || user?.role}
              </Badge>
            </div>

            <div className="w-full border-t border-slate-100 my-5" />

            <div className="w-full space-y-3.5 text-left text-xs text-slate-600 px-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Username:</span>
                <span className="font-semibold text-slate-700">{profile?.username || user?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Role:</span>
                <span className="font-semibold text-slate-700 capitalize">{profile?.role || user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Joined Since:</span>
                <span className="font-semibold text-slate-700">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Card: Account Settings Form */}
        <Card className="border-none shadow-sm md:col-span-2 rounded-xl bg-white">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg font-bold text-slate-900">Profile Settings</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Update your account details and manage security credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              <FieldGroup className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    {success}
                  </div>
                )}

                <Field>
                  <FieldLabel htmlFor="name">Full Name</FieldLabel>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input
                    id="username"
                    value={profile?.username || ""}
                    disabled
                    className="bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Username is fixed and cannot be changed.</p>
                </Field>

                <div className="border-t border-slate-100 my-6 pt-5" />
                
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-800">Change Password</h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Field>
                    <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        minLength={6}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Retype your new password"
                      />
                    </Field>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setName(profile?.name || "")
                      setCurrentPassword("")
                      setNewPassword("")
                      setConfirmPassword("")
                      setError("")
                      setSuccess("")
                    }}
                    disabled={isSubmitting}
                  >
                    Reset Form
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
