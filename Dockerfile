FROM strapi/base


ARG AWS_DEFAULT_REGION 
ARG AWS_ACCESS_KEY_ID 
ARG AWS_SECRET_ACCESS_KEY 
ARG AWS_SESSION_TOKEN 
#RUN echo $AWS_DEFAULT_REGION 
#RUN echo $AWS_ACCESS_KEY_ID 
#RUN echo $AWS_SECRET_ACCESS_KEY 
#RUN echo $AWS_SESSION_TOKEN

# Let WatchTower know to ignore this container for checking
LABEL com.centurylinklabs.watchtower.enable="false"

FROM strapi/base

RUN  apt update 

RUN apt install -y curl

RUN curl google.com

RUN npm install -g n

RUN n 16

WORKDIR /app

COPY ./package*.json ./

COPY ./package.json ./
COPY ./yarn.lock ./

COPY . .


RUN yarn install --ignore-platform



ENV NODE_ENV production

#RUN yarn --ignore-platform

RUN yarn build 

EXPOSE 1337

CMD ["yarn", "start"]