const {exec} = require('child_process');

function Sophos() {
}

Sophos.prototype.scanDirectory = (path, files) => {
    console.log("scanning", path, "with sophos");
    return new Promise((resolve, reject) => {
        exec('/usr/local/bin/savscan -ns -f -all "' + path + '"', (err, stdout, stderr) => {
            // returns error code 1 if a virus is found!!!
            // Not infected files are in stderr
            const output = stdout + '\n' + stderr;
            const results = [];
            files.forEach(f => {
                const pattern = new RegExp('^.*' + RegExp.escape(f.path) + '.*$', 'gm');
                let result;
                let match;
                do {
                    match = pattern.exec(output);
                    if (match) {
                        if (!result) {
                            result = {
                                scanner: 'sophos',
                                sha512: f.sha512,
                                sha256: f.sha256,
                                name: f.name,
                                primary: f.primary,
                                detections: []
                            };
                        }
                        const line = match[0];
                        const m = /Virus\s+'(.*)'\s+found/gm.exec(line);
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

module.exports = Sophos;