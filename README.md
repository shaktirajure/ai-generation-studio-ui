# AI Generation Studio

A comprehensive AI-powered content generation platform featuring multiple AI tools for creative workflows. Built with React, TypeScript, and modern web technologies.

![AI Generation Studio](https://img.shields.io/badge/AI-Generation%20Studio-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

## ✨ Features

### 🎨 **Text to Image Generation**
- High-quality image generation using FLUX.1 model
- Customizable prompts and parameters
- Real-time generation status tracking

### 🎭 **Text to 3D Models**
- Convert text descriptions to 3D models
- Integration with Meshy/Replicate APIs
- Downloadable 3D assets

### 🎯 **AI Texturing**
- Upload 3D models (.glb/.gltf)
- Generate PBR (Physically Based Rendering) texture maps
- Professional material generation

### 🎬 **Image to Video**
- Transform static images into dynamic videos
- Configurable duration and frame rates
- High-quality video output

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **TanStack Query** for data fetching
- **Wouter** for routing
- **Framer Motion** for animations

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** with Neon database
- **Drizzle ORM** for database operations
- **Session management** with express-session

### AI Integration
- **OpenAI API** for advanced AI capabilities
- **FLUX.1** for text-to-image generation
- **Replicate** for 3D and video generation
- **Webhook system** for async job processing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shaktirajure/ai-generation-studio-ui.git
   cd ai-generation-studio-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with the following:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   OPENAI_API_KEY=your_openai_api_key
   SESSION_SECRET=your_session_secret
   HUGGINGFACE_TOKEN=your_huggingface_token
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 📋 Architecture

### Project Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utility functions
│   │   └── hooks/         # Custom React hooks
├── server/                # Backend Express application
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data storage interface
│   ├── job-service.ts     # Background job processing
│   └── webhook-service.ts # Webhook handling
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema and types
└── README.md
```

### Key Features

#### 🔐 **Credit System**
- User-based credit management
- Different costs per AI tool
- Real-time credit tracking
- Secure credit deduction

#### ⚡ **Async Job Processing**
- Background job processing for heavy AI operations
- Real-time status updates
- Webhook integration for external AI services
- Rate limiting and job queue management

#### 🎨 **Professional UI**
- Responsive tabbed interface
- Dark theme with glassmorphic design
- Progress indicators and loading states
- Accessible components with proper ARIA labels

#### 🔒 **Security Features**
- HMAC signature verification for webhooks
- Rate limiting for API endpoints
- Secure session management
- Environment-based configuration

## 🎯 Usage

### Text to Image
1. Select "Text to Image" tab
2. Enter your image description prompt
3. Click "Generate Text to Image"
4. Monitor progress in the Job Status panel
5. Download or view your generated image

### Text to 3D
1. Navigate to "Text to 3D" tab
2. Describe the 3D model you want
3. Generate and download the 3D asset
4. Compatible with .glb and .gltf formats

### AI Texturing
1. Go to "AI Texturing" tab
2. Upload your 3D model (.glb/.gltf)
3. Describe desired texturing style
4. Generate PBR texture maps

### Image to Video
1. Select "Image to Video" tab
2. Upload a source image
3. Configure video parameters (duration, FPS)
4. Generate and download video

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Sync database schema
- `npm run db:studio` - Open database studio

### Testing
The application includes comprehensive test IDs for automated testing:
- All interactive elements have `data-testid` attributes
- Consistent naming convention for test identifiers
- Ready for Playwright or similar testing frameworks

## 🛡️ Rate Limiting

The application implements intelligent rate limiting:
- **Light operations**: 100 requests per 15 minutes
- **Heavy AI operations**: 5 requests per 15 minutes
- **Credit-based limiting**: Prevents unauthorized usage

## 🌐 Deployment

### Production Build
```bash
npm run build
```

### Environment Configuration
Ensure all required environment variables are set:
- Database connections
- API keys for AI services
- Session secrets
- CORS settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT and image generation APIs
- **Replicate** for 3D and video generation models
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for utility-first styling
- **Vercel** for inspiration on modern web development

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for the AI creative community**
