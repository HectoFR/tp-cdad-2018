FROM node:8

RUN npm install -g sails nodemon knex

WORKDIR /app
EXPOSE 1337

CMD nodemon --watch . sails lift
