import datetime as dt
import importlib.util
from pathlib import Path
import tempfile
import unittest
import sys
sys.dont_write_bytecode = True
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('scheduler', Path(__file__).with_name('mac-job-alert-dispatch.py'))
scheduler = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scheduler)

class ScheduleTests(unittest.TestCase):
    def stage(self, value):
        return scheduler.stage_at(dt.datetime.fromisoformat(value).replace(tzinfo=scheduler.KST))

    def test_oct2_morning_production_and_evening_test(self):
        self.assertEqual(self.stage('2026-10-02T07:50:00')['destination'], 'production')
        self.assertIsNone(self.stage('2026-10-02T20:49:59'))
        self.assertEqual(self.stage('2026-10-02T20:50:00')['destination'], 'test')
        self.assertIsNone(self.stage('2026-10-02T21:20:00'))

    def test_weekend_dispatch_is_never_requested(self):
        self.assertIsNone(self.stage('2026-10-03T07:50:00'))
        self.assertIsNone(self.stage('2026-10-04T07:50:00'))
        self.assertFalse(self.stage('2026-10-06T07:50:00')['force'])

    def test_commands_only_dispatch_actions_and_request_time_gate(self):
        test = scheduler.command_for(self.stage('2026-10-02T20:50:00'))
        prod = scheduler.command_for(self.stage('2026-10-06T07:50:00'))
        self.assertIn('job-alert-test.yml', test)
        self.assertIn('hold_until_21=true', test)
        self.assertIn('job-alert.yml', prod)
        self.assertIn('hold_until_08=true', prod)
        self.assertIn('force=false', prod)

    def test_no_retry_for_uncertain_or_sent(self):
        for status in ['SENT', 'UNCERTAIN']:
            with tempfile.TemporaryDirectory() as directory:
                state = Path(directory)/'state.json'
                with patch.object(scheduler,'delivery',return_value=status), patch.object(scheduler,'preflight') as preflight:
                    scheduler.tick(state,dt.datetime(2026,10,2,21,0,tzinfo=scheduler.KST))
                    preflight.assert_not_called()
                    self.assertIn(status,state.read_text())

    def test_first_test_can_start_without_a_test_ledger(self):
        with patch.object(scheduler, 'remote_json', side_effect=FileNotFoundError):
            self.assertIsNone(scheduler.delivery(self.stage('2026-10-02T20:50:00')))
            with self.assertRaises(FileNotFoundError):
                scheduler.delivery(self.stage('2026-10-06T07:50:00'))

    def test_test_delivery_reads_the_requested_batch(self):
        stage = self.stage('2026-10-02T20:50:00')
        def remote(branch, path):
            self.assertEqual(branch, 'job-alert-test-data')
            self.assertEqual(path, 'results/2026-10-02.json')
            return {'batchDate': '2026-10-02', 'mode': 'live', 'status': 'SENT'}
        with patch.object(scheduler, 'remote_json', side_effect=remote):
            self.assertEqual(scheduler.delivery(stage), 'SENT')
        with patch.object(scheduler, 'remote_json', return_value={'batchDate': '2026-10-01', 'mode': 'live', 'status': 'SENT'}):
            self.assertIsNone(scheduler.delivery(stage))

    def test_three_attempt_limit_survives_restart(self):
        with tempfile.TemporaryDirectory() as directory:
            state=Path(directory)/'state.json'
            with patch.object(scheduler,'delivery',return_value=None), patch.object(scheduler,'preflight',return_value={'ready':True,'reason':'ready'}), patch.object(scheduler.subprocess,'run') as run:
                for minute in [50,54,58]:
                    scheduler.tick(state,dt.datetime(2026,10,2,20,minute,tzinfo=scheduler.KST))
                scheduler.tick(state,dt.datetime(2026,10,2,21,2,tzinfo=scheduler.KST))
                self.assertEqual(run.call_count,3)

if __name__=='__main__':unittest.main()
