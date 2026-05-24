const fs = require('fs');
const path = require('path');

const filePath = path.join('packages', 'sanity-studio', 'plugins', 'whatsapp-tool', 'WhatsAppTool.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add new states
const stateMarker = `const [broadcastBatchSize, setBroadcastBatchSize] = useState(100)`;
const newStates = `const [broadcastBatchSize, setBroadcastBatchSize] = useState(100)
  const [broadcastSource, setBroadcastSource] = useState<'sanity' | 'excel'>('sanity')
  const [broadcastExcelFile, setBroadcastExcelFile] = useState<File | null>(null)
  const [excelTargets, setExcelTargets] = useState<{name: string, phoneE164: string}[]>([])
  const [excelTotal, setExcelTotal] = useState(0)
  const [parsingExcel, setParsingExcel] = useState(false)

  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setBroadcastExcelFile(f)
    setParsingExcel(true)
    setExcelTargets([])
    setExcelTotal(0)
    try {
      const fd = new FormData()
      fd.append('file', f)
      // Call the new backend parser
      const host = window.location.origin
      const res = await fetch(\`\${host}/api/whatsapp/parse-excel\`, { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) {
        setExcelTargets(data.targets)
        setExcelTotal(data.targets.length)
        showAlert('ok', \`✅ تم قراءة \${data.targets.length} رقم من الملف\`)
      } else {
        showAlert('err', \`❌ فشل القراءة: \${data.error}\`)
      }
    } catch (err) {
      showAlert('err', '❌ حدث خطأ أثناء القراءة')
    } finally {
      setParsingExcel(false)
    }
  }`;
code = code.replace(stateMarker, newStates);

// 2. Modify handleSendBroadcast
const broadcastStart = `const handleSendBroadcast = async () => {`;
const oldBroadcastCode = `    if (!window.confirm(\`سيتم إرسال الرسالة إلى جميع الأرقام المطابقة (batch: \${broadcastBatchSize}). هل أنت متأكد؟\`)) return

    setSendingBroadcast(true)
    let currentCursor = 0
    let sentTotal = 0
    let failTotal = 0
    let totalAll = 0`;

const newBroadcastCode = `    if (broadcastSource === 'excel') {
      if (!excelTargets.length) {
        return showAlert('err', '⚠️ يرجى رفع ملف Excel يحتوي على أرقام أولاً')
      }
      if (!window.confirm(\`سيتم إرسال الرسالة إلى \${excelTargets.length} رقم من الملف مباشرة. هل أنت متأكد؟\`)) return

      setSendingBroadcast(true)
      let currentCursor = 0
      let sentTotal = 0
      let failTotal = 0
      const batchLimit = Math.max(10, Math.min(100, broadcastBatchSize))

      setBroadcastProgress({ sent: 0, failed: 0, total: excelTargets.length, done: false })

      try {
        while (currentCursor < excelTargets.length) {
          const batch = excelTargets.slice(currentCursor, currentCursor + batchLimit)
          const host = window.location.origin
          const res = await fetch(\`\${host}/api/whatsapp/send-excel-batch\`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              targets: batch,
              message: !selectedMetaKey ? msgBody : undefined,
              templateUsed: selectedMetaKey ? undefined : selectedTpl?.name,
              templateParams: finalParams,
              metaTemplate: finalMeta,
            }),
          })
          if (!res.ok) throw new Error('Network error')
          const data = await res.json()
          if (!data.success) throw new Error(data.error || 'Unknown server error')

          sentTotal += data.sent || 0
          failTotal += data.failed || 0
          currentCursor += batchLimit
          
          setBroadcastProgress({
            sent: sentTotal,
            failed: failTotal,
            total: excelTargets.length,
            done: currentCursor >= excelTargets.length
          })
        }
        showAlert('ok', \`✅ انتهى البث المباشر (نجح \${sentTotal}، فشل \${failTotal})\`)
      } catch (err: unknown) {
        const m = err instanceof Error ? err.message : 'فشل'
        showAlert('err', \`❌ توقف البث بسبب خطأ: \${m}\`)
      } finally {
        setSendingBroadcast(false)
        if (currentCursor >= excelTargets.length) {
          setTimeout(() => setBroadcastProgress(null), 3000)
        }
      }
      return
    }

    if (!window.confirm(\`سيتم إرسال الرسالة إلى جميع الأرقام المحفوظة (batch: \${broadcastBatchSize}). هل أنت متأكد؟\`)) return

    setSendingBroadcast(true)
    let currentCursor = 0
    let sentTotal = 0
    let failTotal = 0
    let totalAll = 0`;

code = code.replace(oldBroadcastCode, newBroadcastCode);

// 3. Update the UI block
const uiStart = `            <label style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', userSelect: 'none', padding: '6px 0'}}>
              <input
                type="checkbox"
                checked={sendFromSavedContacts}
                onChange={(e) => setSendFromSavedContacts(e.target.checked)}
              />
              <span style={{fontWeight: 700, color: '#fca5a5'}}>
                إرسال جماعي إلى "جهات الاتصال المحفوظة" (Broadcast)
              </span>
            </label>`;

const uiOldBlock = `            <label style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', userSelect: 'none', padding: '6px 0'}}>
              <input
                type="checkbox"
                checked={sendFromSavedContacts}
                onChange={(e) => setSendFromSavedContacts(e.target.checked)}
              />
              <span style={{fontWeight: 700, color: '#fca5a5'}}>
                إرسال جماعي إلى "جهات الاتصال المحفوظة" (Broadcast)
              </span>
            </label>

            {sendFromSavedContacts && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #fca5a5',
                  padding: '10px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                }}
              >
                <label style={S.label}>تصفية حسب التاج (اختياري)</label>
                <input
                  style={S.input}
                  placeholder="مثال: vip (اتركه فارغاً لإرسال للكل)"
                  value={broadcastTag}
                  onChange={(e) => setBroadcastTag(e.target.value)}
                />
                
                <div style={{fontSize: '10px', color: 'var(--wa-muted)'}}>
                  سيقوم النظام بإرسال الرسالة على دفعات. حدد حجم الدفعة (مثال: 50 أو 100) لتجنب الإيقاف (Timeout).
                </div>
                <input
                  type="number"
                  style={{...S.input, marginTop: '8px', maxWidth: '100px'}}
                  placeholder="حجم الدفعة"
                  value={broadcastBatchSize}
                  onChange={(e) => setBroadcastBatchSize(Number(e.target.value))}
                  min={10}
                  max={100}
                />
              </div>
            )}`;

const uiNewBlock = `            {/* Broadcast Options */}
            <div style={{...S.surface, padding: '12px', marginTop: '16px', border: '1px solid rgba(59, 130, 246, 0.3)'}}>
              <h3 style={{...S.secTitle, fontSize: '13px', color: '#93c5fd', marginBottom: '8px'}}>🚀 إرسال جماعي (Broadcast)</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer'}}>
                  <input type="radio" checked={!sendFromSavedContacts && broadcastSource === 'sanity'} onChange={() => { setSendFromSavedContacts(false); setBroadcastSource('sanity') }} />
                  <span>لا (إرسال لرقم واحد فقط)</span>
                </label>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer'}}>
                  <input type="radio" checked={sendFromSavedContacts && broadcastSource === 'sanity'} onChange={() => { setSendFromSavedContacts(true); setBroadcastSource('sanity') }} />
                  <span style={{color: '#fca5a5'}}>جهات الاتصال المحفوظة في قاعدة البيانات (Sanity)</span>
                </label>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer'}}>
                  <input type="radio" checked={broadcastSource === 'excel'} onChange={() => { setSendFromSavedContacts(false); setBroadcastSource('excel') }} />
                  <span style={{color: '#86efac'}}>ملف Excel (مباشر ومؤقت بدون حفظ)</span>
                </label>
              </div>

              {broadcastSource === 'excel' && (
                <div style={{marginTop: '12px', padding: '10px', background: 'var(--wa-bg)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)'}}>
                  <label style={{...S.label, fontSize: '11px'}}>اختر ملف Excel (.xls / .xlsx)</label>
                  <input type="file" accept=".xls,.xlsx" onChange={handleExcelFileChange} style={{...S.input, marginBottom: 0, padding: '4px'}} />
                  {parsingExcel && <div style={{fontSize: '11px', color: '#60a5fa', marginTop: '4px'}}>⏳ جاري قراءة الملف...</div>}
                  {!parsingExcel && excelTotal > 0 && <div style={{fontSize: '11px', color: '#4ade80', marginTop: '4px'}}>✅ تم تحميل {excelTotal} رقم جاهز للإرسال.</div>}
                  <div style={{fontSize: '10px', color: 'var(--wa-muted)', marginTop: '4px'}}>
                    سيتم الإرسال لجميع الأرقام الموجودة في الملف مباشرة دون حفظها في قاعدة البيانات لحفظ المساحة. يجب أن يحتوي الملف على عمود للرقم.
                  </div>
                  <div style={{fontSize: '10px', color: 'var(--wa-muted)', marginTop: '8px'}}>
                    حجم الدفعة في الإرسال:
                  </div>
                  <input
                    type="number"
                    style={{...S.input, marginTop: '4px', maxWidth: '80px', padding: '4px 8px'}}
                    value={broadcastBatchSize}
                    onChange={(e) => setBroadcastBatchSize(Number(e.target.value))}
                    min={10}
                    max={100}
                  />
                </div>
              )}

              {sendFromSavedContacts && broadcastSource === 'sanity' && (
                <div style={{marginTop: '12px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid #fca5a5'}}>
                  <label style={S.label}>تصفية حسب التاج (اختياري)</label>
                  <input
                    style={S.input}
                    placeholder="مثال: vip (اتركه فارغاً لإرسال للكل)"
                    value={broadcastTag}
                    onChange={(e) => setBroadcastTag(e.target.value)}
                  />
                  <div style={{fontSize: '10px', color: 'var(--wa-muted)'}}>
                    حجم الدفعة في الإرسال:
                  </div>
                  <input
                    type="number"
                    style={{...S.input, marginTop: '8px', maxWidth: '80px', padding: '4px 8px'}}
                    value={broadcastBatchSize}
                    onChange={(e) => setBroadcastBatchSize(Number(e.target.value))}
                    min={10}
                    max={100}
                  />
                </div>
              )}
            </div>`;

code = code.replace(uiOldBlock, uiNewBlock);

// 4. Update the "single target phone" input to be hidden or disabled when broadcasting from Excel
const targetPhoneOld = `<label style={S.label}>رقم الواتساب المستهدف</label>
            <input
              dir="ltr"
              style={S.input}
              placeholder="+966xxxxxxxxx"
              value={sendPhone}
              onChange={(e) => setSendPhone(e.target.value)}
              disabled={sendFromSavedContacts}
            />`;

const targetPhoneNew = `<label style={S.label}>رقم الواتساب المستهدف</label>
            <input
              dir="ltr"
              style={S.input}
              placeholder="+966xxxxxxxxx"
              value={sendPhone}
              onChange={(e) => setSendPhone(e.target.value)}
              disabled={sendFromSavedContacts || broadcastSource === 'excel'}
            />`;

code = code.replace(targetPhoneOld, targetPhoneNew);

fs.writeFileSync(filePath, code);
console.log("Patch applied successfully.");
