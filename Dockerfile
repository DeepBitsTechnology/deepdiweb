FROM public.ecr.aws/lts/ubuntu:18.04
ARG DEEPDI_URL
# proxy server options
ENV UPLOAD_DIR='/tmp/cache'
ENV MAX_PROJECTS_CACHED='100'
ENV MAX_UPLOADS='50'
# #url for deepdi service
ENV DEEPDI_URL=$DEEPDI_URL

RUN mkdir -p $UPLOAD_DIR

COPY ./proxy /proxy
COPY ./web /web

RUN apt update && apt install -y wget xz-utils binutils file

RUN wget https://nodejs.org/dist/v16.13.0/node-v16.13.0-linux-x64.tar.xz
RUN tar -xf node-v16.13.0-linux-x64.tar.xz -C /usr/local --strip-components=1
RUN corepack enable

# build frontend first
WORKDIR /web
RUN yarn install
RUN yarn run build

WORKDIR /proxy
RUN yarn install
RUN yarn run build

CMD [node", "/proxy/dist/index.js" ]
# ENTRYPOINT [ "bash" ]
