const puppeteer = require('puppeteer');
const fs = require('fs');
const URL = require('url').URL;
const crypto = require('crypto');
const request = require('request');
const analyzer = require('./analyzer');

if (process.argv.length !== 5) {
    console.log('usage: node index.js <id> <url> <download_folder>');
    return;
}

// init

const id = process.argv[2];
const url = process.argv[3];
const folder = process.argv[4];

// config

RegExp.escape = function (text) {
    return text.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
};

// init

analyzer.init({
    findUrl: 'http://localhost:8080/api/file-scans/find',
    saveUrl: 'http://localhost:8080/api/file-scans/save',
    apikey: '43cc0660a6ed6c9c5ce13ae8d413c078f9743b4c'
}, folder);

let index = 0;
const files = [];

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        slowMo: 0,
        ignoreHTTPSErrors: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--allow-running-insecure-content',
            '--disable-client-side-phishing-detection',
            '--safebrowsing-disable-download-protection',
            '--disable-web-security'
        ]
    });
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', async (req) => {
        try {
            const result = await downloadFile(req.url(), true);
            req.respond({
                status: result.response.statusCode,
                contentType: result.response.headers['content-type'],
                body: result.buffer
            });
        } catch (e) {
            req.abort();
        }
    });

    await page.goto(url, {waitUntil: 'networkidle2'});

    await page.waitFor(2000);

    try {
        const links = (await page.$$eval('a', links => links.map(l => l.href)))
            .filter(l => /https?:\/\/.+/.test(l))
            .filter((l, index, self) => self.indexOf(l) === index);

        await Promise.all(links.map(async (link) => {
            try {
                await downloadFile(link, false);
            } catch (e) {
            }
        }));
    } catch (e) {
    }

    await browser.close();

    const results = await analyzer.analyzeAndDeleteFiles(files);

    console.log(JSON.stringify(results));

    console.log('');

    const fileResults = results.map(r => {
        return {
            name: r.name,
            sha256: r.sha256,
            sha512: r.sha512,
            primary: r.primary,
            infected: r.result ? r.result.infected : false
        }
    });
    const testResult = {
        result: fileResults.filter(f => f.infected).length > 0 ? 'MALICIOUS': 'CLEAN',
        totalFiles: fileResults.length,
        infectedFiles: fileResults.filter(f => f.infected).length,
        files: fileResults
    };

    // print result
    console.log(id + ': ' + JSON.stringify(testResult))
})();

function downloadFile(resourceUrl, primary) {
    return new Promise((resolve, reject) => {
        const url = new URL(resourceUrl);
        const split = url.pathname.split('/');
        let filename = /(.+\/)?([^?&;=%#]{0,200}).*/.exec(split[split.length - 1])[2];
        if (!filename.length) {
            filename = 'index.html'
        }

        const path = folder + filename.replace(/^.+?(\.[^.]+)?$/g, (++index).toString(16) + '$1');

        const sha256hash = crypto.createHash('sha256');
        const sha512hash = crypto.createHash('sha512');

        const file = fs.createWriteStream(path);
        let size = 0;

        const call = request.get(resourceUrl);

        call.on('data', data => {
            size += data.length;

            sha256hash.update(data);
            sha512hash.update(data);

            if (size > 20971520) { // 20 MB
                console.log('Resource stream exceeded limit (' + size + ')');

                call.abort(); // Abort the response (close and cleanup the stream)
            }
        }).pipe(file);

        call.on('end', () => {
            try {
                const sha256 = sha256hash.digest('hex');
                const sha512 = sha512hash.digest('hex');

                const result = {
                    sha512: sha512,
                    sha256: sha256,
                    name: filename,
                    path: path,
                    primary: primary
                };
                files.push(result);
                resolve({
                    response: call.response,
                    buffer: fs.readFileSync(result.path)
                });
            } catch (e) {
                console.error(e.message);
            }
        });

        call.on('error', (e) => {
            console.error(`Got error: ${e.message}`);
        });
    });
}