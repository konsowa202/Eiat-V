const fs = require('fs');
const path = require('path');

const filePath = path.join('packages', 'sanity-studio', 'plugins', 'whatsapp-tool', 'WhatsAppTool.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Fix handleLoadMore
const loadMoreOld = `const olderMsgs = await client.fetch<ConversationDoc[]>(
        \`*[_type == "whatsappThread" && phoneNumber match "*\${digits}*" && sentAt < $oldestAt] | order(sentAt desc)[0...100] {
          _id, patientName, phoneNumber, messageBody, templateUsed,
          status, direction, wamid, sentAt, errorMessage, messageKind, waMediaId
        }\`,
        { oldestAt: oldestMsg.sentAt }
      )

      if (olderMsgs && olderMsgs.length > 0) {
        setConversations(prev => {
          const existingIds = new Set(prev.map(c => c._id))
          const newOnes = olderMsgs.filter(c => !existingIds.has(c._id))
          return [...prev, ...newOnes]
        })
        showAlert('ok', \`✅ تم تحميل \${olderMsgs.length} رسالة أقدم\`)
      }`;

const loadMoreNew = `const olderThreads = await client.fetch<any[]>(
        \`*[_type == "whatsappThread" && phoneNumber match "*\${digits}*"] | order(lastMessageAt desc)[0...100] {
          _id, patientName, phoneNumber, lastMessageAt, messages
        }\`
      )

      const olderMsgs: any[] = []
      for (const thread of olderThreads || []) {
        for (const msg of thread.messages || []) {
          olderMsgs.push({
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

      if (olderMsgs.length > 0) {
        setConversations(prev => {
          const existingKeys = new Set(prev.map(c => c._key))
          const newOnes = olderMsgs.filter(c => !existingKeys.has(c._key))
          return [...prev, ...newOnes]
        })
        showAlert('ok', \`✅ تم تحميل رسائل أقدم\`)
      }`;

code = code.replace(loadMoreOld, loadMoreNew);

// Fix handleSearchBackend
const searchOld = `      const results = await client.fetch<ConversationDoc[]>(
        query + \` {
          _id, patientName, phoneNumber, messageBody, templateUsed,
          status, direction, wamid, sentAt, errorMessage, messageKind, waMediaId
        }\`
      )
      if (results && results.length > 0) {
        setConversations(prev => {
          const existingIds = new Set(prev.map(c => c._id))
          const newOnes = results.filter(c => !existingIds.has(c._id))
          return [...prev, ...newOnes]
        })
        showAlert('ok', \`✅ تم إيجاد \${results.length} رسالة من الأرشيف\`)
      }`;

const searchNew = `      const searchThreads = await client.fetch<any[]>(query)
      const results: any[] = []
      for (const thread of searchThreads || []) {
        for (const msg of thread.messages || []) {
          results.push({
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

      if (results.length > 0) {
        setConversations(prev => {
          const existingKeys = new Set(prev.map(c => c._key))
          const newOnes = results.filter(c => !existingKeys.has(c._key))
          return [...prev, ...newOnes]
        })
        showAlert('ok', \`✅ تم إيجاد الأرشيف\`)
      }`;

code = code.replace(searchOld, searchNew);

fs.writeFileSync(filePath, code);
console.log('patched remaining fetches');
