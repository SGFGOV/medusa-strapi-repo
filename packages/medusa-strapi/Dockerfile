FROM strapi/base


#ARG AWS_DEFAULT_REGION 
#ARG AWS_ACCESS_KEY_ID 
#ARG AWS_SECRET_ACCESS_KEY 
#ARG AWS_SESSION_TOKEN 
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
COPY ./config ./config
COPY ./data ./data
COPY ./src ./src

RUN ls

ENV NODE_ENV production

RUN yarn install --ignore-platform --network-timeout 10000000 && yarn build

EXPOSE 1337

CMD ["yarn", "start"]