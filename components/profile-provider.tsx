"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  AvatarKey,
  Profile,
  getCurrentProfileId,
  loadProfiles,
  migrateGlobalToProfile,
  saveProfiles,
  setCurrentProfileId,
} from "@/utils/profile-storage"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Users, Plus, User, UserRound, Baby, Lock, Unlock } from 'lucide-react'
import { cn } from "@/lib/utils"

type ProfileContextType = {
  profiles: Profile[]
  current: Profile | null
  createProfile: (avatar: AvatarKey, name?: string, pin?: string) => void
  switchProfile: (id: string) => void
  openSwitcher: () => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider")
  return ctx
}

function avatarEmoji(a: AvatarKey) {
  if (a === "male") return "👨"
  if (a === "female") return "👩"
  return "🧒"
}

function avatarIcon(a: AvatarKey) {
  if (a === "male") return <User className="h-5 w-5" />
  if (a === "female") return <UserRound className="h-5 w-5" />
  return <Baby className="h-5 w-5" />
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder()
  const data = enc.encode(`${pin}:${salt}`)
  if (crypto?.subtle?.digest) {
    const hash = await crypto.subtle.digest("SHA-256", data)
    const bytes = Array.from(new Uint8Array(hash))
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("")
  }
  // Fallback (not cryptographically strong, but keeps flow)
  let h = 0
  for (let i = 0; i < data.length; i++) {
    h = (h << 5) - h + data[i]!
    h |= 0
  }
  return String(h)
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [firstRunOpen, setFirstRunOpen] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)

  // unlock state in switcher
  const [unlockTarget, setUnlockTarget] = useState<Profile | null>(null)
  const [pinInput, setPinInput] = useState("")
  const [pinError, setPinError] = useState<string | null>(null)

  // hydrate
  useEffect(() => {
    if (typeof window === "undefined") return
    const list = loadProfiles()
    const cur = getCurrentProfileId()
    setProfiles(list)
    setCurrentId(cur)
    if (!list.length) {
      // no profiles: show first-run modal
      setFirstRunOpen(true)
    }
  }, [])

  const current = useMemo(() => profiles.find((p) => p.id === currentId) ?? null, [profiles, currentId])

  const createProfile = useCallback(async (avatar: AvatarKey, name?: string, pin?: string) => {
    const id = `p_${Math.random().toString(36).slice(2, 9)}`
    const now = Date.now()
    const pinHash = pin && pin.trim().length === 4 ? await hashPin(pin.trim(), id) : null
    const profile: Profile = {
      id,
      name: name?.trim() || defaultNameForAvatar(avatar),
      avatar,
      createdAt: now,
      lastActiveAt: now,
      pinHash,
    }
    const next = [...profiles, profile]
    setProfiles(next)
    saveProfiles(next)
    setCurrentId(id)
    setCurrentProfileId(id)
    // migrate any existing global data
    migrateGlobalToProfile(id)
    // let other hooks refresh
    dispatchProfileChanged()
    setFirstRunOpen(false)
  }, [profiles])

  const doSwitch = useCallback((id: string) => {
    setCurrentId(id)
    setCurrentProfileId(id)
    // update lastActiveAt
    setProfiles((prev) => {
      const now = Date.now()
      const updated = prev.map((p) => (p.id === id ? { ...p, lastActiveAt: now } : p))
      saveProfiles(updated)
      return updated
    })
    dispatchProfileChanged()
    setSwitcherOpen(false)
    setUnlockTarget(null)
    setPinInput("")
    setPinError(null)
  }, [])

  const switchProfile = useCallback(async (id: string) => {
    if (id === currentId) return
    const target = profiles.find((p) => p.id === id)
    if (!target) return
    if (target.pinHash) {
      setUnlockTarget(target)
      setPinInput("")
      setPinError(null)
      return
    }
    doSwitch(id)
  }, [currentId, profiles, doSwitch])

  const tryUnlock = useCallback(async () => {
    if (!unlockTarget) return
    const computed = await hashPin(pinInput.trim(), unlockTarget.id)
    if (computed === unlockTarget.pinHash) {
      doSwitch(unlockTarget.id)
    } else {
      setPinError("Incorrect PIN. Please try again.")
    }
  }, [unlockTarget, pinInput, doSwitch])

  const openSwitcher = useCallback(() => {
    setSwitcherOpen(true)
    setUnlockTarget(null)
    setPinInput("")
    setPinError(null)
  }, [])

  return (
    <ProfileContext.Provider value={{ profiles, current, createProfile, switchProfile, openSwitcher }}>
      {children}
      <FirstRunModal open={firstRunOpen} onCancel={() => setFirstRunOpen(false)} onCreate={createProfile} />
      <ProfileSwitcher
        open={switcherOpen}
        onOpenChange={setSwitcherOpen}
        profiles={profiles}
        currentId={currentId}
        onSelect={switchProfile}
        onCreate={createProfile}
        unlockTarget={unlockTarget}
        pinInput={pinInput}
        setPinInput={setPinInput}
        pinError={pinError}
        tryUnlock={tryUnlock}
        cancelUnlock={() => {
          setUnlockTarget(null)
          setPinInput("")
          setPinError(null)
        }}
      />
    </ProfileContext.Provider>
  )
}

function defaultNameForAvatar(a: AvatarKey) {
  if (a === "male") return "Learner (M)"
  if (a === "female") return "Learner (F)"
  return "Learner (Child)"
}

