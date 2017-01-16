FROM debian:latest

COPY init.sh /tmp/
COPY test.sh /tmp/
COPY test.py /tmp/
COPY download.sh /tmp/

RUN sh /tmp/init.sh

CMD sh /tmp/test.sh
