# SMARTESTSAVER

A smart savings application that helps users manage and optimize their savings.

## Project Overview
SMARTESTSAVER is a smart savings application designed to help users manage and optimize their savings through intelligent features and a user-friendly interface.

## Directory Structure
- `api-server/`: Contains the backend API server responsible for handling requests and processing data.
- `savesmart/`: Includes the main application code, front-end components, and configuration files.
- `server/`: Hosts additional server components, though currently empty.

## Components and Functions
### API Server
- **server.js**: Main server file for handling API requests and responses.
- **package.json**: Lists dependencies and scripts for the API server.

### SaveSmart Application
- **src/**: Contains React components and application logic.
- **public/**: Static assets and index.html for the front-end.
- **firebase.json**: Firebase configuration for deploying the application.
- **tailwind.config.js**: Configuration for Tailwind CSS.

## Information Architecture
The application is structured to separate concerns between the front-end and back-end. The `api-server` handles data processing and serves endpoints for the front-end, which resides in the `savesmart` directory. The `server` directory is reserved for additional server-side logic if needed.

## Installation and Setup
1. **API Server**
   - Navigate to `api-server/` and run `npm install` to install dependencies.
   - Start the server using `node server.js`.

2. **SaveSmart Application**
   - Navigate to `savesmart/` and run `npm install` to install dependencies.
   - Start the application using `npm start`.

## Usage
- Access the application via the local server to manage and optimize savings.
- Features include tracking savings goals, analyzing spending habits, and providing recommendations.

## Contributing
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details
