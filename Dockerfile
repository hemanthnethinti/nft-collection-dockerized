FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Use --no-compile flag if available, or just run tests
CMD ["sh", "-c", "npx hardhat test --no-compile 2>/dev/null || npx hardhat test"]