function dispatchProfileChanged() {
  if (typeof window === "undefined") return
  // Let hooks like useSrs / useProgress / Reminders / DialectProvider refresh
  window.dispatchEvent(new Event("profile:changed"))
  // Also trigger an activity update so useProgress recomputes
  window.dispatchEvent(new Event("activity:updated"))
}

function FirstRunModal({
  open,
  onCancel,
  onCreate,
}: {
  open: boolean
  onCancel: () => void
  onCreate: (avatar: AvatarKey, name?: string, pin?: string) => void
}) {
  const [selected, setSelected] = useState<AvatarKey | null>(null)
  const [name, setName] = useState("")
  const [pin, setPin] = useState("")

  const pinValid = pin === "" || /^\d{4}$/.test(pin)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Choose Your Profile
          </DialogTitle>
          <DialogDescription>
            Pick an avatar to start. Optionally set a 4-digit PIN to prevent accidental switching.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3">
          {(["male", "female", "child"] as AvatarKey[]).map((a) => (
            <Card
              key={a}
              className={cn(
                "cursor-pointer transition-all",
                selected === a ? "ring-2 ring-emerald-500 bg-emerald-50" : "hover:bg-gray-50"
              )}
              onClick={() => setSelected(a)}
              aria-pressed={selected === a}
            >
              <CardContent className="p-4 text-center space-y-2">
                <div className="text-4xl">{avatarEmoji(a)}</div>
                <div className="text-sm font-medium capitalize">{a}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-2 mt-2">
          <label className="text-sm font-medium">Name (optional)</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Lily" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Lock className="h-4 w-4" /> PIN (optional)
          </label>
          <Input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
            placeholder="4 digits"
            inputMode="numeric"
            aria-invalid={!pinValid}
          />
          {!pinValid && <div className="text-xs text-rose-600">PIN must be 4 digits</div>}
        </div>
        <Button
          className="w-full mt-2"
          disabled={!selected || !pinValid}
          onClick={() => selected && onCreate(selected, name, pin || undefined)}
        >
          Start
        </Button>
      </DialogContent>
    </Dialog>
  )
}

function ProfileSwitcher({
  open,
  onOpenChange,
  profiles,
  currentId,
  onSelect,
  onCreate,
  unlockTarget,
  pinInput,
  setPinInput,
  pinError,
  tryUnlock,
  cancelUnlock,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  profiles: Profile[]
  currentId: string | null
  onSelect: (id: string) => void
  onCreate: (avatar: AvatarKey, name?: string, pin?: string) => void
  unlockTarget: Profile | null
  pinInput: string
  setPinInput: (v: string) => void
  pinError: string | null
  tryUnlock: () => void
  cancelUnlock: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [newAvatar, setNewAvatar] = useState<AvatarKey>("child")
  const [name, setName] = useState("")
  const [pin, setPin] = useState("")

  const pinValid = pin === "" || /^\d{4}$/.test(pin)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Switch Profile</DialogTitle>
          <DialogDescription>Select a profile or add a new one.</DialogDescription>
        </DialogHeader>

        {!adding ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profiles.map((p) => (
                <Card
                  key={p.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    p.id === currentId ? "ring-2 ring-emerald-500 bg-emerald-50" : "hover:bg-gray-50"
                  )}
                  onClick={() => onSelect(p.id)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="text-3xl">{avatarEmoji(p.avatar)}</div>
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        {p.name}
                        {p.pinHash ? <Lock className="h-3.5 w-3.5 text-emerald-600" /> : null}
                      </div>
                      <div className="text-xs text-gray-500">Last active {new Date(p.lastActiveAt).toLocaleString()}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {unlockTarget && (
              <div className="rounded border p-3 space-y-2">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Unlock className="h-4 w-4" />
                  Enter PIN for {unlockTarget.name}
                </div>
                <Input
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                  placeholder="4 digits"
                  inputMode="numeric"
                />
                {pinError && <div className="text-xs text-rose-600">{pinError}</div>}
                <div className="flex gap-2">
                  <Button onClick={tryUnlock}>Unlock</Button>
                  <Button variant="outline" onClick={cancelUnlock}>Cancel</Button>
                </div>
              </div>
            )}

            <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" />
              Add New Profile
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {(["male", "female", "child"] as AvatarKey[]).map((a) => (
                <Card
                  key={a}
                  className={cn(
                    "cursor-pointer transition-all",
                    newAvatar === a ? "ring-2 ring-emerald-500 bg-emerald-50" : "hover:bg-gray-50"
                  )}
                  onClick={() => setNewAvatar(a)}
                >
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="text-4xl">{avatarEmoji(a)}</div>
                    <div className="text-sm font-medium capitalize">{a}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Ming" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4" /> PIN (optional)
              </label>
              <Input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                placeholder="4 digits"
                inputMode="numeric"
                aria-invalid={!pinValid}
              />
              {!pinValid && <div className="text-xs text-rose-600">PIN must be 4 digits</div>}
            </div>
            <div className="flex gap-2">
              <Button disabled={!pinValid} onClick={() => { onCreate(newAvatar, name, pin || undefined); setAdding(false) }}>Create</Button>
              <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function ProfileButton() {
  const { current, openSwitcher } = useProfile()
  const label = current?.name ?? "Profile"
  const icon = current ? avatarIcon(current.avatar) : <Users className="h-4 w-4" />
  return (
    <Button variant="secondary" size="sm" onClick={openSwitcher} aria-label="Switch profile" className="bg-white text-emerald-700 hover:bg-emerald-50">
      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        {icon}
      </span>
      <span className="max-w-[120px] truncate">{label}</span>
    </Button>
  )
}
