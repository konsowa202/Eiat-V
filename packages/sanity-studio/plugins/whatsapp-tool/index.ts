import { definePlugin } from 'sanity'
import { WhatsAppTool } from './WhatsAppTool'

/**
 * WhatsApp Business Tool for Sanity Studio
 * يضيف أداة إرسال رسائل واتساب مباشرة من لوحة تحكم Sanity
 */
export const whatsappPlugin = definePlugin({
  name: 'whatsapp-tool',
  tools: [
    {
      name: 'whatsapp',
      title: 'واتساب',
      icon: () => '📱',
      component: WhatsAppTool,
    },
  ],
})
