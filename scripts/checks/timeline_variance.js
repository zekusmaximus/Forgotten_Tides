#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { discoverMarkdownFiles, toPosixPath } = require('../lib/content_discovery');

/**
 * Timeline Variance Check Script
 * Parses timeline events and story dates to detect inconsistencies
 */

const outputDir = path.join(__dirname, '../../out/reports');

const timelineReport = {
    timestamp: new Date().toISOString(),
    events: [],
    stories: [],
    issues: {
        hard: [],
        soft: []
    },
    summary: {
        total_events: 0,
        total_stories: 0,
        lore_files_seen: 0,
        lore_files_scanned: 0,
        story_files_seen: 0,
        story_files_scanned: 0,
        skipped_files: 0,
        canonical_event_count: 0,
        draft_event_count: 0,
        frontmatter_event_count: 0,
        duplicate_event_count: 0,
        event_conflicts: 0,
        hard_failures: 0,
        soft_warnings: 0,
        timeline_span: null
    },
    coverage: {
        lore: {},
        stories: {}
    }
};

/**
 * Parse timeline events from lore files
 */
function parseTimelineEvents() {
    const loreDir = path.join(__dirname, '../../lore');
    let timelineEvents = parseTimelineDataEvents();
    const { files: loreFiles, coverage } = discoverMarkdownFiles(loreDir, {
        exclude: filePath => filePath.includes(`${path.sep}ideas${path.sep}`) || filePath.includes(`${path.sep}notes${path.sep}`) || /bible\/ARCHIVISTS_WAKE_STORY_BIBLE\.md$/.test(filePath)
    });
    timelineReport.coverage.lore = coverage;
    timelineReport.summary.lore_files_seen = coverage.files_seen;
    timelineReport.summary.lore_files_scanned = coverage.files_scanned;
    timelineReport.summary.skipped_files += coverage.skipped_files;

    for (const filePath of loreFiles) {
        const file = toPosixPath(path.relative(path.join(__dirname, '../..'), filePath));
        const content = fs.readFileSync(filePath, 'utf8');

        // Look for timeline-like patterns in markdown
        const timelineMatches = content.match(/## Timeline[\s\S]*?(?=##|$)/gi);
        if (timelineMatches) {
            for (const match of timelineMatches) {
                const events = parseTimelineSection(match, file);
                timelineEvents = timelineEvents.concat(events);
            }
        }

        // Also look for individual event patterns
        const eventPattern = /- \*\*(.*?)\*\*:?\s*(.*?)(?=\n-|\n##|\n$)/gis;
        let eventMatch;
        while ((eventMatch = eventPattern.exec(content)) !== null) {
            const [, dateStr, description] = eventMatch;
            if (dateStr && description) {
                const parsedEvent = parseEvent(dateStr.trim(), description.trim(), file);
                if (parsedEvent) {
                    timelineEvents.push({ ...parsedEvent, canon_tier: 'working_canon' });
                }
            }
        }
    }

    // Sort events by a stable relative/Cycle-aware key (preserve original_date intent; do not rely solely on JS Date for Cycle/T forms)
    function getSortKey(ev) {
        const od = (ev && ev.original_date) || '';
        if (/^Cycle\s*(\d+)$/i.test(od)) {
            const n = parseInt(od.match(/^Cycle\s*(\d+)$/i)[1], 10);
            return 1000 + n; // Cycle 0 earliest anchor
        }
        if (/^T(\d+)([+-].*)?$/i.test(od)) {
            const n = parseInt(od.match(/^T(\d+)/i)[1], 10);
            return 2000 + n;
        }
        if (ev && ev.date) {
            const d = new Date(ev.date);
            if (!isNaN(d.getTime())) return d.getTime();
        }
        return 9999999999999; // unknown last
    }
    timelineEvents.sort((a, b) => {
        const ka = getSortKey(a);
        const kb = getSortKey(b);
        if (ka !== kb) return ka - kb;
        // stable: original insertion-ish via source+id lexical
        const sa = (a.source || '') + '|' + (a.id || a.raw || '');
        const sb = (b.source || '') + '|' + (b.id || b.raw || '');
        return sa.localeCompare(sb);
    });

    timelineReport.events = timelineEvents;
    recomputeEventSummary();

    return timelineEvents;
}

/**
 * Parse a timeline section
 */
function parseTimelineSection(section, source = 'timeline') {
    const events = [];
    const lines = section.split('\n');

    let currentDate = null;
    let currentDescription = [];

    for (const line of lines) {
        // Check for date pattern (e.g., "2025-12-11" or "Year 3142")
        const dateMatch = line.match(/^(\d{4}-\d{2}-\d{2}|Year \d+|Cycle \d+)/);
        if (dateMatch) {
            // Save previous event if exists
            if (currentDate && currentDescription.length > 0) {
                const parsedEvent = parseEvent(currentDate, currentDescription.join(' ').trim(), source);
                if (parsedEvent) {
                    events.push({ ...parsedEvent, canon_tier: 'working_canon' });
                }
            }

            currentDate = dateMatch[1];
            currentDescription = [line.replace(dateMatch[1], '').trim()];
        } else if (currentDate) {
            currentDescription.push(line.trim());
        }
    }

    // Save last event
    if (currentDate && currentDescription.length > 0) {
        const parsedEvent = parseEvent(currentDate, currentDescription.join(' ').trim(), source);
        if (parsedEvent) {
            events.push({ ...parsedEvent, canon_tier: 'working_canon' });
        }
    }

    return events;
}

/**
 * Parse individual event
 */
function parseRelativeT(dateStr) {
    const base = dateStr.match(/^T(\d+)(.*)$/i);
    if (!base) return null;
    const stage = Number(base[1]);
    if (!Number.isSafeInteger(stage)) return { stage: null, offsetMs: null };
    if (!base[2].trim()) return { stage, offsetMs: 0 };
    const offset = base[2].match(/^\s*([+-])\s*(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)\s*$/i);
    if (!offset) return { stage, offsetMs: null };
    const amount = Number(offset[2]);
    const unit = offset[3].toLowerCase();
    const multiplier = unit.startsWith('m') ? 60_000 : unit.startsWith('h') ? 3_600_000 : 86_400_000;
    return { stage, offsetMs: (offset[1] === '-' ? -1 : 1) * amount * multiplier };
}

function parseEvent(dateStr, description, source) {
    try {
        dateStr = dateStr instanceof Date ? dateStr.toISOString() : String(dateStr);
        // Try to parse different date formats
        let dateObj;
        const relativeT = parseRelativeT(dateStr);

        // ISO date format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            dateObj = new Date(`${dateStr}T00:00:00.000Z`);
        }
        // Year format
        else if (/^Year (\d+)$/.test(dateStr)) {
            const year = parseInt(dateStr.match(/^Year (\d+)$/)[1]);
            dateObj = new Date(Date.UTC(year, 0, 1));
        }
        // Cycle format
        else if (/^Cycle (\d+)$/.test(dateStr)) {
            const cycle = parseInt(dateStr.match(/^Cycle (\d+)$/)[1]);
            // Assuming 1 cycle = 100 years for this universe
            const year = 2000 + (cycle * 100);
            dateObj = new Date(Date.UTC(year, 0, 1));
        } else if (relativeT) {
            // T labels are local to a story. The synthetic date is only a
            // display value; consistency checks compare local offsets below.
            dateObj = relativeT.stage !== null && relativeT.offsetMs !== null
                ? new Date(Date.UTC(2000 + relativeT.stage, 0, 1) + relativeT.offsetMs)
                : null;
        } else {
            // Try to parse as general date
            dateObj = new Date(dateStr);
            if (isNaN(dateObj.getTime())) {
                return null; // Invalid date
            }
        }

        return {
            date: dateObj ? dateObj.toISOString() : null,
            original_date: dateStr,
            description: description,
            source: source,
            raw: `${dateStr}: ${description}`,
            is_relative: !/^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !/^Year \d+$/.test(dateStr) &&
                !/^\d{4}-\d{2}-\d{2}T/.test(dateStr),
            relative_base: relativeT?.stage ?? null,
            relative_offset_ms: relativeT?.offsetMs ?? null,
            offset: relativeT ? dateStr : null
        };
    } catch (error) {
        console.warn(`Failed to parse event "${dateStr}": ${error.message}`);
        return null;
    }
}

/**
 * Parse story dates and timelines
 */
function parseStoryTimelines() {
    const storiesDir = path.join(__dirname, '../../stories');
    const { files: storyFiles, coverage } = discoverMarkdownFiles(storiesDir);
    timelineReport.coverage.stories = coverage;
    timelineReport.summary.story_files_seen = coverage.files_seen;
    timelineReport.summary.story_files_scanned = coverage.files_scanned;
    timelineReport.summary.skipped_files += coverage.skipped_files;

    const stories = [];

    for (const filePath of storyFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = toPosixPath(path.relative(path.join(__dirname, '../..'), filePath));
        const storyName = relativePath.replace(/\.md$/i, '');

        // Extract YAML frontmatter
        const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        let storyData = {
            name: storyName,
            file: relativePath,
            timeline: null,
            date: null,
            events: []
        };

        if (match) {
            try {
                const frontmatter = yaml.load(match[1]);
                storyData.timeline = frontmatter.timeline;
                storyData.date = frontmatter.date;

                // Extract any events mentioned in the story
                if (frontmatter.events) {
                    storyData.events = frontmatter.events
                        .map(event => normalizeStructuredEvent(event, relativePath, storyName))
                        .filter(Boolean);
                    timelineReport.summary.frontmatter_event_count += storyData.events.length;
                    timelineReport.events.push(...storyData.events);
                }
            } catch (error) {
                console.error(`Error parsing story metadata in ${relativePath}:`, error.message);
            }
        }

        // Also scan content for date-like patterns
        if (!storyData.date) {
            const datePatterns = [
                /\b(\d{4}-\d{2}-\d{2})\b/,
                /\b(Year \d+)\b/,
                /\b(Cycle \d+)\b/
            ];

            for (const pattern of datePatterns) {
                const match = content.match(pattern);
                if (match) {
                    const parsedDate = parseEvent(match[1], `Story ${storyName}`, relativePath);
                    if (parsedDate) {
                        storyData.date = parsedDate.date;
                        break;
                    }
                }
            }
        }

        stories.push(storyData);
    }

    timelineReport.stories = stories;
    timelineReport.summary.total_stories = stories.length;
    recomputeEventSummary();

    return stories;
}

function deduplicateEvents(events, report = timelineReport) {
    const byId = new Map();
    const conflicts = new Map();
    const unique = [];
    report.summary.duplicate_event_count = 0;
    report.summary.event_conflicts = 0;
    for (const event of events) {
        if (!event.id) {
            unique.push(event);
            continue;
        }
        const original = byId.get(event.id);
        if (!original) {
            const kept = { ...event, sources: [event.source] };
            byId.set(event.id, kept);
            unique.push(kept);
            continue;
        }

        report.summary.duplicate_event_count += 1;
        if (!original.sources.includes(event.source)) original.sources.push(event.source);
        const existingRelationships = new Set((original.relationships || []).map(rel => JSON.stringify(rel)));
        for (const rel of event.relationships || []) {
            const key = JSON.stringify(rel);
            if (!existingRelationships.has(key)) {
                original.relationships = [...(original.relationships || []), rel];
                existingRelationships.add(key);
            }
        }
        for (const field of ['original_date', 'summary', 'canon_tier']) {
            if (String(original[field] || '').trim() !== String(event[field] || '').trim()) {
                if (!conflicts.has(event.id)) conflicts.set(event.id, new Set());
                conflicts.get(event.id).add(field);
            }
        }
    }
    for (const [id, fields] of conflicts) {
        const kept = byId.get(id);
        report.issues.soft.push({
            type: 'soft',
            event_id: id,
            issue: `Conflicting definitions for event ${id}`,
            fields: [...fields].sort(),
            sources: kept.sources
        });
    }
    report.summary.event_conflicts = conflicts.size;
    return unique;
}

function updateTimelineSpan(events, report = timelineReport) {
    // T/Cycle labels have local meaning. Do not treat their display dates as a
    // shared calendar anchor when checking whether a story lies outside the span.
    const absolute = events.filter(event => event.date && event.is_relative === false)
        .map(event => new Date(event.date).getTime()).filter(Number.isFinite);
    if (!absolute.length) {
        report.summary.timeline_span = null;
        return null;
    }
    const start = new Date(Math.min(...absolute));
    const end = new Date(Math.max(...absolute));
    report.summary.timeline_span = {
        start: start.toISOString(),
        end: end.toISOString(),
        duration_days: Math.floor((end - start) / 86_400_000)
    };
    return report.summary.timeline_span;
}

function compareEventDates(a, b) {
    if (a.relative_base !== null && a.relative_base !== undefined &&
        b.relative_base !== null && b.relative_base !== undefined) {
        if (a.relative_base === b.relative_base && a.relative_offset_ms !== null && b.relative_offset_ms !== null) {
            return Math.sign(a.relative_offset_ms - b.relative_offset_ms);
        }
        if (a.relative_offset_ms === 0 && b.relative_offset_ms === 0) {
            return Math.sign(a.relative_base - b.relative_base);
        }
        return null;
    }
    if (a.is_relative || b.is_relative || !a.date || !b.date) return null;
    const left = new Date(a.date).getTime();
    const right = new Date(b.date).getTime();
    return Number.isFinite(left) && Number.isFinite(right) ? Math.sign(left - right) : null;
}

/** Check absolute timeline bounds and relationships within each story. */
function checkTimelineConsistency(timelineEvents, stories, report = timelineReport) {
    const span = report.summary.timeline_span;
    for (const story of stories) {
        if (span && story.date) {
            const parsed = parseEvent(story.date, `Story ${story.name}`, story.file);
            if (parsed && parsed.date && !parsed.is_relative) {
                const storyDate = new Date(parsed.date).getTime();
                if (storyDate < new Date(span.start).getTime()) {
                    report.issues.hard.push({
                        type: 'hard', story: story.name,
                        issue: `Story date ${story.date} is before earliest timeline event ${span.start}`,
                        story_date: story.date, timeline_start: span.start
                    });
                } else if (storyDate > new Date(span.end).getTime()) {
                    report.issues.soft.push({
                        type: 'soft', story: story.name,
                        issue: `Story date ${story.date} is after latest timeline event ${span.end}`,
                        story_date: story.date, timeline_end: span.end
                    });
                }
            }
        }

        const byId = new Map(story.events.map(event => [event.id, event]));
        const seen = new Set();
        for (const event of story.events) {
            for (const rel of event.relationships || []) {
                if (!rel || !['before', 'after'].includes(rel.type) || !rel.target) continue;
                const key = `${event.id}\0${rel.type}\0${rel.target}`;
                if (seen.has(key)) continue;
                seen.add(key);
                const target = byId.get(rel.target);
                if (!target) continue;
                const comparison = compareEventDates(event, target);
                const invalid = comparison !== null &&
                    (rel.type === 'before' ? comparison >= 0 : comparison <= 0);
                if (invalid) {
                    report.issues.hard.push({
                        type: 'hard', story: story.name,
                        issue: `Event ${event.id} is supposed to be ${rel.type} ${rel.target} but dates show otherwise`,
                        event1: event.id, event2: rel.target,
                        date1: event.original_date, date2: target.original_date
                    });
                }
            }
        }
    }
}

/**
 * Write timeline report to file
 */
function writeReport() {
    timelineReport.summary.hard_failures = timelineReport.issues.hard.length;
    timelineReport.summary.soft_warnings = timelineReport.issues.soft.length;

    const reportPath = path.join(outputDir, 'timeline_variance.json');
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(timelineReport, null, 2));

    console.log(`Timeline variance report written to: ${reportPath}`);
    console.log(`Summary: ${timelineReport.summary.total_events} timeline events, ${timelineReport.summary.total_stories} stories`);
    console.log(`Hard failures: ${timelineReport.summary.hard_failures}`);
    console.log(`Soft warnings: ${timelineReport.summary.soft_warnings}`);

    if (timelineReport.summary.timeline_span) {
        console.log(`Timeline span: ${timelineReport.summary.timeline_span.start} to ${timelineReport.summary.timeline_span.end}`);
        console.log(`Duration: ${timelineReport.summary.timeline_span.duration_days} days`);
    }

    // Exit with appropriate code
    if (timelineReport.summary.hard_failures > 0) {
        process.exit(1);
    } else if (timelineReport.summary.soft_warnings > 0) {
        process.exit(0); // Soft warnings don't cause failure
    } else {
        process.exit(0);
    }
}

