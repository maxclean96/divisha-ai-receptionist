# Divisha Ayurvedic — AI Receptionist Phase 1

This is a real runnable MVP, not just a mockup.

## What works
- Web chat receptionist
- Live OpenAI Responses API when OPENAI_API_KEY is configured
- Fallback receptionist mode when no key is configured
- Appointment request API
- JSON persistence (`data.json`)
- Owner dashboard with appointment status
- WhatsApp handoff link to 8077220904
- Hindi/Hinglish/English behavior
- Healthcare safety guardrails: no diagnosis/prescription; emergency handoff

## Run
1. Install Node.js 20+.
2. Open terminal in this folder.
3. Run `npm install`.
4. Set `OPENAI_API_KEY` in your environment.
5. Run `npm start`.
6. Open http://localhost:3000

On Windows PowerShell:
$env:OPENAI_API_KEY="YOUR_KEY"
npm start

On Linux/macOS:
export OPENAI_API_KEY="YOUR_KEY"
npm start

Do NOT put an API key in frontend JavaScript or share it publicly.

## Next production steps
- Hosted database (Postgres/Supabase)
- Real WhatsApp Business API instead of click-to-send
- Authentication for doctor dashboard
- Calendar availability integration
- Consent/privacy/retention controls
- Production deployment with HTTPS
- Phone/voice channel later
