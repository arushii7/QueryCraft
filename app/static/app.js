const $ = (id) => document.getElementById(id);
let latestSql = "";
let sampleSchema = "";

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}
async function api(path, options={}) {
  const response = await fetch(path, {
    headers: {"Content-Type":"application/json", ...(options.headers || {})},
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Request failed.");
  return data;
}
function updateCounts() {
  $("schemaCount").textContent = `${$("schemaInput").value.length} characters`;
  $("questionCount").textContent = `${$("questionInput").value.length} / 1500`;
}
function setBusy(button, busy, label) {
  button.disabled = busy;
  if (busy) { button.dataset.old = button.innerHTML; button.textContent = label; }
  else if (button.dataset.old) button.innerHTML = button.dataset.old;
}
function renderResult(data) {
  latestSql = data.sql || "";
  $("resultsSection").hidden = false;
  $("sqlOutput").textContent = latestSql || "-- No SQL query generated";
  $("explanationOutput").textContent = data.explanation || "No explanation returned.";
  $("modelName").textContent = data.model || "—";
  $("usedVersion").textContent = (data.prompt_version || "").toUpperCase();
  $("validationMessage").textContent = data.validation_message || "";
  const badge = $("validationBadge");
  badge.textContent = data.valid ? "VALID SELECT" : "NEEDS REVIEW";
  badge.className = "result-badge " + (data.valid ? "good" : "bad");
  $("tableCard").hidden = true;
  $("resultsSection").scrollIntoView({behavior:"smooth", block:"start"});
}
async function generate(version=$("promptVersion").value, question=$("questionInput").value) {
  const schema = $("schemaInput").value.trim();
  if (!schema) throw new Error("Please provide a database schema.");
  if (question.trim().length < 3) throw new Error("Please enter a question in plain English.");
  return api("/api/generate", {method:"POST", body:JSON.stringify({
    question, schema, version, sample_rows:""
  })});
}
async function generateMain() {
  const btn = $("generateBtn");
  setBusy(btn, true, "Crafting SQL…");
  try {
    const data = await generate();
    renderResult(data);
    toast(data.valid ? "SQL generated and validated." : "SQL generated. Review the validation warning.");
  } catch (err) { toast(err.message); }
  finally { setBusy(btn, false); }
}
async function checkHealth() {
  try {
    const data = await api("/api/health");
    $("apiDot").classList.toggle("online", data.api_key_configured);
    $("apiStatus").textContent = data.api_key_configured ? `API READY · ${data.model}` : "GROQ / OPENROUTER KEY NEEDED";
    if (!data.api_key_configured) $("apiStatus").title = "Add GROQ_API_KEY and/or OPENROUTER_API_KEY to .env, then restart QueryCraft.";
  } catch {
    $("apiStatus").textContent = "SERVER OFFLINE";
  }
}
function renderTable(data) {
  const card = $("tableCard");
  card.hidden = false;
  $("rowCount").textContent = `${data.row_count} rows returned (max 100)`;
  if (!data.columns.length) { $("tableWrap").textContent = "No rows returned."; return; }
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tr = document.createElement("tr");
  data.columns.forEach(col => { const th=document.createElement("th"); th.textContent=col; tr.appendChild(th); });
  thead.appendChild(tr); table.appendChild(thead);
  const tbody = document.createElement("tbody");
  data.rows.forEach(row => {
    const rowEl=document.createElement("tr");
    data.columns.forEach(col => { const td=document.createElement("td"); td.textContent=row[col] ?? "NULL"; rowEl.appendChild(td); });
    tbody.appendChild(rowEl);
  });
  table.appendChild(tbody);
  $("tableWrap").replaceChildren(table);
  card.scrollIntoView({behavior:"smooth", block:"nearest"});
}
async function validateCurrent() {
  if (!latestSql) return toast("Generate a query first.");
  try {
    const result = await api("/api/validate", {method:"POST", body:JSON.stringify({sql:latestSql})});
    $("validationMessage").textContent = result.message;
    $("validationBadge").textContent = result.valid ? "VALID SELECT" : "NEEDS REVIEW";
    $("validationBadge").className = "result-badge " + (result.valid ? "good" : "bad");
    toast(result.message);
  } catch (err) { toast(err.message); }
}
async function executeCurrent() {
  if (!latestSql) return toast("Generate a query first.");
  const btn=$("executeBtn"); setBusy(btn,true,"Executing…");
  try {
    const result=await api("/api/execute",{method:"POST",body:JSON.stringify({sql:latestSql})});
    renderTable(result); toast(`Query executed. ${result.row_count} rows returned.`);
  } catch(err) { toast(err.message); }
  finally { setBusy(btn,false); }
}
async function comparePrompts() {
  const btn=$("compareBtn"); setBusy(btn,true,"Running four experiments…");
  $("comparisonResults").replaceChildren();
  try {
    const versions=["v1","v2","v3","v4"];
    for (const version of versions) {
      const card=document.createElement("div"); card.className="comparison-card";
      const title=document.createElement("h3"); title.textContent=version.toUpperCase()+" · "+({v1:"Baseline",v2:"Schema-aware",v3:"Few-shot",v4:"Guarded"}[version]);
      const pre=document.createElement("pre"); pre.textContent="Generating…";
      const p=document.createElement("p"); p.textContent="Waiting for model response.";
      card.append(title,pre,p); $("comparisonResults").appendChild(card);
      try {
        const data=await generate(version);
        pre.textContent=data.sql || "No SQL returned.";
        p.textContent=(data.valid?"✓ ":"⚠ ")+data.validation_message+" "+data.explanation;
      } catch(err) { pre.textContent="Experiment failed"; p.textContent=err.message; }
    }
    toast("Prompt comparison completed. Record the results in your experiment log.");
  } finally { setBusy(btn,false); }
}

$("generateBtn").addEventListener("click",generateMain);
$("schemaInput").addEventListener("input",updateCounts);
$("questionInput").addEventListener("input",updateCounts);
$("promptVersion").addEventListener("change", async () => {
  try { const data=await api("/api/prompts"); $("promptDescription").textContent=data[$("promptVersion").value].description; } catch {}
});
$("loadSample").addEventListener("click",()=>{ $("schemaInput").value=sampleSchema; updateCounts(); toast("Sample schema loaded."); });
$("resetSchema").addEventListener("click",()=>{ $("schemaInput").value=sampleSchema; updateCounts(); });
$("clearQuestion").addEventListener("click",()=>{ $("questionInput").value=""; updateCounts(); });
document.querySelectorAll("[data-question]").forEach(btn=>btn.addEventListener("click",()=>{ $("questionInput").value=btn.dataset.question; updateCounts(); $("questionInput").focus(); }));
$("copySql").addEventListener("click",async()=>{if(!latestSql)return toast("Nothing to copy.");await navigator.clipboard.writeText(latestSql);toast("SQL copied.");});
$("validateSql").addEventListener("click",validateCurrent);
$("executeBtn").addEventListener("click",executeCurrent);
$("compareBtn").addEventListener("click",comparePrompts);
$("showPromptInfo").addEventListener("click",()=>{$("promptLab").hidden=false;$("promptLab").scrollIntoView({behavior:"smooth"});});
$("questionInput").addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter")generateMain();});
async function init() {
  try {
    const data=await api("/api/sample");
    sampleSchema=data.schema;
    $("schemaInput").value=sampleSchema;
    $("promptDescription").textContent=data.prompt_versions.v3.description;
  } catch {}
  updateCounts(); checkHealth();
}
init();
