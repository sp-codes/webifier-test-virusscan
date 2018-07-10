const request = require('request');
const fs = require('fs');
const BitDefender = require('./bitdefender');
const EScan = require('./escan');
const FSecure = require('./fsecure');
const FProt = require('./fprot');
const Comodo = require('./comodo');
const Clamav = require('./clamav');
const Sophos = require('./sophos');

const scanners = [new BitDefender(), new EScan(), new FSecure(), new FProt(), new Comodo(), new Clamav(), new Sophos()];


(function () {
    let webifier;
    let directory;

    module.exports.init = function (webifierConfig, downloadDir) {
        webifier = webifierConfig;
        directory = downloadDir;
    };

    const analyze = async function (files) {
        return (await Promise.all(scanners.map(async scanner => {
            try {
                return await scanner.scanDirectory(directory, files);
            } catch (e) {
                console.error(e);
                return await null;
            }
        }))).filter(r => r).reduce((previous, current) => {
            current.forEach(r => {
                let existing = {
                    name: r.name,
                    sha256: r.sha256,
                    sha512: r.sha512,
                    primary: r.primary,
                    result: {
                        sha256: r.sha256,
                        sha512: r.sha512,
                        detections: {},
                        scanners: 0,
                        scannersDetected: 0,
                        infected: false,
                        date: new Date()
                    }
                };
                const fileA = previous.filter(f => f.sha512 === r.sha512 && f.sha256 === r.sha256);
                if (fileA && fileA.length) {
                    existing = fileA[0];
                } else {
                    previous.push(existing);
                }
                existing.result.detections[r.scanner] = {
                    infected: r.infected,
                    result: r.detection
                };
                const list = Object.values(existing.result.detections);
                existing.result.scanners = list.length;
                existing.result.scannersDetected = list.filter(d => d.infected).length;
                existing.result.infected = existing.result.scannersDetected > 0;
            });
            return previous;
        }, []);
    };

    const findWebifierScanResults = function (hashes) {
        const options = {
            url: webifier.findUrl,
            body: JSON.stringify(hashes),
            headers: {
                'X-Auth-Token': webifier.apikey,
                'Content-Type': 'application/json'
            }
        };
        return new Promise(function (resolve, reject) {
            request.post(options, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    const result = JSON.parse(body);
                    if (result.results) {
                        const scanResults = result.results
                            .filter(r => r.success)
                            .map(r => r.result);
                        resolve(scanResults);
                    }
                }
                reject(error);
            });
        });
    };

    const saveWebifierScanResults = function (results) {
        const options = {
            url: webifier.saveUrl,
            body: JSON.stringify(results),
            headers: {
                'X-Auth-Token': webifier.apikey,
                'Content-Type': 'application/json'
            }
        };
        return new Promise(function (resolve, reject) {
            request.post(options, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    const result = JSON.parse(body);
                    resolve(result.success);
                }
                reject(error);
            });
        });
    };

    module.exports.analyzeAndDeleteFiles = async function (files) {
        let webifierResults = [];
        try {
            webifierResults = await findWebifierScanResults(files.map(f => {
                return {sha256: f.sha256, sha512: f.sha512}
            }));
        } catch (error) {
            console.error(error);
        }
        files.forEach(f => {
            const result = webifierResults.find(r => f.sha256 === r.sha256 && f.sha512 === r.sha512);
            if (result) {
                f.result = result;
                if (fs.existsSync(f.path)) {
                    fs.unlinkSync(f.path);
                }
            }
        });
        const filesWithoutResult = files.filter(f => !f.result);
        let newResults = [];
        if (filesWithoutResult.length) {
            newResults = await analyze(filesWithoutResult);
            try {
                await saveWebifierScanResults(newResults.map(f => f.result));
            } catch (error) {
                console.error(error);
            }
        }
        files.forEach(f => {
            const result = newResults.find(r => f.sha256 === r.sha256 && f.sha512 === r.sha512);
            if (result && result.result) {
                f.result = result.result;
                if (fs.existsSync(f.path)) {
                    fs.unlinkSync(f.path);
                }
            }
        });
        return files;
    }
}());