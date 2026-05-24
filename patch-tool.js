const fs = require('fs');
const path = require('path');

const filePath = path.join('packages', 'sanity-studio', 'plugins', 'whatsapp-tool', 'WhatsAppTool.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Update ConversationDoc type
code = code.replace(
  `export type ConversationDoc = {
  _id: string`,
  `export type ConversationDoc = {
  _id: string
  _key?: string`
);

// Update fetchConversations query
const fetchOld = `*[_type == "whatsappConversation"] | order(sentAt desc)[0..2999] {
        _id, patientName, phoneNumber, messageBody, templateUsed,
        status, direction, wamid, sentAt, errorMessage, messageKind, waMediaId
      }`;
const fetchNew = `*[_type == "whatsappThread"] | order(lastMessageAt desc)[0..99] {
        _id, patientName, phoneNumber, lastMessageAt, messages
      }`;
code = code.replace(fetchOld, fetchNew);

// Update fetchConversations processing
const processOld = `.then((d) => setConversations(prev => {
        if (!prev || prev.length === 0) return d || []
        const newIds = new Set((d || []).map(x => x._id))
        const oldOnesToKeep = prev.filter(x => !newIds.has(x._id))
        return [...(d || []), ...oldOnesToKeep]
      }))`;
const processNew = `.then((d) => {
        const flat: ConversationDoc[] = []
        for (const thread of d || []) {
          for (const msg of thread.messages || []) {
            flat.push({
              _id: thread._id,
              _key: msg._key,
              patientName: thread.patientName,
              phoneNumber: thread.phoneNumber,
              messageBody: msg.messageBody,
              templateUsed: msg.templateUsed,
              status: msg.status,
              direction: msg.direction,
              wamid: msg.wamid,
              sentAt: msg.sentAt,
              errorMessage: msg.errorMessage,
              messageKind: msg.messageKind,
              waMediaId: msg.waMediaId
            })
          }
        }
        flat.sort((a, b) => new Date(b.sentAt || '').getTime() - new Date(a.sentAt || '').getTime())
        setConversations(flat)
      })`;
code = code.replace(processOld, processNew);

// Update handleSearch query
code = code.replace(
  `query = \`*[_type == "whatsappConversation" && phoneNumber match "*\${digits}*"] | order(sentAt desc)[0...50]\``,
  `query = \`*[_type == "whatsappThread" && phoneNumber match "*\${digits}*"] | order(lastMessageAt desc)[0...50] { _id, patientName, phoneNumber, lastMessageAt, messages }\``
);
code = code.replace(
  `query = \`*[_type == "whatsappConversation" && patientName match "*\${q}*"] | order(sentAt desc)[0...50]\``,
  `query = \`*[_type == "whatsappThread" && patientName match "*\${q}*"] | order(lastMessageAt desc)[0...50] { _id, patientName, phoneNumber, lastMessageAt, messages }\``
);

// Update handleLoadMore query
code = code.replace(
  `\`*[_type == "whatsappConversation" && phoneNumber match "*\${digits}*" && sentAt < $oldestAt] | order(sentAt desc)[0...100] {
        _id, patientName, phoneNumber, messageBody, templateUsed,
        status, direction, wamid, sentAt, errorMessage, messageKind, waMediaId
      }\``,
  `\`*[_type == "whatsappThread" && phoneNumber match "*\${digits}*"] | order(lastMessageAt desc)[0...100] {
        _id, patientName, phoneNumber, lastMessageAt, messages
      }\``
);

// Update handleDeleteMsg
const deleteOld = `const handleDeleteMsg = async (msgId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة من السجل؟')) return
    try {
      await client.delete(msgId)
      showAlert('ok', '✅ تم حذف الرسالة')
      void fetchConversations({ silent: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل الحذف'
      showAlert('err', \`❌ \${msg}\`)
    }
  }`;
const deleteNew = `const handleDeleteMsg = async (msgId: string, msgKey?: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة من السجل؟')) return
    try {
      if (msgKey) {
        await client.patch(msgId).unset([\`messages[_key == "\${msgKey}"]\`]).commit()
      } else {
        await client.delete(msgId)
      }
      showAlert('ok', '✅ تم حذف الرسالة')
      void fetchConversations({ silent: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل الحذف'
      showAlert('err', \`❌ \${msg}\`)
    }
  }`;
code = code.replace(deleteOld, deleteNew);

// Find where handleDeleteMsg is called and pass msgKey
code = code.replace(/onClick=\{\(\) => handleDeleteMsg\(msg\._id\)\}/g, "onClick={() => handleDeleteMsg(msg._id, msg._key)}");

// Also update the text in Delete Contacts dialogs to say whatsappThread
code = code.replace(/whatsappConversation/g, 'whatsappThread');

// Actually wait, if I replace ALL whatsappConversation with whatsappThread, what happens to the ones I just changed?
// The ones I already changed don't have whatsappConversation anymore. But maybe the text mentions do.
// I will just leave the dialog text alone, it's just text. Or I can do a final global replace for the user-facing text.

fs.writeFileSync(filePath, code);
console.log('patched WhatsAppTool.tsx');
