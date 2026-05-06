import { useState } from "react";
import {
  MODE1_TAXONOMY, MODE2_TAXONOMY, LITERARY_MODES,
  TRADITIONS, CONTEXTS, DEFAULT_CHURCH_CONTEXT
} from "./constants.js";
import {
  SYSTEM_PROMPT_NARRATIVE, SYSTEM_PROMPT_PAULINE,
  BRIDGE_PROMPT, TYPOLOGY_PROMPT, BASICS_PROMPT,
  SERMON_BRIEF_PROMPT, WORD_STUDY_PROMPT
} from "./prompts.js";

async function callClaude(systemPrompt, userMessage, maxTokens = 2000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch("/api/anthropic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: userMessage }]
      }),
      signal: controller.signal
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.content?.map(b => b.text || "").join("") || "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON in response");
    return JSON.parse(text.slice(start, end + 1));
  } finally {
    clearTimeout(timeout);
  }
}

function AgentSidebarItem({ agent, result, loading, selected, onSelect }) {
  const isPresent = result?.present;
  const isNone = result && !result.present;
  return (
    <div onClick={() => (isPresent || loading) && onSelect(agent.id)}
      style={{ display:"flex", alignItems:"center", gap:"9px", padding:"9px 10px",
        background: selected ? `${agent.color}12` : isPresent ? "rgba(255,255,255,0.02)" : "transparent",
        border: selected ? `1px solid ${agent.color}40` : "1px solid transparent",
        borderRadius:"8px", cursor: isPresent ? "pointer" : "default",
        opacity: isNone ? 0.3 : 1, transition:"all 0.15s", marginBottom:"3px" }}>
      <div style={{ width:"7px", height:"7px", borderRadius:"50%", flexShrink:0,
        background: loading ? "rgba(255,255,255,0.2)" : isPresent ? agent.color : "rgba(255,255,255,0.15)",
        animation: loading ? "pulse 1.2s ease-in-out infinite" : "none" }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
          <span style={{ fontSize:"10px", color: isPresent ? agent.color : "rgba(255,255,255,0.3)",
            fontFamily:"'Courier New',monospace", letterSpacing:"0.06em" }}>
            {typeof agent.type === "number" ? `T${agent.type}` : agent.type}
          </span>
          {agent.flagged && <span style={{ fontSize:"8px", color:"#B44AE8", fontFamily:"'Courier New',monospace" }}>⚠</span>}
        </div>
        <div style={{ fontSize:"12px", color: isPresent ? "#F0EDE8" : "rgba(255,255,255,0.3)",
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{agent.name}</div>
      </div>
      {!loading && result && (
        <div style={{ fontSize:"8px", fontFamily:"'Courier New',monospace", flexShrink:0,
          color: isPresent ? `${agent.color}80` : "rgba(255,255,255,0.2)" }}>
          {isPresent ? result.strength?.toUpperCase() : "NONE"}
        </div>
      )}
      {loading && <div style={{ width:"10px", height:"10px", borderRadius:"50%",
        border:`1.5px solid ${agent.color}`, borderTopColor:"transparent",
        animation:"spin 0.8s linear infinite", flexShrink:0 }} />}
    </div>
  );
}

function AgentDetail({ agent, result }) {
  if (!result?.present) return (
    <div style={{ padding:"40px 24px", textAlign:"center", color:"rgba(255,255,255,0.25)" }}>
      <div style={{ fontSize:"13px", fontFamily:"'Courier New',monospace", marginBottom:"8px" }}>NO SIGNAL</div>
      <div style={{ fontSize:"12px", lineHeight:1.6 }}>{agent.diagnostic}</div>
    </div>
  );
  return (
    <div style={{ padding:"24px" }}>
      <div style={{ marginBottom:"18px" }}>
        <div style={{ fontSize:"10px", color:agent.color, fontFamily:"'Courier New',monospace",
          letterSpacing:"0.1em", marginBottom:"6px", display:"flex", alignItems:"center", gap:"8px" }}>
          {typeof agent.type === "number" ? `TYPE ${agent.type}` : `MODE 2 · ${agent.type}`} · {result.strength?.toUpperCase()} SIGNAL
          {agent.flagged && <span style={{ fontSize:"9px", padding:"1px 7px",
            background:"rgba(180,74,232,0.12)", border:"1px solid rgba(180,74,232,0.3)",
            borderRadius:"4px", color:"#B44AE8" }}>EISEGESIS · SPIRIT-LED</span>}
        </div>
        <h2 style={{ fontSize:"20px", color:"#F0EDE8", fontWeight:400, lineHeight:1.25,
          letterSpacing:"-0.02em", fontFamily:"Georgia,serif" }}>{result.headline}</h2>
      </div>
      {result.caution_flag && (
        <div style={{ display:"flex", gap:"10px", alignItems:"flex-start", padding:"10px 14px",
          background:"rgba(180,74,232,0.07)", border:"1px solid rgba(180,74,232,0.2)",
          borderRadius:"8px", marginBottom:"14px" }}>
          <span style={{ color:"#B44AE8", fontSize:"13px", flexShrink:0 }}>⚠</span>
          <p style={{ fontSize:"12px", color:"rgba(180,74,232,0.85)", lineHeight:1.6, margin:0, fontStyle:"italic" }}>{result.caution_flag}</p>
        </div>
      )}
      <div style={{ borderLeft:`2px solid ${agent.color}50`, paddingLeft:"16px", marginBottom:"18px" }}>
        <p style={{ fontSize:"13px", color:"rgba(240,237,232,0.85)", lineHeight:1.8, margin:0, fontFamily:"Georgia,serif" }}>{result.analysis}</p>
      </div>
      {result.ot_source && (
        <div style={{ background:"rgba(74,232,212,0.06)", border:"1px solid rgba(74,232,212,0.2)",
          borderRadius:"8px", padding:"12px 14px", marginBottom:"14px" }}>
          <div style={{ fontSize:"10px", color:"#4AE8D4", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"6px" }}>UNCITED OT SOURCE</div>
          <p style={{ fontSize:"13px", color:"#F0EDE8", lineHeight:1.6, margin:0, fontFamily:"Georgia,serif" }}>{result.ot_source}</p>
        </div>
      )}
      {result.bridges?.length > 0 && (
        <div style={{ marginBottom:"14px" }}>
          <div style={{ fontSize:"10px", color:"#B44AE8", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"10px" }}>BRIDGE MOMENTS</div>
          {result.bridges.map((b,i) => (
            <div key={i} style={{ background:"rgba(180,74,232,0.05)", border:"1px solid rgba(180,74,232,0.15)",
              borderRadius:"8px", padding:"12px 14px", marginBottom:"8px" }}>
              <div style={{ fontSize:"12px", fontWeight:500, color:"#B44AE8", marginBottom:"4px", fontFamily:"Georgia,serif" }}>{b.interior_moment}</div>
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.5)", fontStyle:"italic" }}>→ {b.congregation_mirror}</div>
            </div>
          ))}
        </div>
      )}
      {result.divine_principle && (
        <div style={{ background:`${agent.color}08`, border:`1px solid ${agent.color}20`,
          borderRadius:"8px", padding:"12px 14px", marginBottom:"14px" }}>
          <div style={{ fontSize:"10px", color:agent.color, fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"6px" }}>DIVINE PRINCIPLE</div>
          <p style={{ fontSize:"13px", fontWeight:500, color:"#F0EDE8", lineHeight:1.6, margin:0, fontFamily:"Georgia,serif" }}>{result.divine_principle}</p>
        </div>
      )}
      {result.typological_parallels?.length > 0 && (
        <div style={{ marginBottom:"14px" }}>
          <div style={{ fontSize:"10px", color:agent.color, fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"10px" }}>CANONICAL PARALLELS</div>
          {result.typological_parallels.map((p,i) => (
            <div key={i} style={{ borderLeft:`2px solid ${agent.color}40`, paddingLeft:"14px", marginBottom:"10px" }}>
              <div style={{ fontSize:"12px", fontWeight:600, color:agent.color, marginBottom:"3px", fontFamily:"'Courier New',monospace" }}>{p.passage}</div>
              <div style={{ fontSize:"12px", color:"rgba(240,237,232,0.7)", lineHeight:1.6, marginBottom:"3px" }}>{p.structural_echo}</div>
              <div style={{ fontSize:"11px", color:`${agent.color}70`, fontStyle:"italic" }}>{p.what_connects_them}</div>
            </div>
          ))}
        </div>
      )}
      {result.canonical_connections?.length > 0 && (
        <div style={{ marginBottom:"14px" }}>
          <div style={{ fontSize:"10px", color:agent.color, fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>CANONICAL CONNECTIONS</div>
          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
            {result.canonical_connections.map((ref,i) => (
              <span key={i} style={{ fontSize:"11px", padding:"3px 9px",
                background:`${agent.color}12`, border:`1px solid ${agent.color}30`,
                borderRadius:"5px", color:agent.color, fontFamily:"'Courier New',monospace" }}>{ref}</span>
            ))}
          </div>
        </div>
      )}
      {result.sermon_seed && (
        <div style={{ background:`${agent.color}08`, border:`1px solid ${agent.color}22`, borderRadius:"10px", padding:"14px 16px" }}>
          <div style={{ fontSize:"10px", color:agent.color, fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>
            {result.caution_flag ? "APPLICATION SEED — SPIRIT-DEPENDENT" : "SERMON SEED"}
          </div>
          <p style={{ fontSize:"14px", fontStyle:"italic", color:"#F0EDE8", lineHeight:1.65, margin:0, fontFamily:"Georgia,serif" }}>
            "{result.sermon_seed}"
          </p>
        </div>
      )}
    </div>
  );
}

function BasicsPanel({ data, loading }) {
  if (loading) return (
    <div style={{ padding:"60px 24px", textAlign:"center" }}>
      <div style={{ width:"20px", height:"20px", borderRadius:"50%",
        border:"2px solid #4AE8A0", borderTopColor:"transparent",
        animation:"spin 0.8s linear infinite", margin:"0 auto 14px" }} />
      <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em" }}>BUILDING FOUNDATIONS...</div>
    </div>
  );
  if (!data) return (
    <div style={{ padding:"60px 24px", textAlign:"center" }}>
      <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.25)", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>FOUNDATIONS</div>
      <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.18)", lineHeight:1.65 }}>Run an analysis to generate<br/>pericope, terms, and structure.</div>
    </div>
  );
  return (
    <div style={{ padding:"24px", display:"grid", gap:"14px" }}>
      <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"10px", padding:"16px 18px" }}>
        <div style={{ fontSize:"10px", color:"#7C6AF7", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"10px" }}>PERICOPE</div>
        <div style={{ fontSize:"16px", fontWeight:500, color:"#F0EDE8", fontFamily:"Georgia,serif", marginBottom:"8px" }}>{data.pericope?.reference}</div>
        <p style={{ fontSize:"13px", color:"rgba(240,237,232,0.7)", lineHeight:1.7, margin:"0 0 6px", fontFamily:"Georgia,serif" }}>{data.pericope?.boundaries}</p>
        <div style={{ fontSize:"12px", color:"#7C6AF7", fontStyle:"italic" }}>{data.pericope?.genre}</div>
      </div>
      {data.movement_structure && (
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"10px", padding:"16px 18px" }}>
          <div style={{ fontSize:"10px", color:"#4AE8A0", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"10px" }}>MOVEMENT STRUCTURE</div>
          <div style={{ fontSize:"15px", fontWeight:500, color:"#F0EDE8", fontFamily:"Georgia,serif", marginBottom:"14px" }}>"{data.movement_structure.suggested_title}"</div>
          {data.movement_structure.movements?.map((m,i) => (
            <div key={i} style={{ display:"flex", gap:"10px", alignItems:"flex-start", marginBottom:"10px" }}>
              <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:"rgba(74,232,160,0.1)", border:"1px solid rgba(74,232,160,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:"10px", color:"#4AE8A0", fontFamily:"'Courier New',monospace" }}>{m.number}</span>
              </div>
              <div>
                <div style={{ fontSize:"13px", fontWeight:500, color:"#F0EDE8", fontFamily:"Georgia,serif" }}>{m.name}</div>
                <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.45)" }}>{m.focus}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {data.key_terms?.length > 0 && (
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"10px", padding:"16px 18px" }}>
          <div style={{ fontSize:"10px", color:"#E8834A", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"14px" }}>KEY TERMS</div>
          {data.key_terms.map((t,i) => (
            <div key={i} style={{ borderLeft:"2px solid rgba(232,131,74,0.35)", paddingLeft:"14px", marginBottom:"12px" }}>
              <div style={{ display:"flex", gap:"8px", alignItems:"baseline", marginBottom:"4px", flexWrap:"wrap" }}>
                <span style={{ fontSize:"14px", fontWeight:500, color:"#F0EDE8", fontFamily:"Georgia,serif" }}>{t.term}</span>
                <span style={{ fontSize:"12px", color:"#E8834A", fontFamily:"'Courier New',monospace" }}>{t.original}</span>
                <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.25)", fontFamily:"'Courier New',monospace" }}>{t.strongs}</span>
              </div>
              <p style={{ fontSize:"12px", color:"rgba(240,237,232,0.65)", lineHeight:1.6, margin:"0 0 4px" }}>{t.semantic_range}</p>
              <p style={{ fontSize:"12px", fontStyle:"italic", color:"rgba(232,131,74,0.7)", lineHeight:1.5, margin:0 }}>{t.homiletical_weight}</p>
            </div>
          ))}
        </div>
      )}
      {data.tensions?.length > 0 && (
        <div style={{ background:"rgba(232,74,74,0.04)", border:"1px solid rgba(232,74,74,0.18)", borderRadius:"10px", padding:"16px 18px" }}>
          <div style={{ fontSize:"10px", color:"#E84A4A", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"12px" }}>THEOLOGICAL TENSIONS</div>
          {data.tensions.map((t,i) => (
            <div key={i} style={{ display:"flex", gap:"10px", marginBottom: i < data.tensions.length-1 ? "10px" : 0 }}>
              <span style={{ color:"#E84A4A", fontSize:"15px", lineHeight:1.4 }}>⊘</span>
              <p style={{ fontSize:"13px", color:"rgba(240,237,232,0.8)", lineHeight:1.65, margin:0, fontFamily:"Georgia,serif" }}>{t}</p>
            </div>
          ))}
        </div>
      )}
      {data.first_mention && (
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"10px", padding:"16px 18px" }}>
          <div style={{ fontSize:"10px", color:"#E8D44A", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"10px" }}>FIRST MENTION PRINCIPLE</div>
          <p style={{ fontSize:"13px", color:"rgba(240,237,232,0.8)", lineHeight:1.7, margin:0, fontFamily:"Georgia,serif" }}>{data.first_mention}</p>
        </div>
      )}
      {data.cross_references?.length > 0 && (
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"10px", padding:"16px 18px" }}>
          <div style={{ fontSize:"10px", color:"#4A9EE8", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"10px" }}>CROSS-REFERENCE MAP</div>
          <div style={{ display:"flex", gap:"7px", flexWrap:"wrap" }}>
            {data.cross_references.map((ref,i) => (
              <span key={i} style={{ fontSize:"12px", padding:"4px 10px", background:"rgba(74,158,232,0.1)", border:"1px solid rgba(74,158,232,0.25)", borderRadius:"6px", color:"#4A9EE8", fontFamily:"'Courier New',monospace" }}>{ref}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SermonBriefPanel({ data, loading }) {
  if (loading) return (
    <div style={{ padding:"60px 24px", textAlign:"center" }}>
      <div style={{ width:"20px", height:"20px", borderRadius:"50%",
        border:"2px solid #7C6AF7", borderTopColor:"transparent",
        animation:"spin 0.8s linear infinite", margin:"0 auto 14px" }} />
      <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em" }}>BUILDING SERMON BRIEF...</div>
    </div>
  );
  if (!data) return (
    <div style={{ padding:"60px 24px", textAlign:"center" }}>
      <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.25)", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>SERMON BRIEF</div>
      <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.18)", lineHeight:1.65 }}>Run an analysis to generate<br/>your personalized sermon brief.</div>
    </div>
  );
  return (
    <div style={{ padding:"24px", display:"grid", gap:"14px" }}>
      <div style={{ background:"linear-gradient(135deg,rgba(124,106,247,0.08),rgba(91,82,196,0.04))", border:"1px solid rgba(124,106,247,0.25)", borderRadius:"12px", padding:"18px 20px" }}>
        <div style={{ fontSize:"10px", color:"#A89AF7", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"10px" }}>THE BIG IDEA</div>
        <p style={{ fontSize:"16px", color:"#F0EDE8", lineHeight:1.5, margin:0, fontFamily:"Georgia,serif", fontWeight:500 }}>{data.big_idea}</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
        <div style={{ background:"rgba(232,74,74,0.05)", border:"1px solid rgba(232,74,74,0.18)", borderRadius:"10px", padding:"14px 16px" }}>
          <div style={{ fontSize:"10px", color:"#E84A4A", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>KEY TENSION</div>
          <p style={{ fontSize:"13px", color:"rgba(240,237,232,0.8)", lineHeight:1.7, margin:0, fontFamily:"Georgia,serif" }}>{data.key_tension}</p>
        </div>
        <div style={{ background:"rgba(74,158,232,0.05)", border:"1px solid rgba(74,158,232,0.18)", borderRadius:"10px", padding:"14px 16px" }}>
          <div style={{ fontSize:"10px", color:"#4A9EE8", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>CONGREGATION NEED</div>
          <p style={{ fontSize:"13px", color:"rgba(240,237,232,0.8)", lineHeight:1.7, margin:0, fontFamily:"Georgia,serif" }}>{data.audience_need}</p>
        </div>
      </div>
      {data.three_points?.length > 0 && (
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"10px", padding:"16px 18px" }}>
          <div style={{ fontSize:"10px", color:"#4AE8A0", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"14px" }}>THREE-POINT STRUCTURE</div>
          {data.three_points.map((pt, i) => (
            <div key={i} style={{ display:"flex", gap:"14px", alignItems:"flex-start", marginBottom: i < data.three_points.length-1 ? "14px" : 0 }}>
              <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(74,232,160,0.1)", border:"1px solid rgba(74,232,160,0.25)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:"11px", color:"#4AE8A0", fontFamily:"'Courier New',monospace" }}>{i+1}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"14px", fontWeight:600, color:"#F0EDE8", fontFamily:"Georgia,serif", marginBottom:"3px" }}>{pt.label}</div>
                <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.5)", marginBottom:"4px" }}>{pt.focus}</div>
                <div style={{ fontSize:"11px", color:"#4AE8A0", fontFamily:"'Courier New',monospace" }}>{pt.anchor}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {data.the_turn && (
        <div style={{ background:"rgba(232,211,74,0.05)", border:"1px solid rgba(232,211,74,0.18)", borderRadius:"10px", padding:"14px 16px" }}>
          <div style={{ fontSize:"10px", color:"#E8D44A", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>THE TURN</div>
          <p style={{ fontSize:"13px", color:"rgba(240,237,232,0.8)", lineHeight:1.7, margin:0, fontFamily:"Georgia,serif" }}>{data.the_turn}</p>
        </div>
      )}
      {data.illustration_seed && (
        <div style={{ background:"rgba(180,74,232,0.05)", border:"1px solid rgba(180,74,232,0.18)", borderRadius:"10px", padding:"14px 16px" }}>
          <div style={{ fontSize:"10px", color:"#B44AE8", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>ILLUSTRATION SEED</div>
          <p style={{ fontSize:"13px", color:"rgba(240,237,232,0.8)", lineHeight:1.7, margin:0, fontFamily:"Georgia,serif", fontStyle:"italic" }}>{data.illustration_seed}</p>
        </div>
      )}
      {data.supporting_passages?.length > 0 && (
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"10px", padding:"14px 16px" }}>
          <div style={{ fontSize:"10px", color:"#4A9EE8", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"10px" }}>SUPPORTING PASSAGES</div>
          {data.supporting_passages.map((sp, i) => (
            <div key={i} style={{ display:"flex", gap:"10px", alignItems:"flex-start", marginBottom: i < data.supporting_passages.length-1 ? "8px" : 0 }}>
              <span style={{ fontSize:"12px", color:"#4A9EE8", fontFamily:"'Courier New',monospace", flexShrink:0, fontWeight:600 }}>{sp.reference}</span>
              <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.45)" }}>{sp.note}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
        {data.desired_response && (
          <div style={{ background:"rgba(74,232,160,0.05)", border:"1px solid rgba(74,232,160,0.18)", borderRadius:"10px", padding:"14px 16px" }}>
            <div style={{ fontSize:"10px", color:"#4AE8A0", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>DESIRED RESPONSE</div>
            <p style={{ fontSize:"13px", color:"rgba(240,237,232,0.8)", lineHeight:1.7, margin:0, fontFamily:"Georgia,serif" }}>{data.desired_response}</p>
          </div>
        )}
        {data.closing_question && (
          <div style={{ background:"rgba(124,106,247,0.05)", border:"1px solid rgba(124,106,247,0.18)", borderRadius:"10px", padding:"14px 16px" }}>
            <div style={{ fontSize:"10px", color:"#A89AF7", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>SIT WITH THIS BEFORE SUNDAY</div>
            <p style={{ fontSize:"13px", color:"rgba(240,237,232,0.8)", lineHeight:1.7, margin:0, fontFamily:"Georgia,serif", fontStyle:"italic" }}>"{data.closing_question}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

function WordStudiesPanel({ data, loading }) {
  const [selectedWord, setSelectedWord] = useState(0);
  if (loading) return (
    <div style={{ padding:"60px 24px", textAlign:"center" }}>
      <div style={{ width:"20px", height:"20px", borderRadius:"50%",
        border:"2px solid #E8834A", borderTopColor:"transparent",
        animation:"spin 0.8s linear infinite", margin:"0 auto 14px" }} />
      <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em" }}>RUNNING WORD STUDIES...</div>
    </div>
  );
  if (!data?.studies?.length) return (
    <div style={{ padding:"60px 24px", textAlign:"center" }}>
      <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.25)", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>WORD STUDIES</div>
      <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.18)", lineHeight:1.65 }}>Run an analysis to generate<br/>original language word studies.</div>
    </div>
  );
  const studies = data.studies;
  const idx = Math.min(selectedWord, studies.length - 1);
  const study = studies[idx];
  return (
    <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
      <div style={{ width:"160px", flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.07)", padding:"14px 10px", overflowY:"auto" }}>
        {studies.map((s, i) => (
          <div key={i} onClick={() => setSelectedWord(i)}
            style={{ padding:"10px 11px", borderRadius:"8px", marginBottom:"4px", cursor:"pointer",
              background: idx === i ? "rgba(232,131,74,0.1)" : "transparent",
              border: idx === i ? "1px solid rgba(232,131,74,0.28)" : "1px solid transparent",
              transition:"all 0.15s" }}>
            <div style={{ fontSize:"14px", color: idx === i ? "#E8834A" : "rgba(255,255,255,0.55)", fontFamily:"Georgia,serif", marginBottom:"3px" }}>{s.english}</div>
            <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.3)", fontFamily:"'Courier New',monospace" }}>{s.language}</div>
          </div>
        ))}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
        <div style={{ marginBottom:"20px" }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:"12px", flexWrap:"wrap", marginBottom:"8px" }}>
            <span style={{ fontSize:"26px", color:"#F0EDE8", fontFamily:"Georgia,serif", fontWeight:500 }}>{study.english}</span>
            <span style={{ fontSize:"22px", color:"#E8834A" }}>{study.original}</span>
            <span style={{ fontSize:"14px", color:"rgba(255,255,255,0.4)", fontFamily:"'Courier New',monospace" }}>{study.transliteration}</span>
            <span style={{ fontSize:"12px", padding:"3px 8px", background:"rgba(232,131,74,0.1)", border:"1px solid rgba(232,131,74,0.25)", borderRadius:"5px", color:"#E8834A", fontFamily:"'Courier New',monospace" }}>{study.strongs}</span>
          </div>
          <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)", fontFamily:"'Courier New',monospace" }}>{study.language?.toUpperCase()}</div>
        </div>
        <div style={{ display:"grid", gap:"12px" }}>
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"10px", padding:"14px 16px" }}>
            <div style={{ fontSize:"10px", color:"#E8834A", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>ROOT MEANING</div>
            <p style={{ fontSize:"13px", color:"rgba(240,237,232,0.8)", lineHeight:1.7, margin:0, fontFamily:"Georgia,serif" }}>{study.root_meaning}</p>
          </div>
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"10px", padding:"14px 16px" }}>
            <div style={{ fontSize:"10px", color:"#E8834A", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>SEMANTIC RANGE</div>
            <p style={{ fontSize:"13px", color:"rgba(240,237,232,0.8)", lineHeight:1.7, margin:0, fontFamily:"Georgia,serif" }}>{study.semantic_range}</p>
          </div>
          {study.first_mention && (
            <div style={{ background:"rgba(232,211,74,0.05)", border:"1px solid rgba(232,211,74,0.15)", borderRadius:"10px", padding:"14px 16px" }}>
              <div style={{ fontSize:"10px", color:"#E8D44A", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>FIRST MENTION PRINCIPLE</div>
              <p style={{ fontSize:"13px", color:"rgba(240,237,232,0.8)", lineHeight:1.7, margin:0, fontFamily:"Georgia,serif" }}>{study.first_mention}</p>
            </div>
          )}
          {study.key_uses?.length > 0 && (
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"10px", padding:"14px 16px" }}>
              <div style={{ fontSize:"10px", color:"#4A9EE8", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"12px" }}>KEY USES IN SCRIPTURE</div>
              {study.key_uses.map((ku, i) => (
                <div key={i} style={{ borderLeft:"2px solid rgba(74,158,232,0.3)", paddingLeft:"12px", marginBottom:"10px" }}>
                  <div style={{ fontSize:"12px", fontWeight:600, color:"#4A9EE8", fontFamily:"'Courier New',monospace", marginBottom:"3px" }}>{ku.reference}</div>
                  <div style={{ fontSize:"12px", color:"rgba(240,237,232,0.7)", marginBottom:"3px" }}>{ku.use}</div>
                  <div style={{ fontSize:"11px", color:"rgba(74,158,232,0.6)", fontStyle:"italic" }}>{ku.significance}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ background:"rgba(232,131,74,0.06)", border:"1px solid rgba(232,131,74,0.2)", borderRadius:"10px", padding:"14px 16px" }}>
            <div style={{ fontSize:"10px", color:"#E8834A", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>HOMILETICAL WEIGHT</div>
            <p style={{ fontSize:"13px", color:"rgba(240,237,232,0.85)", lineHeight:1.7, margin:0, fontFamily:"Georgia,serif" }}>{study.homiletical_weight}</p>
          </div>
          <div style={{ background:"rgba(124,106,247,0.07)", border:"1px solid rgba(124,106,247,0.22)", borderRadius:"10px", padding:"14px 16px" }}>
            <div style={{ fontSize:"10px", color:"#A89AF7", fontFamily:"'Courier New',monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>PREACHABLE INSIGHT</div>
            <p style={{ fontSize:"14px", fontStyle:"italic", color:"#F0EDE8", lineHeight:1.65, margin:0, fontFamily:"Georgia,serif" }}>"{study.preachable_insight}"</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChurchContextModal({ ctx, onSave, onClose }) {
  const [local, setLocal] = useState({ ...ctx });
  const set = (k, v) => setLocal(prev => ({ ...prev, [k]: v }));
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 }}>
      <div style={{ background:"#1A1820", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"16px", padding:"28px", width:"440px", maxWidth:"90vw" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"22px" }}>
          <div>
            <div style={{ fontSize:"14px", color:"#F0EDE8", fontFamily:"Georgia,serif", marginBottom:"3px" }}>Church Context</div>
            <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.3)", fontFamily:"'Courier New',monospace" }}>Personalizes your sermon brief and word studies</div>
          </div>
          <span onClick={onClose} style={{ color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:"20px", lineHeight:1 }}>×</span>
        </div>
        {[
          { key:"pastorName", label:"PASTOR NAME" },
          { key:"churchName", label:"CHURCH NAME" },
          { key:"denomination", label:"DENOMINATION" },
          { key:"location", label:"CITY, STATE" },
          { key:"attendance", label:"TYPICAL ATTENDANCE" },
          { key:"translation", label:"PREFERRED TRANSLATION" }
        ].map(({ key, label }) => (
          <div key={key} style={{ marginBottom:"14px" }}>
            <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.35)", fontFamily:"'Courier New',monospace", letterSpacing:"0.08em", marginBottom:"5px" }}>{label}</div>
            <input value={local[key]} onChange={e => set(key, e.target.value)}
              style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"7px", padding:"9px 12px", fontSize:"13px", color:"#F0EDE8", fontFamily:"Georgia,serif", outline:"none" }} />
          </div>
        ))}
        <div style={{ display:"flex", gap:"10px", marginTop:"22px" }}>
          <span onClick={() => { onSave(local); onClose(); }}
            style={{ flex:1, padding:"10px", background:"linear-gradient(135deg,#7C6AF7,#5B52C4)", borderRadius:"8px", fontSize:"13px", color:"#fff", cursor:"pointer", textAlign:"center", fontFamily:"Georgia,serif" }}>Save Context</span>
          <span onClick={onClose} style={{ padding:"10px 18px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", fontSize:"13px", color:"rgba(255,255,255,0.45)", cursor:"pointer" }}>Cancel</span>
        </div>
      </div>
    </div>
  );
}

const SCREENS = { LANDING:"landing", DASHBOARD:"dashboard", ANALYSIS:"analysis" };

export default function SermonPrepTool() {
  const [screen, setScreen] = useState(SCREENS.LANDING);
  const [passage, setPassage] = useState("");
  const [tradition, setTradition] = useState("Black Baptist");
  const [context, setContext] = useState("Sunday Morning");
  const [literaryMode, setLiteraryMode] = useState("narrative");
  const [running, setRunning] = useState(false);
  const [agentResults, setAgentResults] = useState({});
  const [agentLoading, setAgentLoading] = useState({});
  const [basicsResult, setBasicsResult] = useState(null);
  const [basicsLoading, setBasicsLoading] = useState(false);
  const [briefResult, setBriefResult] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [wordStudiesResult, setWordStudiesResult] = useState(null);
  const [wordStudiesLoading, setWordStudiesLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [activeTab, setActiveTab] = useState("unseen");
  const [analysisPassage, setAnalysisPassage] = useState("");
  const [analysisMode, setAnalysisMode] = useState("narrative");
  const [churchCtx, setChurchCtx] = useState(() => {
    try { return JSON.parse(localStorage.getItem("unseen-layer-church-ctx") || "null") || DEFAULT_CHURCH_CONTEXT; }
    catch { return DEFAULT_CHURCH_CONTEXT; }
  });
  const [showCtxModal, setShowCtxModal] = useState(false);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("unseen-layer-history") || "null") || []; }
    catch { return []; }
  });
  const [saved, setSaved] = useState(false);

  const currentMode = LITERARY_MODES.find(m => m.id === literaryMode);
  const currentTaxonomy = currentMode?.taxonomy || MODE1_TAXONOMY;

  async function runAnalysis() {
    if (!passage.trim()) return;
    setRunning(true);
    setAnalysisPassage(passage);
    setAnalysisMode(literaryMode);
    setAgentResults({});
    setBasicsResult(null);
    setBriefResult(null);
    setWordStudiesResult(null);
    setSelectedAgent(null);
    setActiveTab("unseen");

    const modeObj = LITERARY_MODES.find(m => m.id === literaryMode);
    const taxonomy = modeObj?.taxonomy || MODE1_TAXONOMY;
    const isPauline = literaryMode === "pauline";

    const userMsg = `Bible passage: ${passage}\nPreaching tradition: ${tradition}\nChurch: ${churchCtx.churchName}, ${churchCtx.location}\nPastor: ${churchCtx.pastorName}\nContext: ${context}\nAttendance: ~${churchCtx.attendance}\nTranslation: ${churchCtx.translation}\nLiterary mode: ${modeObj?.label}\n\nAnalyze this passage.`;

    const loadingState = {};
    taxonomy.forEach(a => loadingState[a.id] = true);
    setAgentLoading(loadingState);
    setBasicsLoading(true);
    setBriefLoading(true);
    setWordStudiesLoading(true);
    setScreen(SCREENS.ANALYSIS);

    // Agents — immediate
    taxonomy.forEach(agent => {
      let prompt = isPauline ? SYSTEM_PROMPT_PAULINE : SYSTEM_PROMPT_NARRATIVE;
      if (agent.id === "homiletical_bridge") prompt = BRIDGE_PROMPT;
      if (agent.id === "canonical_typology") prompt = TYPOLOGY_PROMPT;
      const agentMsg = `${userMsg}\n\nAgent: "${agent.name}"\nDiagnostic: ${agent.diagnostic}\nAnchor example: ${agent.anchor}\n\nApply this specific lens now.`;
      callClaude(prompt, agentMsg)
        .then(r => {
          setAgentResults(prev => ({ ...prev, [agent.id]: r }));
          setAgentLoading(prev => ({ ...prev, [agent.id]: false }));
          if (r.present) setSelectedAgent(id => id || agent.id);
        })
        .catch(() => setAgentLoading(prev => ({ ...prev, [agent.id]: false })));
    });

    setTimeout(() => setRunning(false), 2000);

    // Foundations — +3s
    setTimeout(() => {
      callClaude(BASICS_PROMPT, userMsg, 4000)
        .then(r => setBasicsResult(r))
        .catch(e => console.error("Basics:", e))
        .finally(() => setBasicsLoading(false));
    }, 3000);

    // Sermon Brief — +5s
    setTimeout(() => {
      const briefMsg = `Bible passage: ${passage}\nPreaching tradition: ${tradition}\nChurch: ${churchCtx.churchName}, ${churchCtx.location}\nPastor: ${churchCtx.pastorName}\nContext: ${context}\nAttendance: ~${churchCtx.attendance}\nTranslation: ${churchCtx.translation}\n\nGenerate a focused sermon brief for this passage.`;
      callClaude(SERMON_BRIEF_PROMPT, briefMsg, 3000)
        .then(r => setBriefResult(r))
        .catch(e => console.error("Brief:", e))
        .finally(() => setBriefLoading(false));
    }, 5000);

    // Word Studies — +7s
    setTimeout(() => {
      const wordsMsg = `Bible passage: ${passage}\nTranslation: ${churchCtx.translation}\nPreaching tradition: ${tradition}\n\nProduce a thorough word study for the 3-5 most homiletially significant words in this passage. Quote all scripture in ${churchCtx.translation}.`;
      callClaude(WORD_STUDY_PROMPT, wordsMsg, 5000)
        .then(r => setWordStudiesResult(r))
        .catch(e => console.error("Words:", e))
        .finally(() => setWordStudiesLoading(false));
    }, 7000);
  }

  const activeTaxonomy = LITERARY_MODES.find(m => m.id === analysisMode)?.taxonomy || MODE1_TAXONOMY;
  const presentCount = Object.values(agentResults).filter(r => r?.present).length;
  const selectedAgentObj = activeTaxonomy.find(a => a.id === selectedAgent);
  const selectedResult = agentResults[selectedAgent];

  function saveChurchCtx(newCtx) {
    setChurchCtx(newCtx);
    localStorage.setItem("unseen-layer-church-ctx", JSON.stringify(newCtx));
  }

  function saveToLibrary() {
    const topAgentObj = activeTaxonomy.find(a => agentResults[a.id]?.present);
    const entry = {
      ref: analysisPassage,
      title: basicsResult?.movement_structure?.suggested_title || briefResult?.big_idea?.slice(0, 60) || analysisPassage,
      signals: presentCount,
      context,
      mode: LITERARY_MODES.find(m => m.id === analysisMode)?.label || analysisMode,
      date: new Date().toLocaleDateString("en-US", { month:"short", day:"numeric" }),
      topAgent: topAgentObj?.id.toUpperCase().replace(/_.*/, "") || "—",
      color: topAgentObj?.color || "#7C6AF7"
    };
    const updated = [entry, ...history.filter(h => h.ref !== entry.ref)];
    setHistory(updated);
    localStorage.setItem("unseen-layer-history", JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function exportReport() {
    const modeName = LITERARY_MODES.find(m => m.id === analysisMode)?.label || analysisMode;
    const activeAgents = activeTaxonomy.filter(a => agentResults[a.id]?.present);
    const agentSections = activeAgents.map(agent => {
      const r = agentResults[agent.id];
      const connections = r.canonical_connections?.length
        ? `<p><strong>Canonical connections:</strong> ${r.canonical_connections.join(" · ")}</p>` : "";
      const seed = r.sermon_seed ? `<blockquote>${r.sermon_seed}</blockquote>` : "";
      return `<div class="agent"><h3 style="color:${agent.color}">${agent.name}</h3><p class="headline">${r.headline || ""}</p><p>${r.analysis || ""}</p>${connections}${seed}</div>`;
    }).join("");

    const briefSection = briefResult ? `
      <h2>Sermon Brief</h2>
      <p><strong>Big Idea:</strong> ${briefResult.big_idea}</p>
      <p><strong>Key Tension:</strong> ${briefResult.key_tension}</p>
      ${briefResult.three_points?.map((pt,i) => `<p>${i+1}. <strong>${pt.label}</strong> — ${pt.focus} (${pt.anchor})</p>`).join("") || ""}
      ${briefResult.illustration_seed ? `<p><em>Illustration: ${briefResult.illustration_seed}</em></p>` : ""}
      ${briefResult.closing_question ? `<blockquote>${briefResult.closing_question}</blockquote>` : ""}` : "";

    const wordsSection = wordStudiesResult?.studies?.length ? `
      <h2>Word Studies</h2>
      ${wordStudiesResult.studies.map(s => `
        <div class="agent">
          <h3>${s.english} · ${s.original} · ${s.strongs}</h3>
          <p><strong>Root:</strong> ${s.root_meaning}</p>
          <p><strong>Semantic range:</strong> ${s.semantic_range}</p>
          <p><strong>Homiletical weight:</strong> ${s.homiletical_weight}</p>
          <blockquote>${s.preachable_insight}</blockquote>
        </div>`).join("")}` : "";

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
      <title>Unseen Layer — ${analysisPassage}</title>
      <style>body{font-family:Georgia,serif;color:#1a1a1a;max-width:720px;margin:40px auto;line-height:1.7}
      header{border-bottom:2px solid #1a1a1a;padding-bottom:16px;margin-bottom:32px}
      h1{font-size:22px;margin-bottom:6px}.meta{font-family:'Courier New',monospace;font-size:11px;color:#555}
      .agent{margin-bottom:36px;padding-bottom:28px;border-bottom:1px solid #ddd}
      h3{font-size:15px;margin-bottom:6px}.headline{font-style:italic;color:#444;margin-bottom:10px}
      blockquote{border-left:3px solid #ccc;margin:14px 0 0;padding-left:14px;color:#444;font-style:italic}
      @media print{body{margin:20px}}</style></head><body>
      <header><h1>The Unseen Layer — ${analysisPassage}</h1>
      <div class="meta">${modeName} Mode · ${tradition} · ${context} · Pastor ${churchCtx.pastorName} · ${churchCtx.churchName}</div></header>
      <h2>Unseen Layer Agents (${activeAgents.length} of ${activeTaxonomy.length} signals)</h2>
      ${agentSections || "<p>No active signals.</p>"}
      ${briefSection}${wordsSection}</body></html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  // ── LANDING ──────────────────────────────────────────────────────────────────
  if (screen === SCREENS.LANDING) return (
    <div style={{ background:"#0D0C0F", minHeight:"600px", fontFamily:"'Helvetica Neue',Arial,sans-serif", color:"#F0EDE8" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}*{box-sizing:border-box;margin:0;padding:0}.hover-row:hover{background:rgba(255,255,255,0.04)!important}`}</style>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 28px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        <div>
          <span style={{ fontSize:"15px", color:"#F0EDE8", fontFamily:"Georgia,serif" }}>The Unseen Layer</span>
          <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.25)", fontFamily:"'Courier New',monospace", marginLeft:"10px" }}>by Uzima Amka</span>
        </div>
        <div style={{ display:"flex", gap:"20px", alignItems:"center" }}>
          {["Features","Pricing","About"].map(l => <span key={l} style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", cursor:"pointer" }}>{l}</span>)}
          <span onClick={() => setScreen(SCREENS.DASHBOARD)} style={{ padding:"7px 16px", background:"rgba(124,106,247,0.12)", border:"1px solid rgba(124,106,247,0.35)", borderRadius:"8px", fontSize:"13px", color:"#A89AF7", cursor:"pointer" }}>Sign in</span>
        </div>
      </div>
      <div style={{ padding:"60px 28px 40px", maxWidth:"660px", margin:"0 auto", textAlign:"center" }}>
        <div style={{ display:"inline-block", padding:"3px 12px", background:"rgba(124,106,247,0.08)", border:"1px solid rgba(124,106,247,0.22)", borderRadius:"20px", fontSize:"10px", fontFamily:"'Courier New',monospace", color:"#A89AF7", letterSpacing:"0.08em", marginBottom:"22px" }}>
          UA-TOOL-001-2026 · 14-LENS + BRIEF + WORD STUDIES
        </div>
        <h1 style={{ fontSize:"40px", color:"#F0EDE8", fontWeight:400, lineHeight:1.15, letterSpacing:"-0.03em", marginBottom:"18px", fontFamily:"Georgia,serif" }}>
          Find what the text<br/>withholds.
        </h1>
        <p style={{ fontSize:"15px", color:"rgba(255,255,255,0.4)", lineHeight:1.75, marginBottom:"32px" }}>
          14 diagnostic agents. Sermon brief. Original language word studies. One platform built by a preacher, for preachers.
        </p>
        <div style={{ display:"flex", gap:"10px", justifyContent:"center", flexWrap:"wrap" }}>
          <span onClick={() => setScreen(SCREENS.DASHBOARD)} style={{ padding:"13px 30px", background:"linear-gradient(135deg,#7C6AF7,#5B52C4)", borderRadius:"10px", fontSize:"14px", color:"#fff", cursor:"pointer", fontFamily:"Georgia,serif" }}>Start analyzing</span>
          <span onClick={() => { setPassage("Matthew 20:1–16"); setTradition("Black Baptist"); setContext("Sunday Morning"); setLiteraryMode("narrative"); setScreen(SCREENS.DASHBOARD); }} style={{ padding:"13px 22px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", fontSize:"14px", color:"rgba(255,255,255,0.55)", cursor:"pointer" }}>See a demo</span>
        </div>
      </div>
      <div style={{ padding:"0 28px 40px", maxWidth:"720px", margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"20px" }}>
          <div style={{ background:"rgba(124,106,247,0.06)", border:"1px solid rgba(124,106,247,0.18)", borderRadius:"12px", padding:"16px 18px" }}>
            <div style={{ fontSize:"10px", color:"#A89AF7", fontFamily:"'Courier New',monospace", letterSpacing:"0.08em", marginBottom:"10px" }}>MODE 1 — NARRATIVE</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
              {MODE1_TAXONOMY.map(a => <div key={a.id} style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:a.color, flexShrink:0 }} />
                <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.5)", fontFamily:"'Courier New',monospace" }}>T{a.type} · {a.name}</span>
              </div>)}
            </div>
          </div>
          <div style={{ background:"rgba(74,232,212,0.05)", border:"1px solid rgba(74,232,212,0.15)", borderRadius:"12px", padding:"16px 18px" }}>
            <div style={{ fontSize:"10px", color:"#4AE8D4", fontFamily:"'Courier New',monospace", letterSpacing:"0.08em", marginBottom:"10px" }}>MODE 2 — PAULINE / EPISTOLARY</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
              {MODE2_TAXONOMY.map(a => <div key={a.id} style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:a.color, flexShrink:0 }} />
                <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.5)", fontFamily:"'Courier New',monospace" }}>{a.type} · {a.name}</span>
              </div>)}
            </div>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
          {[{tier:"Study",price:"$29",desc:"Personal use",features:["20 analyses/month","All agents","Export PDF"]},
            {tier:"Minister",price:"$59",desc:"Full workflow",features:["Unlimited","All agents","Sermon Brief","Word Studies","PDF export","Sermon history"],featured:true},
            {tier:"Church",price:"$149",desc:"Up to 5 ministers",features:["Everything in Minister","5 seats","Shared library","Admin dashboard"]}
          ].map(p => (
            <div key={p.tier} style={{ background: p.featured ? "rgba(124,106,247,0.07)" : "rgba(255,255,255,0.03)", border: p.featured ? "1px solid rgba(124,106,247,0.45)" : "1px solid rgba(255,255,255,0.09)", borderRadius:"14px", padding:"22px 18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                <div style={{ fontSize:"10px", color: p.featured ? "#A89AF7" : "rgba(255,255,255,0.3)", fontFamily:"'Courier New',monospace", letterSpacing:"0.08em" }}>{p.tier.toUpperCase()}</div>
                {p.featured && <div style={{ fontSize:"9px", padding:"2px 7px", background:"rgba(124,106,247,0.18)", border:"1px solid rgba(124,106,247,0.35)", borderRadius:"10px", color:"#A89AF7", fontFamily:"'Courier New',monospace" }}>POPULAR</div>}
              </div>
              <div style={{ fontSize:"26px", color:"#F0EDE8", marginBottom:"3px" }}>{p.price}<span style={{ fontSize:"13px", color:"rgba(255,255,255,0.35)" }}>/mo</span></div>
              <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)", marginBottom:"16px" }}>{p.desc}</div>
              {p.features.map((f,i) => <div key={i} style={{ fontSize:"12px", color:"rgba(255,255,255,0.5)", marginBottom:"5px" }}>✓ {f}</div>)}
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"16px 28px", display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.2)", fontFamily:"'Courier New',monospace" }}>UZIMA AMKA VENTURES · UA-TOOL-001-2026 · v1.0</span>
        <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.2)", fontFamily:"'Courier New',monospace" }}>© 2026 · ALL RIGHTS RESERVED</span>
      </div>
    </div>
  );

  // ── DASHBOARD ─────────────────────────────────────────────────────────────────
  if (screen === SCREENS.DASHBOARD) return (
    <div style={{ background:"#0D0C0F", minHeight:"600px", fontFamily:"'Helvetica Neue',Arial,sans-serif", color:"#F0EDE8" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}.hover-row:hover{background:rgba(255,255,255,0.04)!important}`}</style>
      {showCtxModal && <ChurchContextModal ctx={churchCtx} onSave={saveChurchCtx} onClose={() => setShowCtxModal(false)} />}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 24px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
          <span onClick={() => setScreen(SCREENS.LANDING)} style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", fontFamily:"'Courier New',monospace", cursor:"pointer", letterSpacing:"0.06em" }}>← HOME</span>
          <span style={{ fontSize:"15px", color:"#F0EDE8", fontFamily:"Georgia,serif" }}>The Unseen Layer</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span onClick={() => setShowCtxModal(true)} style={{ padding:"6px 13px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"7px", fontSize:"11px", color:"rgba(255,255,255,0.45)", cursor:"pointer" }}>
            ⚙ {churchCtx.pastorName}
          </span>
          <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:"rgba(124,106,247,0.18)", border:"1px solid rgba(124,106,247,0.35)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", color:"#A89AF7", fontWeight:500 }}>
            {churchCtx.pastorName?.split(" ").map(w => w[0]).slice(0,2).join("")}
          </div>
        </div>
      </div>
      <div style={{ padding:"24px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px", marginBottom:"24px" }}>
          {[{label:"PASSAGES ANALYZED",val:"47"},{label:"SIGNALS FOUND",val:"312"},{label:"SERMONS EXPORTED",val:"23"},{label:"TOP AGENT TYPE",val:"T7 · Indefensible Equity",accent:true}].map((s,i) => (
            <div key={i} style={{ background: s.accent ? "rgba(124,106,247,0.07)" : "rgba(255,255,255,0.03)", border: s.accent ? "1px solid rgba(124,106,247,0.2)" : "1px solid rgba(255,255,255,0.07)", borderRadius:"10px", padding:"14px 16px" }}>
              <div style={{ fontSize:"10px", color: s.accent ? "rgba(124,106,247,0.65)" : "rgba(255,255,255,0.28)", fontFamily:"'Courier New',monospace", letterSpacing:"0.07em", marginBottom:"8px" }}>{s.label}</div>
              <div style={{ fontSize: s.accent ? "14px" : "26px", color: s.accent ? "#A89AF7" : "#F0EDE8", lineHeight:1.3 }}>{s.val}</div>
            </div>
          ))}
        </div>
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"14px", padding:"20px", marginBottom:"22px" }}>
          <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.3)", fontFamily:"'Courier New',monospace", letterSpacing:"0.08em", marginBottom:"14px" }}>NEW ANALYSIS</div>
          <textarea value={passage} onChange={e => setPassage(e.target.value)}
            placeholder="Enter a passage reference or the full text — e.g. Eph 2:10–13..."
            rows={2} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"10px 13px", fontSize:"14px", color:"#F0EDE8", resize:"none", lineHeight:1.6, fontFamily:"Georgia,serif", marginBottom:"10px" }} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:"10px", alignItems:"center" }}>
            <select value={literaryMode} onChange={e => setLiteraryMode(e.target.value)}
              style={{ background:"#1A1820", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"9px 11px", fontSize:"12px", color:"#F0EDE8" }}>
              {LITERARY_MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            <select value={tradition} onChange={e => setTradition(e.target.value)}
              style={{ background:"#1A1820", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"9px 11px", fontSize:"12px", color:"#F0EDE8" }}>
              {TRADITIONS.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={context} onChange={e => setContext(e.target.value)}
              style={{ background:"#1A1820", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"9px 11px", fontSize:"12px", color:"#F0EDE8" }}>
              {CONTEXTS.map(c => <option key={c}>{c}</option>)}
            </select>
            <span onClick={runAnalysis} style={{ padding:"9px 22px", background: passage.trim() ? "linear-gradient(135deg,#7C6AF7,#5B52C4)" : "rgba(255,255,255,0.08)", borderRadius:"8px", fontSize:"13px", color: passage.trim() ? "#fff" : "rgba(255,255,255,0.3)", cursor: passage.trim() ? "pointer" : "default", whiteSpace:"nowrap", fontFamily:"Georgia,serif" }}>
              Run →
            </span>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1.4fr) minmax(0,1fr)", gap:"14px" }}>
          <div style={{ background:"#1A1820", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"12px", padding:"18px" }}>
            <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.28)", fontFamily:"'Courier New',monospace", letterSpacing:"0.08em", marginBottom:"14px" }}>RECENT ANALYSES</div>
            {history.length === 0 && <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.2)", fontFamily:"'Courier New',monospace" }}>No analyses yet. Run your first passage above.</div>}
            {history.map((h,i) => (
              <div key={i} className="hover-row" style={{ display:"flex", alignItems:"center", gap:"11px", padding:"10px 8px", borderBottom: i < history.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none", cursor:"pointer", borderRadius:"6px", transition:"background 0.15s" }}>
                <div style={{ width:"34px", height:"34px", borderRadius:"7px", background:`${h.color}12`, border:`1px solid ${h.color}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", color:h.color, fontFamily:"'Courier New',monospace", flexShrink:0 }}>{h.topAgent}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"13px", color:"#F0EDE8", marginBottom:"2px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{h.ref} · {h.title}</div>
                  <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.3)", fontFamily:"'Courier New',monospace" }}>{h.signals} signals · {h.mode} · {h.context}</div>
                </div>
                <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.2)", fontFamily:"'Courier New',monospace", flexShrink:0 }}>{h.date}</div>
              </div>
            ))}
          </div>
          <div style={{ background:"#1A1820", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"12px", padding:"18px" }}>
            <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.28)", fontFamily:"'Courier New',monospace", letterSpacing:"0.08em", marginBottom:"14px" }}>SIGNAL FREQUENCY</div>
            {[{label:"T7 Indefensible Equity",val:34,pct:85,color:"#E84A4A"},{label:"T1 Non-Response",val:29,pct:72,color:"#A89AF7"},{label:"M2 Uncited Source",val:24,pct:60,color:"#4AE8D4"},{label:"M3 Biographical Silence",val:22,pct:55,color:"#E8834A"},{label:"T9 Canonical Typology",val:20,pct:50,color:"#4AE8A0"},{label:"M5 Withheld Conclusion",val:17,pct:42,color:"#E84A4A"}].map((s,i) => (
              <div key={i} style={{ marginBottom:"10px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                  <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.45)", fontFamily:"'Courier New',monospace" }}>{s.label}</span>
                  <span style={{ fontSize:"11px", color:s.color, fontFamily:"'Courier New',monospace" }}>{s.val}</span>
                </div>
                <div style={{ height:"3px", background:"rgba(255,255,255,0.05)", borderRadius:"2px" }}>
                  <div style={{ height:"100%", width:`${s.pct}%`, background:s.color, borderRadius:"2px", opacity:0.65 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── ANALYSIS ──────────────────────────────────────────────────────────────────
  if (screen === SCREENS.ANALYSIS) return (
    <div style={{ background:"#0D0C0F", minHeight:"600px", fontFamily:"'Helvetica Neue',Arial,sans-serif", color:"#F0EDE8", display:"flex", flexDirection:"column" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
      {showCtxModal && <ChurchContextModal ctx={churchCtx} onSave={saveChurchCtx} onClose={() => setShowCtxModal(false)} />}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
          <span onClick={() => setScreen(SCREENS.DASHBOARD)} style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", fontFamily:"'Courier New',monospace", cursor:"pointer", letterSpacing:"0.06em" }}>← DASHBOARD</span>
          <div>
            <div style={{ fontSize:"14px", color:"#F0EDE8", fontFamily:"Georgia,serif" }}>{analysisPassage || "Passage Analysis"}</div>
            <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.3)", fontFamily:"'Courier New',monospace" }}>
              {LITERARY_MODES.find(m => m.id === analysisMode)?.label} Mode · {tradition} · {context} · {churchCtx.churchName}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:"7px" }}>
          <span onClick={() => setShowCtxModal(true)} style={{ padding:"6px 13px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"7px", fontSize:"11px", color:"rgba(255,255,255,0.45)", cursor:"pointer" }}>⚙ Context</span>
          <span onClick={exportReport} style={{ padding:"6px 13px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"7px", fontSize:"11px", color:"rgba(255,255,255,0.45)", cursor:"pointer" }}>Export PDF</span>
          <span onClick={saveToLibrary} style={{ padding:"6px 13px", background: saved ? "rgba(74,232,160,0.1)" : "rgba(124,106,247,0.1)", border: saved ? "1px solid rgba(74,232,160,0.28)" : "1px solid rgba(124,106,247,0.28)", borderRadius:"7px", fontSize:"11px", color: saved ? "#4AE8A0" : "#A89AF7", cursor:"pointer", transition:"all 0.2s" }}>{saved ? "Saved ✓" : "Save"}</span>
        </div>
      </div>

      <div style={{ display:"flex", flex:1, minHeight:0 }}>
        {/* Sidebar */}
        <div style={{ width:"230px", flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.07)", padding:"14px 12px", overflowY:"auto", display:"flex", flexDirection:"column" }}>
          <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.22)", fontFamily:"'Courier New',monospace", letterSpacing:"0.08em", marginBottom:"10px", paddingLeft:"2px" }}>
            {presentCount} OF {activeTaxonomy.length} SIGNALS ACTIVE
          </div>
          <div style={{ flex:1 }}>
            {activeTaxonomy.map(agent => (
              <AgentSidebarItem key={agent.id} agent={agent}
                result={agentResults[agent.id]} loading={agentLoading[agent.id]}
                selected={selectedAgent === agent.id && activeTab === "unseen"}
                onSelect={(id) => { setSelectedAgent(id); setActiveTab("unseen"); }} />
            ))}
          </div>
          {/* Stage tabs */}
          <div style={{ marginTop:"14px", paddingTop:"12px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"grid", gap:"6px" }}>
            {[
              { id:"foundations", label:"FOUNDATIONS", sub:"Pericope · Terms · Structure", color:"#4AE8A0", isLoading:basicsLoading, hasData:!!basicsResult },
              { id:"brief", label:"SERMON BRIEF", sub:"Big Idea · 3 Points · Turn", color:"#7C6AF7", isLoading:briefLoading, hasData:!!briefResult },
              { id:"words", label:"WORD STUDIES", sub:"Hebrew · Greek · Preachable", color:"#E8834A", isLoading:wordStudiesLoading, hasData:!!wordStudiesResult }
            ].map(tab => (
              <div key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ padding:"9px 10px", background: activeTab === tab.id ? `${tab.color}10` : "rgba(255,255,255,0.02)",
                  border: activeTab === tab.id ? `1px solid ${tab.color}30` : "1px solid rgba(255,255,255,0.07)",
                  borderRadius:"8px", cursor:"pointer", transition:"all 0.15s" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"2px" }}>
                  <div style={{ fontSize:"10px", color: activeTab === tab.id ? tab.color : tab.isLoading ? "rgba(255,255,255,0.4)" : tab.hasData ? tab.color : "rgba(255,255,255,0.3)", fontFamily:"'Courier New',monospace" }}>{tab.label}</div>
                  {tab.isLoading && <div style={{ width:"8px", height:"8px", borderRadius:"50%", border:`1.5px solid ${tab.color}`, borderTopColor:"transparent", animation:"spin 0.8s linear infinite" }} />}
                  {tab.hasData && !tab.isLoading && <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:tab.color, opacity:0.7 }} />}
                </div>
                <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)" }}>{tab.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main panel */}
        <div style={{ flex:1, overflowY:"auto", minWidth:0, display:"flex", flexDirection:"column" }}>
          {activeTab === "foundations" ? (
            <BasicsPanel data={basicsResult} loading={basicsLoading} />
          ) : activeTab === "brief" ? (
            <SermonBriefPanel data={briefResult} loading={briefLoading} />
          ) : activeTab === "words" ? (
            <WordStudiesPanel data={wordStudiesResult} loading={wordStudiesLoading} />
          ) : selectedAgentObj ? (
            <AgentDetail agent={selectedAgentObj} result={selectedResult} />
          ) : (
            <div style={{ padding:"60px 24px", textAlign:"center", color:"rgba(255,255,255,0.25)" }}>
              <div style={{ fontSize:"13px", fontFamily:"'Courier New',monospace", marginBottom:"8px" }}>
                {Object.values(agentLoading).some(Boolean) ? "AGENTS RUNNING..." : "SELECT AN AGENT TO VIEW ANALYSIS"}
              </div>
              <div style={{ fontSize:"12px", lineHeight:1.6 }}>
                {Object.values(agentLoading).some(Boolean) ? "Results appear as each agent completes" : "Click any active signal in the sidebar"}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"10px 20px", display:"flex", justifyContent:"space-between", flexShrink:0 }}>
        <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.18)", fontFamily:"'Courier New',monospace" }}>UZIMA AMKA VENTURES · UA-TOOL-001-2026 · v1.0</span>
        <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.18)", fontFamily:"'Courier New',monospace" }}>14-LENS + BRIEF + WORD STUDIES · © 2026</span>
      </div>
    </div>
  );
}
