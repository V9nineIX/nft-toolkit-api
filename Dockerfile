FROM node:14.15.1 as build

WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json /app/package.json
RUN npm install -g nodemon
COPY . .
RUN npm install
CMD ["npm", "run", "start"]