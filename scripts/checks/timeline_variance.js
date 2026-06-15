#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { discoverMarkdownFiles, toPosixPath } = require('../lib/content_discovery');

/**
 * Timeline Variance Check Script
 * Parses timeline events and story dates to detect inconsistencies
 */

// Ensure output directory exists
const outputDir = path.join(__dirname, '../../out/reports');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

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

    // Calculate timeline span if we have events
    if (timelineEvents.some(e => e.date)) {
        const dates = timelineEvents.filter(e => e.date).map(e => new Date(e.date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        timelineReport.summary.timeline_span = {
            start: minDate.toISOString(),
            end: maxDate.toISOString(),
            duration_days: Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24))
        };
    }

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
function parseEvent(dateStr, description, source) {
    try {
        // Try to parse different date formats
        let dateObj;

        // ISO date format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            dateObj = new Date(dateStr);
        }
        // Year format
        else if (/^Year (\d+)$/.test(dateStr)) {
            const year = parseInt(dateStr.match(/^Year (\d+)$/)[1]);
            dateObj = new Date(year, 0, 1); // January 1st of that year
        }
        // Cycle format
        else if (/^Cycle (\d+)$/.test(dateStr)) {
            const cycle = parseInt(dateStr.match(/^Cycle (\d+)$/)[1]);
            // Assuming 1 cycle = 100 years for this universe
            const year = 2000 + (cycle * 100);
            dateObj = new Date(year, 0, 1);
        } else if (/^T(\d+)([+-].*)?$/.test(dateStr)) {
            // Relative T0, T1, T0+48h, T2-0.5 etc. Anchor to year 2000 + T offset for sorting/span
            const m = dateStr.match(/^T(\d+)([+-].*)?$/);
            const t = parseInt(m[1], 10);
            const year = 2000 + t;
            dateObj = new Date(year, 0, 1);
        } else {
            // Try to parse as general date
            dateObj = new Date(dateStr);
            if (isNaN(dateObj.getTime())) {
                return null; // Invalid date
            }
        }

        return {
            date: dateObj.toISOString(),
            original_date: dateStr,
            description: description,
            source: source,
            raw: `${dateStr}: ${description}`,
            is_relative: !/^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !/^Year \d+$/.test(dateStr),
            offset: /T\d+[+-]|T\d+/.test(dateStr) ? dateStr : null
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

/**
 * Check for timeline inconsistencies
 */
function checkTimelineConsistency(timelineEvents, stories) {
    // Check stories against timeline events
    for (const story of stories) {
        if (story.date) {
            const storyDate = new Date(story.date);

            // Check if story date conflicts with known timeline events
            for (const event of timelineEvents) {
                const eventDate = new Date(event.date);

                // If dates are exactly the same, that's fine (story might be about the event)
                if (Math.abs(storyDate - eventDate) < 1000) {
                    continue;
                }

                // Check for impossible sequences (e.g., story set before earliest timeline event)
                if (timelineReport.summary.timeline_span) {
                    const timelineStart = new Date(timelineReport.summary.timeline_span.start);
                    const timelineEnd = new Date(timelineReport.summary.timeline_span.end);

                    if (storyDate < timelineStart) {
                        const issue = {
                            type: 'hard',
                            story: story.name,
                            issue: `Story date ${story.date} is before earliest timeline event ${timelineReport.summary.timeline_span.start}`,
                            story_date: story.date,
                            timeline_start: timelineReport.summary.timeline_span.start
                        };
                        timelineReport.issues.hard.push(issue);
                    } else if (storyDate > timelineEnd) {
                        const issue = {
                            type: 'soft', // Could be future story
                            story: story.name,
                            issue: `Story date ${story.date} is after latest timeline event ${timelineReport.summary.timeline_span.end}`,
                            story_date: story.date,
                            timeline_end: timelineReport.summary.timeline_span.end
                        };
                        timelineReport.issues.soft.push(issue);
                    }
                }
            }
        }

        // Check story events against timeline
        for (const event of story.events) {
            if (event.date) {
                const eventDate = new Date(event.date);

                // Check against other story events for consistency
                for (const otherEvent of story.events) {
                    if (otherEvent === event) continue;

                    if (otherEvent.date && new Date(otherEvent.date) < eventDate) {
                        // This is fine, events should be in order
                        continue;
                    }

                    // If we have before/after relationships, check them
                    if (event.relationships) {
                        for (const rel of event.relationships) {
                            if (rel.type === 'before' && rel.target) {
                                const targetEvent = story.events.find(e => e.id === rel.target);
                                if (targetEvent && targetEvent.date && new Date(targetEvent.date) <= eventDate) {
                                    const issue = {
                                        type: 'hard',
                                        story: story.name,
                                        issue: `Event ${event.id} is supposed to be before ${rel.target} but dates show otherwise`,
                                        event1: event.id,
                                        event2: rel.target,
                                        date1: event.date,
                                        date2: targetEvent.date
                                    };
                                    timelineReport.issues.hard.push(issue);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Check timeline events for internal consistency
    for (let i = 1; i < timelineEvents.length; i++) {
        const prevEvent = timelineEvents[i - 1];
        const currEvent = timelineEvents[i];

        if (new Date(currEvent.date) < new Date(prevEvent.date)) {
            const issue = {
                type: 'hard',
                issue: `Timeline events out of order: ${prevEvent.original_date} comes after ${currEvent.original_date}`,
                event1: prevEvent.raw,
                event2: currEvent.raw
            };
            timelineReport.issues.hard.push(issue);
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

// Main execution
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

    console.log('Parsing story timelines...');
    const stories = parseStoryTimelines();

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
        description: event.summary || event.description || event.event || '',
        summary: event.summary || event.description || event.event || '',
        canon_tier: event.canon_tier || 'draft',
        source,
        story: storyName || event.story || null,
        involved_entities: event.involved_entities || event.entities || [],
        causal_note: event.causal_note || '',
        raw: parsed?.raw || `${timestamp || 'undated'}: ${event.summary || event.description || event.event || event.id}`
    };
}

function recomputeEventSummary() {
    timelineReport.summary.total_events = timelineReport.events.length;
    timelineReport.summary.canonical_event_count = timelineReport.events.filter(event => ['primary_canon', 'working_canon'].includes(event.canon_tier)).length;
    timelineReport.summary.draft_event_count = timelineReport.events.filter(event => event.canon_tier === 'draft').length;
}
