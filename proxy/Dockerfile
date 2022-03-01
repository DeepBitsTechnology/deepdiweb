# docker run -it --rm -v $(pwd):/proxy --platform linux/amd64 -p 3000:3000 deepdiweb_proxy
FROM public.ecr.aws/lts/ubuntu:18.04

ENV UPLOAD_DIR='/tmp/cache'
ENV MAX_PROJECTS_CACHED='100'
ENV MAX_UPLOADS='50'

RUN apt update && apt install -y tmux wget xz-utils binutils file

RUN wget https://nodejs.org/dist/v16.13.0/node-v16.13.0-linux-x64.tar.xz
RUN tar -xf node-v16.13.0-linux-x64.tar.xz -C /usr/local --strip-components=1

RUN mkdir -p $UPLOAD_DIR
RUN mkdir /proxy
COPY ./* /proxy
WORKDIR /proxy

RUN corepack enable
RUN yarn install
# RUN yarn run dev

ENTRYPOINT [ "bash" ]