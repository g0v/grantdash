FROM node:6.9-onbuild
EXPOSE 3000

RUN bash -c 'cd /usr/src/app/client; npm i && npm i -g grunt-cli && grunt'
