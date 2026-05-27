#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const ROOT_DIR = path.join(__dirname, '../..');

// Load all schemas
const schemasDir = path.join(__dirname, '../../docs/schemas');
const schemas = {};

try {
  const schemaFiles = fs.readdirSync(schemasDir).filter(file => file.endsWith('.schema.json'));
  schemaFiles.forEach(file => {
    const schemaPath = path.join(schemasDir, file);
    const schemaContent = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const schemaName = path.basename(file, '.schema.json');
    schemas[schemaName] = schemaContent;
    // Remove $schema reference to avoid external dependency
    delete schemaContent.$schema;
    ajv.addSchema(schemaContent, schemaName);
  });
} catch (error) {
  console.error('Error loading schemas:', error.message);
  process.exit(1);
}

const TYPE_TO_SCHEMA = {
  story: 'story',
  character: 'character',
  faction: 'faction',
  location: 'location',
  mechanics: 'mechanics_rule',
  lore: 'lore'
};

const stats = {
  files_seen: 0,
  files_validated: 0,
  files_skipped: 0,
  warnings: 0,
  failures: 0
};

const visited = new Set();

function relativePath(filePath) {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
}

function shouldInspectFile(file) {
  return (
    (file.endsWith('.md') || file.endsWith('.yaml') || file.endsWith('.yml')) &&
    !file.endsWith('README.md') &&
    !/_backup_/.test(file)
  );
}

function selectSchema(filePath, schemaName, data) {
  if (schemaName && schemas[schemaName]) {
    return schemas[schemaName];
  }

  const rel = relativePath(filePath);
  const inScenesDir = rel.includes('/scenes/');
  const inScreenplayDir = rel.startsWith('stories/screenplay/');

  if (inScreenplayDir && inScenesDir && schemas.screenplay_scene) {
    return schemas.screenplay_scene;
  }

  if (inScenesDir && schemas.scene) {
    return schemas.scene;
  }

  if (data && data.type) {
    const schemaKey = TYPE_TO_SCHEMA[data.type] || data.type;
    return schemas[schemaKey] || schemas[`${schemaKey}_schema`];
  }

  return null;
}

// Function to validate YAML frontmatter against schema
function validateFile(filePath, schemaName, options = {}) {
  const required = Boolean(options.required);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const isMarkdown = filePath.endsWith('.md');
    const frontmatterMatch = content.match(/^---\s*([\s\S]*?)\s*---/);
    let data;

    if (!frontmatterMatch) {
      // For raw YAML data files, parse the whole document; otherwise treat as unvalidated.
      if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        data = yaml.load(content) || {};
      } else {
        const message = 'Missing YAML frontmatter';
        if (required) {
          return { valid: false, errors: [message] };
        }
        return { valid: true, skipped: true, warnings: [`Skipped: ${message}`] };
      }
    } else {
      const yamlContent = frontmatterMatch[1];
      data = yaml.load(yamlContent) || {};
    }

    const schemaToUse = selectSchema(filePath, schemaName, data);

    if (!schemaToUse) {
      const message = `No schema found for type: ${data.type || schemaName || 'unknown'}`;
      if (required) {
        return { valid: false, errors: [message] };
      }
      return { valid: true, skipped: true, warnings: [`Skipped: ${message}`] };
    }

    const validate = ajv.getSchema(schemaToUse.$id) || ajv.compile(schemaToUse);
    const valid = validate(data);

    if (valid) {
      const warnings = [];
      const requiredFieldErrors = [];
      if (!isMarkdown && !frontmatterMatch && Object.keys(data || {}).length === 0) {
        warnings.push('Parsed empty document');
      }
      if (!data.schema_version && !(data.metadata && data.metadata.schema_version)) {
        requiredFieldErrors.push('Missing required field: schema_version');
      }
      if (!data.tags) {
        requiredFieldErrors.push('Missing required field: tags');
      }
      if (!data.status && !(data.metadata && data.metadata.status)) {
        warnings.push('Missing recommended field: status (top-level or metadata.status)');
      }
      if (requiredFieldErrors.length > 0) {
        return { valid: false, errors: requiredFieldErrors };
      }
      return { valid: true, warnings };
    } else {
      return { valid: false, errors: validate.errors.map(err => {
        const propertyPath = err.instancePath || err.schemaPath;
        return `${propertyPath}: ${err.message} (${JSON.stringify(err.params)})`;
      })};
    }
  } catch (error) {
    const message = `Could not parse YAML: ${error.message}`;
    if (required) {
      return { valid: false, errors: [message] };
    }
    return { valid: true, skipped: true, warnings: [`Parse skipped: ${error.message}`] };
  }
}

