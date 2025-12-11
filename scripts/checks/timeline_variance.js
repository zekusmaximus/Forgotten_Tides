#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

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
        hard_failures: 0,
        soft_warnings: 0,
        timeline_span: null
    }
};

/**
 * Parse timeline events from lore files
 */
function parseTimelineEvents() {
    const loreDir = path.join(__dirname, '../../lore');
    let timelineEvents = [];

    try {
        const loreFiles = fs.readdirSync(loreDir)
            .filter(file => file.endsWith('.md'));

        for (const file of loreFiles) {
            const filePath = path.join(loreDir, file);
            const content = fs.readFileSync(filePath, 'utf8');

            // Look for timeline-like patterns in markdown
            const timelineMatches = content.match(/## Timeline[\s\S]*?(?=##|$)/gi);
            if (timelineMatches) {
                for (const match of timelineMatches) {
                    const events = parseTimelineSection(match);
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
                        timelineEvents.push(parsedEvent);
                    }
                }
            }
        }
    } catch (error) {
        console.warn('No lore directory found or error reading lore files:', error.message);
    }

    // Sort events by date
    timelineEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    timelineReport.events = timelineEvents;
    timelineReport.summary.total_events = timelineEvents.length;

    // Calculate timeline span if we have events
    if (timelineEvents.length > 0) {
        const dates = timelineEvents.map(e => new Date(e.date));
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
function parseTimelineSection(section) {
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
                const parsedEvent = parseEvent(currentDate, currentDescription.join(' ').trim(), 'timeline');
                if (parsedEvent) {
                    events.push(parsedEvent);
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
        const parsedEvent = parseEvent(currentDate, currentDescription.join(' ').trim(), 'timeline');
        if (parsedEvent) {
            events.push(parsedEvent);
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
            raw: `${dateStr}: ${description}`
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
    let storyFiles = [];

    try {
        storyFiles = fs.readdirSync(storiesDir)
            .filter(file => file.endsWith('.md') && file !== 'README.md');
    } catch (error) {
        // Stories directory might not exist or be empty
        return;
    }

    const stories = [];

    for (const file of storyFiles) {
        const filePath = path.join(storiesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const storyName = path.basename(file, '.md');

        // Extract YAML frontmatter
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        let storyData = {
            name: storyName,
            file: file,
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
                    storyData.events = frontmatter.events.map(event => ({
                        ...event,
                        story: storyName
                    }));
                }
            } catch (error) {
                console.error(`Error parsing story metadata in ${file}:`, error.message);
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
                    const parsedDate = parseEvent(match[1], `Story ${storyName}`, file);
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
    const timelineEvents = parseTimelineEvents();

    console.log('Parsing story timelines...');
    const stories = parseStoryTimelines();

    console.log('Checking timeline consistency...');
    checkTimelineConsistency(timelineEvents, stories);

    console.log('Generating timeline variance report...');
    writeReport();
} catch (error) {
    console.error('Error running timeline variance check:', error);
    process.exit(1);
}