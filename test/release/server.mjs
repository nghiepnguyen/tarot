import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
fs.mkdirSync('.model-compare/v7-credit-task8', { recursive: true });
const database = process.env.UNLOCK_RELEASE_TEST_DATABASE_URL;
if(!database)throw new Error('Explicit release test URL required');
const target=new URL(database);
if(!['postgres:','postgresql:'].includes(target.protocol)||!['127.0.0.1','localhost'].includes(target.hostname)||target.pathname!=='/tarot_credit_task3'||target.username!=='credit_test'||target.search||target.hash)throw new Error('Only isolated local release database allowed');
const env=Object.fromEntries(['PATH','HOME','TMPDIR','USER','SHELL'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
for(const name of fs.readdirSync('.').filter(n=>n.startsWith('.env')&&fs.statSync(n).isFile())) {
 for(const match of fs.readFileSync(name,'utf8').matchAll(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/gm))env[match[1]]='';
}
Object.assign(env,{NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',DATABASE_URL:database,AUTH_SECRET:'release-test-only-auth-secret-not-production',AUTH_URL:'http://127.0.0.1:3008',AUTH_TRUST_HOST:'true',SENTRY_AUTH_TOKEN:'',SENTRY_DSN:'',NEXT_PUBLIC_SENTRY_DSN:'',GEMINI_API_KEY:'',DEEPSEEK_API_KEY:'release-test-only-key',CRON_SECRET:'release-test-only-cron-secret',UNLOCK_RECOVERY_SECRET:'release-test-only-dedicated-recovery-key'});
const build=process.argv.includes('--build');
if(!build)Object.assign(env,{UNLOCK_RELEASE_FAKE_PROVIDER:'1',UNLOCK_RELEASE_PROVIDER_EVENTS:path.resolve('.model-compare/v7-credit-task8/provider-events.jsonl'),UNLOCK_RELEASE_HOLD_FILE:path.resolve('.model-compare/v7-credit-task8/release-hold.flag'),NODE_OPTIONS:`--import=${pathToFileURL(path.resolve('test/release/provider-preload.mjs')).href}`});
const child=spawn(process.execPath,['node_modules/next/dist/bin/next',...(build?['build']:['start','--hostname','127.0.0.1','--port','3008'])],{env,stdio:'inherit'});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??1));