// Walk directories and validate files
function walkDir(dir, schemaName, options = {}) {
  let hasErrors = false;

  if (!fs.existsSync(dir)) {
    return false;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (walkDir(filePath, schemaName, options)) {
        hasErrors = true;
      }
    } else if (shouldInspectFile(file)) {
      if (options.fileFilter && !options.fileFilter(filePath)) {
        continue;
      }

      const rel = relativePath(filePath);
      if (visited.has(rel)) {
        continue;
      }

      visited.add(rel);
      stats.files_seen += 1;

      const result = validateFile(filePath, schemaName, options);
      if (!result.valid) {
        console.error(`FAIL ${filePath}`);
        result.errors.forEach(error => console.error(`  - ${error}`));
        stats.failures += 1;
        hasErrors = true;
      } else {
        if (result.skipped) {
          stats.files_skipped += 1;
          console.log(`SKIP ${filePath}`);
        } else {
          stats.files_validated += 1;
          console.log(`PASS ${filePath}`);
        }
        if (result.warnings && result.warnings.length > 0) {
          stats.warnings += result.warnings.length;
          result.warnings.forEach(warning => console.log(`WARN ${filePath}: ${warning}`));
        }
      }
    }
  }

  return hasErrors;
}

// Main execution
function main() {
  console.log('Validating YAML frontmatter against schemas...');

  let hasErrors = false;

  // Required for the short-story pipeline and canonical entity registry.
  if (walkDir(path.join(ROOT_DIR, 'characters'), 'character', { required: true })) {
    hasErrors = true;
  }

  if (walkDir(path.join(ROOT_DIR, 'stories/short_story'), null, {
    required: true,
    fileFilter: filePath => path.basename(filePath).toLowerCase() === 'manuscript.md'
  })) {
    hasErrors = true;
  }

  if (walkDir(path.join(ROOT_DIR, 'mechanics'), 'mechanics_rule', { required: true })) {
    hasErrors = true;
  }

  if (walkDir(path.join(ROOT_DIR, 'factions'), 'faction', { required: true })) {
    hasErrors = true;
  }

  if (walkDir(path.join(ROOT_DIR, 'atlas'), 'location', { required: true })) {
    hasErrors = true;
  }

  // Best-effort validation for non-short-story development material. These files
  // remain visible in output without blocking the short-story gate.
  if (walkDir(path.join(ROOT_DIR, 'stories'), null, { required: false })) {
    hasErrors = true;
  }

  if (walkDir(path.join(ROOT_DIR, 'lore'), null, { required: false })) {
    hasErrors = true;
  }

  const optionalDirs = ['data'];
  optionalDirs.forEach(dir => {
    const fullPath = path.join(ROOT_DIR, dir);
    if (fs.existsSync(fullPath)) {
      if (walkDir(fullPath, null, { required: false })) {
        hasErrors = true;
      }
    }
  });

  console.log(
    `Schema coverage: ${stats.files_seen} seen, ${stats.files_validated} validated, ` +
    `${stats.files_skipped} skipped, ${stats.warnings} warnings, ${stats.failures} failures.`
  );

  if (hasErrors) {
    console.error('Schema validation failed');
    process.exit(1);
  } else {
    console.log('All required schema validations passed');
    process.exit(0);
  }
}

main();