function main() {
try {
    console.log('Parsing timeline events...');
    let timelineEvents = parseTimelineEvents();

    // Seed origin story and bible events (primary_canon) before story parse
    const originEvents = parseOriginStoryEvents();
    const bibleEvents = parseBibleTimeline();
    if (originEvents.length) {
        timelineEvents = timelineEvents.concat(originEvents);
        timelineReport.summary.frontmatter_event_count += originEvents.length;
    }
    if (bibleEvents.length) {
        timelineEvents = timelineEvents.concat(bibleEvents);
    }

    // Re-sort the combined list (yaml + origin + bible + lore + story events) with stable relative/Cycle-aware key
    function getSortKey(ev) {
        const od = (ev && ev.original_date) || '';
        if (/^Cycle\s*(\d+)$/i.test(od)) {
            const n = parseInt(od.match(/^Cycle\s*(\d+)$/i)[1], 10);
            return 1000 + n;
        }
        if (/^T(\d+)([+-].*)?$/i.test(od)) {
            const n = parseInt(od.match(/^T(\d+)/i)[1], 10);
            return 2000 + n;
        }
        if (ev && ev.date) {
            const d = new Date(ev.date);
            if (!isNaN(d.getTime())) return d.getTime();
        }
        return 9999999999999;
    }
    timelineEvents.sort((a, b) => {
        const ka = getSortKey(a);
        const kb = getSortKey(b);
        if (ka !== kb) return ka - kb;
        const sa = (a.source || '') + '|' + (a.id || a.raw || '');
        const sb = (b.source || '') + '|' + (b.id || b.raw || '');
        return sa.localeCompare(sb);
    });

    timelineReport.events = timelineEvents;
    console.log('Parsing story timelines...');
    const stories = parseStoryTimelines();
    timelineEvents = deduplicateEvents(timelineReport.events);
    timelineReport.events = timelineEvents;
    recomputeEventSummary();
    updateTimelineSpan(timelineEvents);

    if (timelineReport.summary.story_files_seen > 0 && timelineReport.summary.total_stories === 0) {
        timelineReport.issues.hard.push({
            type: 'hard',
            issue: 'Timeline check saw story markdown files but scanned none.',
            location: 'stories/'
        });
    }
    if (timelineReport.summary.canonical_event_count === 0) {
        timelineReport.issues.soft.push({
            type: 'soft',
            issue: 'Timeline check found no canonical timeline events.',
            location: 'data/timeline/events.yaml'
        });
    }

    console.log('Checking timeline consistency...');
    checkTimelineConsistency(timelineEvents, stories);

    console.log('Generating timeline variance report...');
    writeReport();
} catch (error) {
    console.error('Error running timeline variance check:', error);
    process.exit(1);
}
}

