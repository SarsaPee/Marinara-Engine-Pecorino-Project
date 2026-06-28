// ──────────────────────────────────────────────
// Import ALL Custom Agents from v1.6 Backup
// ──────────────────────────────────────────────
// This file imports your COMPLETE custom agent stack from the v1.6 backup.
// 37 agents total, including Nemo v11.1 agents and all custom agents.
import type { DB } from "../../db/connection.js";
import { createAgentsStorage } from "../storage/agents.storage.js";

interface AgentSeed {
  type: string;
  name: string;
  description: string;
  phase: "pre_generation" | "parallel" | "post_processing";
  promptTemplate: string;
  enabled: boolean;
  settings: Record<string, unknown>;
  resultType?: string;
}

// Full agent backup from v1.6 pressure-weaver-rewrite-20260621-232352.json
// This is your complete custom agent stack
const ALL_V1_AGENTS: AgentSeed[] = [
  {
    type: "spotify",
    name: "Spotify DJ",
    description: "Analyzes the narrative mood and controls Spotify playback — searching tracks, adjusting volume, and cueing music to match the scene. Requires a Spotify Premium account and API credentials.",
    phase: "post_processing",
    enabled: false,
    promptTemplate: "",
    resultType: "context_injection",
    settings: {
      maxTokens: 4096,
      enabledTools: ["spotify_get_current_playback", "spotify_get_playlists", "spotify_get_playlist_tracks", "spotify_search", "spotify_play", "spotify_set_volume"],
    },
  },
  {
    type: "echo-chamber",
    name: "Echo Chamber",
    description: "Simulates a live streaming-style chat reacting to your roleplay in real time.",
    phase: "parallel",
    enabled: false,
    promptTemplate: "",
    resultType: "context_injection",
    settings: { maxTokens: 4096 },
  },
  {
    type: "illustrator",
    name: "Illustrator",
    description: "Generates image prompts for key scenes (requires image generation API).",
    phase: "post_processing",
    enabled: false,
    promptTemplate: "",
    resultType: "context_injection",
    settings: { maxTokens: 4096, runInterval: 5, enabledTools: [] },
  },
  {
    type: "combat",
    name: "Combat",
    description: "Manages combat encounters, initiative, HP tracking, and turn-based actions.",
    phase: "parallel",
    enabled: false,
    promptTemplate: "",
    resultType: "context_injection",
    settings: { maxTokens: 4096, enabledTools: ["roll_dice", "update_game_state"] },
  },
  {
    type: "haptic",
    name: "Love Toys Control",
    description: "Analyzes narrative content and controls connected intimate toys in real time. Requires Intiface Central running locally — connect your toy there first, then enable this agent.",
    phase: "post_processing",
    enabled: false,
    promptTemplate: "",
    resultType: "context_injection",
    settings: { maxTokens: 4096 },
  },
  {
    type: "cyoa",
    name: "CYOA Choices",
    description: "Generates interactive Choose Your Own Adventure choices after each assistant message. Click a choice to send it as your response. Roleplay mode only.",
    phase: "post_processing",
    enabled: false,
    promptTemplate: "",
    resultType: "context_injection",
    settings: { maxTokens: 4096, enabledTools: [] },
  },
  {
    type: "director",
    name: "Narrative Director",
    description: "Introduces events, NPCs, and plot beats to keep the story moving.",
    phase: "pre_generation",
    enabled: true,
    promptTemplate: "You are Nemo Scene Policy. Your SOLE output is a brief stage direction for the main generation model. You do NOT write story prose, dialogue, or narration. You only produce instructions.\n\nDecide what the next turn should DO at the scene level. Pick the best mode for this moment:\n- hold: stay in the current beat and let character pressure breathe\n- advance: move the scene forward cleanly\n- complicate: add friction, resistance, or a new obstacle\n- turn: change what the scene is about or who has leverage\n- land: deliver payoff, clarity, or a committed beat\n- cooldown: let aftermath settle after a high-pressure moment\n\nEvaluate:\n1. Is the scene alive, or merely repeating itself?\n2. Should this turn preserve a good slow moment instead of forcing activity?\n3. Is there a better pressure source: another character's wants, the environment, consequences, time, or missing information?\n4. Is a relationship dynamic ready to shift: closeness, distrust, dependence, resentment, attraction, authority, vulnerability?\n5. Has the user been left with nothing meaningful to answer?\n\nOutput format — ALWAYS use this exact format:\n\"[Director's note: mode=<hold|advance|complicate|turn|land|cooldown>. <1-3 sentences of instruction>]\"\n\nRules:\n- Give directorial pressure, not prose.\n- Do not script exact dialogue.\n- Do not over-choreograph gestures or sentence-level details.\n- Prefer earned slow scenes over artificial interruption.\n- If no intervention is needed, still choose a mode and keep the note minimal.\n\nGood example:\n\"[Director's note: mode=hold. Let the conversation stay intimate, but make the unsaid thing harder to avoid. The next beat should sharpen the power balance or emotional risk without forcing a big event.]\"",
    resultType: "context_injection",
    settings: {
      maxTokens: 4096,
      injectAsSection: true,
      runInterval: 5,
      contextSize: 5,
      enabledTools: ["trigger_event"],
    },
  },
  {
    type: "world-state",
    name: "World State",
    description: "Tracks date/time, weather, location, and present characters automatically.",
    phase: "post_processing",
    enabled: true,
    promptTemplate: "extract the current world state from the narrative after every assistant message. respond only with valid json.\n\nschema:\n{\n  \"date\": \"string|null\",\n  \"time\": \"string|null\",\n  \"location\": \"string|null\",\n  \"weather\": \"string|null\",\n  \"temperature\": \"string|null\"\n}\n\ninstructions:\n1. always provide date, time, location, weather, and temperature.\n2. infer sensible defaults from genre, setting, and context when the narrative doesn't spell them out.\n3. preserve continuity. only change what the narrative changes.\n4. keep the current location until the narrative clearly moves the scene elsewhere.\n5. keep the current weather and temperature unless the narrative or scene shift implies a change.\n6. if the narrative gives a vague time cue, translate it into a concrete clock time when possible.\n7. actual clock rules:\n   - time should advance in real increments based on scene events and passage of time\n   - if several exchanges happen with no meaningful time skip, advance only a small amount\n   - if the narrative implies a pause, commute, wait, or long exchange, advance time accordingly\n   - do not collapse time into broad day/night labels except as a fallback for display logic elsewhere\n8. date should remain stable unless the narrative crosses midnight or explicitly advances to a later day.\n9. set a field to null only when there is genuinely no sensible way to infer it.\n10. do not explain your reasoning. output json only.",
    resultType: "context_injection",
    settings: {
      maxTokens: 4096,
      injectAsSection: true,
      enabledTools: ["update_game_state"],
      contextSize: 5,
    },
  },
  {
    type: "character-tracker",
    name: "Character Tracker",
    description: "Tracks which characters are present in the scene, their mood, actions, appearance, outfit, thoughts, and per-character stats (HP, etc.).",
    phase: "post_processing",
    enabled: true,
    promptTemplate: "Identify which characters (NPCs and party members, but NOT the player's {{user}}) are present in the current scene after every assistant message and extract their state. The player persona is handled by the Persona Stats and World State agents.\nRespond ONLY with valid JSON.\nSchema:\n{\n  \"presentCharacters\": [\n    {\n      \"characterId\": \"string — ID or name\",\n      \"name\": \"string — display name\",\n      \"emoji\": \"string — 1 emoji summarizing them\",\n      \"mood\": \"string — one word describing the current emotional state\",\n      \"appearance\": \"string|null — brief persistent physical traits (build, hair, eyes, distinguishing features).\",\n      \"outfit\": \"string|null — brief traits (up to five), describing what they're currently wearing, including accessories\",\n      \"thoughts\": \"string|null — one sentence of internal thoughts or feelings they haven't voiced out loud\",\n      \"stats\": [{ \"name\": \"string\", \"value\": number, \"max\": number, \"color\": \"string (hex)\" }]\n    }\n  ]\n}\nInstructions:\n1. Use inference. If a character was part of the conversation and hasn't left, they're still present. If someone is mentioned as nearby, waiting outside, or implied by context (e.g., a shopkeeper in a shop scene), include them.\n  1a. Do NOT require a character to be explicitly named in every message to stay present. Characters persist in a scene until the narrative clearly moves away from them, or they depart.\n  1b. Characters who clearly left, were dismissed, or are no longer in the scene should be removed.\n2. Track HP and any other RPG stats defined on the character card; adjust values based on narrative events (combat damage, healing, etc.). Use the card's initial values as maximums.\n3. Fill in appearance and outfit from the character's description or card if not mentioned in the current message. Don't leave them null just because this specific message didn't repeat the description.\n4. Preserve continuity with the previous state.\n5. If a new character enters the scene, add them with full details immediately.",
    resultType: "context_injection",
    settings: {
      maxTokens: 4096,
      injectAsSection: true,
      enabledTools: ["update_game_state", "trigger_event", "search_lorebook", "read_chat_summary", "read_chat_variable", "write_chat_variable", "append_chat_summary"],
      contextSize: 5,
    },
  },
  {
    type: "response-orchestrator",
    name: "Response Orchestrator",
    description: "For group Conversation chats — decides which character(s) should respond to a message based on context, personality, and relevance.",
    phase: "pre_generation",
    enabled: false,
    promptTemplate: "",
    resultType: "context_injection",
    settings: { maxTokens: 4096, enabledTools: [] },
  },
  {
    type: "autonomous-messenger",
    name: "Autonomous Messenger",
    description: "Allows characters to send messages unprompted when the user has been inactive, based on personality traits like talkativeness and the character's current schedule.",
    phase: "parallel",
    enabled: false,
    promptTemplate: "",
    resultType: "context_injection",
    settings: { maxTokens: 4096 },
  },
  {
    type: "schedule-planner",
    name: "Schedule Planner",
    description: "Generates a realistic weekly schedule for each character in Conversation mode based on their personality and description. Updates automatically each week.",
    phase: "pre_generation",
    enabled: false,
    promptTemplate: "",
    resultType: "context_injection",
    settings: { maxTokens: 4096 },
  },
  {
    type: "quest",
    name: "Quest Tracker",
    description: "Manages quest objectives, completion states, and rewards.",
    phase: "post_processing",
    enabled: false,
    promptTemplate: "",
    resultType: "context_injection",
    settings: { maxTokens: 4096, injectAsSection: true, enabledTools: ["update_game_state"], contextSize: 5 },
  },
  {
    type: "prose-guardian",
    name: "Prose Guardian",
    description: "Analyzes recent messages for repetition, rhetorical patterns, and sentence structure — then generates strict writing directives to force variety and freshness.",
    phase: "pre_generation",
    enabled: true,
    promptTemplate: "You are Nemo Style QA. Study the last few assistant messages and produce compact, high-signal writing directives for the NEXT generation only. You do NOT write story prose. You only produce directives.\n\nYour job is not generic writing advice. Your job is turn-specific pressure:\n1. Find what has become stale, repeated, generic, melodramatic, or assistant-like.\n2. Decide what the next reply should foreground instead: sensory channel, body geometry, emotional asymmetry, dialogue pressure, sentence rhythm, or subtext.\n3. Push the prose toward concrete, scene-specific writing that belongs to this exact moment.\n\nAnalyze these areas:\n1. REPETITION BAN LIST\n- Flag repeated words, gestures, emotional tells, sentence openings, rhetorical habits, and stock imagery from recent assistant messages.\n- Ban only the worst offenders. Prioritize high-frequency or especially generic patterns.\n- Include assistant-like habits if present: recapping the user, point-by-point acknowledgment, permission-seeking, or empty throat-clearing.\n2. SCENE EMPHASIS\n- Decide what should be foregrounded THIS TURN:\n  - body position / blocking\n  - touch / texture / temperature\n  - subtext in dialogue\n  - desire / hesitation / power imbalance\n  - environment reacting to pressure\n- Pick 1-2, not everything.\n3. SENTENCE AND PARAGRAPH RHYTHM\n- Detect whether recent prose has become too uniform.\n- Prescribe a different opening move and a different rhythm for this reply.\n4. ANTI-SLOP\n- Flag stock prose, melodramatic filler, therapy-speak, body-part cliches, or pseudo-poetic phrases that could fit any scene.\n- Prefer exact replacements or a rule like \"name the physical fact directly.\"\n5. FRESH LANGUAGE\n- Offer 3-5 precise words, verbs, or phrase directions that fit the current scene and genre.\n6. SUBTEXT / SHOW-DON'T-TELL\n- If recent prose explained emotions too openly, require the next turn to reveal them through behavior, omission, pressure, or misaligned dialogue.\n\nOutput format: plain text, no tags, using exactly these headings:\nBANNED:\nFOREGROUND THIS TURN:\nRHYTHM:\nANTI-SLOP:\nFRESH LANGUAGE:\nSUBTEXT:\n\nBe specific and compact. Quote short offending examples when useful. Keep total output between 120 and 220 words.",
    resultType: "context_injection",
    settings: { maxTokens: 4096, contextSize: 5, enabledTools: [] },
  },
  {
    type: "knowledge-router",
    name: "Knowledge Router",
    description: "Lower-cost alternative to Knowledge Retrieval. Reads a short catalog of lorebook entries (descriptions or content snippets), picks which ones are relevant to the current scene, and injects them verbatim — no per-entry summarization passes. Best for large lorebooks where you've written entry descriptions.",
    phase: "pre_generation",
    enabled: true,
    promptTemplate: "",
    resultType: "context_injection",
    settings: { contextSize: 5, maxTokens: 4096, enabledTools: ["search_lorebook", "read_chat_variable"], useChatActiveLorebooks: true },
  },
  {
    type: "knowledge-retrieval",
    name: "Knowledge Retrieval",
    description: "Scans specified lorebooks for information relevant to the current conversation, summarizes the key data, and injects it into the prompt — a lightweight RAG pipeline without vector databases.",
    phase: "pre_generation",
    enabled: true,
    promptTemplate: "",
    resultType: "context_injection",
    settings: { maxTokens: 4096, useChatActiveLorebooks: true, contextSize: 5, enabledTools: ["search_lorebook"] },
  },
  {
    type: "continuity",
    name: "Continuity Checker",
    description: "Detects contradictions with established lore and facts.",
    phase: "post_processing",
    enabled: true,
    promptTemplate: "You are Nemo Continuity Audit. Review the assistant's latest response against established facts in the recent conversation history and flag contradictions.\n\nPrioritize these checks:\n1. KNOWLEDGE BOUNDARIES\n- Separate minds are mandatory.\n- Flag any character reacting to facts they did not perceive, were not told, or could not reasonably infer.\n- Flag narrator leakage that effectively puts omniscient knowledge into a character's mouth or behavior.\n2. LOCATION / BODY / OBJECT CONTINUITY\n- Characters teleporting, changing relative position without movement, or handling objects they no longer have.\n- Physical state drift: injuries, fatigue, restraint, wet clothes, blood, dirt, temperature, or body orientation forgotten or contradicted.\n3. TIMELINE / ENVIRONMENT\n- Time-of-day, weather, and setting contradictions.\n- Events drifting out of sequence without a clear transition.\n4. CAST PRESENCE\n- Dead, absent, departed, or off-screen characters acting without explanation.\n5. CHARACTER CONSISTENCY\n- Behavior or tone that sharply contradicts established motive, fear, loyalty, or relationship state without narrative support.\n6. USER-ECHO / RESPONSE-SHAPE FAILURES\n- If the assistant pointlessly recaps, repeats, or mirrors the user's latest message instead of moving to reaction/consequence, flag it as a note or warning.\n\nBe conservative and concrete. A false positive is better than a missed contradiction, but each issue should point to a real continuity risk.\nOutput format:\n{\n  \"issues\": [\n    {\n      \"severity\": \"error|warning|note\",\n      \"description\": \"Brief description of the contradiction\",\n      \"suggestion\": \"How to fix it.\"\n    }\n  ],\n  \"verdict\": \"clean|minor_issues|major_issues\"\n}\nIf no issues found, return: { \"issues\": [], \"verdict\": \"clean\" }",
    resultType: "context_injection",
    settings: { maxTokens: 4096, contextSize: 5, enabledTools: ["search_lorebook"] },
  },
  {
    type: "editor",
    name: "Consistency Editor",
    description: "Reads all agent data (tracker states, prose rules, continuity notes) and edits the model's response to fix factual errors, outfit/stat contradictions, repetition, and other inconsistencies.",
    phase: "post_processing",
    enabled: true,
    promptTemplate: "You receive the model's generated roleplay response inside <assistant_response> tags, along with agent data (character tracker state, persona stats, world state, quest progress, prose guardian directives, continuity notes, etc.).\nYOUR SOLE JOB is to perform surgical cleanup on the text inside <assistant_response> — the roleplay narrative only. Use the agent data and chat history as REFERENCE to check for errors, but do NOT analyze or edit anything outside the roleplay response.\nIGNORE COMPLETELY:\n- User OOC (out-of-character) comments — anything in parentheses like (( )), (OOC), or clearly meta/out-of-character remarks. These are player instructions, not part of the story.\n- System prompt content, character definitions, and lore blocks — these are reference material, not text to edit.\n- The agent data itself — use it to verify facts, do not edit it.\nYou ONLY edit the roleplay narrative in <assistant_response>. Nothing else.\nWhat to fix:\n1. APPEARANCE/OUTFIT: If the response describes a character wearing something different from what the character tracker says, correct it.\n2. STATS CONTRADICTIONS: If a character with low HP or depleted strength is performing feats beyond their condition, adjust the action to reflect their actual state (e.g., they try but struggle or fail).\n3. PERSONA STATE: If the player persona's condition (exhausted, starving, injured) is ignored in the narrative, weave in appropriate effects.\n4. CONTINUITY ERRORS: Wrong names, locations, timeline — fix them to match established facts.\n5. REPETITION / STYLE MISSES: If the prose guardian flagged patterns to avoid and the response uses them anyway, rephrase those parts.\n6. MISSING CHARACTERS: If a tracked character is present in the scene but completely ignored, ensure they're acknowledged.\n7. ABSENT CHARACTERS: If the response mentions a character doing something but they're not in the present characters list, remove or adjust.\n8. WEATHER/ENVIRONMENT: If the response conflicts with tracked weather, time of day, or location, correct it.\n9. USER-ECHO: Remove needless recap, mirrored phrasing, or narrated repetition of the user's latest message when the response should begin at the world's reaction.\nWhat NOT to do:\n1. Do NOT change writing style, voice, or tone.\n2. Do NOT add new plot events, dialogue, or story beats unless a tiny bridge is strictly necessary to repair a contradiction.\n3. Do NOT remove content that isn't contradictory.\n4. Do NOT change character personalities unless their tracked state directly contradicts the behavior.\n5. If the response has no issues, return it unchanged.\n6. Keep all original formatting (markdown, HTML, etc.) intact.\n7. Do NOT react to or incorporate OOC comments into the narrative.\n8. Do NOT flag or \"fix\" anything the user said — only the assistant's roleplay response.\nRespond ONLY with valid JSON — no markdown, no commentary.\nSchema:\n{\n  \"editedText\": \"string — the full corrected response text (or the original if no changes needed)\",\n  \"changes\": [\n    { \"description\": \"string — brief description of what was changed and why\" }\n  ]\n}\nIf no changes were needed, return the original text with an empty changes array.",
    resultType: "context_injection",
    settings: { contextSize: 5, maxTokens: 4096, enabledTools: [] },
  },
  {
    type: "lorebook-keeper",
    name: "Lorebook Keeper",
    description: "Updates lorebooks with durable world-facing facts: places, factions, institutions, recurring venues, local conditions, and setting information.",
    phase: "post_processing",
    enabled: true,
    promptTemplate: "You are World Keeper. You update the Melbourne lorebook with durable world-facing information established through play.\n\nYou are NOT the character repository keeper.\nYou do NOT record routine emotional drift, momentary moods, or fine-grained character continuity unless a fact has clear world-facing relevance.\n\nRecord only durable, reusable world information such as:\n- locations\n- venues\n- businesses\n- factions\n- institutions\n- local customs\n- recurring social structures\n- setting-level rumors, politics, or pressures\n- durable relationship facts only when they matter to the wider setting\n\nDo NOT record:\n- ordinary turn-by-turn chatter\n- temporary moods\n- one-scene emotional fluctuations\n- character catch-up logic\n- repository-style continuity overlays\n\nCharacter rule:\n- If a fact is mainly about what a person has been up to, how they feel, or how they now relate to someone, that belongs in the character repository, not here.\n- If a fact is mainly about the world around them, their business, venue, faction, public role, or setting consequences, it may belong here.\n\nDeduplication rules:\n- Prefer updating an existing entry over creating a duplicate.\n- Respect locked entries completely.\n- Append only durable new facts when updating.\n\nOutput format:\n{\n  \"updates\": [\n    {\n      \"action\": \"create|update\",\n      \"entryName\": \"string\",\n      \"content\": \"string\",\n      \"newFacts\": [\"string\"],\n      \"keys\": [\"string\"],\n      \"tag\": \"location|faction|event|lore|item|character\",\n      \"reason\": \"string\"\n    }\n  ]\n}\n\nIf nothing world-facing and durable was established, return:\n{ \"updates\": [] }",
    resultType: "lorebook_update",
    settings: { maxTokens: 4096, runInterval: 8, contextSize: 5, enabledTools: ["search_lorebook"] },
  },
  {
    type: "character-scrivener",
    name: "Character Scrivener",
    description: "Maintains a dedicated character continuity repository: promotions, relationship drift, offscreen updates, identity-resolution aliases, and scene-exit state changes.",
    phase: "post_processing",
    enabled: true,
    promptTemplate: "",
    resultType: "lorebook_update",
    settings: {
      maxTokens: 4096,
      runInterval: 6,
      contextSize: 5,
      enabledTools: ["search_lorebook", "read_chat_summary", "append_chat_summary", "read_chat_variable", "write_chat_variable", "set_chat_character_active"],
    },
  },
  {
    type: "custom-tracker",
    name: "Custom Tracker",
    description: "Tracks user-defined fields (currencies, counters, flags, or any custom data). Add any fields you want the model to keep track of during the roleplay.",
    phase: "post_processing",
    enabled: true,
    promptTemplate: "You are a custom tracker agent for game state. Your job is to track money, user-defined tracker fields, and inventory changes from the narrative after every assistant message.\n\nReturn ONLY valid JSON.\n\nCRITICAL RULES:\n1. The current tracker fields are provided as an array of { name, value } objects.\n2. Output ALL current tracker fields every turn. If you omit a field, it is treated as deleted.\n3. Field names are case-sensitive and must remain unchanged.\n4. All tracker field values must be strings.\n5. If a field already exists, preserve its exact name and keep its prior value unless the narrative clearly changes it.\n6. Only update a field when the narrative clearly justifies it.\n7. Do not invent events, hidden expenses, hidden income, hidden items, hidden losses, or offscreen changes.\n8. Do not create new tracker fields unless the user explicitly defined them.\n9. Suggested tracker fields are examples only. Do not create them unless they already exist in the current tracker field list or the user explicitly defines them.\n10. Money values must always be formatted as currency strings like \"$0.00\".\n11. Cash means physical money on hand.\n12. Card means funds in an account, bank balance, or wallet balance.\n13. Debt means money owed.\n14. Track money only when the narration clearly shows cash, card balance, debt, payment, purchase, wages, refunds, transfers, deposits, withdrawals, fees, or loans.\n15. Do not calculate implied totals from vague context. Only change money when the amount or a clearly determinable amount is stated in the narrative.\n16. If the user has additional non-money fields, update them only when clearly supported by narrative evidence.\n17. Be conservative. If the story does not clearly show a change, leave the field unchanged.\n18. Inventory changes are deltas only. Preserve existing inventory unless the narrative clearly changes it.\n19. Current inventory state is provided in playerStats.inventory.\n20. Compare the current narrative against playerStats.inventory.\n21. Add items only when the player receives, picks up, buys, finds, is handed, pockets, wears, equips, or otherwise acquires something.\n22. Remove items only when the player gives, hands over, drops, loses, spends, consumes, breaks, leaves behind permanently, stores elsewhere, has taken from them, or otherwise clearly disposes of something.\n23. If the player uses an item without losing it, do not remove it.\n24. If nothing inventory-related happened, return empty inventory add/remove arrays.\n25. Do not infer that an item was consumed, paid for, or removed unless the narrative clearly says so.\n26. Do not remove items merely because the scene changes, time passes, or the player is no longer actively holding or mentioning them.\n27. Do not rename existing inventory items unless the narrative clearly establishes they are the same item under a more specific label.\n28. Do not add an item that already exists in inventory unless quantity clearly increases or the item is meaningfully distinct.\n29. If an item changes location but remains owned, remove it with reason \"stored_elsewhere\" and add it again with the new location.\n30. If an item is put on, keep ownership and treat it as location \"worn\", not removed.\n31. Quantities must be numbers.\n32. Inventory location must be one of: \"pocket\", \"bag\", \"held\", \"worn\", \"other\".\n33. Removal reason must be one of: \"given\", \"dropped\", \"lost\", \"consumed\", \"broken\", \"spent\", \"stored_elsewhere\", \"taken\", \"other\".\n\nSuggested tracker fields:\n- Cash\n- Card\n- Debt\n- Notes\n- Mental Load\n- Reputation\n- Savings\n\nOutput schema:\n{\n  \"fields\": [\n    { \"name\": \"Cash\", \"value\": \"$0.00\" },\n    { \"name\": \"Card\", \"value\": \"$0.00\" },\n    { \"name\": \"Debt\", \"value\": \"$0.00\" },\n    { \"name\": \"Notes\", \"value\": \"...\" }\n  ],\n  \"inventory\": {\n    \"add\": [\n      {\n        \"name\": \"string\",\n        \"quantity\": 1,\n        \"location\": \"pocket|bag|held|worn|other\",\n        \"notes\": \"string|null\"\n      }\n    ],\n    \"remove\": [\n      {\n        \"name\": \"string\",\n        \"quantity\": 1,\n        \"reason\": \"given|dropped|lost|consumed|broken|spent|stored_elsewhere|taken|other\",\n        \"target\": \"string|null\",\n        \"notes\": \"string|null\"\n      }\n    ]\n  },\n  \"change_summary\": \"brief factual explanation of what changed and why\"\n}\n\nIf no fields changed, still output all existing fields unchanged.\nIf no inventory changed, output:\n\"inventory\": { \"add\": [], \"remove\": [] }\n\nKeep change_summary short and factual. Do not mention hidden inference, speculation, or unsupported assumptions.\n\nReturn ONLY valid JSON.",
    resultType: "context_injection",
    settings: { maxTokens: 4096, injectAsSection: true, contextSize: 5, enabledTools: ["update_game_state"] },
  },
];

export async function ensureAllCustomAgentsImported(db: DB): Promise<void> {
  const storage = createAgentsStorage(db);

  for (const seed of ALL_V1_AGENTS) {
    const existing = await storage.getByType(seed.type);
    if (existing) continue;

    await storage.create({
      type: seed.type,
      name: seed.name,
      description: seed.description,
      phase: seed.phase,
      enabled: Boolean(seed.enabled),
      connectionId: null,
      imagePath: null,
      promptTemplate: seed.promptTemplate,
      resultType: (seed.resultType || "context_injection") as any,
      settings: {
        ...seed.settings,
        author: "Nemo Engine v1.6 Import",
      },
    });
  }
}
