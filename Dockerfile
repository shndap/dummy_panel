FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080
CMD ["sh", "-c", "HOST=0.0.0.0 PORT=8080 npm start"] 