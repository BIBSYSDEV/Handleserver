FROM  eclipse-temurin:17-alpine

RUN apk add --no-cache gettext

EXPOSE 2461/tcp
EXPOSE 2461/udp
EXPOSE 8000/tcp

RUN mkdir /handleserver

WORKDIR /handleserver

COPY ./hs /handleserver

VOLUME ["/handleserver"]

RUN chmod +x handle-9.3.1/bin/hdl-server
RUN chmod +x handle-9.3.1/bin/hdl
CMD ["./handle-9.3.1/bin/hdl-server", "./svr_1"]
