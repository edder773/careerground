/* global console, process */
import { LocalD1 } from '../../deployment/sites/local-d1.js';

const destination = process.argv[2];
if (!destination) {
  console.error('Usage: tsx scripts/data-integrity/create-local-snapshot.ts <database.sqlite>');
  process.exit(64);
}

const database = new LocalD1(destination);
database.close();
console.log(`Applied all D1 migrations to ${destination}`);
