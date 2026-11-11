// CV03 N1-05c-08. One real, independent OS process running in the
// EXISTING Tokyo preview EVO container. Credentials arrive only on stdin;
// no source or resource DML, no trusted Host claim from a user/Agent request.
// A connection failure is fatal to this process: never trust stale ALLOW.
import {readFileSync} from "node:fs";
import postgres from "postgres";

const [login,hostId,mode]=process.argv.slice(1);
const pairs=new Map([
  ["cv03_n105c_qa_tcp_producer","tokyo-qa-host-01"],
  ["cv03_n105c07_qa_host02","tokyo-qa-host-02"]
]);
if(pairs.get(login)!==hostId||
   !["overlap","frozen","disconnect"].includes(mode))
  throw Error("CV03_N105C08_WORKER_TRUSTED_ARGS_INVALID");
const password=readFileSync(0,"utf8").trim();
if(!/^[a-f0-9]{64}$/.test(password))
  throw Error("CV03_N105C08_WORKER_SECRET_INPUT_INVALID");

const db=postgres(
  "postgres://"+encodeURIComponent(login)+":"+
  encodeURIComponent(password)+"@postgres:5432/cv03_n105b_qa",
  {max:1,prepare:false,connect_timeout:5,idle_timeout:10}
);
try {
  const identity=await db.unsafe(
    "SELECT session_user AS login,current_database() AS db,pg_backend_pid() AS pid"
  );
  if(identity.length!==1||identity[0].login!==login||
     identity[0].db!=="cv03_n105b_qa"||
     !Number.isSafeInteger(identity[0].pid))
    throw Error("CV03_N105C08_REAL_PG_SESSION_IDENTITY_INVALID");
  if(mode==="overlap") {
    const rows=await db.unsafe(
      "SELECT session_user AS login,current_database() AS db,"+
      "pg_backend_pid() AS pid,pg_sleep(7) AS delay "+
      "/* cv03_n105c08_two_distinct_os_processes */"
    );
    if(rows.length!==1||rows[0].login!==login||
       rows[0].db!=="cv03_n105b_qa")
      throw Error("CV03_N105C08_OVERLAP_SESSION_DRIFT");
    console.log("CV03_N105C08_WORKER_OS_PROCESS_OVERLAP_PASS|"+hostId);
  } else if(mode==="frozen") {
    let denied=false;
    try {
      // Real owner SECURITY DEFINER T0: trusted QA source is already FROZEN.
      // No DML can succeed on this path. No Host IDs accepted from HTTP.
      await db.unsafe(
        "SELECT * FROM cv03_n105b_qa.cv03_n105b_commit_deny_t0("+
        "$1::text,$2::text,$3::text,$4::text,$5::text,"+
        "$6::text,$7::text,$8::bigint,$9::text,$10::text)",
        [hostId,"qa-n105c08-"+hostId+"-blocked",
         "enterprise-context:qa-ent-01","qa-ent-01",
         "qa-human-01","HUMAN","qa-gen-20261111",0,
         "AUTHORIZATION_REVOKE","collection.saved-view.personal.save"]
      );
    } catch(err) {
      denied=String(err?.message??"").includes("CV03_QA_FEATURE_FROZEN");
    }
    if(!denied)throw Error("CV03_N105C08_FROZEN_OWNER_ACCEPTED_OR_UNVERIFIABLE");
    console.log("CV03_N105C08_WORKER_AUTHENTIC_OWNER_FROZEN_DENIED_PASS|"+hostId);
  } else {
    let failed=false;
    try {
      // The controlling host kills ONLY this exact role+QA query backend;
      // the test process then terminates rather than using cached authority.
      await db.unsafe(
        "SELECT session_user AS login,pg_backend_pid() AS pid,"+
        "pg_sleep(25) AS delay "+
        "/* cv03_n105c08_forced_qa_backend_termination */"
      );
    } catch {
      failed=true;
    }
    if(!failed)throw Error("CV03_N105C08_DATABASE_CONNECTION_LOSS_NOT_OBSERVED");
    console.log("CV03_N105C08_WORKER_BACKEND_DISCONNECT_FAIL_CLOSED_PASS|"+hostId);
  }
} finally {
  try {await db.end({timeout:2});} catch {}
}
