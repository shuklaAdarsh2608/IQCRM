# WhatsApp Chat (Twilio) Setup

The Chats section uses **Twilio WhatsApp API** to send and receive messages.

## Using your own mobile number

Yes, you can use **your mobile number** as the WhatsApp number that the app uses to send and receive chats.

### Option A: Twilio (current setup)

1. **Get a WhatsApp-enabled number from Twilio**
   - Go to [Twilio Console](https://console.twilio.com) → **Phone Numbers** → **Buy a number** (or use **Messaging** → **Try it out** → **Send a WhatsApp message** to use the sandbox first).
   - For **production**, buy a number that supports WhatsApp. In some countries you can also **port your existing mobile number** to Twilio so that same number works for WhatsApp in the app.
   - Note the number in E.164 format (e.g. `+919876543210`).

2. **Enable WhatsApp on that number**
   - In Twilio: **Messaging** → **Try it out** → **Send a WhatsApp message** (sandbox), or for production follow Twilio’s [WhatsApp onboarding](https://www.twilio.com/docs/whatsapp) for your country.

3. **Point the app to your number**
   - In your backend `.env` set:
     ```env
     TWILIO_WHATSAPP_FROM=whatsapp:+919876543210
     ```
     Replace with your real number (with country code, no spaces).

4. **Set the webhook**
   - In Twilio, for that WhatsApp number, set “When a message comes in” to:
     `https://your-domain.com/api/chats/webhook/whatsapp`
   - Then all messages sent to **your mobile number** on WhatsApp will be received by the app and shown in the Chats page.

After this, when someone messages your number on WhatsApp, it appears in IQLead Chats; when you send from the Chats page, it goes from **your number** to their WhatsApp.

### Option B: Meta WhatsApp Business API (without Twilio)

You can also use **Meta’s WhatsApp Business API** directly with your phone number. You register and verify your number with Meta, then use their API to send/receive. That would require replacing the Twilio integration in the backend with Meta’s API and webhooks. If you want to go this route, we can outline the code changes.

---

## 1. Database

Run the new SQL in `database/schema.sql` for tables `chat_conversations` and `chat_messages` if you haven’t already. If you use Sequelize `sync()`, these tables are created from the models on startup.

## 2. Environment variables

In `.env`:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

- Get SID and token from [Twilio Console](https://console.twilio.com).
- For **sandbox**: use the sandbox “From” number (e.g. `whatsapp:+14155238886`). Users must join the sandbox by sending the join code to that number.
- For **production**: use your Twilio WhatsApp-enabled number in the same format: `whatsapp:+1234567890`.

## 3. Webhook (incoming messages)

Twilio needs a public URL to deliver incoming WhatsApp messages.

- **Development**: use [ngrok](https://ngrok.com) or similar to expose your local server, then set the webhook to:
  `https://your-ngrok-url/api/chats/webhook/whatsapp`
- In Twilio Console: WhatsApp Sandbox (or your WhatsApp number) → “When a message comes in” → set this URL and save.

If the webhook is not set, **sending** from the app still works; **incoming** messages will not be stored until the webhook is configured.

## 4. Phone number format

- **Add contact**: use digits with country code, e.g. `919876543210` (India). Optional leading `+` is fine.
- The app normalizes and stores numbers with `+` and default country code `91` when only 10 digits are given.
