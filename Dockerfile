FROM node:alpine

WORKDIR /root

COPY . .

RUN npm install

CMD npm start
