FROM node:22

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npx hardhat compile

CMD ["npx", "hardhat", "test"]
