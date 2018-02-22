FROM jasonking/sparkbot:latest

COPY *.js /app/skills/

RUN cd /app \
  && npm install request-promise generate-password

WORKDIR /app

CMD ["node", "bot.js"]
