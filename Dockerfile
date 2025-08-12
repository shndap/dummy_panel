FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 13000

CMD ["sh", "-c", "HOST=0.0.0.0 PORT=13000 npm start"] 