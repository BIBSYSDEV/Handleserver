FROM eclipse-temurin:17-alpine

RUN apk add --no-cache gettext

EXPOSE 2461/tcp
EXPOSE 2461/udp
EXPOSE 8000/tcp

RUN mkdir /handleserver #&& mkdir -p /fasehome/applikasjoner/handleserver

WORKDIR /handleserver

COPY ./hs /handleserver

VOLUME ["/hs"]

RUN chmod +x start.sh
RUN chmod +x handle-9.3.1/bin/hdl-server
RUN chmod +x handle-9.3.1/bin/hdl
CMD ["./hs/handle-9.3.1/bin/hdl-server", "./hs/svr_1"]
