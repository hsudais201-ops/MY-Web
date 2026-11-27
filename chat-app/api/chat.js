import { neon } from "@neondatabase/serverless";
import { createHash, randomBytes } from "node:crypto";
const json=(res,data,status=200)=>res.status(status).setHeader("Cache-Control","no-store").json(data);
const clean=v=>String(v??"").trim(), valid=v=>/^[\p{L}\p{N}_. -]{2,24}$/u.test(v), key=v=>clean(v).toLowerCase();
const hash=v=>createHash("sha256").update(v).digest("hex");
function database(){if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is not configured. Connect a Neon Postgres database to this Vercel project.");return neon(process.env.DATABASE_URL)}
async function schema(sql){
 await sql`CREATE TABLE IF NOT EXISTS chat_sessions (username_key TEXT PRIMARY KEY, username TEXT NOT NULL, session_token_hash TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL)`;
 await sql`CREATE TABLE IF NOT EXISTS chat_messages (id TEXT PRIMARY KEY, sender_key TEXT NOT NULL, receiver_key TEXT NOT NULL, sender_name TEXT NOT NULL, receiver_name TEXT NOT NULL, sender_session_hash TEXT NOT NULL, body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
 await sql`CREATE INDEX IF NOT EXISTS chat_messages_sender_idx ON chat_messages(sender_key, created_at DESC)`;
 await sql`CREATE INDEX IF NOT EXISTS chat_messages_receiver_idx ON chat_messages(receiver_key, created_at DESC)`;
}
async function session(sql,username,token){if(!valid(username)||!token)return false;const rows=await sql`SELECT 1 FROM chat_sessions WHERE username_key=${key(username)} AND session_token_hash=${hash(token)} AND expires_at>NOW()`;return rows.length>0}
export default async function handler(req,res){
 if(req.method==="OPTIONS")return res.status(204).end();
 if(!["GET","POST"].includes(req.method))return json(res,{error:"Method not allowed."},405);
 let sql;try{sql=database();await schema(sql)}catch(e){return json(res,{error:e.message||"Database unavailable."},503)}
 try{
  if(req.method==="POST"){
   const b=req.body&&typeof req.body==="object"?req.body:{};const action=b.action||"send";
   if(action==="register"){
    const username=clean(b.username),oldToken=String(b.sessionToken||"");if(!valid(username))return json(res,{error:"Enter a valid username."},400);
    const sessionToken=randomBytes(32).toString("base64url"),tokenHash=hash(sessionToken),usernameKey=key(username);
    const rows=await sql`WITH prior AS (SELECT session_token_hash,expires_at FROM chat_sessions WHERE username_key=${usernameKey}), claimable AS (SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM prior WHERE expires_at>NOW() AND session_token_hash<>${tokenHash} AND session_token_hash<>${hash(oldToken)})), wiped AS (DELETE FROM chat_messages WHERE (sender_key=${usernameKey} OR receiver_key=${usernameKey}) AND EXISTS (SELECT 1 FROM claimable) AND EXISTS (SELECT 1 FROM prior WHERE expires_at<=NOW()) RETURNING id), saved AS (INSERT INTO chat_sessions(username_key,username,session_token_hash,expires_at) SELECT ${usernameKey},${username},${tokenHash},NOW()+INTERVAL '30 days' FROM claimable ON CONFLICT(username_key) DO UPDATE SET username=EXCLUDED.username,session_token_hash=EXCLUDED.session_token_hash,expires_at=EXCLUDED.expires_at WHERE chat_sessions.expires_at<=NOW() OR chat_sessions.session_token_hash=${hash(oldToken)} RETURNING username,expires_at) SELECT username,expires_at FROM saved`;
    if(!rows.length)return json(res,{error:"That username is currently in use. Choose another one."},409);
    return json(res,{ok:true,username:rows[0].username,expiresAt:rows[0].expires_at,sessionToken});
   }
   const username=clean(b.username),token=String(req.headers.authorization||"").replace(/^Bearer\s+/i,"");if(!await session(sql,username,token))return json(res,{error:"Your guest session expired. Choose your username again."},401);
   if(action!=="send")return json(res,{error:"Unknown action."},400);
   const receiver=clean(b.receiver),body=String(b.body||"").trim();if(!valid(receiver)||key(receiver)===key(username))return json(res,{error:"Enter a valid different recipient."},400);if(!body)return json(res,{error:"Write a message first."},400);if(body.length>3000)return json(res,{error:"Messages must be 3,000 characters or fewer."},400);
   const recent=await sql`SELECT COUNT(*)::int AS total FROM chat_messages WHERE sender_session_hash=${hash(token)} AND created_at>NOW()-INTERVAL '1 minute'`;if(recent[0].total>=20)return json(res,{error:"You are sending messages too quickly. Wait a minute."},429);
   const id=randomBytes(16).toString("hex");await sql`INSERT INTO chat_messages(id,sender_key,receiver_key,sender_name,receiver_name,sender_session_hash,body) VALUES(${id},${key(username)},${key(receiver)},${username},${receiver},${hash(token)},${body})`;return json(res,{ok:true,id},201);
  }
  const username=clean(req.query.username),token=String(req.headers.authorization||"").replace(/^Bearer\s+/i,"");if(!await session(sql,username,token))return json(res,{error:"Your guest session expired. Choose your username again."},401);
  const action=req.query.action;if(action==="messages"){const peer=clean(req.query.peer);if(!valid(peer)||key(peer)===key(username))return json(res,{messages:[]});const rows=await sql`SELECT id,sender_key,receiver_key,sender_name,receiver_name,body,created_at FROM chat_messages WHERE (sender_key=${key(username)} AND receiver_key=${key(peer)}) OR (sender_key=${key(peer)} AND receiver_key=${key(username)}) ORDER BY created_at DESC LIMIT 300`;return json(res,{messages:rows.reverse()})}
  if(action==="contacts"){const rows=await sql`SELECT id,sender_key,receiver_key,sender_name,receiver_name,body,created_at FROM chat_messages WHERE sender_key=${key(username)} OR receiver_key=${key(username)} ORDER BY created_at DESC LIMIT 300`;return json(res,{messages:rows})}
  return json(res,{error:"Unknown action."},400);
 }catch(e){console.error("Chat API error",e);return json(res,{error:"The chat service could not complete that request."},500)}
}