import express from "express";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

const clinic = {
  name: "Divisha Ayurvedic",
  address: "CP Colony, Morar, Gwalior",
  timing: "Monday to Saturday, 9:00 AM to 7:00 PM",
  fee: "₹250",
  whatsapp: "8077220904",
  services: [
    "Skin & Hair Care",
    "Digestive Issues",
    "Respiratory & Allergies",
    "Bone & Joint Pain",
    "Women's Health",
    "Pediatric Homeopathy"
  ]
};

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ appointments: [], chats: [] }, null, 2));
const db = () => JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
const save = (x) => fs.writeFileSync(DATA_FILE, JSON.stringify(x, null, 2));

app.use(express.json());
app.use(express.static(__dirname));

function fallback(message) {
  const m = message.toLowerCase();
  if (m.includes("service") || m.includes("kya dekh") || m.includes("problem"))
    return `Divisha Ayurvedic mein ${clinic.services.join(", ")} ki consultation available hai.`;
  if (m.includes("fee") || m.includes("charge") || m.includes("kitna"))
    return `Consultation fee ${clinic.fee} hai.`;
  if (m.includes("timing") || m.includes("kab") || m.includes("open"))
    return `Clinic ${clinic.timing} open hai.`;
  if (m.includes("address") || m.includes("kahan") || m.includes("location"))
    return `Clinic address: ${clinic.address}.`;
  if (m.includes("appointment") || m.includes("booking") || m.includes("milna"))
    return `Bilkul. Appointment request ke liye naam, mobile number, preferred date aur preferred time bataiye. Main request record kar dunga.`;
  return `Namaste 🙏 Main Divisha Ayurvedic ka AI receptionist hoon. Main services, timing, ₹250 consultation fee, address aur appointment request mein help kar sakta hoon.`;
}

app.post("/api/chat", async (req, res) => {
  const message = String(req.body?.message || "").trim();
  const sessionId = String(req.body?.sessionId || "web-demo");
  if (!message) return res.status(400).json({ error: "Message required" });

  const data = db();
  data.chats.push({ sessionId, role: "user", message, at: new Date().toISOString() });

  let reply;
  if (process.env.OPENAI_API_KEY) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        instructions: `You are the AI receptionist for ${clinic.name}.
Clinic address: ${clinic.address}.
Hours: ${clinic.timing}.
Consultation fee: ${clinic.fee}.
Services: ${clinic.services.join(", ")}.
Appointment WhatsApp: ${clinic.whatsapp}.
Speak naturally in Hindi/Hinglish or English matching the user.
You are a receptionist, NOT a doctor. Do not diagnose, prescribe, or claim a treatment will cure a condition.
For emergencies, advise the person to seek immediate appropriate emergency medical care.
You may explain listed clinic information and collect appointment-request details.
Never say an appointment is confirmed unless a human clinic staff member confirms it.
Keep replies concise and friendly.`,
        input: message
      });
      reply = response.output_text;
    } catch (e) {
      reply = fallback(message) + "\n\n(AI service temporarily unavailable; basic receptionist mode is active.)";
    }
  } else {
    reply = fallback(message) + "\n\n(Demo mode: add OPENAI_API_KEY to enable live AI replies.)";
  }

  data.chats.push({ sessionId, role: "assistant", message: reply, at: new Date().toISOString() });
  save(data);
  res.json({ reply });
});

app.post("/api/appointments", (req, res) => {
  const { name, phone, date, time, reason = "" } = req.body || {};
  if (!name || !phone || !date || !time) return res.status(400).json({ error: "name, phone, date and time are required" });

  const data = db();
  const appt = {
    id: "APT-" + Date.now(),
    name, phone, date, time, reason,
    status: "REQUESTED",
    createdAt: new Date().toISOString()
  };
  data.appointments.unshift(appt);
  save(data);

  const waText = `Divisha Ayurvedic Appointment Request%0AName: ${encodeURIComponent(name)}%0APhone: ${encodeURIComponent(phone)}%0ADate: ${encodeURIComponent(date)}%0ATime: ${encodeURIComponent(time)}%0AReason: ${encodeURIComponent(reason)}`;
  res.json({ appointment: appt, whatsappUrl: `https://wa.me/91${clinic.whatsapp}?text=${waText}` });
});

app.get("/api/dashboard", (req, res) => {
  const data = db();
  res.json({
    clinic,
    appointments: data.appointments,
    stats: {
      appointments: data.appointments.length,
      requested: data.appointments.filter(x => x.status === "REQUESTED").length,
      chats: data.chats.length
    }
  });
});

app.patch("/api/appointments/:id", (req, res) => {
  const data = db();
  const appt = data.appointments.find(x => x.id === req.params.id);
  if (!appt) return res.status(404).json({ error: "Not found" });
  if (["REQUESTED", "CONFIRMED", "CANCELLED"].includes(req.body.status)) appt.status = req.body.status;
  save(data);
  res.json(appt);
});

app.listen(PORT, () => console.log(`Divisha AI running at http://localhost:${PORT}`));
