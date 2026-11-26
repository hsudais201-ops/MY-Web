const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const cleanName=value=>String(value||"").trim();
const validName=value=>/^[\p{L}\p{N}_. -]{2,24}$/u.test(value);
const nameKey=value=>cleanName(value).toLocaleLowerCase();
async function ready(db){
  await db.prepare("CREATE TABLE IF NOT EXISTS chat_messages (id TEXT PRIMARY KEY, sender_key TEXT NOT NULL, receiver_key TEXT NOT NULL, sender_name TEXT NOT NULL, receiver_name TEXT NOT NULL, guest_id TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender_key, created_at)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_chat_receiver ON chat_messages(receiver_key, created_at)").run();
}
export async function onRequestGet({request,env}){
  if(!env.CINEFLIX_DB)return json({error:"Chat database is not configured. The existing CINEFLIX_DB binding is required."},503);
  const url=new URL(request.url),action=url.searchParams.get("action"),username=cleanName(url.searchParams.get("username")),peer=cleanName(url.searchParams.get("peer"));
  if(!validName(username))return json({error:"Enter a valid username."},400);
  await ready(env.CINEFLIX_DB);
  if(action==="messages"){
    if(!validName(peer)||nameKey(peer)===nameKey(username))return json({messages:[]});
    const {results}=await env.CINEFLIX_DB.prepare("SELECT id,sender_key,receiver_key,sender_name,receiver_name,body,created_at FROM chat_messages WHERE (sender_key=? AND receiver_key=?) OR (sender_key=? AND receiver_key=?) ORDER BY created_at ASC LIMIT 300").bind(nameKey(username),nameKey(peer),nameKey(peer),nameKey(username)).all();
    return json({messages:results||[]});
  }
  if(action==="contacts"){
    const {results}=await env.CINEFLIX_DB.prepare("SELECT id,sender_key,receiver_key,sender_name,receiver_name,body,created_at FROM chat_messages WHERE sender_key=? OR receiver_key=? ORDER BY created_at DESC LIMIT 300").bind(nameKey(username),nameKey(username)).all();
    return json({messages:results||[]});
  }
  return json({error:"Unknown chat action."},400);
}
export async function onRequestPost({request,env}){
  if(!env.CINEFLIX_DB)return json({error:"Chat database is not configured. The existing CINEFLIX_DB binding is required."},503);
  let input;try{input=await request.json()}catch{return json({error:"Invalid JSON body."},400)}
  const sender=cleanName(input.sender),receiver=cleanName(input.receiver),body=String(input.body||"").trim(),guestId=String(input.guestId||"").slice(0,80);
  if(!validName(sender)||!validName(receiver))return json({error:"Sender and receiver usernames must be 2–24 characters."},400);
  if(nameKey(sender)===nameKey(receiver))return json({error:"You cannot message yourself."},400);
  if(!body)return json({error:"Write a message first."},400);
  if(body.length>3000)return json({error:"Messages must be 3,000 characters or fewer."},400);
  if(!/^[a-zA-Z0-9-]{8,80}$/.test(guestId))return json({error:"Invalid guest session. Refresh the page and try again."},400);
  await ready(env.CINEFLIX_DB);
  const id=crypto.randomUUID(),createdAt=new Date().toISOString();
  await env.CINEFLIX_DB.prepare("INSERT INTO chat_messages (id,sender_key,receiver_key,sender_name,receiver_name,guest_id,body,created_at) VALUES (?,?,?,?,?,?,?,?)").bind(id,nameKey(sender),nameKey(receiver),sender,receiver,guestId,body,createdAt).run();
  return json({ok:true,id,created_at:createdAt},201);
}