# Node API

## Setup & Configuration

```bash
# Install dependencies
npm install

# Copy environment config and generate app key
cp .env.example .env

# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

## Running Tests 
## Expected output: all tests pass.

```bash
npm test
```

## Run Server
```bash
npm run dev
```
