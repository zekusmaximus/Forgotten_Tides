#!/usr/bin/env node
// scripts/prompt/context_builder.js
// Context builder with role profiles, 1-hop expansion, and provenance tracking

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { execSync } = require("child_process");

// CLI Argument Parsing
function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: node scripts/prompt/context_builder.js \"<query>\" [--profile storytelling] [--max 10] [--expand one]");
    process.exit(1);
  }

  let query = "";
  let profile = "default";
  let max = null;
  let expand = "one";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const flag = arg.slice(2);
      const value = args[i + 1];
      if (flag === "profile" && value && !value.startsWith("--")) {
        profile = value;
        i++;
      } else if (flag === "max" && value && !value.startsWith("--")) {
        max = parseInt(value);
        i++;
      } else if (flag === "expand" && value && !value.startsWith("--")) {
        expand = value;
        i++;
      }
    } else {
      query = arg;
    }
  }

  if (!query) {
    console.error("Error: Query is required");
    process.exit(1);
  }

  return { query, profile, max, expand };
}

// Get intent classification
function getIntent(query) {
  try {
    // Try to import route_intent.js
    const routeIntent = require("./route_intent.js");
    return routeIntent.classify(query);
  } catch (e) {
    // Fallback to shell execution
    try {
      const intent = execSync(`node scripts/prompt/route_intent.js "${query}"`, { encoding: "utf8" }).trim();
      return intent;
    } catch (e) {
      console.warn("Warning: Could not get intent classification, using default");
      return "brainstorm";
    }
  }
}

// Get resolved IDs
function getResolvedIDs(query) {
  try {
    // Try to import resolve_ids.js
    const resolveIds = require("./resolve_ids.js");
    return resolveIds.resolve(query);
  } catch (e) {
    // Fallback to shell execution
    try {
      const ids = execSync(`node scripts/prompt/resolve_ids.js "${query}"`, { encoding: "utf8" }).trim();
      return ids.split("\n").filter(id => id.trim());
    } catch (e) {
      console.warn("Warning: Could not resolve IDs");
      return [];
    }
  }
}

// Load context profiles
function loadContextProfiles() {
  try {
    const profilesPath = path.join(__dirname, "../../docs/agents/context_profiles.json");
    const profiles = JSON.parse(fs.readFileSync(profilesPath, "utf8"));
    return profiles;
  } catch (e) {
    console.warn("Warning: Could not load context profiles, using default");
    return {
      default: { order: ["rules", "characters", "locations", "mechanics", "factions", "terms", "stories"], max_entities: 8 }
    };
  }
}

// Read entity data from files
function readEntityData() {
  const entities = {};

  // Read from data directories
  const dataDirs = [
    "characters", "data/characters", "data/locations", "data/factions",
    "data/mechanics", "data/rulesets", "data/timeline"
  ];

  for (const dir of dataDirs) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      const filePath = path.join(dir, file);
      try {
        const content = fs.readFileSync(filePath, "utf8");
        const matter = require("gray-matter");
        const { data } = matter(content);

        if (data && data.id) {
          entities[data.id] = {
            id: data.id,
            type: data.type || "entity",
            name: data.name || data.title || "",
            ...data
          };
        }
      } catch (e) {
        // Skip files that can't be parsed
        continue;
      }
    }
  }

  // Read from stories directories
  const storyDirs = ["stories/shorts", "stories/novels"];
  for (const dir of storyDirs) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      const filePath = path.join(dir, file);
      try {
        const content = fs.readFileSync(filePath, "utf8");
        const matter = require("gray-matter");
        const { data } = matter(content);

        if (data && data.id) {
          entities[data.id] = {
            id: data.id,
            type: data.type || "story",
            name: data.title || "",
            ...data
          };
        }
      } catch (e) {
        // Skip files that can't be parsed
        continue;
      }
    }
  }

  // Read terms from lexicon
  try {
    const lexiconPath = "data/lexicon/terms.yaml";
    if (fs.existsSync(lexiconPath)) {
      const lexicon = yaml.load(fs.readFileSync(lexiconPath, "utf8"));
      for (const term of lexicon.terms || []) {
        entities[term.id] = {
          id: term.id,
          type: "term",
          name: term.term || "",
          ...term
        };
      }
    }
  } catch (e) {
    // Skip lexicon if it can't be read
  }

  return entities;
}