if (require.main === module) main();

function parseTimelineDataEvents() {
    const timelinePath = path.join(__dirname, '../../data/timeline/events.yaml');
    if (!fs.existsSync(timelinePath)) return [];

    try {
        const data = yaml.load(fs.readFileSync(timelinePath, 'utf8')) || {};
        return (data.events || [])
            .map(event => normalizeStructuredEvent(event, 'data/timeline/events.yaml'))
            .filter(Boolean);
    } catch (error) {
        timelineReport.issues.hard.push({
            type: 'hard',
            issue: `Could not parse data/timeline/events.yaml: ${error.message}`,
            location: 'data/timeline/events.yaml'
        });
        return [];
    }
}

function parseOriginStoryEvents() {
    const storyPath = path.join(__dirname, '../../stories/short_story/the_archivists_wake/manuscript.md');
    if (!fs.existsSync(storyPath)) return [];
    try {
        const content = fs.readFileSync(storyPath, 'utf8');
        const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (!fmMatch) return [];
        const fm = yaml.load(fmMatch[1]) || {};
        const events = (fm.events || []).map(e => normalizeStructuredEvent(e, 'stories/short_story/the_archivists_wake/manuscript.md', 'story-0001')).filter(Boolean);
        events.forEach(e => { e.canon_tier = e.canon_tier || 'primary_canon'; e.source = e.source || 'stories/short_story/the_archivists_wake/manuscript.md'; });
        return events;
    } catch (error) {
        timelineReport.issues.hard.push({ type: 'hard', issue: `Could not parse origin story events: ${error.message}`, location: 'stories/short_story/the_archivists_wake/manuscript.md' });
        return [];
    }
}

