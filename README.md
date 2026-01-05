 # Node API

## Running API

```bash

# Install dependencies
npm install

# Copy environment config and generate app key
cp .env.example .env

# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

## Running Tests 
## Expected Output is all tests to pass

```bash
npm test
```

# Run Server
npm run dev

```