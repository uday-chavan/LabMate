# LabMate 🧪->🤖

**LabMate** is an AI-powered smart laboratory assistant designed to reduce experimentation costs, improve lab safety, and accelerate chemical research workflows.

It combines machine learning, computer vision, OCR, and automation tools to help researchers, students, and lab staff make faster and safer decisions.

## 🚀 Features

### ⚗️ Chemical Reaction Predictor
Predicts complete chemical reaction pathways including optimal conditions and potential side reactions — eliminating costly trial-and-error experimentation.

### 📄 Literature Review Assistant
Instantly fetches relevant research papers based on your query with one-click abstract previews, saving days of manual literature searching.

### 🔬 Lab Equipment Identifier
Identifies lab equipment through image recognition and immediately surfaces the relevant safety protocols — no specialized expertise required.

### 🏷️ Chemical Label Analyzer (OCR)
Analyzes chemical labels using OCR to extract and display hazard levels, first-aid instructions, and handling guidelines in structured visual cards.

### 🧬 SMILES to Properties Converter
Converts SMILES notation directly into physical properties and toxicity data, removing the need for tedious manual database lookups.

### 📊 Process Flow Diagram Generator
Automatically generates professional process flow diagrams from lab procedures — eliminating manual drawing errors and technical barriers.

### 🚨 Emergency WhatsApp Alerts
Sends instant WhatsApp alerts to lab staff during emergencies with location data and incident details, reducing critical response time from minutes to seconds.

---

## 🛠️ Tech Stack

| Layer      | Technology                                         |
|------------|----------------------------------------------------|
| Frontend   | React, Vite, TypeScript, Tailwind CSS, shadcn/ui   |
| Backend    | Node.js, TypeScript, Express                       |
| Database   | PostgreSQL, Drizzle ORM                            |
| AI/ML      | Image Recognition, OCR, SMILES parsing             |
| Integrations | WhatsApp API, Research Paper APIs              |
| Tooling    | Vite, PostCSS, TypeScript                          |

---

## 📁 Project Structure

```
LabMate/
├── client/          # React frontend (Vite)
│   └── src/         # Components, pages, hooks
├── server/          # Node.js backend / API routes
├── shared/          # Shared TypeScript types & schemas
├── drizzle.config.ts
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.json
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL database
- npm or yarn
- WhatsApp Business API credentials (for emergency alerts)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/uday-chavan/LabMate.git
   cd LabMate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/labmate
   WHATSAPP_API_KEY=your_api_key
   ```

4. **Set up the database**
   ```bash
   npx drizzle-kit push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

---

## 📦 Scripts

| Command         | Description                              |
|-----------------|------------------------------------------|
| `npm run dev`   | Start development server (client + server) |
| `npm run build` | Build for production                     |
| `npm run start` | Start production server                  |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 👤 Author

**Uday Chavan**
- GitHub: [@uday-chavan](https://github.com/uday-chavan)

---

## 📄 License

This project is open source. Feel free to use and adapt it for your own projects.