function parseBibleTimeline() {
    const biblePath = path.join(__dirname, '../../bible/ARCHIVISTS_WAKE_STORY_BIBLE.md');
    if (!fs.existsSync(biblePath)) return [];
    try {
        const content = fs.readFileSync(biblePath, 'utf8');
        const sectionMatch = content.match(/# 1\. Canonical Timeline of Events[\s\S]*?(?=\n# |$)/);
        if (!sectionMatch) return [];
        const section = sectionMatch[0];
        const lines = section.split('\n');
        const events = [];
        let current = null;
        for (const line of lines) {
            const tMatch = line.match(/###\s*(T\d+)\s*—\s*(.*)/);
            if (tMatch) {
                if (current) {
                    const ev = parseEvent(current.t, current.desc.join(' ').trim(), 'bible/ARCHIVISTS_WAKE_STORY_BIBLE.md');
                    if (ev) events.push({ ...ev, canon_tier: 'primary_canon', id: `bible-${current.t.toLowerCase()}`, summary: current.desc.join(' ').trim() });
                }
                current = { t: tMatch[1], desc: [tMatch[2].trim()] };
            } else if (current && line.trim().startsWith('-')) {
                current.desc.push(line.trim().replace(/^- /, ''));
            }
        }
        if (current) {
            const ev = parseEvent(current.t, current.desc.join(' ').trim(), 'bible/ARCHIVISTS_WAKE_STORY_BIBLE.md');
            if (ev) events.push({ ...ev, canon_tier: 'primary_canon', id: `bible-${current.t.toLowerCase()}`, summary: current.desc.join(' ').trim() });
        }
        return events;
    } catch (error) {
        timelineReport.issues.hard.push({ type: 'hard', issue: `Could not parse bible timeline: ${error.message}`, location: 'bible/ARCHIVISTS_WAKE_STORY_BIBLE.md' });
        return [];
    }
}

function normalizeStructuredEvent(event, source, storyName = null) {
    if (!event || !event.id) return null;
    const timestamp = event.timestamp || event.date || event.original_date;
    const parsed = timestamp ? parseEvent(timestamp, event.summary || event.description || event.event || event.id, source) : null;
    return {
        id: event.id,
        date: parsed?.date || null,
        original_date: timestamp || null,
        is_relative: parsed?.is_relative ?? null,
        relative_base: parsed?.relative_base ?? null,
        relative_offset_ms: parsed?.relative_offset_ms ?? null,
        description: event.summary || event.description || event.event || '',
        summary: event.summary || event.description || event.event || '',
        canon_tier: event.canon_tier || 'draft',
        source,
        declared_source: event.source || null,
        story: storyName || event.story || null,
        involved_entities: event.involved_entities || event.entities || [],
        relationships: Array.isArray(event.relationships) ? event.relationships : [],
        causal_note: event.causal_note || '',
        raw: parsed?.raw || `${timestamp || 'undated'}: ${event.summary || event.description || event.event || event.id}`
    };
}

function recomputeEventSummary() {
    timelineReport.summary.total_events = timelineReport.events.length;
    timelineReport.summary.canonical_event_count = timelineReport.events.filter(event => ['primary_canon', 'working_canon'].includes(event.canon_tier)).length;
    timelineReport.summary.draft_event_count = timelineReport.events.filter(event => event.canon_tier === 'draft').length;
}

module.exports = {
    parseEvent,
    normalizeStructuredEvent,
    deduplicateEvents,
    updateTimelineSpan,
    compareEventDates,
    checkTimelineConsistency
};
