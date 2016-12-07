#!/usr/bin/python

import subprocess
import sys
import re


def download(url, files):
    subprocess.call('wget -m -np -nd -e robots=off -P ' + files + ' ' + url, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    pass


def clamscan(files):
    return execute('clamscan -r -z ' + files)


def avgscan(files):
    return execute('avgscan -m -o ' + files)


def cavscan(files):
    return execute('/opt/COMODO/cmdscan -s ' + files + ' -v')


def execute(command):
    proc = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return proc.stdout.read()


def evaluate(clamav, avg, cav):
    scanned = {}

    clamav_pattern = re.compile(r"^/tmp/files/(.*): (.*)$", re.MULTILINE)
    for (file, state) in re.findall(clamav_pattern, clamav):
        scanned[file] = scanned.get(file, False) or state != "OK"

    avg_pattern = re.compile(r'^/tmp/files/(.*) .* (.*)\.$', re.MULTILINE)
    for (file, state) in re.findall(avg_pattern, avg):
        scanned[file] = scanned.get(file, False) or state != "clean"

    cav_pattern = re.compile(r'^/tmp/files/(.*) ---> (.*)$', re.MULTILINE)
    for (file, state) in re.findall(cav_pattern, cav):
        scanned[file] = scanned.get(file, False) or state != "Not Virus"

    return scanned


def print_result(prefix, result):
    files = []
    for file in result:
        files.append("{\"name\": \"" + file + "\", \"malicious\": " + ("true" if result[file] else "false") + "}")
    scanned_files = len(result)
    malicious_files = sum(result.values())
    print prefix + ": {\"malicious\": " + (
        "true" if malicious_files > 0 else "false") + ", \"info\": {\"scanned_files\": " + str(
        scanned_files) + ", \"malicious_files\": " + str(
        malicious_files) + ", \"files\": [" + ", ".join(files) + "]}}"


if __name__ == "__main__":
    if len(sys.argv) == 4:
        prefix = sys.argv[1]
        url = sys.argv[2]
        files = sys.argv[3]
        download(url, files)
        clamav = clamscan(files)
        avg = avgscan(files)
        cav = cavscan(files)
        result = evaluate(clamav, avg, cav)
        print_result(prefix, result)
    else:
        print "prefix, url or directory missing"
