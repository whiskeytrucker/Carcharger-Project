FROM node:18.16.1-alpine
WORKDIR /archiver
COPY package.json ./
COPY package-lock.json ./
COPY ./ ./
RUN npm i
CMD [ "npm", "start" ]
