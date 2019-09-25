#!/bin/bash
if [ ! -s .private.pem ] || [ ! -s .public.pem ] || [ ! -s .claves.ssl ];
then
   #Limpiar resultados
   rm -f .private.pem .public.pem .claves.ssl
   echo "This creates a key file called private.pem that uses 2048 bits..."
   openssl genrsa -out private.pem 2048
   echo "This create a key file called public.pem derives private.pem"
   openssl rsa -in private.pem -out public.pem -outform PEM -pubout
   #echo "mariadb://masterdb0:Master-cmm0@csti-qa-db.ckor3xu9ubbx.us-east-2.rds.amazonaws.com:3306/siadedb?debug=false" > claves.tx
   echo "csti-qa-db.ckor3xu9ubbx.us-east-2.rds.amazonaws.com:masterdb0:Master-cmm0:siadedb" > claves.tx
   echo "Encrypt using OpenSSL and the public key"
   openssl rsautl -encrypt -inkey public.pem -pubin -in claves.tx -out claves.ssl
   #Ajustar resultados
   mv claves.ssl .claves.ssl
   mv private.pem .private.pem
   mv public.pem .public.pem
   rm -f claves.tx
else
   echo "Nada por hacer"
fi
echo "Proceso terminado"