// One-hop expansion
function expandEntities(primaryIds, entities) {
  const expanded = [];
  const seen = new Set(primaryIds);

  for (const id of primaryIds) {
    const entity = entities[id];
    if (!entity) continue;

    // Expand based on entity type
    if (entity.type === "character" || entity.type === "entity") {
      // Characters: expand to locations, factions, stories
      const expansions = [
        { field: "cross_refs.locations", reason: "1-hop from " + id + " → locations" },
        { field: "cross_refs.factions", reason: "1-hop from " + id + " → factions" },
        { field: "cross_refs.stories", reason: "1-hop from " + id + " → stories" },
        { field: "cross_refs.characters", reason: "1-hop from " + id + " → characters" },
        { field: "cross_refs.mechanics", reason: "1-hop from " + id + " → mechanics" }
      ];

      for (const exp of expansions) {
        const fieldParts = exp.field.split(".");
        let fieldData = entity;
        for (const part of fieldParts) {
          fieldData = fieldData?.[part];
          if (!fieldData) break;
        }

        if (Array.isArray(fieldData)) {
          for (const relatedId of fieldData) {
            if (!seen.has(relatedId) && entities[relatedId]) {
              expanded.push({ id: relatedId, reason: exp.reason });
              seen.add(relatedId);
            }
          }
        }
      }
    } else if (entity.type === "term") {
      // Terms: expand to related terms
      if (entity.related_terms && Array.isArray(entity.related_terms)) {
        for (const relatedTerm of entity.related_terms) {
          // Find term by name or ID
          const relatedEntity = Object.values(entities).find(e =>
            e.id === relatedTerm || e.name === relatedTerm
          );
          if (relatedEntity && !seen.has(relatedEntity.id)) {
            expanded.push({ id: relatedEntity.id, reason: "1-hop from " + id + " → related terms" });
            seen.add(relatedEntity.id);
          }
        }
      }
    }
  }

  return expanded;
}

// Apply ordering and capping
function applyOrderingAndCapping(ids, expanded, profile, max, entities) {
  const profiles = loadContextProfiles();
  const profileConfig = profiles[profile] || profiles.default;

  // Use provided max or profile max
  const maxEntities = max !== null ? max : profileConfig.max_entities;

  // Combine primary and expanded IDs
  const allIds = [...ids];

  // Add expanded IDs
  for (const exp of expanded) {
    if (!allIds.includes(exp.id)) {
      allIds.push(exp.id);
    }
  }

  // Sort by ID for deterministic ordering
  allIds.sort();

  // Apply profile ordering
  const orderRules = profileConfig.order || [];
  const ordered = [];

  for (const rule of orderRules) {
    const matching = allIds.filter(id => {
      const entity = entities[id];
      if (!entity) return false;

      if (rule === "rules" && entity.type === "rule") return true;
      if (rule === "mechanics" && entity.type === "mechanics") return true;
      if (rule === "characters" && entity.type === "character") return true;
      if (rule === "locations" && entity.type === "location") return true;
      if (rule === "factions" && entity.type === "faction") return true;
      if (rule === "terms" && entity.type === "term") return true;
      if (rule === "stories" && entity.type === "story") return true;
      return false;
    });

    ordered.push(...matching);
  }

  // Add any remaining IDs that didn't match rules
  const remaining = allIds.filter(id => !ordered.includes(id));
  ordered.push(...remaining);

  // Cap at max entities
  const finalOrder = ordered.slice(0, maxEntities);

  return finalOrder;
}

// Main function
function main() {
  const { query, profile, max, expand } = parseArgs();
  const intent = getIntent(query);
  const primaryIds = getResolvedIDs(query);

  // Load entities
  const entities = readEntityData();

  // One-hop expansion
  const expanded = expand === "one" ? expandEntities(primaryIds, entities) : [];

  // Apply ordering and capping
  const order = applyOrderingAndCapping(primaryIds, expanded, profile, max, entities);

  // Generate output
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputDir = "out/prompts";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${timestamp}_context.json`);
  const output = {
    query: query,
    intent: intent,
    profile: profile,
    primary_ids: primaryIds,
    expanded: expanded,
    order: order,
    limits: { max_entities: max !== null ? max : loadContextProfiles()[profile]?.max_entities || 8 },
    created_at: new Date().toISOString()
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(outputPath);
}

// Run main function
main();