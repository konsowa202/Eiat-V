import React, {useState, useEffect, useCallback, useRef, useMemo, startTransition, memo} from 'react'
import {useClient} from 'sanity'

/** Production Next app (WhatsApp API routes). Override with SANITY_STUDIO_WA_SITE_ORIGIN in .env */
const DEFAULT_WA_SITE_ORIGIN = 'https://eiat-v.vercel.app'

/**
 * Origin of the site that serves `/api/whatsapp/*` (Next on Vercel).
 * Hosted Studio (*.sanity.studio) and `sanity dev` on localhost have no `/api` — must use absolute URL.
 *
 * When Studio runs on the same Next app (e.g. eiat-v.vercel.app), use `window.location.origin` explicitly
 * so `fetch` always targets a full URL (avoids rare base-path / extension / SW quirks with `''` + `/api/...`).
 */
function getWaSiteOrigin(): string {
  // Destructure env from import.meta to avoid Next.js build warnings
  const { env } = import.meta as any
  const raw = env?.SANITY_STUDIO_WA_SITE_ORIGIN
  if (raw && String(raw).trim()) return String(raw).trim().replace(/\/$/, '')

  if (typeof window !== 'undefined') {
    const host = window.location.hostname || ''
    const needsRemoteApi =
      host === 'localhost' ||
      host.endsWith('.sanity.studio') ||
      host.endsWith('.sanity.io') ||
      host.endsWith('.sanity.build')
    if (!needsRemoteApi) {
      return window.location.origin.replace(/\/$/, '')
    }
  }

  return '' // Fallback to relative path for current host (Vercel)
}

function waApiAbs(path: string): string {
  const origin = getWaSiteOrigin()
  const p = path.startsWith('/') ? path : `/${path}`
  return `${origin.replace(/\/$/, '')}${p}`
}

interface WaTemplate {
  _id: string
  name: string
  category: string
  messageBody: string
  includeCallButton: boolean
  callPhoneNumber?: string
  linkedOffer?: {title?: string; discount?: string; description?: string}
  linkedService?: {name?: string; price?: string; description?: string}
}

/** Row from `/api/whatsapp/meta-templates` (WhatsApp Cloud API). */
interface MetaWaTemplateRow {
  name: string
  language: string
  category?: string
  bodyText: string
  bodyVariableCount: number
  headerFormat: 'NONE' | 'IMAGE' | 'TEXT' | 'VIDEO' | 'DOCUMENT'
}

/** When `/api/whatsapp/meta-templates` is 404 (Vercel mis-root) or non-JSON — same names as server fallback. */
const META_CLIENT_FALLBACK: MetaWaTemplateRow[] = [
  {name: 'opening', language: 'ar', category: 'Marketing', bodyText: '', bodyVariableCount: 0, headerFormat: 'NONE'},
  {name: 'open', language: 'ar', category: 'Marketing', bodyText: '', bodyVariableCount: 0, headerFormat: 'NONE'},
  {name: 'confirmation', language: 'ar', category: 'Utility', bodyText: '', bodyVariableCount: 4, headerFormat: 'NONE'},
  {name: 'eiat', language: 'ar', category: 'Marketing', bodyText: 'مرحباً بك من عيادات إيات لطب الأسنان! 🦷✨ سعداء بتواصلك معنا، وسنقوم بالرد عليك في أقرب وقت ممكن.', bodyVariableCount: 0, headerFormat: 'IMAGE'},
  {name: 'eiat1', language: 'ar', category: 'Utility', bodyText: 'أهلاً بك عميلنا العزيز بكلمة تأكيد! تم استلام رسالتك وسيتم التعامل معها فوراً.', bodyVariableCount: 0, headerFormat: 'IMAGE'},
  {name: 'hello_world', language: 'en_US', category: 'Utility', bodyText: '', bodyVariableCount: 0, headerFormat: 'NONE'},
]

function metaTemplateRowKey(t: Pick<MetaWaTemplateRow, 'name' | 'language'>): string {
  return `${t.name}::${t.language}`
}

/** Replace {{1}}, {{2}}, … like Meta body components (best-effort chat preview). */
function fillMetaBodyPlaceholders(bodyText: string, values: string[]): string {
  let out = bodyText || ''
  for (let i = 0; i < values.length; i++) {
    const re = new RegExp(`\\{\\{${i + 1}\\}\\}`, 'g')
    out = out.replace(re, values[i] ?? '')
  }
  out = out.replace(/\{\{\d+\}\}/g, '…')
  return out.trim() || (bodyText || '').trim()
}

/**
 * Meta often mirrors the Business Suite *label* in `components[].text` (e.g. template `open` → "Re-engagement message").
 * The Cloud API still sends `type: "template"` with `name: "open"` — this only fixes Studio/Sanity preview text.
 */
/** Meta / Business Suite label for template `open` — allow minor spacing variants from Graph. */
const OPEN_META_SUITE_LABEL = /^[\s\u00a0\u200c-\u200f]*re[-\s]?engagement\s+message[\s\u00a0\u200c-\u200f]*$/i

const META_GRAPH_BODY_AS_ENGLISH_LABEL: Record<string, RegExp> = {
  open: OPEN_META_SUITE_LABEL,
  opening: OPEN_META_SUITE_LABEL,
}

const META_TEMPLATE_AR_PREVIEW: Record<string, string> = {
  opening: 'حياكم الله... مجمع عيادات إيات الطبي',
  open: 'قالب اختبار بدون متغيرات',
}

const OPEN_ENGLISH_LABEL_LINE = OPEN_META_SUITE_LABEL

function isOpenTemplateContext(templateUsedOrName: string | undefined): boolean {
  const t = (templateUsedOrName || '').trim().toLowerCase()
  return t === 'open' || t === 'opening' || t === 're-engagement message' || /^re[-\s]?engagement/.test(t)
}

/**
 * Meta may put the suite label on its own line, after Arabic, or with a single `\n`.
 * Replace every line/paragraph that is *only* that English label (template `open`).
 */
function scrubOpenMetaEnglishLabel(raw: string, templateUsedOrName: string | undefined): string {
  if (!raw || !isOpenTemplateContext(templateUsedOrName)) return raw
  const ar = META_TEMPLATE_AR_PREVIEW.open
  return raw
    .split(/\n\s*\n/)
    .map((para) =>
      para
        .split(/\n/)
        .map((line) => (OPEN_ENGLISH_LABEL_LINE.test(line) ? ar : line))
        .join('\n'),
    )
    .join('\n\n')
}

function metaSanityPreviewBody(templateName: string, filledBodyTrimmed: string): string {
  const scrubbed = scrubOpenMetaEnglishLabel(filledBodyTrimmed, templateName)
  if (scrubbed !== filledBodyTrimmed) return scrubbed
  const re = META_GRAPH_BODY_AS_ENGLISH_LABEL[templateName]
  if (re?.test(filledBodyTrimmed)) {
    return META_TEMPLATE_AR_PREVIEW[templateName] || filledBodyTrimmed
  }
  return filledBodyTrimmed
}

/** Thread list + bubbles: show Arabic clinic label instead of Meta English label-as-body. */
function conversationMessageBodyForDisplay(c: ConversationDoc): string | undefined {
  const raw = c.messageBody
  if (raw == null || raw === '') return undefined
  if (c.direction !== 'outgoing') return raw
  const tu = (c.templateUsed || '').trim()
  const openCtx = isOpenTemplateContext(tu)
  /** Very old docs: no templateUsed but body is only Meta's English suite line for `open`. */
  const orphanOpenLabel = !tu && OPEN_ENGLISH_LABEL_LINE.test(raw.trim())
  /** e.g. "قالب واتساب: open" + newline + "Re-engagement message" without templateUsed */
  const legacyOpenMix =
    !tu &&
    /\bre-engagement message\b/i.test(raw) &&
    /\bقالب\s*واتساب\s*:\s*open\b/i.test(raw)
  if (!openCtx && !orphanOpenLabel && !legacyOpenMix) return raw
  return scrubOpenMetaEnglishLabel(raw, 'open')
}

/** Hide Meta suite label if it was ever stored as `templateUsed`. */
function conversationTemplateUsedForDisplay(c: ConversationDoc): string | undefined {
  const tu = (c.templateUsed || '').trim()
  if (!tu) return undefined
  if (OPEN_META_SUITE_LABEL.test(tu)) return 'open'
  return tu
}

interface ConversationDoc {
  _id: string
  patientName?: string
  phoneNumber: string
  messageBody?: string
  templateUsed?: string
  status: string
  direction: string
  wamid?: string
  sentAt: string
  errorMessage?: string
  messageKind?: string
  waMediaId?: string
}

interface WaThread {
  key: string
  sendPhone: string
  displayName: string
  messages: ConversationDoc[]
  lastAt: number
}

function normalizePhone(p: string): string {
  let n = (p || '').trim()
  if (!n) return ''

  // Keep "+" if user enters an international number and strip visual separators.
  n = n.replace(/[^\d+]/g, '')
  if (n.startsWith('00')) n = `+${n.slice(2)}`
  if (!n.startsWith('+')) n = `+${n}`

  const digits = n.replace(/\D/g, '')
  if (!digits) return ''

  // Default local numbers to Saudi country code.
  if (digits.startsWith('966')) return `+${digits}`
  if (digits.length === 10 && digits.startsWith('05')) return `+966${digits.slice(1)}`
  if (digits.length === 9 && digits.startsWith('5')) return `+966${digits}`

  return `+${digits}`
}

function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '')
}

function commonSuffixLen(a: string, b: string): number {
  let i = a.length - 1
  let j = b.length - 1
  let n = 0
  while (i >= 0 && j >= 0 && a[i] === b[j]) {
    n += 1
    i -= 1
    j -= 1
  }
  return n
}

function samePersonDigits(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true
  const suffix = commonSuffixLen(a, b)
  // Country-agnostic: at least 8 trailing digits must match,
  // and length difference can be larger due to country/trunk prefixes.
  if (suffix >= 8 && Math.abs(a.length - b.length) <= 6) return true
  return false
}

function resolveThreadKey(phone: string, existingKeys: string[]): string {
  const digits = phoneDigits(phone)
  if (!digits) return phone
  const found = existingKeys.find((k) => samePersonDigits(k, digits))
  return found || digits
}

const JUNK_DISPLAY_NAMES = new Set([
  'غير محدد',
  'بدون اسم',
  'من المحادثات',
  'إرسال جماعي',
  '.',
  '..',
  '…',
])

function isJunkDisplayName(name: string): boolean {
  const t = name.trim()
  if (!t) return true
  if (JUNK_DISPLAY_NAMES.has(t)) return true
  if (t.length <= 2 && !/[\u0600-\u06FF]/.test(t) && !/\d{2,}/.test(t)) return true
  return false
}

/** Prefer the most frequent non-junk name so one bad inbound (e.g. ".") does not override a saved name. */
function pickDisplayNameFromMessages(msgs: ConversationDoc[]): string {
  const counts = new Map<string, number>()
  for (const m of msgs) {
    const n = (m.patientName || '').trim()
    if (isJunkDisplayName(n)) continue
    counts.set(n, (counts.get(n) || 0) + 1)
  }
  let best = ''
  let bestCount = 0
  for (const [n, c] of counts) {
    if (c > bestCount || (c === bestCount && n.length > best.length)) {
      best = n
      bestCount = c
    }
  }
  if (best) return best
  const lastIn = [...msgs]
    .reverse()
    .find((m) => m.direction === 'incoming' && !isJunkDisplayName((m.patientName || '').trim()))
  if (lastIn?.patientName) return lastIn.patientName.trim()
  const lastOut = [...msgs]
    .reverse()
    .find((m) => m.direction === 'outgoing' && !isJunkDisplayName((m.patientName || '').trim()))
  if (lastOut?.patientName) return lastOut.patientName.trim()
  const last = msgs[msgs.length - 1]
  const ln = (last?.patientName || '').trim()
  return isJunkDisplayName(ln) ? 'عميل' : ln
}

const WA_LAST_READ_PREFIX = 'eiat_wa_last_read:'

function getThreadLastReadAt(key: string): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem(WA_LAST_READ_PREFIX + key)
    if (raw == null || raw === '') return 0
    const n = parseInt(raw, 10)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

function setThreadLastReadAt(key: string, atMs: number) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(WA_LAST_READ_PREFIX + key, String(Math.floor(atMs)))
  } catch {
    /* ignore */
  }
}

function buildThreads(list: ConversationDoc[]): WaThread[] {
  const map = new Map<string, ConversationDoc[]>()
  for (const c of list) {
    const k = resolveThreadKey(c.phoneNumber, [...map.keys()])
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(c)
  }
  const out: WaThread[] = []
  for (const [key, msgs] of map) {
    msgs.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
    const last = msgs[msgs.length - 1]
    const displayName = pickDisplayNameFromMessages(msgs)
    const sendPhone = normalizePhone(
      [...msgs]
        .reverse()
        .map((m) => m.phoneNumber)
        .find((p) => (p || '').replace(/\D/g, '').length >= 10) || last?.phoneNumber || key,
    )
    out.push({
      key,
      sendPhone,
      displayName,
      messages: msgs,
      lastAt: Math.max(...msgs.map((m) => new Date(m.sentAt).getTime())),
    })
  }
  return out.sort((a, b) => b.lastAt - a.lastAt)
}

