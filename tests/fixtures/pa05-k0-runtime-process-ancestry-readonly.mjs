// PA05 / K0 / R5-02: bounded, read-only Linux PID ancestry evidence collector.
//
// Intentionally reads only /proc/<pid>/stat, /proc/<pid>/comm and
// /proc/1/stat. Never reads cmdline, environ, fd, maps, secrets or SQL.
// Never sends signals or forks children. A probe result is NOT an
// attestation that Railway's SIGTERM reaches Node (or a production stop
// receipt). Operator must capture the *actual deployment* separately.
import {readFileSync} from "node:fs";

function identity(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return null;
  let stat;
  try {stat=readFileSync(`/proc/${pid}/stat`,"utf8");}
  catch(e) {
    if (e?.code === "ENOENT" || e?.code === "ESRCH" || e?.code === "EACCES")
      return null;
    throw e;
  }
  const close=stat.lastIndexOf(")");
  if(close < 2) return null;
  const fields=stat.slice(close+1).trim().split(/\s+/);
  const ppid=Number(fields[1]);
  const startTicks=fields[19];
  if(!Number.isSafeInteger(ppid) || ppid < 0 || !/^\d+$/.test(startTicks))
    return null;
  let comm="unknown";
  try {comm=readFileSync(`/proc/${pid}/comm`,"utf8").trim();}
  catch{}
  const executableClass=/^(?:node|nodejs)$/.test(comm) ? "node"
    : /^(?:npm|npm start|npm run.*)$/.test(comm) ? "npm"
    : /^(?:sh|dash|bash|ash)$/.test(comm) ? "shell"
    : comm === "tini" ? "init" : "other-or-unknown";
  return Object.freeze({pid,ppid,startTicks,state:fields[0],executableClass});
}

export function observeK0LinuxRuntimeAncestryReadOnly({
  pid=process.pid,maxDepth=16
}={}) {
  if(process.platform!=="linux")
    return Object.freeze({scope:"linux-readonly-unsupported",
      permittedToAuthorizeStop:false,globalStopCertified:false});
  if(!Number.isSafeInteger(pid)||pid<=0||!Number.isSafeInteger(maxDepth)
    ||maxDepth<1||maxDepth>32) throw new Error("PA05_K0_INVALID_PROBE_ARGS");
  const chain=[],seen=new Set();
  let current=pid,reason="depth-limit";
  while(chain.length<maxDepth) {
    if(seen.has(current)){reason="cycle";break;}
    seen.add(current);
    const row=identity(current);
    if(!row){reason="identity-unavailable";break;}
    chain.push(row);
    if(current===1){reason="reached-pid1";break;}
    if(row.ppid<=0){reason="no-parent-in-namespace";break;}
    current=row.ppid;
  }
  const pid1=identity(1);
  return Object.freeze({
    scope:"single-linux-procfs-namespace-readonly",
    requestedPid:pid,chain,
    chainTerminationReason:reason,
    pid1Identity:pid1,
    pid1WasInAncestry:chain.some(x=>x.pid===1),
    // Ancestry alone cannot establish which process Railway targets with
    // SIGTERM, whether intermediate shells forward it, or any timing budget.
    runtimeSigtermDelivered:false,
    effectiveRailwayDrainingVerified:false,
    independentSupervisorVerified:false,
    productionOperatorAttestationPresent:false,
    permittedToAuthorizeStop:false,
    globalStopCertified:false,
    secretDataRead:false,
    signalSent:false
  });
}
