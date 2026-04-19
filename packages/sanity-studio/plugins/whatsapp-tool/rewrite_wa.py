import os

filepath = r"c:\Users\user\OneDrive\Desktop\new eiat\eiat-master\packages\sanity-studio\plugins\whatsapp-tool\WhatsAppTool.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('  return (')
if idx == -1:
    print("Could not find '  return ('")
    exit(1)

pre_text = text[:idx]

NEW_UI = """  return (
    <div className="wa-app-wrapper" data-theme={theme}>
      <style>{CSS_GLOBAL + (theme === 'light' ? CSS_LIGHT : '')}</style>

      {/* Modern Dashboard Header */}
      <div style={S.header}>
        <div style={S.headerIcon}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </div>
        <div style={{flex: 1}}>
          <h1 style={S.headerTitle}>واتساب إيات Pro</h1>
          <p style={S.headerSub}>واجهة التواصل السريع وإدارة العملاء</p>
        </div>
        <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
          <div style={{textAlign: 'left' as const}}>
            <div style={{fontSize: '11px', color: 'var(--wa-text-muted)'}}>رقم الأعمال</div>
            <div style={{fontSize: '14px', fontWeight: 600, color: 'var(--wa-text)', direction: 'ltr' as const}}>+966 12 615 0299</div>
          </div>
          <button
            type="button"
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            style={S.themeBtn}
          >
            {isLight ? '🌙 داكن' : '☀️ فاتح'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabRow}>
        {(['chats', 'send', 'dashboard'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{...S.tab, ...(tab === t ? S.tabActive : {})}}
          >
            {t === 'chats' && `💬 المحادثات (${threads.length})`}
            {t === 'send' && '📤 إرسال وبث'}
            {t === 'dashboard' && '📊 الإحصائيات'}
          </button>
        ))}
      </div>

      <div style={S.mainContentWrapper}>
        {/* ═══ CHATS TAB (WA Web Clone) ═══ */}
        {tab === 'chats' && (
          <div style={S.waApp}>
            {/* Sidebar (Right Pane) */}
            <div style={S.waSidebar}>
              <div style={S.waSidebarHeader}>
                <div style={{fontWeight: 700, fontSize: '15px'}}>المحادثات</div>
                <div style={{display: 'flex', gap: '8px'}}>
                  <button style={S.waIconButton} onClick={() => setLogTableMode(!logTableMode)} title={logTableMode ? 'عرض الشات' : 'عرض السجل كجدول'}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"></path></svg>
                  </button>
                  <button style={S.waIconButton} onClick={fetchConversations} title="تحديث">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 20.664a9.163 9.163 0 0 1-6.521-2.702.977.977 0 0 1 1.381-1.381 7.269 7.269 0 0 0 10.024.244.977.977 0 0 1 1.313 1.445A9.192 9.192 0 0 1 12 20.664zm7.965-6.112a.977.977 0 0 1-.944-1.229 7.26 7.26 0 0 0-4.8-8.804L13.921 7.2a.977.977 0 0 1-1.847-.646l1.286-3.68a.977.977 0 0 1 1.258-.621l3.68 1.286a.977.977 0 0 1-.646 1.847l-1.638-.573a9.183 9.183 0 0 1 4.884 10.519.977.977 0 0 1-.933.22z"></path></svg>
                  </button>
                </div>
              </div>

              <div style={S.waSearchArea}>
                <div style={S.waSearchBox}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="var(--wa-text-muted)"><path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"></path></svg>
                  <input
                    style={S.waSearchInput}
                    placeholder="ابحث أو ابدأ محادثة جديدة"
                    value={searchLog}
                    onChange={(e) => setSearchLog(e.target.value)}
                  />
                </div>
              </div>

              <div style={S.waChatList}>
                {loadingLog ? (
                  <div style={{padding: '20px', textAlign: 'center', color: 'var(--wa-text-muted)'}}>جاري التحميل...</div>
                ) : logTableMode ? (
                  <div style={{padding: '20px', textAlign: 'center', color: 'var(--wa-text-muted)'}}>
                    الوضع الجدولي مفعل. الشات معروض بالكامل على اليسار كجدول السجل.
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div style={{padding: '40px 20px', textAlign: 'center', color: 'var(--wa-text-muted)'}}>
                    <div style={{fontSize: '32px', marginBottom: '10px'}}>📭</div>
                    لا توجد محادثات.
                  </div>
                ) : (
                  filteredThreads.map((th) => {
                    const unread = countIncomingUnread(th)
                    const lastMsg = th.messages[th.messages.length - 1]
                    const isActive = selectedThreadKey === th.key
                    const time = lastMsg?.sentAt ? new Date(lastMsg.sentAt).toLocaleString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : ''
                    return (
                      <button
                        key={th.key}
                        onClick={() => { setSelectedThreadKey(th.key); setChatQuickPhone(''); }}
                        style={{...S.waChatListItem, ...(isActive ? S.waChatListItemActive : {})}}
                      >
                        <div style={S.waAvatar}>
                          <svg viewBox="0 0 24 24" width="30" height="30" fill="var(--wa-bg-panel)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path></svg>
                        </div>
                        <div style={{flex: 1, minWidth: 0, borderBottom: isActive ? 'none' : '1px solid var(--wa-border)', paddingBottom: '12px', paddingTop: '12px', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div style={{fontWeight: unread ? 600 : 500, fontSize: '15px', color: 'var(--wa-text)'}}>{th.displayName}</div>
                            <div style={{fontSize: '12px', color: unread ? 'var(--wa-primary)' : 'var(--wa-text-muted)'}}>{time}</div>
                          </div>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div style={{fontSize: '13px', color: 'var(--wa-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: lastMsg?.messageBody?.match(/^[A-Za-z]/)? 'ltr' : 'rtl', textAlign: lastMsg?.messageBody?.match(/^[A-Za-z]/)? 'left': 'right', flex: 1}}>
                              {lastMsg?.direction === 'outgoing' && (
                                <span style={{display: 'inline-block', marginLeft: '4px', color: lastMsg.status === 'read' ? '#53bdeb' : 'var(--wa-text-muted)', fontSize: '11px', verticalAlign: 'middle'}}>
                                  {lastMsg.status === 'sent' ? '✓' : lastMsg.status === 'delivered' ? '✓✓' : lastMsg.status === 'read' ? '✓✓' : '×'}
                                </span>
                              )}
                              {lastMsg?.messageBody || '📎 رسالة وسائط'}
                            </div>
                            {unread > 0 && (
                              <div style={S.waUnreadBadge}>{unread > 99 ? '99+' : unread}</div>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Main Chat Area (Left Pane) */}
            <div style={S.waMainArea}>
              {logTableMode ? (
                // 📋 Table Mode View
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--wa-bg-panel)'}}>
                  <div style={{padding: '16px', borderBottom: '1px solid var(--wa-border)'}}>
                     <h3 style={{margin: 0, color: 'var(--wa-text)'}}>سجل المحادثات كجدول</h3>
                  </div>
                  <div style={{flex: 1, overflowY: 'auto', padding: '16px'}}>
                    <div style={{display: 'flex', gap: '8px', marginBottom: '16px'}}>
                      {(['all', 'outgoing', 'incoming'] as const).map((f) => (
                        <button key={f} onClick={() => setLogFilter(f)} style={{...S.chip, ...(logFilter === f ? S.chipActive : {})}}>
                          {f === 'all' ? 'الكل' : f === 'outgoing' ? '📤 صادرة' : '📥 واردة'}
                        </button>
                      ))}
                    </div>
                    {filteredLog.length === 0 ? (
                      <div style={{color: 'var(--wa-text-muted)', textAlign: 'center', marginTop: '40px'}}>لا توجد رسائل مطابقة.</div>
                    ) : (
                      <div style={{background: 'var(--wa-bg-default)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--wa-border)'}}>
                        {filteredLog.map(c => (
                          <div key={c._id} style={{display: 'flex', padding: '12px', borderBottom: '1px solid var(--wa-border)', gap: '16px', alignItems: 'center', fontSize: '13px'}}>
                            <div style={{fontSize: '18px'}}>{c.direction === 'incoming' ? '📥' : '📤'}</div>
                            <div style={{flex: '1.2'}}><div style={{fontWeight: 600}}>{c.patientName || 'بدون اسم'}</div><div style={{fontSize: '11px', color: 'var(--wa-text-muted)', direction: 'ltr'}}>{c.phoneNumber}</div></div>
                            <div style={{flex: '2', color: 'var(--wa-text-muted)'}}>{c.messageBody?.substring(0,60)}</div>
                            <div style={{flex: '0.8', fontSize: '11px'}}>{c.templateUsed}</div>
                            <div style={{flex: '0.8', color: c.status === 'failed' ? '#ef4444' : 'var(--wa-primary)'}}>
                              {c.status === 'sent' ? '✅ مرسلة' : c.status === 'delivered' ? '📬 وصلت' : c.status === 'read' ? '👁️ مقروءة' : '❌ فشل'}
                            </div>
                            <div style={{flex: '1', fontSize: '11px', color: 'var(--wa-text-muted)'}}>{c.sentAt ? new Date(c.sentAt).toLocaleString('ar-SA') : '—'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : !activeThread ? (
                // 📭 Empty State View
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--wa-bg-panel)', borderBottom: '6px solid var(--wa-primary)'}}>
                  <div style={{background: 'var(--wa-bg-default)', width: '320px', height: '320px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px'}}>
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="var(--wa-border)"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"></path></svg>
                  </div>
                  <h2 style={{fontSize: '32px', fontWeight: 300, color: 'var(--wa-text)', marginBottom: '16px'}}>واتساب إيات للتواصل</h2>
                  <p style={{color: 'var(--wa-text-muted)', fontSize: '14px', maxWidth: '400px', textAlign: 'center', lineHeight: '1.6'}}>اختر محادثة من القائمة لعرض الرسائل أو ابدأ محادثة جديدة بكتابة رقم في القائمة.</p>
                </div>
              ) : (
                // 💬 Active Chat View
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', position: 'relative'}}>
                  
                  {/* Active Chat Header */}
                  <div style={S.waChatHeader}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <div style={S.waAvatar}><svg viewBox="0 0 24 24" width="24" height="24" fill="var(--wa-bg-panel)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path></svg></div>
                      <div style={{display: 'flex', flexDirection: 'column'}}>
                        <input
                          value={chatNameDraft}
                          onChange={(e) => setChatNameDraft(e.target.value)}
                          style={S.waContactNameInput}
                        />
                        <div style={{fontSize: '12px', color: 'var(--wa-text-muted)', direction: 'ltr', textAlign: 'right'}}>{activeThread.sendPhone}</div>
                      </div>
                    </div>
                    <div>
                      {chatNameDraft !== activeThread.displayName && (
                        <button style={S.waSaveNameBtn} onClick={() => void handleSaveChatName()} disabled={savingChatName}>
                          {savingChatName ? '...' : 'حفظ الاسم'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chat Messages Area */}
                  <div className="wa-chat-bg" ref={chatScrollRef} style={S.waChatScroll}>
                    {activeThread.messages.map((c, i) => {
                      const out = c.direction === 'outgoing'
                      const kind = c.messageKind || 'text'
                      const src = c.waMediaId ? mediaSrc(c.waMediaId) : ''
                      return (
                        <div key={c._id} style={{display: 'flex', justifyContent: out ? 'flex-start' : 'flex-end', marginBottom: '6px', position: 'relative'}}>
                          <div style={{...S.waBubble, background: out ? 'var(--wa-bubble-out)' : 'var(--wa-bubble-in)', borderTopLeftRadius: out ? '8px' : '0', borderTopRightRadius: out ? '0' : '8px'}}>
                            
                            {/* Tails (Triangles) */}
                            {i === 0 || activeThread.messages[i-1].direction !== c.direction ? (
                              <svg viewBox="0 0 8 13" width="8" height="13" style={{position: 'absolute', top: 0, [out ? 'right' : 'left']: '-8px', transform: out ? 'scaleX(-1)' : 'none'}}>
                                <path opacity=".13" fill="#0000000" d="M1.533 3.118L8 12.114V1H2.812C1.042 1 .474 2.156 1.533 3.118z"></path>
                                <path fill="currentColor" d="M1.533 2.118L8 11.114V0H2.812C1.042 0 .474 1.156 1.533 2.118z"></path>
                              </svg>
                            ) : null}

                            {/* Media Content */}
                            {c.waMediaId && kind === 'image' && <img src={src} alt="" style={S.waMediaImage} />}
                            {c.waMediaId && kind === 'video' && <video src={src} controls style={S.waMediaImage} />}
                            {c.waMediaId && kind === 'audio' && <audio src={src} controls style={{width: '240px', marginBottom: '8px'}} />}
                            {c.waMediaId && kind === 'document' && <a href={src} target="_blank" rel="noreferrer" style={{color: 'var(--wa-primary)', fontWeight: 600, textDecoration: 'none', display: 'block', padding: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', marginBottom:'4px'}}>📎 تحميل المستند</a>}
                            
                            {/* Text Content */}
                            {c.messageBody && (
                              <div style={{fontSize: '14px', lineHeight: 1.5, color: 'var(--wa-bubble-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                                {c.messageBody}
                              </div>
                            )}

                            {c.status === 'failed' && c.errorMessage && (
                              <div style={{fontSize: '11px', color: '#ef4444', marginTop: '4px'}}>
                                {c.errorMessage}
                              </div>
                            )}

                            {/* Meta row (Time + Ticks) */}
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px', float: 'right', marginLeft: '12px'}}>
                              <span style={{fontSize: '10px', color: 'var(--wa-text-muted)'}}>
                                {c.sentAt ? new Date(c.sentAt).toLocaleString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                              {out && (
                                <span style={{color: c.status === 'read' ? '#53bdeb' : 'var(--wa-text-muted)', fontSize: '12px', lineHeight: 1}}>
                                  {c.status === 'sent' ? '✓' : c.status === 'delivered' ? '✓✓' : c.status === 'read' ? '✓✓' : '✗'}
                                </span>
                              )}
                            </div>
                            <div style={{clear:'both'}}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Chat Input Footer */}
                  <div style={S.waChatFooter}>
                     <div style={{display: 'flex', alignItems: 'center', gap: '8px', flex: 1}}>
                       {/* Attach Button */}
                       <label style={{...S.waIconButton, cursor: 'pointer', padding: '8px'}} title="إرفاق ملف">
                         <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--wa-text-muted)"><path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 0 1-2.829 1.171 3.975 3.975 0 0 1-2.83-1.173 3.973 3.973 0 0 1-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.572.572 0 0 0-.834.018l-7.205 7.207a5.577 5.577 0 0 0-1.645 3.971z"></path></svg>
                         <input
                           type="file"
                           accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                           style={{display: 'none'}}
                           disabled={sending}
                           onChange={(e) => {
                             const f = e.target.files?.[0]
                             if (f) handleChatMedia(f)
                             e.target.value = ''
                           }}
                         />
                       </label>
                       
                       {/* Textarea */}
                       <div style={{flex: 1, background: 'var(--wa-bg-default)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center'}}>
                         <textarea
                           style={{width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'var(--wa-text)', resize: 'none', fontFamily: 'inherit', fontSize: '15px'}}
                           placeholder="اكتب رسالة..."
                           rows={1}
                           value={chatQuickMsg}
                           onChange={(e) => {
                             setChatQuickMsg(e.target.value);
                             e.target.style.height = 'auto';
                             e.target.style.height = (e.target.scrollHeight) + 'px';
                           }}
                         />
                       </div>

                       {/* Mic / Send */}
                       {chatQuickMsg.trim() ? (
                         <button style={S.waIconButton} onClick={() => handleChatSend()} disabled={sending} title="إرسال">
                           <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--wa-primary)"><path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path></svg>
                         </button>
                       ) : (
                         <button style={{...S.waIconButton, background: recording ? '#ef4444' : 'transparent', color: recording ? '#fff' : 'inherit', borderRadius: '50%'}} onClick={() => recording ? stopAndSendVoiceRecording() : startVoiceRecording()} disabled={sending} title="تسجيل صوتي">
                           <svg viewBox="0 0 24 24" width="24" height="24" fill={recording ? "#fff" : "var(--wa-text-muted)"}><path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2.002z"></path></svg>
                         </button>
                       )}
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ SEND TAB ═══ */}
        {tab === 'send' && (
          <div style={{display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap'}}>
            <div style={S.dashboardCardContainer}>
              <h2 style={S.dashboardCardTitle}>📋 القوالب الجاهزة</h2>
              <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px'}}>
                {['all', 'offer', 'package', 'appointment', 'followup', 'custom'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCat(cat)}
                    style={{...S.chip, ...(filterCat === cat ? S.chipActive : {})}}
                  >
                    {cat === 'all' ? '🔍 الكل' : catLabels[cat]}
                  </button>
                ))}
              </div>
              <div style={{maxHeight: '460px', overflowY: 'auto'}}>
                {filteredTpls.map((t) => (
                  <div
                    key={t._id}
                    style={{...S.tplCard, ...(selectedTpl?._id === t._id ? S.tplCardSel : {})}}
                    onClick={() => { setSelectedTpl(selectedTpl?._id === t._id ? null : t); setCustomMsg(''); }}
                  >
                    <div style={S.chipActive}>{catLabels[t.category] || t.category}</div>
                    <div style={{fontWeight: 600, fontSize: '15px', color: 'var(--wa-text)', marginTop: '8px'}}>{t.name}</div>
                    <div style={{fontSize: '13px', color: 'var(--wa-text-muted)', marginTop: '4px'}}>{t.messageBody?.substring(0, 80)}...</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={S.dashboardCardContainer}>
              <h2 style={S.dashboardCardTitle}>✉️ إعداد الرسالة للإرسال</h2>
              <label style={S.formLabel}>اسم المريض (اختياري)</label>
              <input style={S.formInput} placeholder="مثال: أحمد محمد" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
              
              <label style={S.formLabel}>رقم الواتساب *</label>
              <input style={S.formInput} placeholder="مثال: +966501234567" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" disabled={sendBroadcastMode} />
              
              <label style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--wa-text)'}}>
                <input type="checkbox" checked={sendBroadcastMode} onChange={(e) => setSendBroadcastMode(e.target.checked)} />
                <span style={{fontSize: '13px'}}>إرسال جماعي (بث / Broadcast) من القائمة</span>
              </label>

              {sendBroadcastMode && (
                <div style={{marginBottom: '16px', padding: '12px', background: 'var(--wa-bg-panel)', borderRadius: '8px', border: '1px solid var(--wa-border)'}}>
                  <label style={S.formLabel}>أرقام إضافية للارسال (اسم|رقم)</label>
                  <textarea style={{...S.formInput, minHeight: '80px'}} value={sendBroadcastNumbersRaw} onChange={e => setSendBroadcastNumbersRaw(e.target.value)} />
                  <div style={{fontSize: '11px', color: 'var(--wa-text-muted)'}}>يمكنك كتابة رقم في كل سطر. وسيتم دمجهم مع الأشخاص في سجل المحادثات.</div>
                </div>
              )}

              {selectedTpl ? (
                <div style={{padding: '12px', background: 'var(--wa-bg-panel)', borderRadius: '8px', border: '1px solid var(--wa-border)', marginBottom: '16px'}}>
                  <div style={{color: 'var(--wa-primary)', fontWeight: 600, fontSize: '13px'}}>✅ القالب المختار: {selectedTpl.name}</div>
                </div>
              ) : (
                <>
                  <label style={S.formLabel}>رسالة مخصصة</label>
                  <textarea style={{...S.formInput, minHeight: '100px'}} placeholder="اكتب رسالتك..." value={customMsg} onChange={e => setCustomMsg(e.target.value)} />
                </>
              )}

              {(selectedTpl || customMsg) && (
                <div style={{marginBottom: '20px'}}>
                  <div style={{fontSize: '13px', color: 'var(--wa-text)', marginBottom: '8px', fontWeight: 600}}>👁️ معاينة الرسالة</div>
                  <div style={{padding: '12px', background: 'var(--wa-bubble-out)', borderRadius: '8px', color: 'var(--wa-bubble-text)', whiteSpace: 'pre-wrap', border: '1px solid var(--wa-primary)'}}>
                    {preview()}
                  </div>
                </div>
              )}

              {alert && <div style={{padding: '12px', borderRadius: '8px', marginBottom: '16px', background: alert.type === 'ok' ? '#dcfce7' : '#fee2e2', color: alert.type === 'ok' ? '#166534' : '#991b1b', border: `1px solid ${alert.type === 'ok' ? '#86efac' : '#fca5a5'}`}}>{alert.msg}</div>}

              <button style={S.primaryBtn} onClick={handleSend} disabled={sending}>
                {sending ? 'جاري الإرسال...' : '📤 إرسال الآن'}
              </button>
            </div>
          </div>
        )}

        {/* ═══ DASHBOARD TAB ═══ */}
        {tab === 'dashboard' && (
          <div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '32px'}}>
              {[
                {label: 'إجمالي المحادثات', val: stats.total, color: 'var(--wa-text)'},
                {label: 'صادرة 📤', val: stats.totalOut, color: 'var(--wa-text)'},
                {label: 'واردة 📥', val: stats.totalIn, color: 'var(--wa-text)'},
                {label: 'ناجحة ✅', val: stats.sent, color: 'var(--wa-primary)'},
                {label: 'فاشلة ❌', val: stats.failed, color: '#ef4444'},
                {label: 'اليوم 📅', val: stats.today, color: '#f59e0b'},
              ].map((s, i) => (
                <div key={i} style={{background: 'var(--wa-bg-default)', padding: '20px', borderRadius: '12px', border: '1px solid var(--wa-border)', textAlign: 'center'}}>
                  <div style={{fontSize: '32px', fontWeight: 800, color: s.color}}>{s.val}</div>
                  <div style={{fontSize: '13px', color: 'var(--wa-text-muted)', marginTop: '8px', fontWeight: 600}}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={S.dashboardCardContainer}>
              <h2 style={S.dashboardCardTitle}>آخر النشاطات</h2>
              <div style={{display: 'table', width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
                <div style={{display: 'table-row', borderBottom: '2px solid var(--wa-border)', fontWeight: 600, color: 'var(--wa-text-muted)'}}>
                  <div style={{display: 'table-cell', padding: '12px'}}>النوع</div>
                  <div style={{display: 'table-cell', padding: '12px'}}>المريض / الرقم</div>
                  <div style={{display: 'table-cell', padding: '12px'}}>مقتطف</div>
                  <div style={{display: 'table-cell', padding: '12px'}}>الحالة</div>
                </div>
                {conversations.slice(0, 15).map(c => (
                  <div key={c._id} style={{display: 'table-row', borderBottom: '1px solid var(--wa-border)', color: 'var(--wa-text)'}}>
                    <div style={{display: 'table-cell', padding: '12px', fontSize: '18px'}}>{c.direction === 'incoming' ? '📥' : '📤'}</div>
                    <div style={{display: 'table-cell', padding: '12px'}}><div style={{fontWeight: 600}}>{c.patientName || 'بدون اسم'}</div><div style={{fontSize: '11px', color: 'var(--wa-text-muted)'}}>{c.phoneNumber}</div></div>
                    <div style={{display: 'table-cell', padding: '12px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--wa-text-muted)'}}>{c.messageBody?.substring(0, 60)}</div>
                    <div style={{display: 'table-cell', padding: '12px'}}>
                      <span style={{padding: '4px 8px', borderRadius: '4px', fontSize: '11px', background: c.status === 'failed' ? '#fee2e2' : '#dcfce7', color: c.status === 'failed' ? '#991b1b' : '#166534', fontWeight: 600}}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══ Styles (WhatsApp Web Native Theme Engine) ═══ */
const CSS_GLOBAL = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;800&display=swap');
@keyframes spin { to { transform: rotate(360deg); } }

:root {
  /* Dark Mode Tokens (Default) */
  --wa-bg-chat: #0b141a;
  --wa-bg-panel: #111b21;
  --wa-bg-default: #202c33;
  --wa-border: rgba(134,150,160,0.15);
  --wa-primary: #00a884;
  --wa-text: #e9edef;
  --wa-text-muted: #8696a0;
  --wa-bubble-in: #202c33;
  --wa-bubble-out: #005c4b;
  --wa-bubble-text: #e9edef;
  --wa-hover: #202c33;
}

[data-theme='light'] {
  /* Light Mode Tokens */
  --wa-bg-chat: #efeae2;
  --wa-bg-panel: #f0f2f5;
  --wa-bg-default: #ffffff;
  --wa-border: #d1d7db;
  --wa-primary: #008069;
  --wa-text: #111b21;
  --wa-text-muted: #667781;
  --wa-bubble-in: #ffffff;
  --wa-bubble-out: #d9fdd3;
  --wa-bubble-text: #111b21;
  --wa-hover: #f5f6f6;
}

.wa-app-wrapper {
  background-color: var(--wa-bg-panel);
  color: var(--wa-text);
  font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  direction: rtl;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.wa-chat-bg {
  background-color: var(--wa-bg-chat);
  background-image: url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='var(--wa-primary)' fill-opacity='0.08'%3E%3Cpath d='M10 10l5-5 5 5-5 5zM50 50l5-5 5 5-5 5zM90 90l5-5 5 5-5 5zM30 70l5-5 5 5-5 5zM70 30l5-5 5 5-5 5z'/%3E%3C/g%3E%3C/svg%3E");
}

input:focus, textarea:focus { border-color: var(--wa-primary) !important; outline: none; }
input::placeholder, textarea::placeholder { color: var(--wa-text-muted); }
button:hover:not(:disabled) { filter: brightness(1.05); }

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(134,150,160,0.3); border-radius: 3px; }
`

const CSS_LIGHT = `` // Dynamic tokens handled via wrapper attribute.

const S: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '24px',
    background: 'var(--wa-primary)',
    color: '#ffffff',
  },
  headerIcon: { display: 'flex', alignItems: 'center' },
  headerTitle: { margin: 0, fontSize: '20px', fontWeight: 700, fontFamily: "'Tajawal', sans-serif" },
  headerSub: { margin: '4px 0 0', fontSize: '13px', opacity: 0.9 },
  themeBtn: {
    padding: '6px 12px',
    borderRadius: '20px',
    background: 'rgba(0,0,0,0.15)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: "'Tajawal', sans-serif",
  },
  tabRow: {
    display: 'flex',
    background: 'var(--wa-bg-panel)',
    borderBottom: '1px solid var(--wa-border)',
    padding: '0 24px',
    gap: '32px',
  },
  tab: {
    padding: '16px 0',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    color: 'var(--wa-text-muted)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Tajawal', sans-serif",
  },
  tabActive: {
    color: 'var(--wa-primary)',
    borderBottom: '3px solid var(--wa-primary)',
  },
  mainContentWrapper: { padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' },
  
  /* WhatsApp Dual Pane Layout */
  waApp: {
    display: 'flex',
    flex: 1,
    height: '75vh',
    minHeight: '600px',
    background: 'var(--wa-bg-default)',
    border: '1px solid var(--wa-border)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
  },
  waSidebar: {
    width: '30%',
    minWidth: '320px',
    borderLeft: '1px solid var(--wa-border)',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--wa-bg-default)',
  },
  waSidebarHeader: {
    height: '60px',
    padding: '10px 16px',
    background: 'var(--wa-bg-panel)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: 'var(--wa-text)',
    borderBottom: '1px solid var(--wa-border)',
  },
  waIconButton: {
    background: 'transparent',
    border: 'none',
    color: 'var(--wa-text-muted)',
    padding: '8px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waSearchArea: {
    padding: '8px 12px',
    borderBottom: '1px solid var(--wa-border)',
    background: 'var(--wa-bg-default)',
  },
  waSearchBox: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--wa-bg-panel)',
    borderRadius: '8px',
    padding: '6px 12px',
    gap: '12px',
  },
  waSearchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: 'var(--wa-text)',
    fontSize: '14px',
    padding: '2px 0',
  },
  waChatList: {
    flex: 1,
    overflowY: 'auto',
    background: 'var(--wa-bg-default)',
  },
  waChatListItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'right',
  },
  waChatListItemActive: {
    background: 'var(--wa-bg-panel)',
  },
  waAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'var(--wa-bg-panel)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '14px',
    flexShrink: 0,
    color: 'var(--wa-text-muted)',
    overflow: 'hidden',
  },
  waUnreadBadge: {
    background: 'var(--wa-primary)',
    color: '#fff',
    borderRadius: '12px',
    padding: '2px 6px',
    fontSize: '11px',
    fontWeight: 700,
    minWidth: '20px',
    textAlign: 'center',
  },
  waMainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  waChatHeader: {
    height: '60px',
    padding: '10px 16px',
    background: 'var(--wa-bg-panel)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--wa-border)',
  },
  waContactNameInput: {
    background: 'transparent',
    border: 'none',
    color: 'var(--wa-text)',
    fontSize: '16px',
    fontWeight: 600,
    padding: 0,
    margin: 0,
    outline: 'none',
  },
  waSaveNameBtn: {
    padding: '6px 12px',
    background: 'var(--wa-primary)',
    color: '#fff',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
  },
  waChatScroll: {
    flex: 1,
    padding: '20px 6%',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  waBubble: {
    maxWidth: '65%',
    padding: '8px 10px',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    position: 'relative',
    color: 'var(--wa-bubble-text)',
    display: 'inline-block',
  },
  waMediaImage: {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: '4px',
    marginBottom: '4px',
    display: 'block',
  },
  waChatFooter: {
    minHeight: '62px',
    padding: '10px 16px',
    background: 'var(--wa-bg-panel)',
    display: 'flex',
    alignItems: 'center',
    borderTop: '1px solid var(--wa-border)',
  },
  dashboardCardContainer: {
    flex: 1,
    minWidth: '320px',
    background: 'var(--wa-bg-default)',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid var(--wa-border)',
  },
  dashboardCardTitle: {
    fontSize: '18px',
    color: 'var(--wa-text)',
    margin: '0 0 20px',
    fontWeight: 700,
  },
  chip: {
    padding: '6px 14px',
    borderRadius: '20px',
    background: 'var(--wa-bg-panel)',
    border: '1px solid var(--wa-border)',
    color: 'var(--wa-text-muted)',
    cursor: 'pointer',
    fontSize: '13px',
  },
  chipActive: {
    background: 'var(--wa-primary)',
    color: '#fff',
    border: 'transparent',
  },
  tplCard: {
    padding: '16px',
    background: 'var(--wa-bg-panel)',
    borderRadius: '10px',
    border: '1px solid var(--wa-border)',
    marginBottom: '12px',
    cursor: 'pointer',
  },
  tplCardSel: {
    border: '1px solid var(--wa-primary)',
    background: 'rgba(0,168,132,0.05)',
  },
  formLabel: {
    display: 'block',
    fontSize: '13px',
    color: 'var(--wa-text-muted)',
    marginBottom: '6px',
    fontWeight: 600,
  },
  formInput: {
    width: '100%',
    padding: '12px',
    background: 'var(--wa-bg-panel)',
    border: '1px solid var(--wa-border)',
    borderRadius: '8px',
    color: 'var(--wa-text)',
    fontSize: '14px',
    marginBottom: '16px',
  },
  primaryBtn: {
    width: '100%',
    padding: '14px',
    background: 'var(--wa-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },
}
"""

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(pre_text + NEW_UI)
print("Rewrite successful")