function mediaSrc(waMediaId: string): string {
  return waApiAbs(`/api/whatsapp/media?mediaId=${encodeURIComponent(waMediaId)}`)
}

async function parseApiResponse(res: Response): Promise<{success: boolean; error?: string; [k: string]: unknown}> {
  const text = await res.text()
  let parsed: Record<string, unknown>
  try {
    parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {}
  } catch {
    return {
      success: false,
      error: `[HTTP ${res.status}] ${text?.slice(0, 220) || 'Non-JSON response'}`,
    }
  }
  if (!res.ok && parsed.success !== true) {
    const fromBody =
      typeof parsed.error === 'string' && parsed.error.trim() ? parsed.error.trim() : ''
    return {
      ...parsed,
      success: false,
      error: fromBody || `[HTTP ${res.status}] فشل الخادم`,
    }
  }
  return parsed as {success: boolean; error?: string; [k: string]: unknown}
}

/** Graph returns `{ error: { message, ... } }` on failure; our route forwards it as `waData`. */
function waSendFailureMessage(data: Record<string, unknown>): string {
  const direct = typeof data.error === 'string' ? data.error.trim() : ''
  if (direct) return direct
  const wa = data.waData as {error?: {message?: string; error_user_msg?: string}} | undefined
  const msg = wa?.error?.error_user_msg || wa?.error?.message
  if (msg && String(msg).trim()) return String(msg).trim()
  return 'خطأ'
}

async function fileToBase64(file: File): Promise<string> {
  const arr = new Uint8Array(await file.arrayBuffer())
  let out = ''
  const chunk = 0x8000
  for (let i = 0; i < arr.length; i += chunk) {
    const slice = arr.subarray(i, i + chunk)
    out += String.fromCharCode(...slice)
  }
  return btoa(out)
}

interface BroadcastTarget {
  phone: string
  name?: string
}

function extractBroadcastTargets(raw: string): BroadcastTarget[] {
  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)

  const out = new Map<string, BroadcastTarget>()
  for (const line of lines) {
    const byPipe = line.split('|').map((s) => s.trim())
    const byComma = line.split(',').map((s) => s.trim())
    const parts = byPipe.length >= 2 ? byPipe : byComma.length >= 2 ? byComma : [line]

    const phoneCandidate = parts[parts.length - 1]
    const digits = phoneCandidate.replace(/\D/g, '')
    if (digits.length < 8 || digits.length > 15) continue
    const normalized = normalizePhone(phoneCandidate)
    const name = parts.length >= 2 ? parts.slice(0, -1).join(' ').trim() : undefined
    out.set(normalized, {phone: normalized, ...(name ? {name} : {})})
  }
  return [...out.values()]
}

interface Stats {
  total: number
  totalOut: number
  totalIn: number
  sent: number
  failed: number
  today: number
}

const catLabels: Record<string, string> = {
  offer: '🏷️ عروض وخصومات',
  package: '📦 باقات علاج',
  appointment: '📅 مواعيد',
  followup: '🔄 متابعة',
  custom: '✏️ مخصص',
}

/** Some older docs may store messageBody as portable-text blocks instead of string. */
function stringFromSanityText(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw)) {
    const lines: string[] = []
    for (const block of raw) {
      if (!block || typeof block !== 'object') continue
      const b = block as {_type?: string; children?: unknown[]}
      if (b._type === 'block' && Array.isArray(b.children)) {
        const parts: string[] = []
        for (const ch of b.children) {
          if (ch && typeof ch === 'object' && 'text' in ch && typeof (ch as {text: unknown}).text === 'string') {
            parts.push((ch as {text: string}).text)
          }
        }
        lines.push(parts.join(''))
      }
    }
    return lines.join('\n')
  }
  return String(raw)
}

function normalizeTemplateBody(s: string): string {
  try {
    return s.normalize('NFC')
  } catch {
    return s
  }
}

/** Match {{token}} with optional spaces / fullwidth braces (common paste from Word). */
function replaceToken(body: string, token: string, value: string): string {
  const v = value == null ? '' : String(value)
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const inner = `\\s*${esc}\\s*`
  let out = body
  out = out.replace(new RegExp(`\\{\\{${inner}\\}\\}`, 'g'), v)
  out = out.replace(new RegExp(`｛｛${inner}｝｝`, 'g'), v)
  return out
}

type TemplateVars = {
  patientName: string
  appointmentDate: string
  doctorName: string
  offerName?: string
  price?: string
}

const fillTemplate = (tpl: WaTemplate, vars: TemplateVars): string => {
  let body = normalizeTemplateBody(stringFromSanityText((tpl as {messageBody?: unknown}).messageBody))
  const offerName = vars.offerName ?? tpl.linkedOffer?.title ?? ''
  const price =
    vars.price ?? (tpl.linkedService?.price as string | undefined) ?? tpl.linkedOffer?.discount ?? ''

  body = replaceToken(body, 'اسم_المريض', vars.patientName || 'عزيزي المريض')
  body = replaceToken(body, 'اسم_العرض', offerName)
  body = replaceToken(body, 'السعر', price)
  body = replaceToken(body, 'تاريخ_الموعد', vars.appointmentDate || '')
  body = replaceToken(body, 'اسم_الطبيب', vars.doctorName || '')

  body = replaceToken(body, 'patient_name', vars.patientName || 'عزيزي المريض')
  body = replaceToken(body, 'offer_name', offerName)
  body = replaceToken(body, 'price', price)
  body = replaceToken(body, 'appointment_date', vars.appointmentDate || '')
  body = replaceToken(body, 'doctor_name', vars.doctorName || '')

  if (tpl.includeCallButton && tpl.callPhoneNumber) {
    body += `\n\n📞 للحجز والاستفسار: ${tpl.callPhoneNumber}`
  }
  return body
}

const todayISO = () => new Date().toISOString().slice(0, 10)

