const {exec} = require('child_process');
const fs = require('fs');

function Bitdefender() {
}

Bitdefender.prototype.scanDirectory = (path, files) => {
    console.log("scanning", path, "with bitdefender");
    return new Promise((resolve, reject) => {
        exec('/usr/bin/bdscan --log=bdscan.log "' + path + '"', (err, stdout, stderr) => {
            // returns error code 1 if a virus is found!!!
            const response = fs.readFileSync('bdscan.log', {encoding: 'UTF-8'});
            const results = [];
            files.forEach(f => {
                const pattern = new RegExp('^' + RegExp.escape(f.path) + '.*$', 'gm');
                let result;
                let match;
                do {
                    match = pattern.exec(response);
                    if (match) {
                        if (!result) {
                            result = {
                                scanner: 'bitdefender',
                                sha512: f.sha512,
                                sha256: f.sha256,
                                name: f.name,
                                primary: f.primary,
                                infected: false,
                                detections: []
                            };
                        }
                        const line = match[0];
                        const m = /infected:\s+(.*)/gm.exec(line);
                        if (m) {
                            const detection = m[1].trim();
                            if (!result.detections.includes(detection)) {
                                result.detections.push(detection);
                            }
                        }
                    }
                } while (match);
                if (result) {
                    result.infected = result.detections.length > 0;
                    result.detection = result.detections.join(' ');
                    results.push(result);
                }
            });
            resolve(results);
        });
    });
};

module.exports = Bitdefender;