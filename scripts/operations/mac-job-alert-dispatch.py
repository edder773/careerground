#!/usr/bin/env python3
"""Mac dispatch fallback; Slack delivery always stays in GitHub Actions."""
import argparse
import base64
import datetime as dt
import json
import os
from pathlib import Path
import subprocess
import time
from zoneinfo import ZoneInfo

KST = ZoneInfo('Asia/Seoul')
GH = '/opt/homebrew/bin/gh'
REPO = 'edder773/careerground'


def stage_at(now):
    now = now.astimezone(KST)
    day = now.date().isoformat()
    minutes = now.hour * 60 + now.minute
    if day < '2026-10-02':
        return None
    if day == '2026-10-03' and 470 <= minutes < 500:
        return {'day': day, 'destination': 'production', 'batch': '2026-10-02', 'force': True}
    if now.weekday() >= 5:
        return None
    if day >= '2026-10-03' and 470 <= minutes < 500:
        return {'day': day, 'destination': 'production', 'batch': '', 'force': False}
    if 530 <= minutes < 560:
        return {'day': day, 'destination': 'test', 'batch': day, 'force': False}
    return None


def command_for(stage):
    test = stage['destination'] == 'test'
    cmd = [GH, 'workflow', 'run', 'job-alert-test.yml' if test else 'job-alert.yml',
           '-R', REPO, '--ref', 'main', '-f', 'dry_run=false',
           '-f', 'force=' + str(stage['force']).lower(),
           '-f', 'batch_date=' + stage['batch'], '-f', 'hold_until_09=true' if test else 'hold_until_08=true']
    if test:
        cmd += ['-f', 'mode=test', '-f', 'retest=false']
    return cmd


def gh(*args):
    result = subprocess.run([GH, *args], capture_output=True, text=True, timeout=45)
    if result.returncode and 'HTTP 404' in result.stderr:
        raise FileNotFoundError('GitHub record not found')
    if result.returncode:
        raise RuntimeError('GitHub command failed: exit ' + str(result.returncode))
    return result.stdout


def api(path):
    return json.loads(gh('api', 'repos/' + REPO + '/' + path))


def remote_json(branch, path):
    item = api('contents/' + path + '?ref=' + branch)
    return json.loads(base64.b64decode(item['content']))


def preflight(stage):
    test = stage['destination'] == 'test'
    workflow = api('actions/workflows/' + ('job-alert-test.yml' if test else 'job-alert.yml'))
    if workflow.get('state') != 'active':
        return {'ready': False, 'reason': 'workflow-inactive'}
    if test:
        paths = {entry['path'] for entry in api('git/trees/job-alert-data?recursive=1')['tree']}
        prefix = 'batches/' + stage['batch'] + '/'
        complete = all(prefix + 'collector-%d.json' % i in paths for i in range(1, 6)) and all(prefix + 'reviewer-%d.json' % i in paths for i in range(1, 4))
        return {'ready': complete, 'reason': 'ready' if complete else 'batch-incomplete'}
    if api('actions/variables/JOB_ALERT_LIVE').get('value') != 'true':
        return {'ready': False, 'reason': 'production-disabled'}
    if stage['batch']:
        release = remote_json('job-alert-test-data', 'releases/' + stage['batch'] + '.json')
        main = api('commits/main')['sha']
        if release.get('status') != 'READY' or release.get('codeSha') != main:
            return {'ready': False, 'reason': 'release-not-ready'}
    return {'ready': True, 'reason': 'ready'}


def delivery(stage):
    branch = 'job-alert-test-data' if stage['destination'] == 'test' else 'job-alert-data'
    try:
        record = remote_json(branch, 'ledger.json').get('deliveries', {}).get(stage['day'], {})
    except FileNotFoundError:
        if stage['destination'] == 'test':
            return None
        raise
    return record.get('status') if record.get('mode') == 'live' else None


def log(event, **fields):
    print(json.dumps({'at': dt.datetime.now(KST).isoformat(), 'event': event, **fields}, ensure_ascii=False), flush=True)


def tick(state_path, now=None):
    now = now or dt.datetime.now(KST)
    stage = stage_at(now)
    if not stage:
        return
    key = stage['day'] + ':' + stage['destination']
    state = json.loads(state_path.read_text()) if state_path.exists() else {}
    item = state.get(key, {'attempts': 0, 'nextAttemptAt': 0})
    if item.get('finished'):
        return
    try:
        status = delivery(stage)
        if status in ('SENT', 'UNCERTAIN'):
            item['finished'] = status
            log('DELIVERY_' + status, **stage)
        elif item['attempts'] < 3 and now.timestamp() >= item['nextAttemptAt']:
            ready = preflight(stage)
            if ready['ready']:
                # Save an accepted dispatch before polling. A timeout can still
                # have queued a run; the workflow ledger prevents duplicates.
                item['attempts'] += 1
                item['nextAttemptAt'] = now.timestamp() + 240
                subprocess.run(command_for(stage), capture_output=True, text=True, timeout=45, check=True)
                log('DISPATCH_ACCEPTED', **stage, attempt=item['attempts'])
            elif item.get('lastReason') != ready['reason']:
                log('NOT_READY', **stage, reason=ready['reason'])
            item['lastReason'] = ready['reason']
    except (RuntimeError, FileNotFoundError, ValueError, KeyError, subprocess.SubprocessError) as error:
        log('CHECK_FAILED', **stage, errorType=type(error).__name__)
    state[key] = item
    state_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = state_path.with_suffix('.tmp')
    temporary.write_text(json.dumps(state, ensure_ascii=False, indent=2))
    os.replace(temporary, state_path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--state', type=Path, required=True)
    parser.add_argument('--preflight', choices=['test', 'production'])
    args = parser.parse_args()
    if args.preflight:
        stage = {'day': '2026-10-02' if args.preflight == 'test' else '2026-10-03', 'destination': args.preflight,
                 'batch': '2026-10-02', 'force': args.preflight == 'production'}
        log('PREFLIGHT', **stage, **preflight(stage))
        return
    log('ARMED', testAt='08:50 dispatch → 09:00 KST', productionAt='07:50 dispatch → 08:00 KST', firstProduction='2026-10-03')
    awake_until = dt.datetime(2026, 10, 3, 8, 30, tzinfo=KST)
    seconds = int((awake_until - dt.datetime.now(KST)).total_seconds())
    if seconds > 0:
        subprocess.Popen(['/usr/bin/caffeinate', '-i', '-s', '-t', str(seconds)])
    while True:
        tick(args.state)
        time.sleep(30)


if __name__ == '__main__':
    main()