export function WhatsAppTool() {
  const client = useClient({apiVersion: '2024-01-01'})

  const [tab, setTab] = useState<'send' | 'chats' | 'dashboard'>('dashboard')
  const [templates, setTemplates] = useState<WaTemplate[]>([])
  const [conversations, setConversations] = useState<ConversationDoc[]>([])
  const [loadingTpl, setLoadingTpl] = useState(true)
  const [loadingLog, setLoadingLog] = useState(true)

  const [selectedTpl, setSelectedTpl] = useState<WaTemplate | null>(null)
  const [selectedChatTpl, setSelectedChatTpl] = useState<WaTemplate | null>(null)
  const [metaWaTemplates, setMetaWaTemplates] = useState<MetaWaTemplateRow[]>([])
  const [loadingMetaTpl, setLoadingMetaTpl] = useState(false)
  const [metaTplFetchError, setMetaTplFetchError] = useState<string | null>(null)
  const [metaUsedFallback, setMetaUsedFallback] = useState(false)
  const [selectedMetaKey, setSelectedMetaKey] = useState('')
  const [metaParamValues, setMetaParamValues] = useState<string[]>([])
  /** HTTPS CDN URL or Sanity image `_ref` (image-…) for Meta template IMAGE header */
  const [metaHeaderImageInput, setMetaHeaderImageInput] = useState('')
  const [filterCat, setFilterCat] = useState('all')

  const selectedMetaTpl = useMemo(
    () => metaWaTemplates.find((t) => metaTemplateRowKey(t) === selectedMetaKey) || null,
    [metaWaTemplates, selectedMetaKey],
  )

  const [patientName, setPatientName] = useState('')
  const [phone, setPhone] = useState('')
  const [customMsg, setCustomMsg] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [doctorName, setDoctorName] = useState('')

  const [sending, setSending] = useState(false)
  const [alert, setAlert] = useState<{type: 'ok' | 'err'; msg: string} | null>(null)
  const [searchLog, setSearchLog] = useState('')
  const [logFilter, setLogFilter] = useState<'all' | 'incoming' | 'outgoing'>('all')
  const [selectedThreadKey, setSelectedThreadKey] = useState<string | null>(null)
  const [chatQuickPhone, setChatQuickPhone] = useState('')
  const [creatingNewChat, setCreatingNewChat] = useState(false)
  const [logTableMode, setLogTableMode] = useState(false)
  const [broadcastMode, setBroadcastMode] = useState(false)
  const [sendBroadcastMode, setSendBroadcastMode] = useState(false)
  const [sendBroadcastNumbersRaw, setSendBroadcastNumbersRaw] = useState('')
  const [recording, setRecording] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [chatNameDraft, setChatNameDraft] = useState('')
  const [savingChatName, setSavingChatName] = useState(false)
  const [readEpoch, setReadEpoch] = useState(0)
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [longPressMenu, setLongPressMenu] = useState<{
    msgId: string
    body: string
    isOut: boolean
    x: number
    y: number
  } | null>(null)
  const sessionUnreadBaselineRef = useRef<Map<string, number>>(new Map())
  const lastFocusFetchAtRef = useRef(0)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const isTypingRef = useRef(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const newChatPhoneInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioPartsRef = useRef<Blob[]>([])
  const audioMimeTypeRef = useRef('audio/ogg')

  const alertTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const showAlert = useCallback((type: 'ok' | 'err', msg: string) => {
    setAlert({type, msg})
    clearTimeout(alertTimer.current)
    alertTimer.current = setTimeout(() => setAlert(null), 6000)
  }, [])

  const isLight = theme === 'light'

  // Load templates
  useEffect(() => {
    client
      .fetch<WaTemplate[]>(
        `*[_type == "whatsappTemplate" && active == true] | order(_createdAt desc) {
        _id, name, category, messageBody, includeCallButton, callPhoneNumber,
        "linkedOffer": linkedOffer->{title, discount, description},
        "linkedService": linkedService->{name, price, description}
      }`,
      )
      .then((d) => setTemplates(d || []))
      .finally(() => setLoadingTpl(false))
  }, [client])

  // Approved Meta / Facebook message templates (same list as WhatsApp Manager).
  useEffect(() => {
    let cancelled = false
    setLoadingMetaTpl(true)
    setMetaTplFetchError(null)
    setMetaUsedFallback(false)
    fetch(waApiAbs('/api/whatsapp/meta-templates'), {cache: 'no-store'})
      .then(async (r) => {
        const status = r.status
        const raw = await r.text()
        type MetaTplApi = {
          templates?: MetaWaTemplateRow[]
          error?: string
          usedFallback?: boolean
          success?: boolean
        }
        let data: MetaTplApi | null = null
        try {
          data = JSON.parse(raw) as MetaTplApi
        } catch {
          data = null
        }
        if (cancelled) return
        if (!r.ok || data == null || typeof data !== 'object') {
          setMetaWaTemplates(META_CLIENT_FALLBACK)
          setMetaUsedFallback(true)
          setMetaTplFetchError(
            !r.ok
              ? `GET /api/whatsapp/meta-templates → HTTP ${status}. غالباً Vercel: Root Directory ليس «packages/eiat-site» أو لم يُنشر المسار. تأكد أيضاً من وجود WHATSAPP_ACCESS_TOKEN أو WA_ACCESS_TOKEN ثم أعد النشر. تُعرض قائمة احتياطية.`
              : `استجابة غير JSON (HTTP ${status}) — قائمة احتياطية.`,
          )
          return
        }
        const list = Array.isArray(data.templates) ? data.templates : []
        const effective = list.length > 0 ? list : META_CLIENT_FALLBACK
        setMetaWaTemplates(effective)
        setMetaTplFetchError(data.error?.trim() ? data.error.trim() : null)
        setMetaUsedFallback(Boolean(data.usedFallback) || list.length === 0)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setMetaWaTemplates(META_CLIENT_FALLBACK)
          setMetaUsedFallback(true)
          setMetaTplFetchError(
            e instanceof Error ? e.message : 'تعذر الاتصال بخادم قوالب واتساب — قائمة احتياطية.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMetaTpl(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const t = metaWaTemplates.find((x) => metaTemplateRowKey(x) === selectedMetaKey)
    if (!t) {
      setMetaParamValues([])
      setMetaHeaderImageInput('')
      return
    }

    const defaultParams = Array.from({length: Math.max(0, t.bodyVariableCount)}, () => '')
    let defaultHeader = ''

    // Global Defaults for specific templates
    if (t.name === 'eiat' || t.name === 'eiat1') {
      if (t.headerFormat === 'IMAGE') {
        defaultHeader = 'https://eiat-v.vercel.app/wa-logo.jpg'
      }
      // No body params to fill if count is 0
    }

    setMetaParamValues(defaultParams)
    setMetaHeaderImageInput(defaultHeader)
  }, [selectedMetaKey, metaWaTemplates])

  // Load conversations
  const fetchConversations = useCallback(() => {
    setLoadingLog(true)
    client
      .fetch<ConversationDoc[]>(
        `*[_type == "whatsappConversation"] | order(sentAt desc)[0..499] {
        _id, patientName, phoneNumber, messageBody, templateUsed,
        status, direction, wamid, sentAt, errorMessage, messageKind, waMediaId
      }`,
      )
      .then((d) => setConversations(d || []))
      .finally(() => setLoadingLog(false))
  }, [client])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Auto-refresh ~every 90s; skip while typing, recording, or sending media/text (avoids breaking uploads).
  useEffect(() => {
    const interval = setInterval(() => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase()
      const inInput = activeTag === 'input' || activeTag === 'textarea'
      if (inInput || isTypingRef.current || sending || recording) return
      void fetchConversations()
    }, 90000)
    return () => clearInterval(interval)
  }, [fetchConversations, sending, recording])

  // Refresh on focus/visibility only when idle, throttled to ~90s (same cadence as polling).
  useEffect(() => {
    const maybeFetch = () => {
      if (sending || recording || isTypingRef.current) return
      const activeTag = (document.activeElement?.tagName || '').toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') return
      const now = Date.now()
      if (now - lastFocusFetchAtRef.current < 90000) return
      lastFocusFetchAtRef.current = now
      void fetchConversations()
    }
    const onFocus = () => {
      maybeFetch()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        maybeFetch()
      }
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fetchConversations, sending, recording])

  // Detect active typing (ref only, no state to avoid re-renders)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const onInput = (ev: Event) => {
      const tag = ((ev.target as HTMLElement | null)?.tagName || '').toLowerCase()
      if (tag !== 'input' && tag !== 'textarea') return
      isTypingRef.current = true
      clearTimeout(timer)
      timer = setTimeout(() => {
        isTypingRef.current = false
      }, 1400)
    }
    document.addEventListener('input', onInput, true)
    return () => {
      document.removeEventListener('input', onInput, true)
      clearTimeout(timer)
    }
  }, [])

  const stats: Stats = {
    total: conversations.length,
    totalOut: conversations.filter((c) => c.direction === 'outgoing').length,
    totalIn: conversations.filter((c) => c.direction === 'incoming').length,
    sent: conversations.filter(
      (c) => c.status === 'sent' || c.status === 'delivered' || c.status === 'read',
    ).length,
    failed: conversations.filter((c) => c.status === 'failed').length,
    today: conversations.filter((c) => c.sentAt?.startsWith(todayISO())).length,
  }

  const preview = useCallback(() => {
    if (!selectedTpl) return customMsg
    const priceRaw = selectedTpl.linkedService?.price ?? selectedTpl.linkedOffer?.discount
    return fillTemplate(selectedTpl, {
      patientName,
      appointmentDate,
      doctorName,
      offerName: selectedTpl.linkedOffer?.title || '',
      price: priceRaw != null && priceRaw !== '' ? String(priceRaw) : '',
    })
  }, [selectedTpl, patientName, appointmentDate, doctorName, customMsg])

  // Send message via our own server-side API
  const handleSend = async () => {
    const text = selectedTpl ? preview() : customMsg
    if (!text.trim()) return showAlert('err', '⚠️ اختر قالب أو اكتب رسالة')

    const manualTargets = extractBroadcastTargets(sendBroadcastNumbersRaw)
    const historyTargets: BroadcastTarget[] = threads.map((t) => ({
      phone: t.sendPhone,
      name: t.displayName,
    }))
    const singleTarget: BroadcastTarget[] = phone.trim()
      ? [{phone: normalizePhone(phone.trim()), ...(patientName.trim() ? {name: patientName.trim()} : {})}]
      : []
    const targets = sendBroadcastMode
      ? Array.from(
          new Map(
            [...historyTargets, ...manualTargets].map((t) => [t.phone, t]),
          ).values(),
        )
      : singleTarget

    if (!targets.length) {
      return showAlert(
        'err',
        sendBroadcastMode
          ? '⚠️ أدخل أرقامًا للبث أو تأكد من وجود أرقام في الهيستوري'
          : '⚠️ أدخل رقم الواتساب',
      )
    }

    setSending(true)
    setAlert(null)

    try {
      let ok = 0
      let fail = 0
      for (const t of targets) {
        // Build raw params for the backend to use with Meta Templates
        const templateParams = {
          patientName: t.name || patientName || 'عميلنا العزيز',
          appointmentDate: appointmentDate,
          doctorName: doctorName,
          location: 'حي الأندلس، جدة', // Default
        }

        const res = await fetch(waApiAbs('/api/whatsapp/send'), {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            phone: t.phone,
            message: text,
            patientName: t.name || patientName || 'غير محدد',
            templateUsed: sendBroadcastMode
              ? `Broadcast · ${selectedTpl?.name || 'رسالة مخصصة'}`
              : selectedTpl?.name || 'رسالة مخصصة',
            templateParams, // Pass actual data fields to the backend
          }),
        })
        const data = await parseApiResponse(res)
        if (data.success) ok += 1
        else fail += 1
        if (sendBroadcastMode) await new Promise((r) => setTimeout(r, 120))
      }

      if (sendBroadcastMode) {
        showAlert('ok', `📣 الإرسال الجماعي تم: ✅ ${ok} / ❌ ${fail}`)
      } else if (fail > 0) {
        showAlert('err', '❌ فشل الإرسال')
      } else {
        showAlert('ok', `✅ تم إرسال الرسالة بنجاح`)
        setPhone('')
        setPatientName('')
        setCustomMsg('')
        setAppointmentDate('')
        setDoctorName('')
        setSelectedTpl(null)
      }

      // Refresh conversations from Sanity
      setTimeout(fetchConversations, 1000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ في الاتصال'
      showAlert('err', `❌ خطأ: ${msg}`)
    } finally {
      setSending(false)
    }
  }

  const handleChatSend = async (customText?: string) => {
    if (selectedMetaTpl && !broadcastMode) {
      return showAlert(
        'err',
        '⚠️ يوجد قالب فيسبوك محدد — استخدم زر «إرسال قالب فيسبوك» أو اضغط «إزالة» لإلغاء اختيار القالب',
      )
    }
    const text = (customText ?? '').trim()
    if (!text && !selectedChatTpl) return showAlert('err', '⚠️ اكتب رسالة أو اختر قالب')

    let targetPhone = ''
    if (selectedThreadKey) {
      targetPhone = activeThread?.sendPhone || ''
    } else if (chatQuickPhone.trim()) {
      targetPhone = normalizePhone(chatQuickPhone)
    } else {
      return showAlert('err', '⚠️ اختر محادثة من القائمة أو أدخل رقم واتساب')
    }

    const chatPhoneToSend = targetPhone.trim() ? normalizePhone(targetPhone.trim()) : ''
    if (!chatPhoneToSend) {
      return showAlert(
        'err',
        '⚠️ الرقم غير صالح أو غير محفوظ — اكتب رقم واتساب في الحقل أعلاه',
      )
    }

    setSending(true)
    setAlert(null)
    try {
      const payload = {
        phone: chatPhoneToSend,
        message: selectedChatTpl ? (selectedChatTpl.messageBody || '') : text,
        patientName: activeThread?.displayName || 'من المحادثات',
        templateUsed: selectedChatTpl ? selectedChatTpl.name : 'رد سريع',
        templateParams: {
          patientName: activeThread?.displayName || patientName || 'عميلنا العزيز',
          appointmentDate: appointmentDate || new Date().toLocaleDateString('ar-SA'),
          doctorName: doctorName || 'عيادات إيات',
          location: 'حي الأندلس، جدة',
        },
      };

      console.log('Sending WhatsApp Payload (V3.1):', payload);
      // Removed the alert to keep it clean, but kept logs for dev console
      
      const res = await fetch(waApiAbs('/api/whatsapp/send'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      })
      const data = await parseApiResponse(res)
      if (!data.success) {
        showAlert('err', `❌ فشل (V3.1): ${waSendFailureMessage(data)} | القالب: ${payload.templateUsed}`)
      } else {
        showAlert('ok', `✅ تم الإرسال (V3.1)`)
        setSelectedChatTpl(null)
        setTimeout(fetchConversations, 800)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ في الاتصال'
      showAlert('err', `❌ ${msg}`)
    } finally {
      setSending(false)
    }
  }

  const handleChatSendMetaTemplate = async (customText?: string) => {
    if (selectedChatTpl) {
      return showAlert('err', '⚠️ أزل قالب Sanity أولاً أو ألغِ اختياره لإرسال قالب فيسبوك')
    }
    if (broadcastMode) {
      return showAlert('err', '⚠️ الإرسال الجماعي للنصوص فقط — عطّل الجماعي لإرسال قالب فيسبوك')
    }
    const t = selectedMetaTpl
    if (!t) return showAlert('err', '⚠️ اختر قالب فيسبوك من القائمة')

    for (let i = 0; i < t.bodyVariableCount; i++) {
      if (!String(metaParamValues[i] ?? '').trim()) {
        return showAlert('err', `⚠️ املأ قيمة المتغير ${i + 1} في القالب`)
      }
    }

    let targetPhone = ''
    if (selectedThreadKey) {
      targetPhone = activeThread?.sendPhone || ''
    } else if (chatQuickPhone.trim()) {
      targetPhone = normalizePhone(chatQuickPhone)
    } else {
      return showAlert('err', '⚠️ اختر محادثة من القائمة أو أدخل رقم واتساب')
    }

    const phoneToSend = targetPhone.trim() ? normalizePhone(targetPhone.trim()) : ''
    if (!phoneToSend) {
      return showAlert(
        'err',
        '⚠️ الرقم غير صالح أو غير محفوظ لهذه المحادثة — اكتب الرقم في حقل «رقم واتساب» أعلاه ثم أعد الإرسال',
      )
    }

    const filledRaw = fillMetaBodyPlaceholders(t.bodyText, metaParamValues).trim()
    const filledBody = metaSanityPreviewBody(t.name, filledRaw)
    const extra = (customText ?? '').trim()
    // Some gateways / older deploys reject empty `message`; zero-var templates often have no bodyText in fallback rows.
    const messageBodyForSanity =
      [filledBody, extra].filter(Boolean).join('\n\n').trim() ||
      (metaSanityPreviewBody(t.name, (t.bodyText || '').trim()) || '').trim() ||
      META_TEMPLATE_AR_PREVIEW[t.name]?.trim() ||
      `قالب واتساب: ${t.name}`

    const hdr = metaHeaderImageInput.trim()
    const headerImageFields =
      hdr.startsWith('https://')
        ? {headerImageLink: hdr}
        : hdr.startsWith('image-') && !hdr.includes('/')
          ? {headerImageSanityRef: hdr}
          : {}

    setSending(true)
    setAlert(null)
    try {
      const sendUrl = waApiAbs('/api/whatsapp/send')
      const res = await fetch(sendUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          phone: phoneToSend,
          message: messageBodyForSanity,
          patientName: activeThread?.displayName || patientName || 'من المحادثات',
          templateUsed: t.name,
          metaTemplate: {
            name: t.name,
            languageCode: t.language,
            bodyParameterValues: metaParamValues.slice(0, t.bodyVariableCount),
            headerFormat: t.headerFormat,
            ...headerImageFields,
          },
        }),
      })
      const data = await parseApiResponse(res)
      if (!data.success) {
        showAlert('err', `❌ فشل إرسال القالب: ${waSendFailureMessage(data)} · ${t.name}`)
      } else {
        showAlert('ok', `✅ تم إرسال قالب فيسبوك: ${t.name}`)
        setSelectedMetaKey('')
        setMetaParamValues([])
        setMetaHeaderImageInput('')
        setTimeout(fetchConversations, 800)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ في الاتصال'
      showAlert('err', `❌ ${msg}`)
    } finally {
      setSending(false)
    }
  }

  const handleChatMedia = async (file: File, customCaption?: string) => {
    let targetPhone = ''
    if (selectedThreadKey) {
      targetPhone = activeThread?.sendPhone || ''
    } else if (chatQuickPhone.trim()) {
      targetPhone = normalizePhone(chatQuickPhone)
    } else {
      return showAlert('err', '⚠️ اختر محادثة أو أدخل رقم قبل رفع ملف')
    }

    setSending(true)
    setAlert(null)
    try {
      const fileDataBase64 = await fileToBase64(file)
      const res = await fetch(waApiAbs('/api/whatsapp/send-media'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          phone: targetPhone,
          patientName: 'من المحادثات',
          templateUsed: 'ميديا',
          caption: (customCaption ?? '').trim(),
          fileName: file.name || `upload-${Date.now()}.bin`,
          fileType: file.type || 'application/octet-stream',
          fileDataBase64,
        }),
      })
      const data = await parseApiResponse(res)
      if (!data.success) {
        showAlert('err', `❌ فشل إرسال الملف: ${waSendFailureMessage(data)}`)
      } else {
        showAlert('ok', `✅ تم إرسال الملف`)
        setTimeout(fetchConversations, 1000)
      }
    } catch (err: unknown) {
      showAlert('err', `❌ خطأ في الاتصال`)
    } finally {
      setSending(false)
    }
  }

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true})
      mediaStreamRef.current = stream
      const preferred = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ]
      const selectedMime =
        preferred.find((m) => MediaRecorder.isTypeSupported(m)) || ''
      const rec = selectedMime ? new MediaRecorder(stream, {mimeType: selectedMime}) : new MediaRecorder(stream)
      audioMimeTypeRef.current = rec.mimeType || selectedMime || 'audio/ogg'
      audioPartsRef.current = []
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) audioPartsRef.current.push(e.data)
      }
      mediaRecorderRef.current = rec
      rec.start()
      setRecording(true)
      showAlert('ok', '🎙️ بدأ التسجيل الصوتي')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر تشغيل الميكروفون'
      showAlert('err', `❌ ${msg}`)
    }
  }

  const stopAndSendVoiceRecording = async () => {
    const rec = mediaRecorderRef.current
    if (!rec || rec.state === 'inactive') return

    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve()
      rec.stop()
    })
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    mediaStreamRef.current = null
    setRecording(false)

    const mime = audioMimeTypeRef.current || 'audio/ogg'
    const blob = new Blob(audioPartsRef.current, {type: mime})
    if (blob.size < 600) {
      showAlert('err', '⚠️ التسجيل قصير جداً')
      return
    }
    const ext = mime.includes('webm') ? 'webm' : mime.includes('mp4') ? 'm4a' : 'ogg'
    const voiceFile = new File([blob], `voice-${Date.now()}.${ext}`, {type: blob.type})
    await handleChatMedia(voiceFile)
  }

  const handleBroadcastText = async (customText?: string) => {
    const text = (customText ?? '').trim()
    if (!text) return showAlert('err', '⚠️ اكتب الرسالة أولاً')
    const targets = filteredThreads.map((t) => t.sendPhone)
    if (!targets.length) return showAlert('err', '⚠️ لا توجد محادثات لإرسال جماعي')

    setSending(true)
    let ok = 0
    let fail = 0
    for (const targetPhone of targets) {
      try {
        const res = await fetch(waApiAbs('/api/whatsapp/send'), {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            phone: targetPhone,
            message: text,
            patientName: 'إرسال جماعي',
            templateUsed: 'Broadcast',
          }),
        })
        const data = await parseApiResponse(res)
        if (data.success) ok += 1
        else fail += 1
      } catch {
        fail += 1
      }
      await new Promise((r) => setTimeout(r, 120))
    }
    setSending(false)
    setTimeout(fetchConversations, 1000)
    showAlert('ok', `📣 الإرسال الجماعي تم: ✅ ${ok} / ❌ ${fail}`)
  }

  const handleBroadcastMedia = async (file: File, customCaption?: string) => {
    const targets = filteredThreads.map((t) => t.sendPhone)
    if (!targets.length) return showAlert('err', '⚠️ لا توجد محادثات لإرسال جماعي')

    setSending(true)
    let ok = 0
    let fail = 0
    const fileDataBase64 = await fileToBase64(file)
    for (const targetPhone of targets) {
      try {
        const res = await fetch(waApiAbs('/api/whatsapp/send-media'), {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            phone: targetPhone,
            patientName: 'إرسال جماعي',
            templateUsed: 'Broadcast Media',
            caption: (customCaption ?? '').trim(),
            fileName: file.name || `upload-${Date.now()}.bin`,
            fileType: file.type || 'application/octet-stream',
            fileDataBase64,
          }),
        })
        const data = await parseApiResponse(res)
        if (data.success) ok += 1
        else fail += 1
      } catch {
        fail += 1
      }
      await new Promise((r) => setTimeout(r, 120))
    }
    setSending(false)
    setTimeout(fetchConversations, 1200)
    showAlert('ok', `📣 إرسال الملف جماعيًا: ✅ ${ok} / ❌ ${fail}`)
  }

  const filteredTpls = filterCat === 'all' ? templates : templates.filter((t) => t.category === filterCat)

  const filteredLog = conversations.filter((c) => {
    if (logFilter !== 'all' && c.direction !== logFilter) return false
    if (
      searchLog &&
      !(
        c.patientName?.includes(searchLog) ||
        c.phoneNumber?.includes(searchLog) ||
        c.messageBody?.includes(searchLog) ||
        c.templateUsed?.includes(searchLog)
      )
    )
      return false
    return true
  })

  const threads = useMemo(() => buildThreads(conversations), [conversations])
  const historyNumbers = useMemo(
    () => Array.from(new Set(threads.map((t) => t.sendPhone))),
    [threads],
  )

  const filteredThreads = useMemo(() => {
    const q = searchLog.trim()
    if (!q) return threads
    return threads.filter(
      (t) =>
        t.displayName.includes(q) ||
        t.sendPhone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        t.messages.some(
          (m) =>
            m.messageBody?.includes(q) ||
            m.templateUsed?.includes(q) ||
            m.patientName?.includes(q),
        ),
    )
  }, [threads, searchLog])

  const activeThread = useMemo(
    () => threads.find((t) => t.key === selectedThreadKey) || null,
    [threads, selectedThreadKey],
  )

  const lastReadMsForThread = useCallback(
    (th: WaThread) => {
      void readEpoch
      const fromLs = getThreadLastReadAt(th.key)
      if (fromLs > 0) return fromLs
      if (!sessionUnreadBaselineRef.current.has(th.key)) {
        sessionUnreadBaselineRef.current.set(th.key, th.lastAt)
      }
      return sessionUnreadBaselineRef.current.get(th.key)!
    },
    [readEpoch],
  )

  const countIncomingUnread = useCallback(
    (th: WaThread) => {
      const lastRead = lastReadMsForThread(th)
      return th.messages.reduce(
        (n, m) =>
          m.direction === 'incoming' && new Date(m.sentAt).getTime() > lastRead ? n + 1 : n,
        0,
      )
    },
    [lastReadMsForThread],
  )

  const threadRowsForList = useMemo(
    () => filteredThreads.map((th) => ({th, unread: countIncomingUnread(th)})),
    [filteredThreads, countIncomingUnread, readEpoch],
  )

  // While a thread is open, treat new incoming as read (WhatsApp-style).
  useEffect(() => {
    if (tab !== 'chats' || !selectedThreadKey || !activeThread) return
    const maxIn = activeThread.messages.reduce((acc, m) => {
      if (m.direction !== 'incoming') return acc
      return Math.max(acc, new Date(m.sentAt).getTime())
    }, 0)
    const at = Math.max(Date.now(), maxIn)
    const prevLs = getThreadLastReadAt(selectedThreadKey)
    if (prevLs >= at) return
    setThreadLastReadAt(selectedThreadKey, at)
    sessionUnreadBaselineRef.current.set(selectedThreadKey, at)
    setReadEpoch((e) => e + 1)
  }, [tab, selectedThreadKey, activeThread])

  useEffect(() => {
    setChatNameDraft(activeThread?.displayName || '')
  }, [activeThread?.key, activeThread?.displayName])

  const handleSaveChatName = async () => {
    if (!activeThread) return
    const nextName = chatNameDraft.trim()
    if (!nextName) return showAlert('err', '⚠️ أدخل اسم العميل')
    setSavingChatName(true)
    try {
      const updates = activeThread.messages.map((m) =>
        client.patch(m._id).set({patientName: nextName}).commit(),
      )
      await Promise.all(updates)
      showAlert('ok', '✅ تم حفظ اسم العميل')
      void fetchConversations()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل حفظ الاسم'
      showAlert('err', `❌ ${msg}`)
    } finally {
      setSavingChatName(false)
    }
  }

  const handleDeleteMsg = async (msgId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة من السجل؟')) return
    try {
      await client.delete(msgId)
      showAlert('ok', '✅ تم حذف الرسالة')
      void fetchConversations()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل الحذف'
      showAlert('err', `❌ ${msg}`)
    }
  }

  const handleCopyMsg = (text: string) => {
    if (!text) return
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => showAlert('ok', '✅ تم النسخ'),
        () => showAlert('err', '❌ فشل النسخ')
      )
    } else {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      showAlert('ok', '✅ تم النسخ')
    }
  }

  const handleStartEdit = (msgId: string) => {
    setEditingMsgId(msgId)
    // The text will be handled internally by the WhatsAppComposer
    setTimeout(() => {
      document.getElementById('wa-composer-textarea')?.focus()
    }, 80)
  }

  const handleCancelEdit = () => {
    setEditingMsgId(null)
  }

  const handleSaveEdit = async (newBody: string) => {
    if (!editingMsgId) return
    if (!newBody.trim()) return showAlert('err', '⚠️ نص الرسالة لا يجوز أن يكون فارغاً')
    setSavingEdit(true)
    try {
      await client.patch(editingMsgId).set({messageBody: newBody}).commit()
      showAlert('ok', '✅ تم تعديل الرسالة')
      setEditingMsgId(null)
      void fetchConversations()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل التعديل'
      showAlert('err', `❌ ${msg}`)
    } finally {
      setSavingEdit(false)
    }
  }

  useEffect(() => {
    if (tab !== 'chats') return
    if (!filteredThreads.length) {
      startTransition(() => setSelectedThreadKey(null))
      return
    }
    if (!selectedThreadKey || !filteredThreads.some((t) => t.key === selectedThreadKey)) {
      startTransition(() => setSelectedThreadKey(filteredThreads[0].key))
    }
  }, [tab, filteredThreads, selectedThreadKey])

  useEffect(() => {
    if (!creatingNewChat) return
    requestAnimationFrame(() => {
      newChatPhoneInputRef.current?.focus()
    })
  }, [creatingNewChat])

  useEffect(() => {
    if (tab !== 'chats' || logTableMode) return
    const el = chatScrollRef.current
    if (!el) return
    // Use a small timeout to ensure layout has settled on mount/refresh
    const timer = setTimeout(() => {
      el.scrollTop = el.scrollHeight
    }, 60)
    return () => clearTimeout(timer)
  }, [tab, activeThread?.messages.length, selectedThreadKey, logTableMode])

  return (
    <div
      className="wa-inbox-root"
      data-wa-ui={theme}
      style={{
        ...S.root,
        background: 'var(--wa-page-bg)',
        color: 'var(--wa-text)',
      }}
    >
      <style>{CSS_GLOBAL}</style>

      {/* Header */}
      <div style={S.header}>
        <div style={S.headerIcon}>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </div>
        <div style={{flex: 1}}>
          <h1 style={S.headerTitle}>واتساب للأعمال — إيات لطب الأسنان</h1>
          <p style={S.headerSub}>أرسل واستقبل رسائل مباشرة من لوحة التحكم</p>
        </div>
        <div style={{textAlign: 'left' as const}}>
          <button
            type="button"
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            style={{
              marginBottom: '8px',
              padding: '4px 10px',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.45)',
              background: 'rgba(255,255,255,0.18)',
              color: '#fff',
              fontSize: '11px',
              cursor: 'pointer',
              fontFamily: "'Tajawal', 'Segoe UI', sans-serif",
            }}
          >
            {isLight ? '🌙 داكن' : '☀️ فاتح'}
          </button>
          <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.7)'}}>رقم الأعمال</div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#fff',
              direction: 'ltr' as const,
            }}
          >
            +966 12 615 0299
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={S.statsRow}>
        {[
          {n: stats.total, label: 'إجمالي', color: '#25d366'},
          {n: stats.totalOut, label: '📤 صادرة', color: '#38bdf8'},
          {n: stats.totalIn, label: '📥 واردة', color: '#a78bfa'},
          {n: stats.sent, label: '✅ ناجحة', color: '#4ade80'},
          {n: stats.failed, label: '❌ فاشلة', color: '#f87171'},
          {n: stats.today, label: '📅 اليوم', color: '#fbbf24'},
        ].map((s, i) => (
          <div key={i} style={S.statCard}>
            <div style={{fontSize: '28px', fontWeight: 800, color: s.color}}>{s.n}</div>
            <div style={{fontSize: '11px', color: 'var(--wa-muted)', marginTop: '4px'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={S.tabRow}>
        {(['dashboard', 'send', 'chats'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{...S.tab, ...(tab === t ? S.tabActive : {})}}
          >
            {t === 'dashboard' && '📊 لوحة التحكم'}
            {t === 'send' && '📤 إرسال رسالة'}
            {t === 'chats' && `💬 المحادثات (${threads.length})`}
          </button>
        ))}
      </div>

      {/* ═══ DASHBOARD TAB ═══ */}
      {tab === 'dashboard' && (
        <div style={{...S.card}}>
          <h2 style={S.secTitle}>📊 ملخص النشاط</h2>

          {conversations.length === 0 ? (
            <div style={S.empty}>
              <div style={{fontSize: '48px', marginBottom: '12px'}}>📱</div>
              <div style={{fontSize: '16px', fontWeight: 600, marginBottom: '8px'}}>
                لم يتم إرسال أو استقبال أي رسائل بعد
              </div>
              <div style={{fontSize: '13px', color: 'var(--wa-muted)'}}>
                اذهب إلى تبويب "إرسال رسالة" لبدء التواصل مع المرضى
              </div>
            </div>
          ) : (
            <>
              <div style={{marginBottom: '24px'}}>
                <h3 style={{...S.secTitle, fontSize: '14px', marginBottom: '12px'}}>
                  📬 آخر المحادثات
                </h3>
                {conversations.slice(0, 10).map((c) => (
                  <div key={c._id} style={S.logRow}>
                    <div
                      style={{fontSize: '20px', minWidth: '32px', textAlign: 'center' as const}}
                    >
                      {c.direction === 'incoming' ? '📥' : '📤'}
                    </div>
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: 600, fontSize: '14px', color: 'var(--wa-text)'}}>
                        {c.patientName || 'بدون اسم'}
                        {c.direction === 'incoming' && (
                          <span
                            style={{
                              marginRight: '8px',
                              fontSize: '11px',
                              padding: '1px 6px',
                              borderRadius: '8px',
                              background: 'rgba(167,139,250,0.15)',
                              color: '#a78bfa',
                            }}
                          >
                            وارد
                          </span>
                        )}
                      </div>
                      <div
                        style={{fontSize: '12px', color: 'var(--wa-muted)', direction: 'ltr' as const}}
                      >
                        {c.phoneNumber} · {conversationTemplateUsedForDisplay(c) ?? c.templateUsed}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--wa-muted)',
                          marginTop: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap' as const,
                          maxWidth: '600px',
                        }}
                      >
                        {conversationMessageBodyForDisplay(c)?.substring(0, 90)}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column' as const,
                        alignItems: 'flex-end',
                        gap: '4px',
                      }}
                    >
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: 600,
                          background:
                            c.status === 'failed'
                              ? 'rgba(239,68,68,0.15)'
                              : 'rgba(37,211,102,0.15)',
                          color: c.status === 'failed' ? '#f87171' : '#25d366',
                        }}
                      >
                        {c.status === 'sent'
                          ? '✅'
                          : c.status === 'delivered'
                            ? '📬'
                            : c.status === 'read'
                              ? '👁️'
                              : '❌'}
                      </span>
                      <div
                        style={{fontSize: '11px', color: 'var(--wa-muted)', whiteSpace: 'nowrap' as const}}
                      >
                        {c.sentAt
                          ? new Date(c.sentAt).toLocaleString('ar-SA', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {stats.failed > 0 && (
                <div
                  style={{
                    padding: '14px 18px',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{fontWeight: 600, color: '#f87171', marginBottom: '6px'}}>
                    ⚠️ يوجد {stats.failed} رسالة فاشلة
                  </div>
                  <div style={{fontSize: '12px', color: 'var(--wa-muted)'}}>
                    تحقق من صحة أرقام الهواتف وأن الـ API Token ساري المفعول في Vercel Environment
                    Variables
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ SEND TAB ═══ */}
      {tab === 'send' && (
        <div style={S.grid}>
          {/* Templates Panel */}
          <div style={{...S.card}}>
            <h2 style={S.secTitle}>📋 القوالب</h2>

            <div
              style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap' as const,
                marginBottom: '16px',
              }}
            >
              {['all', 'offer', 'package', 'appointment', 'followup', 'custom'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: "'Segoe UI', Tajawal, sans-serif",
                    background:
                      filterCat === cat ? 'var(--wa-brand)' : 'var(--wa-surface-2)',
                    color: filterCat === cat ? '#fff' : 'var(--wa-muted)',
                    border:
                      filterCat === cat
                        ? '1px solid transparent'
                        : '1px solid var(--wa-border)',
                    transition: 'all 0.2s',
                  }}
                >
                  {cat === 'all' ? '🔍 الكل' : catLabels[cat]}
                </button>
              ))}
            </div>

            {loadingTpl ? (
              <div style={S.empty}>جاري تحميل القوالب...</div>
            ) : filteredTpls.length === 0 ? (
              <div style={S.empty}>
                <div style={{fontSize: '36px', marginBottom: '8px'}}>📭</div>
                <div>لا توجد قوالب في هذه الفئة</div>
                <div style={{marginTop: '8px', fontSize: '12px'}}>
                  أضف قوالب من "قوالب واتساب" في القائمة الجانبية
                </div>
              </div>
            ) : (
              <div style={{maxHeight: '500px', overflowY: 'auto' as const}}>
                {filteredTpls.map((t) => (
                  <div
                    key={t._id}
                    style={{
                      ...S.tplCard,
                      ...(selectedTpl?._id === t._id ? S.tplCardSel : {}),
                    }}
                    onClick={() => {
                      setSelectedTpl(selectedTpl?._id === t._id ? null : t)
                      setCustomMsg('')
                    }}
                  >
                    <div style={S.badge}>{catLabels[t.category] || t.category}</div>
                    <p style={{margin: 0, fontWeight: 600, fontSize: '14px', color: 'var(--wa-text)'}}>
                      {t.name}
                    </p>
                    <p style={{margin: '4px 0 0', fontSize: '12px', color: 'var(--wa-muted)'}}>
                      {t.messageBody?.substring(0, 80)}...
                    </p>
                    {t.linkedOffer && (
                      <p style={{margin: '4px 0 0', fontSize: '11px', color: '#f59e0b'}}>
                        🏷️ مرتبط بـ: {t.linkedOffer.title}
                      </p>
                    )}
                    {t.linkedService && (
                      <p style={{margin: '4px 0 0', fontSize: '11px', color: '#38bdf8'}}>
                        📦 باقة: {t.linkedService.name} — {t.linkedService.price}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Compose Panel */}
          <div style={{...S.card}}>
            <h2 style={S.secTitle}>✉️ إنشاء الرسالة</h2>

            <label style={S.label}>اسم المريض (اختياري)</label>
            <input
              style={S.input}
              placeholder="مثال: أحمد محمد"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />

            <label style={S.label}>رقم الواتساب *</label>
            <input
              style={S.input}
              placeholder="محلي: 5XXXXXXXX أو 05XXXXXXXX | دولي: +2010XXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              disabled={sendBroadcastMode}
            />
            <label style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px'}}>
              <input
                type="checkbox"
                checked={sendBroadcastMode}
                onChange={(e) => setSendBroadcastMode(e.target.checked)}
              />
              <span style={{fontSize: '12px', color: 'var(--wa-muted)'}}>
                إرسال جماعي من تبويب الإرسال (broadcast)
              </span>
            </label>

            {sendBroadcastMode && (
              <div
                style={{
                  marginBottom: '12px',
                  padding: '10px',
                  border: '1px solid rgba(99,120,160,0.2)',
                  borderRadius: '10px',
                  background: 'rgba(15,23,42,0.45)',
                }}
              >
                <label style={S.label}>أرقام إضافية (سطر/فاصلة)</label>
                <textarea
                  style={{...S.textarea, minHeight: '92px'}}
                  value={sendBroadcastNumbersRaw}
                  placeholder={
                    'اسم العميل|5XXXXXXXX\nأحمد محمد,+2010XXXXXXX\nأو رقم فقط في كل سطر'
                  }
                  onChange={(e) => setSendBroadcastNumbersRaw(e.target.value)}
                />
                <label
                  style={{
                    display: 'inline-block',
                    marginTop: '8px',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(56,189,248,0.35)',
                    color: '#38bdf8',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  📂 رفع ملف أرقام (txt/csv)
                  <input
                    type="file"
                    accept=".txt,.csv"
                    style={{display: 'none'}}
                    onChange={async (e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      const content = await f.text()
                      const merged = [sendBroadcastNumbersRaw, content].filter(Boolean).join('\n')
                      setSendBroadcastNumbersRaw(merged)
                      e.target.value = ''
                    }}
                  />
                </label>
                <div style={{marginTop: '10px', fontSize: '12px', color: 'var(--wa-muted)'}}>
                  هيستوري الأرقام:
                </div>
                <div style={{display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginTop: '6px'}}>
                  {historyNumbers.slice(0, 60).map((n) => (
                    <button
                      key={n}
                      type="button"
                      style={{
                        fontSize: '11px',
                        borderRadius: '16px',
                        border: '1px solid rgba(99,120,160,0.35)',
                        background: 'rgba(30,41,59,0.8)',
                        color: 'var(--wa-text)',
                        padding: '3px 9px',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        if (sendBroadcastNumbersRaw.includes(n)) return
                        setSendBroadcastNumbersRaw((prev) => (prev ? `${prev}\n${n}` : n))
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div style={{marginTop: '8px', fontSize: '11px', color: 'var(--wa-muted)'}}>
                  المستهدفون = أرقام الهيستوري + الأرقام المضافة/المرفوعة (بدون تكرار)،
                  ويمكن إدخال الاسم مع الرقم بصيغة name|phone.
                </div>
              </div>
            )}

            {selectedTpl && (
              <>
                {selectedTpl.category === 'appointment' && (
                  <>
                    <label style={S.label}>تاريخ الموعد</label>
                    <input
                      style={S.input}
                      placeholder="مثال: الإثنين 15 أبريل - 3 مساءً"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                    />
                    <label style={S.label}>اسم الطبيب</label>
                    <input
                      style={S.input}
                      placeholder="مثال: د. سارة"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                    />
                  </>
                )}

                <div
                  style={{
                    marginTop: '8px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{fontSize: '12px', color: '#25d366', fontWeight: 600}}>
                    ✅ قالب: {selectedTpl.name}
                  </span>
                  <button
                    onClick={() => setSelectedTpl(null)}
                    style={{
                      background: 'rgba(239,68,68,0.15)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#f87171',
                      fontSize: '11px',
                      padding: '2px 8px',
                      fontFamily: "'Segoe UI', Tajawal, sans-serif",
                    }}
                  >
                    ✕ إزالة
                  </button>
                </div>
                <div style={{fontSize: '11px', color: 'var(--wa-muted)', marginBottom: '10px'}}>
                  ملاحظة: هذا قالب داخلي يرسل كنص. لو تريد قالب واتساب الرسمي بالأزرار/الهيدر
                  يجب إنشاؤه واعتماده في Meta ثم إرساله كـ `template` API.
                </div>
              </>
            )}

            {!selectedTpl && (
              <>
                <label style={S.label}>أو اكتب رسالة مخصصة</label>
                <textarea
                  style={S.textarea}
                  placeholder="اكتب رسالتك هنا..."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                />
              </>
            )}

            {(selectedTpl || customMsg) && (
              <div>
                <h3 style={{...S.secTitle, marginTop: '16px', fontSize: '13px'}}>
                  👁️ معاينة الرسالة
                </h3>
                <div style={S.preview}>{preview()}</div>
              </div>
            )}

            {alert && (
              <div style={alert.type === 'ok' ? S.alertOk : S.alertErr}>{alert.msg}</div>
            )}

            <button
              style={{
                ...S.sendBtn,
                opacity: sending ? 0.7 : 1,
                cursor: sending ? 'not-allowed' : 'pointer',
              }}
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? (
                <>
                  جاري الإرسال... <span style={S.spinner} />
                </>
              ) : (
                '📤 إرسال عبر واتساب'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══ CHATS TAB (واجهة شات) ═══ */}
      {tab === 'chats' && (
        <div
          style={{...S.card}}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
              flexWrap: 'wrap' as const,
            }}
          >
            <h2 style={{...S.secTitle, margin: 0, flex: 1}}>💬 المحادثات</h2>
            <button
              onClick={() => setLogTableMode(!logTableMode)}
              style={{
                background: logTableMode ? 'rgba(56,189,248,0.18)' : 'var(--wa-surface-2)',
                border: '1px solid var(--wa-border)',
                borderRadius: '8px',
                color: logTableMode ? '#38bdf8' : 'var(--wa-muted)',
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: "'Segoe UI', Tajawal, sans-serif",
              }}
            >
              {logTableMode ? '💬 عرض الشات' : '📋 عرض السجل كجدول'}
            </button>
            <button
              onClick={fetchConversations}
              style={{
                background: 'rgba(0, 168, 132, 0.12)',
                border: '1px solid rgba(0, 168, 132, 0.28)',
                borderRadius: '8px',
                color: 'var(--wa-brand)',
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: "'Segoe UI', Tajawal, sans-serif",
              }}
            >
              🔄 تحديث
            </button>
          </div>

          <input
            style={{...S.input, marginBottom: '16px'}}
            placeholder="🔍 ابحث باسم جهة الاتصال أو الرقم أو نص الرسالة..."
            value={searchLog}
            onChange={(e) => setSearchLog(e.target.value)}
          />

          {loadingLog ? (
            <div style={S.empty}>جاري تحميل المحادثات...</div>
          ) : logTableMode ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  flexWrap: 'wrap' as const,
                }}
              >
                <span style={{fontSize: '12px', color: 'var(--wa-muted)'}}>تصفية:</span>
                {(['all', 'outgoing', 'incoming'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setLogFilter(f)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: "'Segoe UI', Tajawal, sans-serif",
                      background: logFilter === f ? 'var(--wa-brand)' : 'var(--wa-surface-2)',
                      color: logFilter === f ? '#fff' : 'var(--wa-muted)',
                      border:
                        logFilter === f
                          ? '1px solid transparent'
                          : '1px solid var(--wa-border)',
                    }}
                  >
                    {f === 'all' ? 'الكل' : f === 'outgoing' ? '📤 صادرة' : '📥 واردة'}
                  </button>
                ))}
              </div>
              {filteredLog.length === 0 ? (
                <div style={S.empty}>
                  <div style={{fontSize: '40px', marginBottom: '12px'}}>📭</div>
                  <div style={{fontSize: '15px', fontWeight: 600}}>لا توجد رسائل</div>
                </div>
              ) : (
                <div style={{maxHeight: '560px', overflowY: 'auto' as const}}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1.2fr 1fr 1.5fr 0.8fr 0.7fr 120px',
                      gap: '8px',
                      padding: '10px 14px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--wa-muted)',
                      borderBottom: '1px solid var(--wa-border)',
                    }}
                  >
                    <div />
                    <div>المريض</div>
                    <div>الرقم</div>
                    <div>الرسالة</div>
                    <div>القالب</div>
                    <div>الحالة</div>
                    <div>الوقت</div>
                  </div>
                  {filteredLog.map((c) => (
                    <div
                      key={c._id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1.2fr 1fr 1.5fr 0.8fr 0.7fr 120px',
                        gap: '8px',
                        padding: '12px 14px',
                        fontSize: '13px',
                        borderBottom: '1px solid var(--wa-border)',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{fontSize: '18px', textAlign: 'center' as const}}>
                        {c.direction === 'incoming' ? '📥' : '📤'}
                      </div>
                      <div style={{fontWeight: 600, color: 'var(--wa-text)'}}>
                        {c.patientName || 'بدون اسم'}
                      </div>
                      <div style={{color: 'var(--wa-muted)', direction: 'ltr' as const, fontSize: '12px'}}>
                        {c.phoneNumber}
                      </div>
                      <div
                        style={{
                          color: 'var(--wa-muted)',
                          fontSize: '12px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap' as const,
                        }}
                      >
                        {conversationMessageBodyForDisplay(c)?.substring(0, 60)}
                      </div>
                      <div style={{fontSize: '11px', color: 'var(--wa-muted)'}}>
                        {conversationTemplateUsedForDisplay(c) ?? c.templateUsed}
                      </div>
                      <div>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background:
                              c.status === 'sent' || c.status === 'delivered' || c.status === 'read'
                                ? 'rgba(37,211,102,0.15)'
                                : 'rgba(239,68,68,0.15)',
                            color:
                              c.status === 'sent' || c.status === 'delivered' || c.status === 'read'
                                ? '#25d366'
                                : '#f87171',
                          }}
                        >
                          {c.status === 'sent'
                            ? '✅ مرسلة'
                            : c.status === 'delivered'
                              ? '📬 وصلت'
                              : c.status === 'read'
                                ? '👁️ مقروءة'
                                : '❌ فشل'}
                        </span>
                      </div>
                      <div style={{fontSize: '11px', color: 'var(--wa-muted)'}}>
                        {c.sentAt
                          ? new Date(c.sentAt).toLocaleString('ar-SA', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : filteredThreads.length === 0 ? (
            <div style={S.empty}>
              <div style={{fontSize: '48px', marginBottom: '12px'}}>📭</div>
              <div style={{fontSize: '15px', fontWeight: 600}}>
                {searchLog ? 'لا توجد محادثات مطابقة' : 'لا توجد محادثات بعد'}
              </div>
              <div style={{fontSize: '12px', color: 'var(--wa-muted)', marginTop: '6px'}}>
                أرسل من تبويب «إرسال رسالة» أو تأكد أن Webhook واتساب يُرسل إلى
                /api/whatsapp/webhook على نفس الدومين (مثلاً Vercel).
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                gap: 0,
                minHeight: '560px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--wa-border)',
                background: 'var(--wa-surface)',
                boxShadow: 'var(--wa-card-shadow)',
              }}
            >
              {/* قائمة جهات الاتصال */}
              <div
                style={{
                  width: 'min(320px, 38%)',
                  borderLeft: '1px solid var(--wa-border)',
                  overflowY: 'auto' as const,
                  maxHeight: '72vh',
                  background: 'var(--wa-surface)',
                }}
              >
                {threadRowsForList.map(({th, unread}) => (
                  <button
                    key={th.key}
                    type="button"
                    className="wa-thread-item"
                    data-active={selectedThreadKey === th.key ? 'true' : 'false'}
                    onClick={() => {
                      startTransition(() => {
                        setSelectedThreadKey(th.key)
                        setChatQuickPhone('')
                        setCreatingNewChat(false)
                        setSelectedChatTpl(null)
                      })
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'right' as const,
                      padding: '12px 14px',
                      border: 'none',
                      borderBottom: '1px solid var(--wa-border)',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--wa-text)',
                      fontFamily: "'Segoe UI',system-ui,Tajawal,sans-serif",
                      transition: 'background 0.12s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 10,
                        direction: 'rtl' as const,
                      }}
                    >
                      <div style={{flex: 1, minWidth: 0}}>
                        <div
                          style={{
                            fontWeight: unread ? 800 : 700,
                            fontSize: '14px',
                            color: unread ? 'var(--wa-text)' : undefined,
                          }}
                        >
                          {th.displayName}
                        </div>
                        <div style={{fontSize: '11px', color: 'var(--wa-muted)', direction: 'ltr' as const}}>
                          {th.sendPhone}
                        </div>
                      </div>
                      {unread > 0 ? (
                        <span
                          style={{
                            flexShrink: 0,
                            minWidth: 22,
                            height: 22,
                            borderRadius: 11,
                            background: '#25d366',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 6px',
                            lineHeight: 1,
                          }}
                        >
                          {unread > 99 ? '99+' : unread}
                        </span>
                      ) : null}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: unread ? 'var(--wa-text)' : 'var(--wa-muted)',
                        marginTop: '4px',
                        fontWeight: unread ? 600 : 400,
                        opacity: unread ? 1 : 0.92,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' as const,
                      }}
                    >
                      {(() => {
                        const last = th.messages[th.messages.length - 1]
                        return last
                          ? conversationMessageBodyForDisplay(last)?.substring(0, 42) || '—'
                          : '—'
                      })()}
                    </div>
                  </button>
                ))}
              </div>

              {/* منطقة الشات */}
              <div style={{flex: 1, display: 'flex', flexDirection: 'column' as const, minWidth: 0}}>
                {!activeThread ? (
                  <div style={{...S.empty, flex: 1}}>اختر محادثة من القائمة</div>
                ) : (
                  <>
                    <div
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--wa-border)',
                        background: 'var(--wa-chat-header)',
                      }}
                    >
                      <div style={{display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' as const}}>
                        <input
                          value={chatNameDraft}
                          onChange={(e) => setChatNameDraft(e.target.value)}
                          style={{
                            ...S.input,
                            marginBottom: 0,
                            maxWidth: '280px',
                            fontWeight: 700,
                            fontSize: '14px',
                          }}
                          placeholder="اسم العميل"
                        />
                        <button
                          type="button"
                          onClick={() => void handleSaveChatName()}
                          disabled={savingChatName}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(37,211,102,0.35)',
                            background: 'rgba(37,211,102,0.13)',
                            color: '#16a34a',
                            cursor: savingChatName ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          {savingChatName ? '...' : '💾 حفظ الاسم'}
                        </button>
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--wa-muted)',
                          direction: 'ltr' as const,
                          marginTop: '6px',
                        }}
                      >
                        {activeThread.sendPhone}
                      </div>
                    </div>
                    {/* Long-press context menu */}
                    {longPressMenu && (
                      <div
                        style={{
                          position: 'fixed',
                          top: longPressMenu.y,
                          left: longPressMenu.x,
                          zIndex: 9999,
                          background: 'var(--wa-elevated)',
                          border: '1px solid var(--wa-border)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                          padding: '6px',
                          display: 'flex',
                          flexDirection: 'column' as const,
                          gap: '2px',
                          minWidth: '130px',
                          direction: 'rtl' as const,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          style={{
                            width: '100%',
                            padding: '9px 14px',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'var(--wa-text)',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'right' as const,
                            fontFamily: "'Tajawal','Segoe UI',sans-serif",
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--wa-surface-2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          onClick={() => { handleCopyMsg(longPressMenu.body); setLongPressMenu(null) }}
                        >
                          <span>📋</span> نسخ
                        </button>
                        {longPressMenu.isOut && (
                          <button
                            style={{
                              width: '100%',
                              padding: '9px 14px',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#60a5fa',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textAlign: 'right' as const,
                              fontFamily: "'Tajawal','Segoe UI',sans-serif",
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            onClick={() => { handleStartEdit(longPressMenu.msgId); setLongPressMenu(null) }}
                          >
                            <span>✏️</span> تعديل
                          </button>
                        )}
                        <div style={{height: '1px', background: 'var(--wa-border)', margin: '2px 6px'}} />
                        <button
                          style={{
                            width: '100%',
                            padding: '9px 14px',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#f87171',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'right' as const,
                            fontFamily: "'Tajawal','Segoe UI',sans-serif",
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          onClick={() => { void handleDeleteMsg(longPressMenu.msgId); setLongPressMenu(null) }}
                        >
                          <span>🗑️</span> حذف
                        </button>
                      </div>
                    )}
                    <div
                      ref={chatScrollRef}
                      className="wa-msg-scroll"
                      style={{
                        flex: 1,
                        overflowY: 'auto' as const,
                        padding: '16px 14px 20px',
                        display: 'flex',
                        flexDirection: 'column' as const,
                        gap: '6px',
                        maxHeight: '54vh',
                      }}
                      onClick={() => setLongPressMenu(null)}
                    >
                      {activeThread.messages.map((c) => {
                        const out = c.direction === 'outgoing'
                        const kind = c.messageKind || 'text'
                        const src = c.waMediaId ? mediaSrc(c.waMediaId) : ''
                        const displayBody = conversationMessageBodyForDisplay(c)
                        const isBeingEdited = editingMsgId === c._id
                        return (
                          <div
                            key={c._id}
                            className="wa-msg-row"
                            style={{
                              display: 'flex',
                              justifyContent: out ? 'flex-start' : 'flex-end',
                              flexDirection: 'column',
                              alignItems: out ? 'flex-start' : 'flex-end',
                              paddingTop: '4px',
                              paddingBottom: '4px',
                            }}
                          >
                            <div
                              className="wa-bubble-wrap"
                              style={{
                                position: 'relative',
                                maxWidth: 'min(92%, 420px)',
                                cursor: 'pointer',
                              }}
                              onMouseDown={(e) => {
                                const body = displayBody || c.messageBody || ''
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                longPressTimerRef.current = setTimeout(() => {
                                  const menuX = Math.min(e.clientX, window.innerWidth - 160)
                                  const menuY = Math.min(e.clientY + 8, window.innerHeight - 160)
                                  setLongPressMenu({msgId: c._id, body, isOut: out, x: menuX, y: menuY})
                                }, 500)
                              }}
                              onMouseUp={() => clearTimeout(longPressTimerRef.current)}
                              onMouseLeave={() => clearTimeout(longPressTimerRef.current)}
                              onTouchStart={(e) => {
                                const body = displayBody || c.messageBody || ''
                                const touch = e.touches[0]
                                longPressTimerRef.current = setTimeout(() => {
                                  const menuX = Math.min(touch.clientX, window.innerWidth - 160)
                                  const menuY = Math.min(touch.clientY + 8, window.innerHeight - 160)
                                  setLongPressMenu({msgId: c._id, body, isOut: out, x: menuX, y: menuY})
                                }, 500)
                              }}
                              onTouchEnd={() => clearTimeout(longPressTimerRef.current)}
                              onTouchMove={() => clearTimeout(longPressTimerRef.current)}
                            >
                              <div
                                style={{
                                  borderRadius: '8px',
                                  padding: '8px 12px 6px',
                                  background: isBeingEdited
                                    ? 'rgba(59,130,246,0.22)'
                                    : out ? 'var(--wa-bubble-out)' : 'var(--wa-bubble-in)',
                                  color: out ? 'var(--wa-bubble-out-text)' : 'var(--wa-bubble-in-text)',
                                  border: isBeingEdited
                                    ? '1px solid rgba(59,130,246,0.55)'
                                    : out
                                    ? '1px solid rgba(0,0,0,0.04)'
                                    : '1px solid var(--wa-border)',
                                  boxShadow: 'var(--wa-bubble-shadow)',
                                  transition: 'background 0.18s, border-color 0.18s',
                                }}
                              >
                                {c.waMediaId && kind === 'image' && (
                                  <img
                                    src={src}
                                    alt=""
                                    style={{
                                      maxWidth: '100%',
                                      borderRadius: '10px',
                                      marginBottom: '8px',
                                      display: 'block',
                                    }}
                                  />
                                )}
                                {c.waMediaId && kind === 'video' && (
                                  <video
                                    src={src}
                                    controls
                                    style={{
                                      maxWidth: '100%',
                                      borderRadius: '10px',
                                      marginBottom: '8px',
                                    }}
                                  />
                                )}
                                {c.waMediaId && kind === 'audio' && (
                                  <audio
                                    src={src}
                                    controls
                                    style={{width: '100%', marginBottom: '8px'}}
                                  />
                                )}
                                {c.waMediaId && kind === 'document' && (
                                  <a
                                    href={src}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: 'inline-block',
                                      marginBottom: '8px',
                                      color: 'var(--wa-brand)',
                                      fontWeight: 600,
                                    }}
                                  >
                                    📎 تحميل المستند
                                  </a>
                                )}
                                {displayBody && (
                                  <div
                                    style={{
                                      fontSize: '14.2px',
                                      lineHeight: 1.5,
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word' as const,
                                      userSelect: 'text',
                                      cursor: 'text',
                                    }}
                                  >
                                    {displayBody}
                                    {isBeingEdited && (
                                      <span style={{marginRight: '6px', fontSize: '10px', color: '#93c5fd', fontStyle:'italic'}}>✏️ يُعدَّل الآن…</span>
                                    )}
                                  </div>
                                )}
                                {c.status === 'failed' && c.errorMessage && (
                                  <div style={{fontSize: '11px', color: '#fca5a5', marginTop: '6px'}}>
                                    {c.errorMessage}
                                  </div>
                                )}
                                <div
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--wa-muted)',
                                    marginTop: '6px',
                                    textAlign: 'left' as const,
                                    direction: 'ltr' as const,
                                    opacity: 0.95,
                                  }}
                                >
                                  {c.sentAt
                                    ? new Date(c.sentAt).toLocaleString('ar-SA', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        day: 'numeric',
                                        month: 'short',
                                      })
                                    : ''}
                                  {out &&
                                    (c.status === 'sent'
                                      ? ' · ✓'
                                      : c.status === 'delivered'
                                        ? ' · ✓✓'
                                        : c.status === 'read'
                                          ? ' · ✓✓'
                                          : '')}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div
                      style={{
                        padding: '12px 14px',
                        borderTop: '1px solid var(--wa-border)',
                        background: 'var(--wa-composer)',
                      }}
                    >
                      {alert && (
                        <div style={{marginBottom: '10px', ...(alert.type === 'ok' ? S.alertOk : S.alertErr)}}>
                          {alert.msg}
                        </div>
                      )}
                      {selectedThreadKey && !creatingNewChat ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCreatingNewChat(true)
                            setSelectedThreadKey(null)
                          }}
                          style={{
                            marginBottom: '10px',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: '1px solid rgba(37,211,102,0.35)',
                            background: 'rgba(37,211,102,0.12)',
                            color: '#16a34a',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 700,
                            fontFamily: "'Segoe UI',Tajawal,sans-serif",
                          }}
                        >
                          ＋ إضافة محادثة جديدة
                        </button>
                      ) : (
                        <>
                          <label style={{...S.label, marginBottom: '6px'}}>ابدأ محادثة جديدة</label>
                          <input
                            ref={newChatPhoneInputRef}
                            style={{...S.input, marginBottom: '6px'}}
                            placeholder="اكتب الرقم فقط: 5XXXXXXXX أو +2010XXXXXXX"
                            value={chatQuickPhone}
                            onChange={(e) => setChatQuickPhone(e.target.value)}
                            dir="ltr"
                          />
                          <div style={{fontSize: '11px', color: 'var(--wa-muted)', marginBottom: '10px'}}>
                            المحلي يتحول تلقائيًا إلى +966.
                          </div>
                        </>
                      )}
                      <label style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px'}}>
                        <input
                          type="checkbox"
                          checked={broadcastMode}
                          onChange={(e) => setBroadcastMode(e.target.checked)}
                        />
                        <span style={{fontSize: '12px', color: 'var(--wa-muted)'}}>
                          إرسال جماعي لكل جهات الاتصال الظاهرة في القائمة
                        </span>
                      </label>
                      <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap' as const, alignItems: 'flex-end'}}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {!selectedChatTpl ? (
                            <select
                              style={{
                                ...S.input,
                                padding: '6px 10px',
                                marginBottom: 0,
                                fontSize: '12px',
                                border: '1px solid rgba(0, 168, 132, 0.35)',
                                background: 'var(--wa-surface-2)',
                                color: 'var(--wa-text)'
                              }}
                              value=""
                              onChange={(e) => {
                                const tid = e.target.value;
                                if (!tid) return;
                                const t = templates.find(x => x._id === tid);
                                if (t) {
                                  setSelectedMetaKey('')
                                  setSelectedChatTpl(t);
                                }
                              }}
                            >
                              <option value="">📋 قوالب المحتوى (Sanity) — نص عادي…</option>
                              {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                            </select>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', background: 'rgba(37,211,102,0.1)' }}>
                              <span style={{ fontSize: '12px', color: '#25d366', fontWeight: 600 }}>
                                ✅ قالب: {selectedChatTpl.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedChatTpl(null)}
                                style={{ background: 'transparent', border: '1px solid #f87171', color: '#f87171', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', padding: '2px 6px' }}
                              >
                                إزالة
                              </button>
                            </div>
                          )}
                          {!selectedMetaKey ? (
                            <select
                              style={{
                                ...S.input,
                                padding: '6px 10px',
                                marginBottom: 0,
                                fontSize: '12px',
                                border: '1px solid rgba(59, 130, 246, 0.45)',
                                background: 'var(--wa-surface-2)',
                                color: 'var(--wa-text)',
                              }}
                              value=""
                              onChange={(e) => {
                                const key = e.target.value
                                if (!key) return
                                setSelectedChatTpl(null)
                                setSelectedMetaKey(key)
                              }}
                            >
                              <option value="">
                                {loadingMetaTpl ? '⏳ جاري تحميل قوالب فيسبوك…' : '📱 قالب واتساب معتمد (Meta / فيسبوك)…'}
                              </option>
                              {metaWaTemplates.map((t) => (
                                <option key={metaTemplateRowKey(t)} value={metaTemplateRowKey(t)}>
                                  {t.name} · {t.language}
                                  {t.category ? ` · ${t.category}` : ''}
                                </option>
                              ))}
                            </select>
                          ) : null}
                          {selectedMetaKey ? (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexWrap: 'wrap' as const,
                                padding: '6px 10px',
                                borderRadius: '8px',
                                background: 'rgba(59,130,246,0.12)',
                              }}
                            >
                              <span style={{fontSize: '12px', color: '#60a5fa', fontWeight: 600}}>
                                ✅ قالب Meta: {selectedMetaTpl?.name} ({selectedMetaTpl?.language})
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedMetaKey('')}
                                style={{
                                  background: 'transparent',
                                  border: '1px solid #f87171',
                                  color: '#f87171',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  cursor: 'pointer',
                                  padding: '2px 6px',
                                }}
                              >
                                إزالة
                              </button>
                            </div>
                          ) : null}
                          {selectedMetaTpl && selectedMetaTpl.bodyVariableCount > 0 ? (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column' as const,
                                gap: '6px',
                                padding: '8px 0 4px',
                              }}
                            >
                              <span style={{fontSize: '11px', color: 'var(--wa-muted)', fontWeight: 600}}>
                                متغيرات القالب بالترتيب (مثل {'{{1}}'}، {'{{2}}'} في مدير فيسبوك)
                              </span>
                              {Array.from({length: selectedMetaTpl.bodyVariableCount}, (_, i) => {
                                let label = `القيمة ${i + 1}`
                                if (selectedMetaTpl.name === 'confirmation') {
                                  if (i === 0) label = 'اسم العميل'
                                  if (i === 1) label = 'الموعد'
                                  if (i === 2) label = 'الخدمة المحجوزة'
                                  if (i === 3) label = 'رقم التأكيد'
                                }
                                return (
                                  <div key={i} style={{marginBottom: '6px'}}>
                                    <label style={{...S.label, fontSize: '10px', marginBottom: '2px'}}>{label}</label>
                                    <input
                                      dir="auto"
                                      style={{...S.input, marginBottom: 0, fontSize: '13px'}}
                                      placeholder={label}
                                      value={metaParamValues[i] ?? ''}
                                      onChange={(e) => {
                                        const v = e.target.value
                                        setMetaParamValues((prev) => {
                                          const next = [...prev]
                                          next[i] = v
                                          return next
                                        })
                                      }}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          ) : null}
                          {selectedMetaTpl && selectedMetaTpl.headerFormat === 'IMAGE' ? (
                            <div style={{padding: '6px 0 2px'}}>
                              <label
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--wa-muted)',
                                  fontWeight: 600,
                                  display: 'block',
                                  marginBottom: '4px',
                                }}
                              >
                                صورة الهيدر (Meta): رابط HTTPS مباشر أو ref من Sanity (يبدأ بـ image-…)
                              </label>
                              <input
                                dir="ltr"
                                style={{...S.input, marginBottom: 0, fontSize: '12px'}}
                                placeholder="https://cdn.sanity.io/... أو image-XXXX-..."
                                value={metaHeaderImageInput}
                                onChange={(e) => setMetaHeaderImageInput(e.target.value)}
                              />
                              <div style={{fontSize: '10px', color: 'var(--wa-muted)', marginTop: '4px'}}>
                                إن تُرك فارغًا يُستخدم شعار العيادة الافتراضي على الخادم.
                              </div>
                            </div>
                          ) : null}
                          {selectedMetaTpl && selectedMetaTpl.bodyText ? (
                            <div
                              style={{
                                fontSize: '11px',
                                color: 'var(--wa-muted)',
                                lineHeight: 1.45,
                                padding: '4px 2px 0',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word' as const,
                              }}
                            >
                              <span style={{fontWeight: 700}}>معاينة: </span>
                              {metaSanityPreviewBody(
                                selectedMetaTpl.name,
                                fillMetaBodyPlaceholders(selectedMetaTpl.bodyText, metaParamValues),
                              )}
                            </div>
                          ) : null}
                        <WhatsAppComposer
                          editingMsgId={editingMsgId}
                          initialValue={editingMsgId ? activeThread.messages.find(m => m._id === editingMsgId)?.messageBody || '' : ''}
                          sending={sending}
                          recording={recording}
                          savingEdit={savingEdit}
                          broadcastMode={broadcastMode}
                          selectedMetaTpl={selectedMetaTpl}
                          onSendText={handleChatSend}
                          onSendMeta={handleChatSendMetaTemplate}
                          onBroadcastText={handleBroadcastText}
                          onSendMedia={handleChatMedia}
                          onBroadcastMedia={handleBroadcastMedia}
                          onStartVoice={startVoiceRecording}
                          onStopVoice={stopAndSendVoiceRecording}
                          onCancelEdit={handleCancelEdit}
                          onSaveEdit={handleSaveEdit}
                          showAlert={showAlert}
                        />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══ WhatsApp Web–inspired tokens (dark / light) ═══ */
const CSS_GLOBAL = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;800&display=swap');
@keyframes spin { to { transform: rotate(360deg); } }

.wa-inbox-root[data-wa-ui="dark"] {
  --wa-page-bg: #0b141a;
  --wa-surface: #111b21;
  --wa-surface-2: #1b2730;
  --wa-elevated: #202c33;
  --wa-border: #2a3942;
  --wa-text: #e9edef;
  --wa-muted: #8696a0;
  --wa-brand: #00a884;
  --wa-header-strip: #008069;
  --wa-chat-header: #202c33;
  --wa-chat-bg: #0b141a;
  --wa-bubble-in: #202c33;
  --wa-bubble-out: #005c4b;
  --wa-bubble-in-text: #e9edef;
  --wa-bubble-out-text: #e9edef;
  --wa-bubble-shadow: 0 1px 0.5px rgba(11,20,26,0.13);
  --wa-stat-bg: #202c33;
  --wa-stat-shadow: 0 1px 2px rgba(0,0,0,0.35);
  --wa-tab-bg: #1a252c;
  --wa-tab-active-bg: #2a3942;
  --wa-tab-active-text: #e9edef;
  --wa-tab-active-shadow: 0 1px 3px rgba(0,0,0,0.28);
  --wa-card-bg: #111b21;
  --wa-card-shadow: 0 2px 10px rgba(0,0,0,0.38);
  --wa-input-bg: #2a3942;
  --wa-input-border: #2a3942;
  --wa-composer: #202c33;
  --wa-thread-hover: rgba(255,255,255,0.05);
  --wa-thread-active: rgba(0,168,132,0.16);
}

.wa-inbox-root[data-wa-ui="light"] {
  --wa-page-bg: #f0f2f5;
  --wa-surface: #ffffff;
  --wa-surface-2: #f7f8fa;
  --wa-elevated: #ffffff;
  --wa-border: #e9edef;
  --wa-text: #111b21;
  --wa-muted: #667781;
  --wa-brand: #008069;
  --wa-header-strip: #008069;
  --wa-chat-header: #f0f2f5;
  --wa-chat-bg: #efeae2;
  --wa-bubble-in: #ffffff;
  --wa-bubble-out: #d9fdd3;
  --wa-bubble-in-text: #111b21;
  --wa-bubble-out-text: #111b21;
  --wa-bubble-shadow: 0 1px 0.5px rgba(11,20,26,0.13);
  --wa-stat-bg: #ffffff;
  --wa-stat-shadow: 0 1px 3px rgba(11,20,26,0.08);
  --wa-tab-bg: #ffffff;
  --wa-tab-active-bg: #f0f2f5;
  --wa-tab-active-text: #008069;
  --wa-tab-active-shadow: 0 1px 2px rgba(11,20,26,0.06);
  --wa-card-bg: #ffffff;
  --wa-card-shadow: 0 1px 3px rgba(11,20,26,0.08);
  --wa-input-bg: #ffffff;
  --wa-input-border: #e9edef;
  --wa-composer: #f0f2f5;
  --wa-thread-hover: #f5f6f6;
  --wa-thread-active: #f0f2f5;
}

.wa-inbox-root {
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.wa-inbox-root input,
.wa-inbox-root textarea {
  background: var(--wa-input-bg) !important;
  color: var(--wa-text) !important;
  border: 1px solid var(--wa-input-border) !important;
}
.wa-inbox-root input::placeholder,
.wa-inbox-root textarea::placeholder {
  color: var(--wa-muted) !important;
}
.wa-inbox-root input:focus,
.wa-inbox-root textarea:focus {
  border-color: var(--wa-brand) !important;
  box-shadow: 0 0 0 2px rgba(0, 168, 132, 0.2) !important;
}
.wa-inbox-root button:hover:not(:disabled) {
  filter: brightness(1.04);
}

.wa-inbox-root ::-webkit-scrollbar { width: 6px; height: 6px; }
.wa-inbox-root ::-webkit-scrollbar-track { background: transparent; }
.wa-inbox-root[data-wa-ui="light"] ::-webkit-scrollbar-thumb {
  background: rgba(17, 27, 33, 0.22);
  border-radius: 4px;
}
.wa-inbox-root[data-wa-ui="dark"] ::-webkit-scrollbar-thumb {
  background: rgba(134, 150, 160, 0.35);
  border-radius: 4px;
}

.wa-msg-scroll {
  background-color: var(--wa-chat-bg);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280'%3E%3Cg fill='%238696a0' fill-opacity='0.055'%3E%3Cpath d='M0 0h70v70H0zm140 140h70v70h-70zM0 140h70v70H0zm140-70h70v70h-70z'/%3E%3C/g%3E%3C/svg%3E");
}
.wa-inbox-root[data-wa-ui="light"] .wa-msg-scroll {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280'%3E%3Cg fill='%23111b21' fill-opacity='0.04'%3E%3Cpath d='M0 0h70v70H0zm140 140h70v70h-70zM0 140h70v70H0zm140-70h70v70h-70z'/%3E%3C/g%3E%3C/svg%3E");
}

.wa-inbox-root .wa-thread-item[data-active="true"] {
  background: var(--wa-thread-active) !important;
}
.wa-inbox-root .wa-thread-item:not([data-active="true"]):hover {
  background: var(--wa-thread-hover) !important;
}

/* Message rows — proper spacing like WhatsApp */
.wa-inbox-root .wa-msg-row { padding: 3px 0; }

/* Bubble: allow text selection, show pointer on hover */
.wa-inbox-root .wa-bubble-wrap {
  user-select: text;
  -webkit-user-select: text;
}
.wa-inbox-root .wa-bubble-wrap:active {
  opacity: 0.82;
}

/* Inputs/textareas: restore native right-click / paste behaviour */
.wa-inbox-root input,
.wa-inbox-root textarea {
  -webkit-user-select: text;
  user-select: text;
}
`

/* ════ WhatsAppComposer (Internal Text State for Performance) ════ */
const WhatsAppComposer = memo(({
  editingMsgId,
  initialValue,
  sending,
  recording,
  savingEdit,
  broadcastMode,
  selectedMetaTpl,
  onSendText,
  onSendMeta,
  onBroadcastText,
  onSendMedia,
  onBroadcastMedia,
  onStartVoice,
  onStopVoice,
  onCancelEdit,
  onSaveEdit,
  showAlert
}: any) => {
  const [text, setText] = useState('')

  // Sync internal text state when entering edit mode or changing thread
  useEffect(() => {
    setText(initialValue || '')
  }, [editingMsgId, initialValue])

  const handleCommit = async () => {
    if (editingMsgId) {
      await onSaveEdit(text)
    } else if (broadcastMode) {
      await onBroadcastText(text)
      setText('')
    } else {
      await onSendText(text)
      setText('')
    }
  }

  const handleMetaCommit = async () => {
    await onSendMeta(text)
    setText('')
  }

  return (
    <div style={{display: 'flex', gap: '12px', padding: '12px 16px', background: 'var(--wa-chat-header)'}}>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column' as const}}>
        {editingMsgId ? (
          <div style={{
            padding: '8px 10px',
            borderRadius: '8px',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.35)',
            marginBottom: '6px',
            fontSize: '11px',
            color: '#60a5fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>✏️ وضع التعديل — ستُعدَّل الرسالة في السجل فقط (لن تُرسَل مجدداً)</span>
            <button
              type="button"
              onClick={onCancelEdit}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f87171',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 700,
                padding: '0 4px',
              }}
            >✕ إلغاء</button>
          </div>
        ) : null}
        <div style={{position: 'relative', flex: 1}}>
          <textarea
            id="wa-composer-textarea"
            style={{
              ...S.textarea,
              width: '100%',
              minHeight: '72px',
              border: editingMsgId ? '1px solid rgba(59,130,246,0.6)' : undefined,
              paddingLeft: '42px',
              boxSizing: 'border-box',
            }}
            placeholder={editingMsgId ? 'عدِّل نص الرسالة هنا…' : 'اكتب ردك هنا…'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onContextMenu={(e) => e.stopPropagation()}
            onPaste={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            title="لصق"
            style={{
              position: 'absolute', left: '8px', bottom: '10px', background: 'transparent',
              border: '1px solid var(--wa-border)', borderRadius: '6px', color: 'var(--wa-muted)',
              fontSize: '14px', cursor: 'pointer', padding: '3px 6px', lineHeight: 1,
            }}
            onClick={async () => {
              try {
                const clipText = await navigator.clipboard.readText()
                setText(prev => prev + clipText)
                document.getElementById('wa-composer-textarea')?.focus()
              } catch {
                showAlert('err', '⚠️ اسمح للمتصفح بالوصول إلى الحافظة')
              }
            }}
          >📋</button>
        </div>
      </div>
      <div style={{display: 'flex', flexDirection: 'column' as const, gap: '8px'}}>
        <label
          style={{
            padding: '10px 14px', background: 'rgba(56,189,248,0.15)',
            border: '1px solid rgba(56,189,248,0.35)', borderRadius: '10px',
            cursor: sending ? 'not-allowed' : 'pointer', fontSize: '12px', textAlign: 'center' as const,
          }}
        >
          📎 ملف
          <input
            type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            style={{display: 'none'}} disabled={sending}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) {
                if (broadcastMode) onBroadcastMedia(f)
                else onSendMedia(f)
              }
              e.target.value = ''
            }}
          />
        </label>
        <button
          type="button"
          style={{
            padding: '10px 14px', borderRadius: '10px', fontSize: '12px',
            background: recording ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.18)',
            border: recording ? '1px solid rgba(239,68,68,0.45)' : '1px solid rgba(245,158,11,0.45)',
            color: recording ? '#f87171' : '#fbbf24',
            cursor: sending ? 'not-allowed' : 'pointer',
          }}
          disabled={sending}
          onClick={() => {
            if (recording) onStopVoice()
            else onStartVoice()
          }}
        >
          {recording ? '⏹️' : '🎙️'}
        </button>
        <button
          type="button"
          style={{
            ...S.sendBtn, marginTop: 0, padding: '12px 18px',
            background: editingMsgId ? 'rgba(59,130,246,0.85)' : undefined,
            opacity: sending || savingEdit ? 0.7 : 1,
            cursor: sending || savingEdit ? 'not-allowed' : 'pointer',
          }}
          disabled={sending || savingEdit}
          onClick={handleCommit}
        >
          {editingMsgId ? (savingEdit ? '⏳' : '💾') : (sending ? '…' : (broadcastMode ? '📣' : '📤'))}
        </button>
        <button
          type="button"
          style={{
            padding: '12px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '12px',
            border: '1px solid rgba(59,130,246,0.45)', background: 'rgba(59,130,246,0.2)',
            color: '#93c5fd',
            opacity: !!editingMsgId || sending || broadcastMode || !selectedMetaTpl ? 0.55 : 1,
            cursor: !!editingMsgId || sending || broadcastMode || !selectedMetaTpl ? 'not-allowed' : 'pointer',
          }}
          disabled={!!editingMsgId || sending || broadcastMode || !selectedMetaTpl}
          onClick={handleMetaCommit}
        >
          📨
        </button>
      </div>
    </div>
  )
})

const S: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    padding: '18px 20px 28px',
    fontFamily: "'Segoe UI','Helvetica Neue',Helvetica,Arial,Tajawal,sans-serif",
    direction: 'rtl',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '18px',
    padding: '16px 22px',
    background: 'var(--wa-header-strip)',
    borderRadius: '8px',
    boxShadow: 'var(--wa-card-shadow)',
    border: '1px solid rgba(0,0,0,0.06)',
  },
  headerIcon: {filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))'},
  headerTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '-0.02em',
  },
  headerSub: {margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.9)'},
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '10px',
    marginBottom: '18px',
  },
  statCard: {
    padding: '14px 10px',
    background: 'var(--wa-stat-bg)',
    border: '1px solid var(--wa-border)',
    borderRadius: '8px',
    textAlign: 'center' as const,
    boxShadow: 'var(--wa-stat-shadow)',
  },
  tabRow: {
    display: 'flex',
    gap: '6px',
    marginBottom: '18px',
    background: 'var(--wa-tab-bg)',
    padding: '6px',
    borderRadius: '10px',
    border: '1px solid var(--wa-border)',
    boxShadow: 'var(--wa-card-shadow)',
  },
  tab: {
    flex: 1,
    padding: '10px 8px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: "'Segoe UI',Tajawal,sans-serif",
    background: 'transparent',
    color: 'var(--wa-muted)',
    transition: 'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
  },
  tabActive: {
    background: 'var(--wa-tab-active-bg)',
    color: 'var(--wa-tab-active-text)',
    boxShadow: 'var(--wa-tab-active-shadow)',
  },
  card: {
    background: 'var(--wa-card-bg)',
    border: '1px solid var(--wa-border)',
    borderRadius: '10px',
    padding: '22px',
    boxShadow: 'var(--wa-card-shadow)',
  },
  grid: {display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '18px', alignItems: 'start'},
  secTitle: {
    margin: '0 0 16px',
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--wa-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    color: 'var(--wa-muted)',
    marginBottom: '6px',
    fontWeight: 600,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: "'Segoe UI',Tajawal,sans-serif",
    direction: 'rtl',
    marginBottom: '12px',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    minHeight: '130px',
    boxSizing: 'border-box',
    fontFamily: "'Segoe UI',Tajawal,sans-serif",
    direction: 'rtl',
    lineHeight: 1.65,
  },
  tplCard: {
    padding: '14px 16px',
    marginBottom: '8px',
    background: 'var(--wa-surface-2)',
    border: '1px solid var(--wa-border)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
  },
  tplCardSel: {
    border: '2px solid var(--wa-brand)',
    background: 'rgba(0, 168, 132, 0.09)',
    boxShadow: '0 0 0 1px rgba(0, 168, 132, 0.22)',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 600,
    background: 'rgba(0, 168, 132, 0.12)',
    color: 'var(--wa-brand)',
    marginBottom: '8px',
  },
  preview: {
    background: 'var(--wa-surface-2)',
    border: '1px solid var(--wa-border)',
    borderRadius: '10px',
    padding: '18px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word' as const,
    overflowWrap: 'break-word' as const,
    unicodeBidi: 'plaintext' as const,
    fontSize: '14px',
    lineHeight: 1.75,
    color: 'var(--wa-text)',
    minHeight: '100px',
    direction: 'rtl',
  },
  sendBtn: {
    width: '100%',
    padding: '14px',
    background: 'var(--wa-brand)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '16px',
    boxShadow: '0 2px 6px rgba(0, 128, 105, 0.35)',
    transition: 'filter 0.15s, transform 0.1s',
    fontFamily: "'Segoe UI',Tajawal,sans-serif",
  },
  alertOk: {
    padding: '12px 16px',
    background: 'rgba(0, 168, 132, 0.1)',
    border: '1px solid rgba(0, 168, 132, 0.35)',
    borderRadius: '8px',
    color: 'var(--wa-brand)',
    marginTop: '12px',
    fontSize: '13px',
    fontWeight: 600,
  },
  alertErr: {
    padding: '12px 16px',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    borderRadius: '8px',
    color: '#e11d48',
    marginTop: '12px',
    fontSize: '13px',
    fontWeight: 600,
  },
  spinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '3px solid rgba(255,255,255,0.35)',
    borderTop: '3px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    marginRight: '8px',
    verticalAlign: 'middle',
  },
  logRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 14px',
    marginBottom: '6px',
    background: 'var(--wa-surface-2)',
    borderRadius: '8px',
    border: '1px solid var(--wa-border)',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: 'var(--wa-muted)',
    fontSize: '14px',
  },
}
