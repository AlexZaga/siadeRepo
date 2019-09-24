#!/bin/bash
if [ $# -lt 2 ];
then
  echo "Unknow parameters expected..."
  exit
else
  APP=$1
  PARAMETER=$2
  ps -fea | grep ${APP} | grep -v grep| grep -v monitor > app.log
  if [ -e app.log ] && [ -s app.log ]
  then
    echo "Application on line & running ..."
  else
    echo "Application off line...restarting..."
    detach node ${PARAMETER}
    echo "Application restared."
    ps -fea|grep ${APP}|grep -v grep|grep -v monitor
  fi
  rm -f ${HOME}/app.log
fi
