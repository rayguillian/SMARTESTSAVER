# SMARTESTSAVER

A Danish shopping and meal planning companion that helps you find supermarkets and plan your meals.

## Features

### Store Finder
- Locates nearby Danish supermarkets (Netto, Føtex, Bilka, etc.)
- Shows distance and store information
- Considers your travel preferences
- Provides store ratings and details

### Meal Planning
- AI-powered recipe suggestions
- Personalized meal recommendations
- Estimated costs for meals
- Complete ingredient lists
- Breakfast, lunch, and dinner options

### User Preferences
- Saves your food preferences
- Remembers travel radius settings
- Personalizes recommendations
- Customizes your experience

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/rayguillian/SMARTESTSAVER.git
```

2. Install dependencies
```bash
# Install API server dependencies
cd api-server
npm install

# Install frontend dependencies
cd ../savesmart
npm install
```

3. Set up environment variables
Create a `.env` file in the savesmart directory with:
```
OPENAI_API_KEY=your_openai_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

4. Start the development servers
```bash
# Start API server
cd api-server
npm start

# Start frontend (in new terminal)
cd savesmart
npm start
```

## Project Structure

```
SMARTESTSAVER/
├── api-server/     # Backend API server
│   ├── server.js   # Main server file
│   └── package.json
├── savesmart/      # Frontend React application
│   ├── src/        # React components
│   ├── public/     # Static files
│   └── package.json
└── README.md
```

## APIs Used
- Google Maps API for store locations
- OpenAI API for recipe suggestions

## Technologies
- Frontend: React with Tailwind CSS
- Backend: Express.js
- APIs: Google Maps, OpenAI