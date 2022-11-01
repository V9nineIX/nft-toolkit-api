FROM node:16.7.0 as build

WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json /app/package.json
RUN apt-get update
RUN apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
# RUN apk add --update --no-cache \
#     make \
#     g++ \
#     jpeg-dev \
#     cairo-dev \
#     giflib-dev \
#     pango-dev \
#     libtool \
#     autoconf \
#     automake
RUN npm install -g nodemon
RUN npm install canvas --build-from-source
COPY . /app/
RUN npm install
CMD ["npm", "run", "start"]