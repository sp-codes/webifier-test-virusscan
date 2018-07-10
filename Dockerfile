FROM node:8-jessie

RUN apt-get update && \
apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst ttf-freefont \
ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget curl && \
apt-get clean && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

COPY bitdefender.sh /
RUN bash /bitdefender.sh && rm /bitdefender.sh

COPY escan.sh /
RUN bash /escan.sh && rm /escan.sh

COPY fsecure.sh /
RUN bash /fsecure.sh && rm /fsecure.sh

COPY fprot.sh /
RUN bash /fprot.sh && rm /fprot.sh

COPY comodo.sh /
RUN bash /comodo.sh && rm /comodo.sh

COPY clamav.sh /
RUN bash /clamav.sh && rm /clamav.sh

COPY sophos.sh /
RUN bash /sophos.sh && rm /sophos.sh

RUN mkdir /app && mkdir /app/download
WORKDIR /app

# Add user so we don't need --no-sandbox.
RUN groupadd -r pptruser \
    && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Run everything after as non-privileged user.
USER pptruser

RUN npm i puppeteer request

COPY src/ /app/

ENTRYPOINT ["bash", "index.sh"]