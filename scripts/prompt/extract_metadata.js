const { DEFAULT_ROOT, discoverWorks, discoverScenes } = require('../lib/work_resolver');

function levenshteinDistance(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + Number(a[i - 1] !== b[j - 1]));
      diagonal = above;
    }
  }
  return previous[b.length];
}

function normalizedLevenshtein(a, b) {
  const longest = Math.max(a.length, b.length);
  return longest === 0 ? 0 : levenshteinDistance(a, b) / longest;
}

function chooseMatch(items, query, identifiers, titleOf) {
  const lowered = query.toLowerCase();
  const explicit = items.filter(item => identifiers(item).some(value =>
    typeof value === 'string' && value.length >= 3 && lowered.includes(value.toLowerCase())));
  if (explicit.length) return explicit;
  const fuzzy = items.map(item => ({ item, score: normalizedLevenshtein(titleOf(item).toLowerCase(), lowered) }))
    .filter(match => match.score < 0.5)
    .sort((a, b) => a.score - b.score);
  return fuzzy.length ? fuzzy.map(match => match.item) : [];
}

function clarification(label, query, matches, describe, value) {
  return {
    question: `Which ${label} did you mean? I found multiple matches for "${query}":`,
    options: matches.map(match => ({ label: describe(match), value: value(match) }))
  };
}

function withoutMention(text, mention) {
  if (!mention) return text;
  const index = text.toLowerCase().indexOf(mention.toLowerCase());
  return index < 0 ? text : `${text.slice(0, index)} ${text.slice(index + mention.length)}`;
}

function extract(query, root = DEFAULT_ROOT) {
  const result = {
    work: null,
    scene: null,
    order: null,
    outline_section: null,
    flags: {},
    needs_clarification: null
  };

  try {
    if (typeof query !== 'string') throw new Error('Query must be a string');
    const works = discoverWorks(root);
    result.flags.replace = /\b(replace|overwrite)\b/i.test(query);

    const workMatches = chooseMatch(works, query,
      work => [work.directoryId, work.id, work.title], work => work.title);
    if (workMatches.length > 1) {
      result.needs_clarification = clarification('work', query, workMatches,
        work => `${work.title} (${work.directoryId})`, work => work.directoryId);
      return result;
    }
    if (workMatches.length === 1) {
      const work = workMatches[0];
      result.work = {
        id: work.directoryId,
        canonical_id: work.id,
        title: work.title,
        kind: work.kind
      };
    }

    const selectedWork = workMatches.length === 1 ? workMatches[0] : null;
    const scenes = selectedWork ? discoverScenes(root, { work: selectedWork }) : discoverScenes(root, { includeShared: true });
    const sceneMatches = chooseMatch(scenes, query,
      scene => [scene.id, scene.fileId, scene.title], scene => scene.title);
    if (sceneMatches.length > 1) {
      result.needs_clarification = clarification('scene', query, sceneMatches,
        scene => `${scene.title} (${scene.fileId})`, scene => scene.fileId);
      return result;
    }
    if (sceneMatches.length === 1) {
      const scene = sceneMatches[0];
      result.scene = { id: scene.fileId, canonical_id: scene.id, path: scene.path };
    }

    const orderPatterns = [
      { regex: /\bbefore\s+((?:SCENE[_-]|SC-)[A-Z0-9_-]+)\b/i, mode: 'before' },
      { regex: /\bafter\s+((?:SCENE[_-]|SC-)[A-Z0-9_-]+)\b/i, mode: 'after' },
      { regex: /\bscene\s+(\d+)\b/i, mode: 'index' },
      { regex: /\bat\s+index\s+(\d+)\b/i, mode: 'index' },
      { regex: /\b(opening|first)\b/i, mode: 'first' },
      { regex: /\b(last|final|ending)\b/i, mode: 'last' },
      { regex: /\bmidpoint\b/i, mode: 'midpoint' },
      { regex: /\b(second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s+chapter\b/i, mode: 'index' }
    ];
    // A work or scene title can contain "First", "Last", or "Opening".
    // Infer placement only when the request actually mentions positioning.
    const orderQuery = withoutMention(withoutMention(query, selectedWork?.title), sceneMatches[0]?.title);
    if (/\b(place|insert|move|order|position|put|before|after|at)\b/i.test(orderQuery)) {
      for (const pattern of orderPatterns) {
        const match = orderQuery.match(pattern.regex);
        if (!match) continue;
        let value = null;
        if (pattern.mode === 'index') {
          if (/\d/.test(match[1])) value = Number(match[1]) - 1;
          else value = ['second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth']
            .indexOf(match[1].toLowerCase()) + 1;
        } else if (pattern.mode === 'before' || pattern.mode === 'after') {
          value = match[1].toUpperCase();
        }
        result.order = { mode: pattern.mode, value };
        break;
      }
    }

    for (const [section, regex] of [
      ['act_one', /\bact\s+one\b/i],
      ['act_two', /\bact\s+two\b/i],
      ['act_three', /\bact\s+three\b/i],
      ['midpoint', /\bmidpoint\b/i],
      ['finale', /\bfinale\b/i]
    ]) {
      if (regex.test(query)) {
        result.outline_section = section;
        break;
      }
    }
    return result;
  } catch (error) {
    result.needs_clarification = {
      question: `An error occurred while processing your request: ${error.message}`,
      options: []
    };
    return result;
  }
}

module.exports = { extract };
