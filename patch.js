const fs = require('fs');
const path = require('path');

const filePath = path.join('packages', 'sanity-studio', 'plugins', 'whatsapp-tool', 'WhatsAppTool.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Define renderMetaTemplateSelector
const renderFunc = `  const renderMetaTemplateSelector = () => (
    <>
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
            setSelectedTpl(null)
            setSelectedMetaKey(key)
          }}
        >
          <option value="">
            {loadingMetaTpl ? '⏳ جاري تحميل قوالب فيسبوك…' : '📱 قالب واتساب معتمد (Meta / فيسبوك)…'}
          </option>
          {metaWaTemplates.map((t) => (
            <option key={metaTemplateRowKey(t)} value={metaTemplateRowKey(t)}>
              {t.name} · {t.language}
              {t.category ? \` · \${t.category}\` : ''}
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
            marginTop: '8px',
            marginBottom: '8px',
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
      {selectedMetaTpl &&
      selectedMetaTpl.headerFormat === 'TEXT' &&
      (selectedMetaTpl.headerVariableCount ?? 0) > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '6px',
            padding: '8px 0 4px',
            maxHeight: '120px',
            overflowY: 'auto' as const,
            paddingLeft: '2px',
          }}
        >
          <span style={{fontSize: '11px', color: 'var(--wa-muted)', fontWeight: 600}}>
            عنوان القالب (هيدر نصي) — {selectedMetaTpl.headerVariableCount} متغير
            {' '}مطلوب من Meta وإلا يظهر خطأ (#100).
          </span>
          {Array.from({length: selectedMetaTpl.headerVariableCount ?? 0}, (_, i) => (
            <div key={\`h-\${i}\`} style={{marginBottom: '6px'}}>
              <label style={{...S.label, fontSize: '10px', marginBottom: '2px'}}>
                نص الهيدر {'{{'}
                {i + 1}
                {'}}'}
              </label>
              <input
                dir="auto"
                style={{...S.input, marginBottom: 0, fontSize: '13px'}}
                placeholder={\`الهيدر \${i + 1}\`}
                value={metaHeaderTextValues[i] ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  setMetaHeaderTextValues((prev) => {
                    const next = [...prev]
                    next[i] = v
                    return next
                  })
                }}
              />
            </div>
          ))}
        </div>
      ) : null}
      {selectedMetaTpl && selectedMetaTpl.bodyVariableCount > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '6px',
            padding: '8px 0 4px',
            maxHeight: '140px',
            overflowY: 'auto' as const,
            paddingLeft: '2px',
          }}
        >
          <span style={{fontSize: '11px', color: 'var(--wa-muted)', fontWeight: 600}}>
            متغيرات القالب بالترتيب (مثل {'{{1}}'}، {'{{2}}'} في مدير فيسبوك)
          </span>
          <span style={{fontSize: '10px', color: 'var(--wa-muted)'}}>
            الاسم: {selectedMetaTpl.name} · عدد المتغيرات: {selectedMetaTpl.bodyVariableCount}
          </span>
          {Array.from({length: selectedMetaTpl.bodyVariableCount}, (_, i) => {
            const hint = selectedMetaParamHints[i]
            const label = hint?.label || \`القيمة \${i + 1}\`
            return (
              <div key={i} style={{marginBottom: '6px'}}>
                <label style={{...S.label, fontSize: '10px', marginBottom: '2px'}}>{label}</label>
                <input
                  dir="auto"
                  style={{...S.input, marginBottom: 0, fontSize: '13px'}}
                  placeholder={hint?.placeholder || label}
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
            maxHeight: '88px',
            overflowY: 'auto' as const,
            marginBottom: '12px',
          }}
        >
          <span style={{fontWeight: 700}}>معاينة: </span>
          {metaSanityPreviewBody(
            selectedMetaTpl.name,
            fillMetaBodyPlaceholders(selectedMetaTpl.bodyText, metaParamValues),
          )}
        </div>
      ) : null}
    </>
  )

  const effectiveActiveThread = activeThread || draftThread`;

code = code.replace("  const effectiveActiveThread = activeThread || draftThread", renderFunc);

// 2. Insert into Compose Panel (Send tab)
const sendPanelTarget = `            {!selectedTpl && (
              <>
                <label style={S.label}>أو اكتب رسالة مخصصة</label>
                <textarea
                  style={S.textarea}
                  placeholder="اكتب رسالتك هنا..."`;

const sendPanelReplacement = `            {renderMetaTemplateSelector()}

            {!selectedTpl && !selectedMetaKey && (
              <>
                <label style={S.label}>أو اكتب رسالة مخصصة</label>
                <textarea
                  style={S.textarea}
                  placeholder="اكتب رسالتك هنا..."`;

code = code.replace(sendPanelTarget, sendPanelReplacement);

// 3. Replace in Chats tab
// We need to replace the large select block. We'll find its start and end.
const chatsStartStr = `                          {!selectedMetaKey ? (
                            <select
                              style={{
                                ...S.input,
                                padding: '6px 10px',`;

const chatsEndStr = `                          {selectedMetaTpl && selectedMetaTpl.bodyText ? (
                            <div
                              style={{
                                fontSize: '11px',
                                color: 'var(--wa-muted)',
                                lineHeight: 1.45,
                                padding: '4px 2px 0',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word' as const,
                                maxHeight: '88px',
                                overflowY: 'auto' as const,
                              }}
                            >
                              <span style={{fontWeight: 700}}>معاينة: </span>
                              {metaSanityPreviewBody(
                                selectedMetaTpl.name,
                                fillMetaBodyPlaceholders(selectedMetaTpl.bodyText, metaParamValues),
                              )}
                            </div>
                          ) : null}`;

const startIndex = code.indexOf(chatsStartStr);
const endIndex = code.indexOf(chatsEndStr);

if (startIndex > -1 && endIndex > -1) {
  const toReplace = code.substring(startIndex, endIndex + chatsEndStr.length);
  code = code.replace(toReplace, '                          {renderMetaTemplateSelector()}');
} else {
  console.log("Could not find chats tab template selector block");
  process.exit(1);
}

fs.writeFileSync(filePath, code);
console.log("Successfully patched WhatsAppTool.tsx");
