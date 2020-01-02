FROM node:alpine

WORKDIR /root

COPY . .

RUN npm install

ENV PORT=3000

CMD npm start -- --listen tcp://0.0.0.0:$PORT
