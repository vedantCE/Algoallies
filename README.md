# HealthSphere AI - Full Stack Integration

## 🚀 Quick Start

### Option 1: Automated Setup
```bash
./start_servers.sh
```

### Option 2: Manual Setup

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔗 Server URLs
- **Backend API**: http://127.0.0.1:8000
- **Frontend**: http://localhost:5173

## 🔑 Demo Accounts

### Citizen Account
- **Email**: `citizen@test.com`
- **Password**: `1234`

### Hospital Account
- **Email**: `hospital@test.com`
- **Password**: `9999`

## 📡 API Endpoints

### Authentication
- `POST /login` - User login
- `POST /signup` - User registration

### AI Agents
- `POST /citizen-response` - Citizen health assistant
- `POST /hospital-response` - Hospital operations assistant
- `POST /landing-response` - Landing page wellness tips

### Health Data
- `GET /health-advisory` - Daily health recommendations

## 🛠 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **LangChain** - AI agent framework
- **Google Gemini** - AI model
- **MongoDB** - Database
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations

## 🔧 Configuration

### Environment Variables (.env)
```
GEMINI_API_KEY=your_gemini_api_key
MONGO_URI=your_mongodb_connection_string
```

### CORS Settings
The backend is configured to accept requests from:
- `http://localhost:5173`
- `http://127.0.0.1:5173`

## 📝 API Usage Examples

### Login
```javascript
const response = await api.post('/login', {
  email: 'citizen@test.com',
  password: '1234'
});
```

### Send Citizen Message
```javascript
const response = await api.post('/citizen-response', {
  message: 'I have a headache, what should I do?'
});
```

### Get Health Advisory
```javascript
const response = await api.get('/health-advisory');
```

## 🐛 Troubleshooting

### Backend Issues
- Ensure Python dependencies are installed: `pip install -r requirements.txt`
- Check if port 8000 is available
- Verify environment variables are set

### Frontend Issues
- Install dependencies: `npm install`
- Check if port 5173 is available
- Ensure axios is installed

### CORS Issues
- Backend CORS is configured for localhost:5173
- Check browser console for CORS errors

## 📊 Console Logging

Both frontend and backend include extensive console logging:

### Backend Logs
- Route hits: `"API route hit: route_name"`
- Request data: `"Request data: {...}"`
- Response data: `"Generated response: {...}"`

### Frontend Logs
- API requests: `"Request sent to backend"`
- Payloads: `"Payload: {...}"`
- Responses: `"Backend returned: {...}"`