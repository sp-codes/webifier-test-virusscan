#!/usr/bin/python

import json
import subprocess
import sys
import re
import time
from thread import start_new_thread, allocate_lock

running_scans = 0
scan_started = False
lock = allocate_lock()
clamav = ""
avg = ""
cav = ""


def download(url, files):
    proc = subprocess.Popen('httrack --get-files --keep-links=K --do-not-log --sockets=8 --robots=0 --retries=2 '
                            '--depth=9999 --max-time=180 ' + url + ' -O ' + files, shell=True,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print proc.stdout.read()
    pass


def clamscan(files):
    global running_scans, scan_started, lock, clamav
    lock.acquire()
    running_scans += 1
    scan_started = True
    lock.release()
    clamav = execute('clamscan -r -z ' + files)
    lock.acquire()
    running_scans -= 1
    lock.release()


def avgscan(files):
    global running_scans, scan_started, lock, avg
    lock.acquire()
    running_scans += 1
    scan_started = True
    lock.release()
    avg = execute('avgscan -m -o ' + files)
    lock.acquire()
    running_scans -= 1
    lock.release()


def cavscan(files):
    global running_scans, scan_started, lock, cav
    lock.acquire()
    running_scans += 1
    scan_started = True
    lock.release()
    cav = execute('/opt/COMODO/cmdscan -s ' + files + ' -v')
    lock.acquire()
    running_scans -= 1
    lock.release()


def execute(command):
    proc = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return proc.stdout.read()


def evaluate(files):
    global clamav, avg, cav
    scanned = {}

    print 'clamav\n' + clamav
    print 'avg\n' + avg
    print 'cav\n' + cav

    clamav_pattern = re.compile(r"^" + files + "(.*): (.*)$", re.MULTILINE)
    for (file, state) in re.findall(clamav_pattern, clamav):
        if state != "OK" and state != "Empty file":
            scanned[file] = scanned.get(file, 0) + 1
        else:
            scanned[file] = scanned.get(file, 0)

    avg_pattern = re.compile(r"^" + files + "(.*) .* (.*)\.$", re.MULTILINE)
    for (file, state) in re.findall(avg_pattern, avg):
        if state != "clean":
            scanned[file] = scanned.get(file, 0) + 1
        else:
            scanned[file] = scanned.get(file, 0)

    cav_pattern = re.compile(r"^" + files + "(.*) ---> (.*)$", re.MULTILINE)
    for (file, state) in re.findall(cav_pattern, cav):
        if state != "Not Virus":
            scanned[file] = scanned.get(file, 0) + 1
        else:
            scanned[file] = scanned.get(file, 0)

    return scanned


def format_result(evaluation):
    files = []
    scanned_files = len(evaluation)
    suspicious_files = 0
    malicious_files = 0
    result = "CLEAN"
    for file in evaluation:
        file_result = get_result(evaluation.get(file, 0))
        if file_result == "SUSPICIOUS":
            suspicious_files += 1
            if result == "CLEAN":
                result = "SUSPICIOUS"

        if file_result == "MALICIOUS":
            malicious_files += 1
            result = "MALICIOUS"
        files.append({
            "name": file,
            "result": file_result
        })
    return {
        "result": result,
        "info": {
            "scanned_files": str(scanned_files),
            "suspicious_files": str(suspicious_files),
            "malicious_files": str(malicious_files),
            "files": files
        }
    }


def get_result(param):
    if param == 0:
        return "CLEAN"
    if param == 1:
        return "SUSPICIOUS"
    return "MALICIOUS"


if __name__ == "__main__":
    if len(sys.argv) == 4:
        start = int(round(time.time() * 1000))
        prefix = sys.argv[1]
        url = sys.argv[2]
        files = sys.argv[3]
        download(url, files)
        down = int(round(time.time() * 1000))
        print "Downloaded " + url + " in " + str(down - start)
        start_new_thread(clamscan, (files,))
        start_new_thread(avgscan, (files,))
        start_new_thread(cavscan, (files,))
        while not scan_started:
            pass
        while running_scans > 0:
            pass
        result = evaluate(files)
        end = int(round(time.time() * 1000))
        print end - start
        print '{}: {}'.format(prefix, json.dumps(format_result(result)))
    else:
        print "prefix, url or directory missing"
