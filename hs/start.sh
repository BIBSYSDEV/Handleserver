#!/bin/sh
DB_PASSWORD=$DB_PASSWORD
envsubst '${DB_PASSWORD}' < svr_1/config.dct > svr_1/config.dct.tmp && mv svr_1/config.dct.tmp svr_1/config.dct
handle-9.3.1/bin/hdl-server svr_1
