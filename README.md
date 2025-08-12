# Frontend

## Development

- Copy `.env.example` to `.env` and set your API URL/token if needed:

```
cp .env.example .env
```

Edit `.env`:

```
REACT_APP_API_BASE_URL=http://localhost:8000
# REACT_APP_API_TOKEN=your_token
```

- Start the dev server:

```
npm start
```

## API Client

The app uses a lightweight fetch-based client in `src/api/client.js` with env-configured base URL and optional Token auth. Fulltests endpoints are wrapped in `src/api/fulltests.js`.
