const fs = require('fs');
const path = require('path');

const filePath = path.join('packages', 'sanity-studio', 'app', 'api', 'whatsapp', 'send-media', 'route.ts');
let code = fs.readFileSync(filePath, 'utf8');

const regex = /client\.create\(\{\s*_type:\s*"whatsappConversation",\s*patientName,\s*phoneNumber:\s*`\+\$\{num\}`,\s*messageBody:\s*caption\s*\|\|\s*`\[\$\{kind\}\]`,\s*templateUsed,\s*status:\s*"(failed|sent)",\s*direction:\s*"outgoing",\s*messageKind:\s*kind,\s*(waMediaId:\s*mediaId,\s*)?(wamid(:\s*wamid)?,\s*)?sentAt:\s*new Date\(\)\.toISOString\(\),(?:\s*errorMessage:\s*`([^`]+)`,\s*)?\}\)/g;

code = code.replace(regex, (match, status, waMediaMatch, wamidMatch, wamidValueMatch, errMatch) => {
  const isFailed = status === 'failed';
  const hasMedia = !!waMediaMatch;
  const hasWamid = !!wamidMatch;
  const errMsgStr = errMatch ? \`\${errMatch}\` : '""';

  return `(() => {
          const phoneDigits = num;
          const threadId = \`whatsappThread.\${phoneDigits}\`;
          const sentAtStr = new Date().toISOString();
          const _key = Math.random().toString(36).substring(2, 15);
          return client.patch(threadId)
            .setIfMissing({
              _type: "whatsappThread",
              phoneNumber: \`+\${num}\`,
              patientName,
              messages: [],
            })
            .set({ patientName, lastMessageAt: sentAtStr })
            .append("messages", [{
              _key,
              messageBody: caption || \`[\${kind}]\`,
              direction: "outgoing",
              status: "${status}",
              messageKind: kind,
              templateUsed,
              sentAt: sentAtStr,
              ${hasMedia ? 'waMediaId: mediaId,' : ''}
              ${hasWamid ? 'wamid,' : ''}
              ${isFailed ? `errorMessage: \`${errMatch}\`,` : ''}
            }])
            .commit({ autoGenerateArrayKeys: true });
        })()`;
});

fs.writeFileSync(filePath, code);
console.log('patched send-media');
