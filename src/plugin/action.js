import config from '../../config.cjs';
import axios from 'axios';

async function handleCommand(m, gss) {
    // Presence updates
    if (config.AUTO_TYPING && m.from) {
        gss.sendPresenceUpdate("composing", m.from);
    }

    if (config.AUTO_RECORDING && m.from) {
        gss.sendPresenceUpdate("recording", m.from);
    }

    if (m.from) {
        gss.sendPresenceUpdate(config.ALWAYS_ONLINE ? 'available' : 'unavailable', m.from);
    }

    // Auto read
    if (config.AUTO_READ) {
        await gss.readMessages([m.key]);
    }

    // Auto block
    if (config.AUTO_BLOCK && m.sender.startsWith('212')) {
        await gss.updateBlockStatus(m.sender, 'block');
    }

    // Skip auto-reply if message is from specific number
    if (m.sender && m.sender.includes('94789958225')) {
        return;
    }
    
    const messageText = m.message?.conversation?.toLowerCase() || 
                       m.message?.extendedTextMessage?.text?.toLowerCase() || '';

    try {
        // Load image replies from GitHub
        const response = await axios.get('https://raw.githubusercontent.com/DEXTER-OFFICIAL/PROJECT-JSON/refs/heads/main/dexter-img-reply.json');
        const imageReplies = response.data;

        // Check for matching keywords
        for (const [keyword, reply] of Object.entries(imageReplies)) {
            if (messageText.includes(keyword.toLowerCase())) {
                // Process caption with newlines
                const formattedCaption = reply.caption.replace(/\\n/g, '\n');
                
                // Download image
                const imageResponse = await axios.get(reply.image, { 
                    responseType: 'arraybuffer',
                    timeout: 10000 // 10 second timeout
                });
                
                // Send with formatted caption
                await gss.sendMessage(m.from, {
                    image: Buffer.from(imageResponse.data),
                    caption: formattedCaption,
                    quoted: m
                });
                return;
            }
        }

        // If no image reply found, check text replies
        const textResponse = await axios.get('https://raw.githubusercontent.com/DEXTER-OFFICIAL/PROJECT-JSON/refs/heads/main/auto-reply-dexter.json');
        const textReplies = textResponse.data;

        for (const [keyword, reply] of Object.entries(textReplies)) {
            if (messageText.includes(keyword.toLowerCase())) {
                await gss.sendMessage(m.from, { 
                    text: reply,
                    quoted: m
                });
                return;
            }
        }

    } catch (error) {
        console.error('Error in handleCommand:', error);
        // No error message will be sent to user
    }
}

export default handleCommand;
