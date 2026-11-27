import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { TAROT_CARDS } from "../../lib/tarot/cards";
import { reserveUnlock } from "../../lib/ai/unlock-credit";
import { SPREAD_POSITIONS } from "../../lib/tarot/draw";
const url=process.env.UNLOCK_RELEASE_TEST_DATABASE_URL;
if(!url)throw new Error("Explicit release test URL required");
const target=new URL(url);
if(!['127.0.0.1','localhost'].includes(target.hostname)||target.pathname!=='/tarot_credit_task3'||target.username!=='credit_test'||target.search||target.hash)throw new Error('Isolated test target required');
const db=new PrismaClient({datasources:{db:{url}}});
const users:string[]=[];
const cards=SPREAD_POSITIONS.map((position,i)=>({position,cardId:TAROT_CARDS[i].id,orientation:'upright'}));
const events='.model-compare/v7-credit-task8/provider-events.jsonl', hold='.model-compare/v7-credit-task8/release-hold.flag';
const calls=()=>fs.existsSync(events)?fs.readFileSync(events,'utf8').trim().split('\n').filter(Boolean).length:0;
async function seed(credits=20,question='E2E_RELEASE_SUCCESS',prefix='task8') {
 const id=`task8-user-${randomUUID()}`;users.push(id);
 const user=await db.user.create({data:{id,email:`${id}@test.invalid`,passwordHash:await hash('release-password-123',4),emailVerifiedAt:new Date(),credits}});
 const reading=await db.reading.create({data:{id:`${prefix}-${randomUUID()}`,userId:id,question,cards}});return {user,reading};
}
async function pickCards(page:Page) {
 const wheel=page.getByRole('group',{name:/^Vòng bài/});
 await expect(page.getByRole('button',{name:/^Chọn lá thứ/}).first()).toBeEnabled();
 const box=await wheel.boundingBox();if(!box)throw new Error('Missing card wheel');
 const point={x:box.x+box.width/2,y:box.y+60};
 for(let i=1;i<=3;i++) {
  await page.waitForFunction(({x,y})=>document.elementFromPoint(x,y)?.closest('button[aria-label^="Chọn lá thứ"]:not([disabled])')!=null,point);
  await page.mouse.click(point.x,point.y);await expect(page.getByText(new RegExp(i===3?'Đã chọn đủ 3 lá':`Đã chọn ${i}/3`))).toBeVisible();
 }
}
async function login(page:Page,email:string) {
 await page.goto('/login');await page.getByPlaceholder('Email').fill(email);await page.getByPlaceholder('Mật khẩu').fill('release-password-123');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await expect(page).toHaveURL('/');
}
async function history(page:Page,question:string) {await page.goto('/history');const item=page.locator('details').filter({hasText:question});await item.locator('summary').click();return item;}
const saved=(page:Page)=>page.getByText('Tổng quan kiểm thử release được lưu từ phản hồi provider giả.',{exact:true});
const balance=async(id:string)=>(await db.user.findUniqueOrThrow({where:{id}})).credits;
const ledger=(id:string)=>db.creditTransaction.findMany({where:{userId:id},orderBy:{createdAt:'asc'}});
test.beforeAll(async()=>{
 fs.mkdirSync('.model-compare/v7-credit-task8',{recursive:true});
 await db.rateLimit.deleteMany();
 await db.appSetting.upsert({where:{key:'ai.model'},update:{value:'deepseek-flash'},create:{key:'ai.model',value:'deepseek-flash'}});
 await db.$executeRaw`CREATE OR REPLACE FUNCTION task8_release_refund_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."relatedReadingId" LIKE 'task8-refund-fault-%' AND NEW.type = 'REFUND' THEN RAISE EXCEPTION 'Synthetic refund rejection'; END IF; RETURN NEW; END; $$`;
 await db.$executeRaw`CREATE TRIGGER task8_release_refund_fault BEFORE INSERT ON "CreditTransaction" FOR EACH ROW EXECUTE FUNCTION task8_release_refund_fault()`;
});
test.beforeEach(async({page})=>{
 if(fs.existsSync(hold))fs.unlinkSync(hold);
 await page.addInitScript(()=>localStorage.setItem('tarot:analyticsConsent','denied'));
 await page.context().route('**/*',route=>{const u=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)?route.continue():route.abort();});
});
test.afterEach(async()=>{fs.writeFileSync(hold,'release');await db.user.deleteMany({where:{id:{in:users.splice(0)}}});});
test.afterAll(async()=>{await db.$executeRaw`DROP TRIGGER IF EXISTS task8_release_refund_fault ON "CreditTransaction"`;await db.$executeRaw`DROP FUNCTION IF EXISTS task8_release_refund_fault()`;await db.$disconnect();});
test('main page draws, saves and unlocks once with persisted v7 identity',async({page})=>{
 const {user}=await seed();await login(page,user.email);const before=calls();
 await page.getByLabel('Câu hỏi của bạn').fill('E2E_RELEASE_SUCCESS_MAIN');await page.getByRole('button',{name:'Bốc 3 lá bài'}).click();await pickCards(page);await page.getByRole('button',{name:'Mở lá bài'}).click();
 await page.getByRole('button',{name:/Mở khóa diễn giải/}).click();await expect(saved(page)).toBeVisible();
 const rows=await db.aiInterpretation.findMany({where:{reading:{userId:user.id}}});expect(rows).toHaveLength(1);expect(rows[0]).toMatchObject({promptVersion:'v7-2026-10-06',model:'deepseek-flash'});expect(await balance(user.id)).toBe(10);expect(await ledger(user.id)).toHaveLength(1);expect(calls()-before).toBe(1);
});
test('history unlock and reload reuse one committed result without charging again',async({page})=>{
 const {user,reading}=await seed();await login(page,user.email);await history(page,reading.question);const before=calls();await page.getByRole('button',{name:/Mở khóa diễn giải/}).click();await expect(saved(page)).toBeVisible();
 await history(page,reading.question);await expect(saved(page)).toBeVisible();expect(calls()-before).toBe(1);expect(await balance(user.id)).toBe(10);expect(await ledger(user.id)).toHaveLength(1);
});
test('insufficient balance never calls provider or creates a spend',async({page})=>{
 const {user,reading}=await seed(0);await login(page,user.email);const before=calls();await history(page,reading.question);await expect(page.getByRole('link',{name:/Nạp thêm để tiếp tục/})).toBeVisible();await expect(page.getByRole('button',{name:/Mở khóa diễn giải/})).toHaveCount(0);expect(calls()).toBe(before);expect(await ledger(user.id)).toHaveLength(0);
});
test('provider failure refunds once and explicit retry creates only the next valid attempt',async({page})=>{
 const {user,reading}=await seed(20,`E2E_RELEASE_FAIL_ONCE ${randomUUID()}`);await login(page,user.email);await history(page,reading.question);const before=calls();await page.getByRole('button',{name:/Mở khóa diễn giải/}).click();await expect(page.getByText(/Credit đã được hoàn/)).toBeVisible();expect(await balance(user.id)).toBe(20);
 await page.getByRole('button',{name:'Thử lại',exact:true}).click();await expect(saved(page)).toBeVisible();expect(await balance(user.id)).toBe(10);expect((await ledger(user.id)).map(r=>r.amount)).toEqual([-10,10,-10]);expect(calls()-before).toBe(2);
});
test('synthetic provider timeout with failed refund stays pending then authenticated recovery refunds once',async({page,request})=>{
 const {user,reading}=await seed(20,'E2E_RELEASE_ABORT','task8-refund-fault');await login(page,user.email);await history(page,reading.question);const before=calls();await page.getByRole('button',{name:/Mở khóa diễn giải/}).click();await expect(page.getByRole('button',{name:'Kiểm tra trạng thái'})).toBeVisible();await expect(page.getByRole('button',{name:/Thử lại|Mở khóa diễn giải/})).toHaveCount(0);expect(await balance(user.id)).toBe(10);
 expect((await db.unlockOperation.findUniqueOrThrow({where:{readingId:reading.id}})).status).toBe('PROCESSING');
 await db.$executeRaw`UPDATE "UnlockOperation" SET "expiresAt"=clock_timestamp()-interval '1 second' WHERE "readingId"=${reading.id}`;
 await db.$executeRaw`ALTER TABLE "CreditTransaction" DISABLE TRIGGER task8_release_refund_fault`;
 try {
  for(let i=0;i<2;i++){const response=await request.get('/api/cron/recover-unlocks',{headers:{authorization:'Bearer release-test-only-dedicated-recovery-key'}});expect(response.status()).toBe(200);}
 }finally{await db.$executeRaw`ALTER TABLE "CreditTransaction" ENABLE TRIGGER task8_release_refund_fault`;}
 await page.getByRole('button',{name:'Kiểm tra trạng thái'}).click();await expect(page.getByText(/Credit đã được hoàn/)).toBeVisible();expect(await balance(user.id)).toBe(20);expect((await ledger(user.id)).map(r=>r.amount)).toEqual([-10,10]);expect(calls()-before).toBe(1);
});
test('lost postcommit action response recovers through status without another charge or generation',async({page})=>{
 const {user,reading}=await seed();await login(page,user.email);await history(page,reading.question);await expect(page.getByRole('button',{name:/Mở khóa diễn giải/})).toBeVisible();const before=calls();let dropped=false;
 await page.route('**/history',async route=>{if(!dropped&&route.request().method()==='POST'&&route.request().headers()['next-action']){await route.fetch();dropped=true;await route.abort('failed');}else await route.continue();});
 await page.getByRole('button',{name:/Mở khóa diễn giải/}).click();await expect(page.getByRole('button',{name:'Kiểm tra trạng thái'})).toBeVisible();await page.getByRole('button',{name:'Kiểm tra trạng thái'}).click();await expect(saved(page)).toBeVisible();expect(dropped).toBe(true);expect(calls()-before).toBe(1);expect(await balance(user.id)).toBe(10);expect(await ledger(user.id)).toHaveLength(1);
});
test('another tab sees processing and cannot start a second generation',async({page})=>{
 const {user,reading}=await seed(20,'E2E_RELEASE_HOLD');await login(page,user.email);await history(page,reading.question);const before=calls();await page.getByRole('button',{name:/Mở khóa diễn giải/}).click();await expect.poll(()=>calls()).toBe(before+1);
 const peer=await page.context().newPage();try{await history(peer,reading.question);await expect(peer.getByRole('button',{name:'Kiểm tra trạng thái'})).toBeVisible();await expect(peer.getByRole('button',{name:/Mở khóa diễn giải/})).toHaveCount(0);fs.writeFileSync(hold,'release');await expect(saved(page)).toBeVisible();await peer.getByRole('button',{name:'Kiểm tra trạng thái'}).click();await expect(saved(peer)).toBeVisible();expect(calls()-before).toBe(1);expect(await balance(user.id)).toBe(10);}finally{fs.writeFileSync(hold,'release');await peer.close();}
});
test('legacy history is readable without opening another operation',async({page})=>{
 const {user,reading}=await seed();await db.aiInterpretation.create({data:{readingId:reading.id,model:'gemini-3-flash-preview',promptVersion:'v0-legacy',overview:'Nội dung legacy task8',perCard:SPREAD_POSITIONS.map(position=>({position,text:'Lá cũ'})),connections:'Liên hệ cũ',actionSuggestions:'Hành động legacy task8',reflectiveQuestion:'Câu hỏi cũ?'}});await login(page,user.email);const before=calls();await history(page,reading.question);await expect(page.getByText('Nội dung legacy task8',{exact:true})).toBeVisible();await expect(page.getByText('Hành động legacy task8',{exact:true})).toBeVisible();expect(calls()).toBe(before);expect(await balance(user.id)).toBe(20);expect(await ledger(user.id)).toHaveLength(0);
});
test('recovery endpoint rejects unauthorized requests without changing money',async({request})=>{
 const {user,reading}=await seed();
 expect((await reserveUnlock(db,user.id,reading.id,{model:'deepseek-flash',promptVersion:'v7-2026-10-06'})).status).toBe('reserved');
 await db.$executeRaw`UPDATE "UnlockOperation" SET "expiresAt"=clock_timestamp()-interval '1 second' WHERE "readingId"=${reading.id}`;
 const before=calls();expect((await request.get('/api/cron/recover-unlocks')).status()).toBe(401);expect((await request.get('/api/cron/recover-unlocks',{headers:{authorization:'Bearer release-test-only-cron-secret'}})).status()).toBe(401);expect(await balance(user.id)).toBe(10);expect(await ledger(user.id)).toHaveLength(1);expect((await db.unlockOperation.findUniqueOrThrow({where:{readingId:reading.id}})).status).toBe('PROCESSING');expect(calls()).toBe(before);
});
